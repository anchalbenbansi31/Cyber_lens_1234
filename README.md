# CyberLens Complete

This package contains a complete Flask website matching the CyberLens mint/teal reference design.

## Real AI model

The backend uses the `juandaram/deepfake-detector` TensorFlow Lite model.

Model details documented by its author:
- ResNet50 transfer learning
- RGB 128x128 input
- sigmoid output: 0 = FAKE, 1 = REAL
- published validation accuracy: about 84%
- model can have bias and should not be treated as perfect

The model is downloaded on first analysis; it is not committed into the repository.

## Local test

On Linux/macOS:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Windows local testing may require a compatible TensorFlow installation because `tflite-runtime` is primarily distributed for Linux platforms. The target deployment is a Linux web service.

Open:
http://127.0.0.1:5000

Health:
http://127.0.0.1:5000/api/health

## Free deployment

Deploy as a Render Web Service.

Build command:
pip install -r requirements.txt

Start command:
gunicorn --bind 0.0.0.0:$PORT app:app

Health check:
`/api/health`

After deployment, use the generated public HTTPS URL. The website and backend are served by the same Flask service, so the frontend uses `/api/health` and `/api/analyze`; there is no localhost or example backend URL in production.

## Supported input

JPG, JPEG, PNG and WEBP images up to 20 MB.

## Important

No AI detector can guarantee every real/fake decision. CyberLens displays the actual model output and uses `Needs Verification` for uncertain scores.
