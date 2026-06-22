import serial.tools.list_ports

from fingerprint import (
    FingerprintModule,
    CaptureFingerImage,
    ExtractFeatures,
    GenerateTemplate,
    StoreTemplate,
    get_port_from_user,
    BUFFER_1,
    BUFFER_2
)
import matplotlib.pyplot as plt


ports = serial.tools.list_ports.comports()
# module = FingerprintModule(port)

# Look for Silicon Labs CP210x (your fingerprint sensor bridge)
port_device = None
for p in ports:
    if 'CP210x' in p.description or 'Silicon Labs' in p.description:
        port_device = p.device
        print(f"✓ Found fingerprint sensor at: {port_device}")
        break

if not port_device:
    print("✗ No fingerprint sensor detected!")
    print("Available Serial Ports:")
    for i, p in enumerate(ports):
        print(f"  ({i}) {p.device} ({p.description})")
    exit(1)

module = FingerprintModule(port_device)

if not module.connect():
    print("Could not connect.")
    exit(1)

input("Press enter to scan finger.")
result = module.capture_finger_image()
if result != CaptureFingerImage.SUCCESS:
    print("Could not capture finger image.")
    exit(1)

print("Extracting fingerprint features...")
result = module.extract_features(BUFFER_1)
if result != ExtractFeatures.SUCCESS:
    print("Could not extract fingerprint features.")
    exit(1)

input("Press enter to scan finger.")
result = module.capture_finger_image()
if result != CaptureFingerImage.SUCCESS:
    print("Could not capture finger image.")
    exit(1)

print("Extracting fingerprint features...")
result = module.extract_features(BUFFER_2)
if result != ExtractFeatures.SUCCESS:
    print("Could not extract fingerprint features.")
    exit(1)

print("Generating fingerprint template...")
result = module.generate_template()
if result != GenerateTemplate.SUCCESS:
    print("Could not generate fingerprint template.")
    exit(1)

print("Getting next available page id...")
page_id = module.get_next_page_id()
if page_id is None:
    print("Could not get next available page id.")
    exit(1)

print(f"Saving fingerprint template in page {page_id}...")
result = module.store_template(page_id, BUFFER_1)
if result != StoreTemplate.SUCCESS:
    print("Could not save fingerprint template.")
    exit(1)

print("Transfering bytes...")
data = module.read_image_buffer()
if not data:
    print("Could not read image buffer.")
    exit(1)
    
# # Convert bytes to Base64 string
# import base64

# fingerprint_string = base64.b64encode(data).decode('utf-8')
# print(f"\n✓ Fingerprint captured!")
# print(f"Base64 string length: {len(fingerprint_string)} characters")
# print(f"First 100 chars: {fingerprint_string[:100]}...")

print("Done!")
module.disconnect()

image = FingerprintModule.decode_image_buffer(data)
plt.imshow(image, cmap='gray')
plt.title(f"Fingerprint from {port_device}")
plt.show()