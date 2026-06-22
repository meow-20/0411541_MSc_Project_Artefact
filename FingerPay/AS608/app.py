"""
app.py — Flask REST API for the AS608 fingerprint sensor.

Exposes HTTP endpoints that your Node.js / Express app calls to
enroll and verify fingerprints.  Runs on port 5001 by default.

Endpoints
---------
POST /enroll    — capture finger twice, generate template, store in MongoDB
POST /match     — compare a fresh finger against a supplied base64 template
POST /delete    — delete all templates from the sensor's onboard flash
GET  /health    — return sensor status for diagnostics
"""

from __future__ import annotations

import base64
import logging
import time
from datetime import datetime
from typing import Optional

import serial.tools.list_ports
from bson.binary import Binary
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient

from fingerprint import (
    BUFFER_1,
    BUFFER_2,
    CaptureFingerImage,
    ExtractFeatures,
    FingerprintModule,
    GenerateTemplate,
    StoreTemplate,
)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = Flask(__name__)
CORS(app)  # allow cross-origin calls from your Node.js backend

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# MongoDB connection (same db/collection as enroll_mongo.py)
# ---------------------------------------------------------------------------

MONGO_URI = "mongodb://localhost:27017/"
mongo_client = MongoClient(MONGO_URI)
fp_collection = mongo_client["fingerpay"]["biometrics"]
logger.info("Connected to MongoDB — database: fingerpay, collection: biometrics")

# ---------------------------------------------------------------------------
# Sensor helpers
# ---------------------------------------------------------------------------


def _find_sensor_port() -> Optional[str]:
    """Return the first CP210x / Silicon Labs serial port, or None."""
    ports = serial.tools.list_ports.comports()
    for p in ports:
        if "CP210x" in p.description or "Silicon Labs" in p.description:
            logger.info("Found sensor at %s", p.device)
            return p.device
    logger.warning("No fingerprint sensor detected")
    return None


def _connect_sensor() -> Optional[FingerprintModule]:
    """Open a connection to the fingerprint sensor.

    Returns the module instance, or *None* if the sensor could not be
    found or connected.
    """
    port = _find_sensor_port()
    if not port:
        return None
    module = FingerprintModule(port)
    if not module.connect():
        logger.error("Could not connect to sensor at %s", port)
        return None
    time.sleep(0.1)
    module.ser.reset_input_buffer()
    return module


def _drain(module: FingerprintModule) -> None:
    """Discard trailing ACK bytes left by previous write operations."""
    time.sleep(0.3)
    n = module.ser.in_waiting
    if n:
        module.ser.read(n)
    module.ser.reset_input_buffer()


def _capture_twice(module: FingerprintModule) -> tuple[bool, str]:
    """Perform the two-finger-scan sequence required for enrolment.

    Returns ``(success, error_message)``.
    """
    # -- first scan ----------------------------------------------------------
    result = module.capture_finger_image()
    if result != CaptureFingerImage.SUCCESS:
        return False, f"First capture failed (code: {result})"
    logger.info("First capture OK")

    result = module.extract_features(BUFFER_1)
    if result != ExtractFeatures.SUCCESS:
        return False, f"First feature extraction failed (code: {result})"
    logger.info("First features extracted")

    # -- second scan ---------------------------------------------------------
    result = module.capture_finger_image()
    if result != CaptureFingerImage.SUCCESS:
        return False, f"Second capture failed (code: {result})"
    logger.info("Second capture OK")

    result = module.extract_features(BUFFER_2)
    if result != ExtractFeatures.SUCCESS:
        return False, f"Second feature extraction failed (code: {result})"
    logger.info("Second features extracted")

    return True, ""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.route("/enroll", methods=["POST"])
