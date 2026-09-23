import numpy as np
from PIL import Image
import keras
from huggingface_hub import hf_hub_download

MODEL_ID = "kumaran-0188/image_forgery_detector"
MODEL_FILE = "forgery_model_fixed.keras"
IMG_SIZE = 224

_model = None


def _load_model():
    global _model

    if _model is not None:
        return

    print("Downloading CyberLens AI model...")

    model_path = hf_hub_download(
        repo_id=MODEL_ID,
        filename=MODEL_FILE
    )

    print("Loading CyberLens AI detector...")

    _model = keras.saving.load_model(model_path)

    print("AI detector ready.")


def analyze_image(image_path):
    _load_model()

    image = Image.open(image_path).convert("RGB")
    image = image.resize((IMG_SIZE, IMG_SIZE))

    image_array = np.asarray(image, dtype=np.float32) / 255.0
    image_array = np.expand_dims(image_array, axis=0)

    prediction = _model.predict(image_array, verbose=0)

    real_probability = float(np.asarray(prediction).reshape(-1)[0])
    real_probability = max(0.0, min(1.0, real_probability))

    fake_probability = 1.0 - real_probability

    if real_probability >= 0.65:
        verdict = "Likely Authentic"
        confidence = real_probability
    elif real_probability <= 0.35:
        verdict = "Likely Fake"
        confidence = fake_probability
    else:
        verdict = "Needs Verification"
        confidence = max(real_probability, fake_probability)

    return {
        "analysis_type": "image",
        "risk_score": round(fake_probability * 100, 2),
        "fake_probability": round(fake_probability, 4),
        "real_probability": round(real_probability, 4),
        "confidence": round(confidence * 100, 2),
        "verdict": verdict,
        "evidence": [
            f"Model real probability: {real_probability * 100:.2f}%",
            f"Model fake probability: {fake_probability * 100:.2f}%",
            "Result produced by the CyberLens AI image-forgery classifier."
        ]
    }