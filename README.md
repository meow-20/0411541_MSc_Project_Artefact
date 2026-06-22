# FingerPay

FingerPay is a full-stack fintech application that combines a React Native mobile app, a Node.js/Express backend, MongoDB, and a Python service for fingerprint sensor integration using the AS608 biometric module. The platform supports user and merchant flows, payments, account verification, merchant withdrawals, and biometric identity verification.

---

## Overview

This project is built as a multi-part system:

- **Mobile frontend** for customers and merchants
- **Node.js backend** for authentication, user management, merchant operations, and API endpoints
- **MongoDB database** for persistent application data
- **Python biometric service** for communicating with the AS608 fingerprint sensor and processing enrollment or verification requests

The goal of FingerPay is to provide a secure and modern digital payment experience with biometric verification support for merchant-side customer validation.

---

## Features

### Mobile app
- User authentication
- Role-aware UI for merchants and regular users
- Account verification
- Email OTP verification
- Payment screen
- Transaction history
- Merchant wallet withdrawal
- Merchant fingerprint verification screen
- Profile and settings screens
- Modern merchant bottom tab navigation

### Backend
- JWT-based authentication
- User profile endpoints
- Merchant wallet balance endpoint
- Merchant withdrawal endpoint
- Credential verification endpoint
- Biometric enrollment trigger endpoint

### Python biometric service
- Connects to **AS608 fingerprint sensor**
- Handles fingerprint enrollment
- Can be extended for verification or template capture
- Intended to act as the bridge between hardware and backend API logic

---

## Architecture

```text
React Native App
   |
   | HTTP requests
   v
Node.js / Express API
   |
   | MongoDB queries
   v
MongoDB

Node.js / Express API
   |
   | triggers / communicates
   v
Python Fingerprint Service
   |
   | serial/UART
   v
AS608 Fingerprint Sensor
```

The React Native app handles the mobile experience, the Express backend manages business logic and API endpoints, MongoDB stores application data, and the Python service interacts with the AS608 sensor over serial communication, which is a common pattern for Python-based fingerprint sensor integrations [web:738][web:740].

---

## Tech stack

### Frontend
- React Native
- Expo
- React Navigation
- AsyncStorage
- Expo Local Authentication
- React Native OTP Entry
- Expo Vector Icons

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)

### Python biometric layer
- Python 3
- PySerial
- AS608-compatible fingerprint communication library or custom serial logic

The AS608 is typically used over UART/serial communication, and Python integrations often rely on serial communication layers or libraries adapted for the sensor’s command protocol [web:736][web:740].

---

## Repository structure

```bash
fingerpay/
├── frontend/
│   ├── assets/
│   ├── components/
│   ├── config/
│   │   └── env.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   ├── screens/
│   │   ├── PaymentScreen.js
│   │   ├── HistoryScreen.js
│   │   ├── WithdrawScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── VerifyAccountScreen.jsx
│   │   └── VerifyFingerPrintScreen.js
│   ├── App.js
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── controllers/
│   ├── server.js
│   └── package.json
│
├── AS608/
│   ├── mongo_enroll.py
|   ├── mongo_match.py
│   ├── requirements.txt
│   └── app.py
│
└── README.md
```

Full-stack repositories are usually easier to maintain when frontend, backend, and Python or hardware-integration services are separated into clear directories with their own entry points and dependency files [web:733][web:735].

---

## How the system works

### 1. Mobile app
The React Native app is used by both customers and merchants. Merchants can verify customers, withdraw funds, and manage account-related flows.

### 2. Backend API
The Express backend authenticates users, stores user and merchant data, updates balances, verifies credentials, and exposes REST endpoints used by the mobile app.

### 3. Python fingerprint layer
The Python service communicates with the AS608 fingerprint sensor through a serial/UART connection. It can be used to enroll fingerprints, verify users, or capture biometric templates before sending results back to the backend.

### 4. MongoDB
MongoDB stores users, merchants, balances, settings, and any future transaction or biometric metadata you choose to persist.

---

## Hardware requirements

To use the fingerprint part of this project, you need:

- AS608 fingerprint sensor
- USB-to-TTL serial adapter or supported microcontroller bridge
- A machine capable of running the Python service
- Correct serial/UART wiring

Typical AS608 integrations use UART communication and often initialize the sensor at `57600` baud in example setups, though the exact wiring and serial behavior depend on the board or adapter being used [web:732][web:736].