def enroll():
    """Enrol a new fingerprint (matches the logic from enroll_mongo.py).

    Expects a ``userId`` in the request body.  Captures the finger twice,
    generates a template, stores it **both** on the sensor's onboard flash
    **and** in MongoDB (``fingerpay.biometrics``).

    .. code-block:: json

       { "userId": "abc123" }

    Response:

    .. code-block:: json

       {
         "success": true,
         "userId": "abc123",
         "biometricId": "<MongoDB _id>",
         "template_length": 512,
         "page_id": 0
       }
    """
    data = request.get_json(silent=True) or {}
    print(data)
    user_id = data.get("userId", "").strip()

    if not user_id:
        return jsonify(success=False, error="userId is required"), 400

    module = _connect_sensor()
    if not module:
        return jsonify(success=False, error="Sensor not found or not connected"), 503

    try:
        # ------------------------------------------------------------------
        #  1. Capture twice & generate template
        # ------------------------------------------------------------------
        ok, msg = _capture_twice(module)
        if not ok:
            return jsonify(success=False, error=msg), 400

        result = module.generate_template()
        if result != GenerateTemplate.SUCCESS:
            return jsonify(success=False,
                           error=f"Template generation failed (code: {result})"), 500

        template_bytes = module.read_buffer(BUFFER_1)
        if not template_bytes:
            return jsonify(success=False, error="Could not read template from buffer"), 500

        logger.info("Template generated: %d bytes", len(template_bytes))

        # ------------------------------------------------------------------
        #  2. (Optional) Store on sensor flash for onboard matching
        # ------------------------------------------------------------------
        page_id = module.get_next_page_id()
        if page_id is not None:
            result = module.store_template(page_id, BUFFER_1)
            if result == StoreTemplate.SUCCESS:
                logger.info("Template saved to sensor page %d", page_id)
            else:
                logger.warning("Could not save to sensor flash (page %d)", page_id)
                page_id = None
        else:
            logger.warning("Sensor flash is full — template stored in MongoDB only")
            page_id = None

        # ------------------------------------------------------------------
        #  3. (Optional) Capture raw image for display
        # ------------------------------------------------------------------
        image_b64 = None
        # (skipped in API mode — image capture is optional interactive step)

        # ------------------------------------------------------------------
        #  4. Store in MongoDB (fingerpay.biometrics)
        # ------------------------------------------------------------------
        document = {
            "user_id": user_id,
            "template_data": Binary(template_bytes),
            "template_length": len(template_bytes),
            "page_id": page_id,
            "base64_string": image_b64,
            "timestamp": datetime.now(),
        }

        result = fp_collection.insert_one(document)
        biometric_id = str(result.inserted_id)
        logger.info("MongoDB document inserted: %s", biometric_id)

        return jsonify(
            success=True,
            userId=user_id,
            biometricId=biometric_id,
            template_length=len(template_bytes),
            page_id=page_id,
        )

    except Exception as exc:
        logger.exception("Enrolment error")
        return jsonify(success=False, error=str(exc)), 500

    finally:
        module.disconnect()


