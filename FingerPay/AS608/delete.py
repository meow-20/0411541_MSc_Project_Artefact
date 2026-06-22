from fingerprint import FingerprintModule, get_port_from_user, DeleteTemplates
import serial.tools.list_ports

# Auto-detect sensor
ports = serial.tools.list_ports.comports()
port_device = None
for p in ports:
    if 'CP210x' in p.description or 'Silicon Labs' in p.description:
        port_device = p.device
        print(f"✓ Found fingerprint sensor at: {port_device}")
        break

if not port_device:
    exit(1)

module = FingerprintModule(port_device)

if not module.connect():
    print(f"Could not connect to {port_device}")
    exit(1)

# Get current number of fingerprints
next_page = module.get_next_page_id()
if next_page is None:
    print("Could not get page count")
    exit(1)

print(f"\n⚠ Sensor has {next_page} fingerprints (pages 0 to {next_page-1})")
print("This will delete ALL fingerprints from the sensor!")
confirm = input("Press 'Y' to confirm: ")

if confirm.upper() == 'Y':
    # Use delete_all_templates() - returns DeleteTemplates object
    result = module.delete_all_templates()
    
    if result == DeleteTemplates.SUCCESS:
        print("\n✓ SUCCESS: All fingerprints deleted from sensor!")
    elif result == DeleteTemplates.ERROR_RECEIVING_PACKAGE:
        print("\n✗ Error: Failed to receive package from sensor")
    elif result == DeleteTemplates.ERROR_DELETING_TEMPLATES:
        print("\n✗ Error: Clear library failed on sensor")
    elif result is None:
        print("\n✗ Error: Communication error happened")
    else:
        print(f"\n✗ Unknown error: {result}")
    
    # Verify sensor is empty
    new_next_page = module.get_next_page_id()
    if new_next_page == 0:
        print("✓ Sensor confirmed EMPTY (next page ID = 0)")
    else:
        print(f"⚠ Sensor still has {new_next_page} fingerprints remaining")

module.disconnect()
print("\nDone!")