---

## AS608 wiring notes

Common serial wiring conventions:

- **AS608 TX** → host RX
- **AS608 RX** → host TX
- **VCC** → power
- **GND** → ground

If you are connecting through a microcontroller or adapter, double-check the labels because TX/RX markings can sometimes be confusing in real hardware setups [web:744].

---

## Frontend setup

### Prerequisites
- Node.js
- npm or yarn
- Expo CLI
- Android Studio emulator or physical device
- Expo Go (optional)

### Install dependencies

```bash
cd frontend
npm install
```

### Install additional packages if needed

```bash
npm install @react-native-async-storage/async-storage
npm install @react-navigation/native
npm install @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-otp-entry
npx expo install expo-local-authentication
npx expo install @expo/vector-icons
```

### Configure API base URL

```js
// frontend/config/env.js
export const API_BASE_URL = "http://YOUR_LOCAL_IP:5000";
```

If testing on a physical device, use your computer’s LAN IP instead of `localhost`, because mobile devices do not resolve your development machine’s localhost the same way local desktop apps do [web:725].

### Run the frontend

```bash
npx expo start
```

---

## Backend setup

### Prerequisites
- Node.js
- MongoDB connection string
- npm or yarn

### Install dependencies

```bash
cd backend
npm install
```

### Example dependencies

```bash
npm install express mongoose cors dotenv jsonwebtoken bcryptjs
```

### Example environment file

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fingerpay
JWT_SECRET=your_secret_key
PYTHON_SERVICE_URL=http://127.0.0.1:8000
```

### Start backend server

```bash
npm run dev
```

or

```bash
node server.js
```

---

## Python fingerprint service setup

### Prerequisites
- Python 3.9+
- pip
- Serial access to the AS608 sensor

### Install Python dependencies

```bash
cd python
pip install -r requirements.txt
```

### Example `requirements.txt`

```txt
pyserial
flask
requests
```

### Example Python service responsibilities

The Python service can:
- Open the serial connection to the AS608 sensor
- Enroll fingerprints
- Verify fingerprints
- Return success or failure data to the backend
- Optionally expose simple HTTP endpoints that the Node backend can call

Python support for optical fingerprint sensors is commonly built around serial access, and Adafruit’s optical fingerprint documentation also highlights hardware UART support as part of Python-based sensor communication workflows [web:738]. Python libraries and forks specifically supporting AS608 also exist and can reduce low-level protocol work if you do not want to implement the serial command layer from scratch [web:740].

---

## Example AS608 Python service

```python
# python/fingerprint_service.py
from flask import Flask, request, jsonify
import serial

app = Flask(__name__)

SERIAL_PORT = "COM3"   # change for your system, e.g. /dev/ttyUSB0 on Linux
BAUD_RATE = 57600

def connect_sensor():
    return serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)