@app.route("/match", methods=["POST"])
def match():
    """Match a fresh fingerprint against templates stored in MongoDB
    (exactly like ``match_mongo.py``).

    No request body required — the endpoint reads all enrolled templates
    from ``fingerpay.biometrics`` automatically, captures a fresh finger,
    and returns the matched user (or a "not found" result).

    .. code-block:: json

       { "userId": "optional-id-to-echo-back" }

    Response (match found):

    .. code-block:: json

       {
         "success": true,
         "matched": true,
         "score": 128,
         "user_id": "jdoe",
         "page_id": 3,
         "document_id": "65f1...",
         "userId": "echoed-back"
       }

    Response (no match):

    .. code-block:: json

       {
         "success": true,
         "matched": false,
         "score": 0,
         "userId": "echoed-back"
       }
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get("userId", None)

    # ------------------------------------------------------------------
    #  1. Load templates from MongoDB  (match_mongo.py lines 29-50)
    # ------------------------------------------------------------------
    total = fp_collection.count_documents({})
    if total == 0:
        return jsonify(success=False, error="No fingerprints in database"), 404

    has_templates = fp_collection.count_documents({"template_data": {"$exists": True}})
    if has_templates == 0:
        return jsonify(success=False, error="No template data found in MongoDB"), 404

    docs = list(fp_collection.find({"template_data": {"$exists": True}}))
    logger.info("Loaded %d template(s) from MongoDB — ready for matching", len(docs))

    # ------------------------------------------------------------------
    #  2. Connect to sensor
    # ------------------------------------------------------------------
    module = _connect_sensor()
    if not module:
        return jsonify(success=False, error="Sensor not found or not connected"), 503

    try:
        # ------------------------------------------------------------------
        #  3. Capture fresh finger → features in BUFFER_2
        # ------------------------------------------------------------------
        result = module.capture_finger_image()
        if result != CaptureFingerImage.SUCCESS:
            return jsonify(success=False, error=f"Capture failed (code: {result})"), 400

        result = module.extract_features(BUFFER_2)
        if result != ExtractFeatures.SUCCESS:
            return jsonify(success=False, error=f"Feature extraction failed (code: {result})"), 400

        logger.info("Fresh finger captured and features extracted")

        # ------------------------------------------------------------------
        #  4. Match against each stored template
        # ------------------------------------------------------------------
        match_doc = None
        match_score = 0

        for i, doc in enumerate(docs):
            template = doc["template_data"]  # Binary → bytes

            # Write stored template into BUFFER_1
            if not module.write_buffer(BUFFER_1, template):
                logger.warning("  [%d/%d] Write error — skipping", i + 1, len(docs))
                _drain(module)
                continue

            _drain(module)

            # Compare BUFFER_1 (stored) vs BUFFER_2 (fresh)
            result = module.compare_buffers()
            if result is None:
                logger.warning("  [%d/%d] Compare returned None — skipping", i + 1, len(docs))
                continue

            if result.is_matching:
                match_doc = doc
                match_score = result.matching_score
                logger.info("  MATCH at index %d (score: %d)", i, result.matching_score)
                break
            else:
                logger.info("  [%d/%d] No match (score: %d)", i + 1, len(docs), result.matching_score)

        # ------------------------------------------------------------------
        #  5. Result  (match_mongo.py lines 158-177)
        # ------------------------------------------------------------------
        if match_doc:
            uid = match_doc.get("user_id", "Unknown")
            page = match_doc.get("page_id")
            ts = match_doc.get("timestamp")
            doc_id = str(match_doc["_id"])

            return jsonify(
                success=True,
                matched=True,
                score=match_score,
                user_id=uid,
                page_id=page,
                document_id=doc_id,
                userId=user_id,
            )

        logger.info("No match — scanned fingerprint does not match any enrolled user")
        return jsonify(
            success=True,
            matched=False,
            score=0,
            userId=user_id,
        )

    except Exception as exc:
        logger.exception("Match error")
        return jsonify(success=False, error=str(exc)), 500

    finally:
        module.disconnect()


@app.route("/delete", methods=["POST"])
def delete():
    """Delete ALL fingerprint templates from the sensor's onboard flash.

    .. code-block:: json

       {
         "success": true,
         "deleted_count": 3
       }
    """
    from fingerprint import DeleteTemplates

    module = _connect_sensor()
    if not module:
        return jsonify(success=False, error="Sensor not found or not connected"), 503

    try:
        before = module.read_enrolled_fingers_count()
        logger.info("Templates before delete: %s", before)

        result = module.delete_all_templates()
        if result != DeleteTemplates.SUCCESS:
            return (
                jsonify(
                    success=False,
                    error=f"Delete failed (code: {result})",
                    deleted_count=0,
                ),
                500,
            )

        after = module.read_enrolled_fingers_count() or 0
        deleted = (before or 0) - after
        logger.info("Deleted %d template(s)", deleted)

        return jsonify(success=True, deleted_count=deleted)

    except Exception as exc:
        logger.exception("Delete error")
        return jsonify(success=False, error=str(exc)), 500

    finally:
        module.disconnect()


@app.route("/health", methods=["GET"])
def health():
    """Lightweight health-check — is the sensor reachable?"""
    sensor_found = _find_sensor_port() is not None
    if not sensor_found:
        return jsonify(status="unhealthy", sensor="not found"), 503

    module = _connect_sensor()
    if not module:
        return jsonify(status="unhealthy", sensor="connection failed"), 503

    try:
        count = module.read_enrolled_fingers_count()
        return jsonify(
            status="healthy",
            sensor="connected",
            enrolled_fingers=count,
        )
    except Exception:
        return jsonify(status="unhealthy", sensor="communication error"), 503
    finally:
        module.disconnect()


# ---------------------------------------------------------------------------
# Entry-point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    logger.info("Starting fingerprint API server on port %d (debug=%s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)
