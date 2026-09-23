import os
import uuid
from pathlib import Path

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

from detector import analyze_image

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@app.get("/")
def home():
    return render_template("index.html")

@app.get("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "service": "CyberLens Backend",
        "model": "juandaram/deepfake-detector TensorFlow Lite"
    })

@app.post("/api/analyze")
def analyze():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file was uploaded."}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"success": False, "error": "No file was selected."}), 400

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({
            "success": False,
            "error": "Please upload JPG, JPEG, PNG or WEBP."
        }), 415

    temp_dir = Path(os.environ.get("TMPDIR", "/tmp")) / "cyberlens"
    temp_dir.mkdir(parents=True, exist_ok=True)
    path = temp_dir / f"{uuid.uuid4().hex}{ext}"

    try:
        file.save(path)
        result = analyze_image(str(path))
        return jsonify({
            "success": True,
            "analysis": result,
            "file": {"name": file.filename, "type": file.mimetype or "image"},
            "status": "completed",
            "verification_id": "CL-" + uuid.uuid4().hex[:8].upper()
        })
    except Exception as exc:
        return jsonify({
            "success": False,
            "error": f"AI analysis failed: {str(exc)}"
        }), 500
    finally:
        try:
            path.unlink(missing_ok=True)
        except Exception:
            pass

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