@app.route("/enroll", methods=["POST"])
def enroll():
    data = request.get_json()
    user_id = data.get("userId")

    if not user_id:
        return jsonify({"error": "userId is required"}), 400

    try:
        sensor = connect_sensor()

        # Replace this with real AS608 enroll logic
        # Example: send command packets to sensor, capture finger, store template, etc.

        sensor.close()

        return jsonify({
            "message": "Fingerprint enrolled successfully",
            "userId": user_id,
            "success": True
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

if __name__ == "__main__":
    app.run(port=8000, debug=True)
```

This sample shows the service shape only. Real enrollment must implement the AS608 command flow for image capture, conversion, and template storage, which is reflected in common AS608 examples that initialize the sensor, capture an image, and convert it into an internal template before enrollment completes [web:732][web:736].

---

## Backend to Python communication

Your Node.js backend can call the Python service when a merchant taps **Verify fingerprint** in the mobile app.

Example:

```js
const axios = require("axios");

const response = await axios.post(`${process.env.PYTHON_SERVICE_URL}/enroll`, {
  userId: foundUser.id,
});
```

This keeps the hardware communication inside Python while the backend remains responsible for authentication, permissions, and app-facing API responses.

---

## Example merchant withdraw endpoint

```js
router.post("/withdraw", authMerchant, async (req, res) => {
  try {
    const { amount } = req.body;
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Please provide a valid withdrawal amount" });
    }

    const merchant = await Merchant.findById(req.merchantId);

    if (!merchant) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    const currentBalance = Number(merchant.balance || 0);

    if (numericAmount > currentBalance) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    merchant.balance = currentBalance - numericAmount;
    await merchant.save();

    return res.status(200).json({
      message: "Withdrawal successful",
      balance: merchant.balance,
      merchant,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});
```

---

## Local merchant withdrawal history

The mobile app can store withdrawal history locally using AsyncStorage so merchants can still see recent withdrawals without needing a dedicated MongoDB transaction collection immediately. AsyncStorage is commonly used in React Native apps for lightweight persistence such as retaining locally stored app state or records between sessions [web:669][web:665].

Example key:

```js
const merchantStorageKey = `merchant_withdrawals_${user?.id || user?.company_name}`;
```

If logout clears the entire AsyncStorage store, these local withdrawals will also be deleted, so logout should remove only auth-related keys if the history needs to remain on the device [web:663][web:671].

---

## Role-based theming

Merchant theming can be determined by checking whether the logged-in user has a `company_name` value:

```js
const isMerchant = !!user?.company_name?.trim();
```

Optional chaining is useful here because it safely handles missing fields without throwing runtime errors when a nested property does not exist [web:654][web:662].

---

## API endpoints

### Auth
- `POST /auth/login`
- `POST /auth/send-email-code`
- `POST /auth/verify-email-code`

### User
- `GET /user/me`
- `POST /user/me/default-payment`
- `POST /user/verify-credentials`

### Merchant
- `GET /merchant/me`
- `POST /merchant/withdraw`

### Biometric
- `POST /biometric/enroll`

You can also add:
- `POST /biometric/verify`
- `GET /merchant/withdrawals`
- `POST /merchant/save-fingerprint-status`

---

## Running the full system

### Start MongoDB
Make sure MongoDB is running locally or your cloud database is accessible.

### Start backend
```bash
cd backend
npm install
npm run dev
```

### Start Python service
```bash
cd python
pip install -r requirements.txt
python fingerprint_service.py
```

### Start frontend
```bash
cd frontend
npm install
npx expo start
```

---

## Recommended environment variables

### Frontend
```env
API_BASE_URL=http://YOUR_LOCAL_IP:5000
```

### Backend
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fingerpay
JWT_SECRET=your_secret_key
PYTHON_SERVICE_URL=http://127.0.0.1:8000
```

### Python
```env
SERIAL_PORT=COM3
BAUD_RATE=57600
```

AS608 examples commonly show a `57600` serial speed during initialization, though this should still be confirmed against the specific module and adapter being used in your environment [web:732][web:736].

---

## Security notes

- Store JWT secrets in environment variables
- Never hardcode production credentials
- Protect merchant-only routes with authentication middleware
- Validate all withdrawal and biometric requests on the backend
- Restrict Python service access so it is not publicly exposed without backend control

Authorization middleware that reads Bearer tokens from request headers is a standard pattern for protected Express APIs [web:690][web:694].

---

## Future improvements

- Store fingerprint enrollment metadata in MongoDB
- Add a proper `transactions` collection
- Add merchant settlement reports
- Add real biometric verification templates and matching logic
- Add audit logging for enrollments and withdrawals
- Replace local withdrawal history with backend persistence
- Add Docker support for backend and Python service
- Add CI/CD workflows

---

## Troubleshooting

### App cannot reach backend
- Check `API_BASE_URL`
- Use your computer’s IP address, not `localhost`
- Ensure backend server is running on the same network

### Python service cannot access AS608
- Confirm serial port name
- Check TX/RX wiring
- Confirm baud rate
- Make sure another app is not already using the serial port

### Fingerprint enrollment fails
- Verify sensor power
- Confirm UART connection
- Confirm the Python service is using the correct serial device
- Check whether the AS608 library or serial command protocol is correctly implemented

### Merchant history disappears after logout
- Do not use `AsyncStorage.clear()`
- Remove only token and auth keys during logout

---

## Screens to showcase

For a good GitHub presentation, include screenshots or short recordings of:
- Login
- Verify account
- Merchant payment screen
- Withdraw to bank
- Fingerprint verification
- Merchant profile
- Merchant bottom tabs

Clear visuals, setup instructions, and architecture notes make project READMEs easier for contributors to understand and reuse [web:718][web:730].

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a pull request

---

## Author

Built as a full-stack fintech and biometric verification project using React Native, Node.js, MongoDB, Python, and the AS608 fingerprint sensor.
