from pathlib import Path
from urllib.request import Request, urlopen

import numpy as np
from PIL import Image

MODEL_URL = (
    "https://huggingface.co/juandaram/deepfake-detector/"
    "resolve/main/model.tflite"
)
MODEL_PATH = Path(__file__).with_name("model.tflite")

_interpreter = None
_input_index = None
_output_index = None


def _load_model():
    global _interpreter, _input_index, _output_index

    if _interpreter is not None:
        return

    if not MODEL_PATH.exists():
        print("Downloading CyberLens AI model...")
        req = Request(MODEL_URL, headers={"User-Agent": "CyberLens/1.0"})
        with urlopen(req, timeout=180) as response:
            MODEL_PATH.write_bytes(response.read())
        print("AI model downloaded.")

    try:
        import tflite_runtime.interpreter as tflite
        Interpreter = tflite.Interpreter
    except ImportError:
        try:
            import tensorflow as tf
            Interpreter = tf.lite.Interpreter
        except ImportError as exc:
            raise RuntimeError(
                "TensorFlow Lite runtime is not installed. "
                "Install tflite-runtime on Linux or tensorflow on a compatible local system."
            ) from exc

    print("Loading CyberLens AI detector...")
    _interpreter = Interpreter(model_path=str(MODEL_PATH))
    _interpreter.allocate_tensors()

    inputs = _interpreter.get_input_details()
    outputs = _interpreter.get_output_details()

    _input_index = inputs[0]["index"]
    _output_index = outputs[0]["index"]

    print("AI detector ready.")


def analyze_image(image_path: str):
    _load_model()

    image = Image.open(image_path).convert("RGB")
    image = image.resize((128, 128))

    array = np.asarray(image, dtype=np.float32) / 255.0
    batch = np.expand_dims(array, axis=0)

    _interpreter.set_tensor(_input_index, batch)
    _interpreter.invoke()

    output = _interpreter.get_tensor(_output_index)
    real_probability = float(np.asarray(output).reshape(-1)[0])
    real_probability = max(0.0, min(1.0, real_probability))
    fake_probability = 1.0 - real_probability

    if real_probability >= 0.65:
        verdict = "Likely Authentic"
        confidence = real_probability
    elif fake_probability >= 0.65:
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
            "Result produced by the CyberLens TensorFlow Lite deepfake classifier."
        ]
    }
