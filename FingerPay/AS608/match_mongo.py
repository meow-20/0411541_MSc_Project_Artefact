"""
match_mongo.py — Compare a fresh fingerprint against templates stored in MongoDB.

How it works:
  1. Fetches all biometric TEMPLATES from MongoDB (stored by enroll_mongo.py).
  2. Captures ONE fresh fingerprint and extracts its features into BUFFER_2.
  3. For each template in the DB: writes it to BUFFER_1, then calls the sensor's
     built-in compare_buffers() to check for a match against BUFFER_2.
  4. Reports the matched user or "not found".

Templates are ~512 bytes, so the whole process is fast — no 36KB image transfers.

Requires data enrolled via enroll_mongo.py (which stores template_data).
"""

from fingerprint import (
    FingerprintModule,
    CaptureFingerImage,
    ExtractFeatures,
    BUFFER_1,
    BUFFER_2,
)
import serial.tools.list_ports
import time
from pymongo import MongoClient


# ═══════════════════════════════════════════════════════════════
#  1. Connect to MongoDB and load templates
# ═══════════════════════════════════════════════════════════════
client = MongoClient('mongodb://localhost:27017/')
collection = client['fingerprints']['captures']
total = collection.count_documents({})
print(f"✓ Connected to MongoDB — {total} fingerprint document(s)")

if total == 0:
    print("✗ No fingerprints in database. Run enroll_mongo.py first.")
    exit(1)

# Check whether template data exists (stored by enroll_mongo.py)
has_templates = collection.count_documents({'template_data': {'$exists': True}})
if has_templates == 0:
    print("✗ No template data found in MongoDB.")
    print("  The existing documents were created by store.py which stores")
    print("  raw images only — they cannot be matched with the sensor.")
    print("  Run enroll_mongo.py to enroll fingerprints properly.")
    exit(1)

docs = list(collection.find({'template_data': {'$exists': True}}))
print(f"✓ Loaded {len(docs)} template(s) — ready for matching\n")

# ═══════════════════════════════════════════════════════════════
#  2. Auto-detect sensor
# ═══════════════════════════════════════════════════════════════
ports = serial.tools.list_ports.comports()
port_device = None
for p in ports:
    if 'CP210x' in p.description or 'Silicon Labs' in p.description:
        port_device = p.device
        print(f"✓ Found fingerprint sensor at: {port_device}")
        break

if not port_device:
    print("✗ No fingerprint sensor detected!")
    if ports:
        for i, p in enumerate(ports):
            print(f"  ({i}) {p.device} ({p.description})")
    exit(1)

# ═══════════════════════════════════════════════════════════════
#  3. Connect to sensor
# ═══════════════════════════════════════════════════════════════
module = FingerprintModule(port_device)
if not module.connect():
    print("✗ Could not connect to sensor!")
    exit(1)

# Clear any stale serial data from power-on / previous use
time.sleep(0.1)
module.ser.reset_input_buffer()


def _drain_sensor():
    """Discard trailing ACKs left by write_buffer.

    The library's _write_data sends data packets to the sensor but
    never reads the sensor's ACK responses. This drains them.
    Templates are tiny (~512 bytes = 5 packets) so a short wait
    is sufficient.
    """
    time.sleep(0.2)
    n = module.ser.in_waiting
    if n:
        module.ser.read(n)
    module.ser.reset_input_buffer()


# ═══════════════════════════════════════════════════════════════
#  4. Capture fresh fingerprint — extract features to BUFFER_2
# ═══════════════════════════════════════════════════════════════
print("\n── Capture fingerprint to verify ──")
input("  Place your finger on the sensor, then press Enter...\n")

result = module.capture_finger_image()
if result != CaptureFingerImage.SUCCESS:
    print("✗ Could not capture finger image. Make sure the finger is")
    print("  placed properly and the sensor is clean.")
    module.disconnect()
    exit(1)

result = module.extract_features(BUFFER_2)
if result != ExtractFeatures.SUCCESS:
    print("✗ Could not extract features. Try with a cleaner / drier finger.")
    module.disconnect()
    exit(1)

print("✓ Finger captured and features extracted.\n")

# ═══════════════════════════════════════════════════════════════
#  5. Match against each stored template
# ═══════════════════════════════════════════════════════════════
print("── Matching ———")

match_doc = None
match_score = 0

for i, doc in enumerate(docs):
    template = doc['template_data']  # Binary → bytes when used

    # Write the stored template into BUFFER_1
    if not module.write_buffer(BUFFER_1, template):
        print(f"  [{i+1}/{len(docs)}] Write error — skipping")
        _drain_sensor()
        continue

    # Drain the trailing ACK from the write operation
    _drain_sensor()

    # Compare BUFFER_1 (stored template) vs BUFFER_2 (fresh scan)
    result = module.compare_buffers()
    if result is None:
        print(f"  [{i+1}/{len(docs)}] Compare returned None — skipping")
        continue

    if result.is_matching:
        match_doc = doc
        match_score = result.matching_score
        print(f"\n  ✓ MATCH at index {i+1}  (score: {result.matching_score})")
        break
    else:
        print(f"  [{i+1}/{len(docs)}] No match  (score: {result.matching_score})")

module.disconnect()

# ═══════════════════════════════════════════════════════════════
#  6. Result
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 50)
if match_doc:
    print("✓ VERIFICATION SUCCESSFUL!")
    uid = match_doc.get('user_id', 'Unknown')
    print(f"  User:        {uid}")
    print(f"  Score:       {match_score}")
    if 'page_id' in match_doc and match_doc['page_id'] is not None:
        print(f"  Sensor page: {match_doc['page_id']}")
    if 'timestamp' in match_doc:
        ts = match_doc['timestamp']
        if hasattr(ts, 'strftime'):
            print(f"  Enrolled:    {ts.strftime('%Y-%m-%d %H:%M')}")
        else:
            print(f"  Enrolled:    {ts}")
    print(f"  Document ID: {match_doc['_id']}")
else:
    print("✗ VERIFICATION FAILED")
    print("  The scanned fingerprint does not match any enrolled user.")
    print("  (Registered users: " + ", ".join(
        d.get('user_id', '?') for d in docs) + ")")
print("=" * 50)
