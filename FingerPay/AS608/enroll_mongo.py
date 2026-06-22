"""
enroll_mongo.py — Enroll a fingerprint and store its biometric TEMPLATE in MongoDB.

Captures the finger twice (as required by the sensor), generates a combined
template, and stores both the template bytes (for matching) and the raw image
(for display) in the 'fingerprints.captures' collection.

Can also store the template to the sensor's onboard flash so that checck.py
(sensor-based search) works too.
"""

from fingerprint import (
    FingerprintModule,
    CaptureFingerImage,
    ExtractFeatures,
    GenerateTemplate,
    StoreTemplate,
    BUFFER_1,
    BUFFER_2,
)
import serial.tools.list_ports
import base64
import time
from datetime import datetime
from pymongo import MongoClient
from bson.binary import Binary
import matplotlib.pyplot as plt


# ═══════════════════════════════════════════════════════════════
#  1. User info
# ═══════════════════════════════════════════════════════════════
user_id = input("Enter a name / ID for this fingerprint: ").strip()
if not user_id:
    print("✗ Name / ID cannot be empty!")
    exit(1)

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
#  3. Connect to MongoDB
# ═══════════════════════════════════════════════════════════════
client = MongoClient('mongodb://localhost:27017/')
collection = client['fingerprints']['captures']
print(f"✓ Connected to MongoDB — database: fingerprints, collection: captures")

# ═══════════════════════════════════════════════════════════════
#  4. Connect to sensor
# ═══════════════════════════════════════════════════════════════
module = FingerprintModule(port_device)
if not module.connect():
    print(f"✗ Could not connect to sensor at {port_device}")
    exit(1)

# Clear any stale serial data
time.sleep(0.1)
module.ser.reset_input_buffer()


def _drain_sensor():
    """Discard trailing ACKs left behind by write operations.

    The library's _write_data sends data packets to the sensor but
    never reads the sensor's ACK responses. This drains them so the
    next command reads fresh data.
    """
    time.sleep(0.3)
    n = module.ser.in_waiting
    if n:
        module.ser.read(n)
    module.ser.reset_input_buffer()


# ═══════════════════════════════════════════════════════════════
#  5. Capture — first finger scan
# ═══════════════════════════════════════════════════════════════
input("\n── Place your finger on the sensor, then press Enter ──\n")

result = module.capture_finger_image()
if result != CaptureFingerImage.SUCCESS:
    print(f"✗ Could not capture finger image (error: {result})")
    module.disconnect()
    exit(1)
print("✓ First capture OK")

# Extract features into BUFFER_1 (characteristics in the image)
result = module.extract_features(BUFFER_1)
if result != ExtractFeatures.SUCCESS:
    print(f"✗ Could not extract features (error: {result})")
    module.disconnect()
    exit(1)
print("✓ Features extracted from first scan")

# ═══════════════════════════════════════════════════════════════
#  6. Capture — second finger scan
# ═══════════════════════════════════════════════════════════════
input("\n── Remove finger, then place it AGAIN and press Enter ──\n")

result = module.capture_finger_image()
if result != CaptureFingerImage.SUCCESS:
    print(f"✗ Could not capture finger image (error: {result})")
    module.disconnect()
    exit(1)
print("✓ Second capture OK")

result = module.extract_features(BUFFER_2)
if result != ExtractFeatures.SUCCESS:
    print(f"✗ Could not extract features (error: {result})")
    module.disconnect()
    exit(1)
print("✓ Features extracted from second scan")

# ═══════════════════════════════════════════════════════════════
#  7. Generate template (combines both feature sets)
# ═══════════════════════════════════════════════════════════════
print("\n── Generating template ──")
result = module.generate_template()
if result != GenerateTemplate.SUCCESS:
    print(f"✗ Could not generate template (error: {result})")
    module.disconnect()
    exit(1)

# After generate_template, the template is stored in both BUFFER_1 and BUFFER_2
template_bytes = module.read_buffer(BUFFER_1)
if not template_bytes:
    print("✗ Could not read template from buffer")
    module.disconnect()
    exit(1)

print(f"✓ Template generated ({len(template_bytes)} bytes)")

# ═══════════════════════════════════════════════════════════════
#  8. (Optional) Store template on sensor's flash for onboard matching
# ═══════════════════════════════════════════════════════════════
page_id = module.get_next_page_id()
if page_id is not None:
    result = module.store_template(page_id, BUFFER_1)
    if result == StoreTemplate.SUCCESS:
        print(f"✓ Template saved to sensor page {page_id} (also usable by checck.py)")
    else:
        print(f"⚠ Could not save to sensor flash (page {page_id}) — will still store in MongoDB")
        page_id = None
else:
    print("⚠ Sensor flash is full — template will only be stored in MongoDB")

# ═══════════════════════════════════════════════════════════════
#  9. (Optional) Capture raw image for display
# ═══════════════════════════════════════════════════════════════
image_b64 = None
while input("\n── Capture a raw image too for display? (y/n): ").strip().lower() == 'y':
    input("  Place your finger and press Enter...")
    result = module.capture_finger_image()
    if result != CaptureFingerImage.SUCCESS:
        print("  Retry? (y/n): ", end='')
        if input().strip().lower() != 'y':
            break
        continue
    raw_image = module.read_image_buffer()
    if raw_image:
        image_b64 = base64.b64encode(raw_image).decode('utf-8')
        print(f"  ✓ Raw image captured ({len(raw_image)} bytes)")

        try:
            pixels = FingerprintModule.decode_image_buffer(raw_image)
            plt.imshow(pixels, cmap='gray')
            plt.title(f"{user_id}")
            plt.show(block=False)
        except Exception:
            pass
    break

# ═══════════════════════════════════════════════════════════════
#  10. Store in MongoDB
# ═══════════════════════════════════════════════════════════════
document = {
    'user_id': user_id,
    'template_data': Binary(template_bytes),
    'template_length': len(template_bytes),
    'page_id': page_id,
    'base64_string': image_b64,
    'timestamp': datetime.now(),
}

result = collection.insert_one(document)

print(f"\n{'=' * 50}")
print(f"✓ ENROLLMENT SUCCESSFUL!")
print(f"  User ID:       {user_id}")
print(f"  Template:      {len(template_bytes)} bytes")
print(f"  Sensor page:   {page_id if page_id is not None else 'N/A'}")
print(f"  MongoDB doc:   {result.inserted_id}")
print(f"{'=' * 50}")

module.disconnect()
