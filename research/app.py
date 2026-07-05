"""
Flask server for the pH vision app.

The phone's browser does the camera work and color sampling; it sends
the sampled sample-patch RGB and gray-card RGB here. We compute the
same features used in training and return a prediction WITH an
uncertainty estimate.

Uncertainty: for a random forest, each tree makes its own prediction.
The spread (std) across trees is a useful honesty signal -- if the
trees disagree, the color is unlike anything in training and the app
shows a low-confidence warning instead of a confident wrong answer.

Run:
    python train_model.py --data ./dataset     (first, once)
    python app.py
Then open http://<your-computer-ip>:5000 on the phone (same Wi-Fi).
Note: phone browsers only allow camera access over HTTPS or
localhost. Easiest workarounds during development:
  * use the photo-upload fallback built into the page, or
  * `adb reverse tcp:5000 tcp:5000` with USB debugging, then open
    http://localhost:5000 on the phone.
"""

from pathlib import Path

import joblib
import numpy as np
from flask import Flask, jsonify, render_template, request

from features import rgb_to_features

MODEL_PATH = Path("ph_model.joblib")

app = Flask(__name__)
bundle = None
if MODEL_PATH.exists():
    bundle = joblib.load(MODEL_PATH)
    print(f"Loaded {bundle['model_name']} "
          f"(training CV MAE {bundle['cv_mae']:.2f} pH)")
else:
    print("WARNING: ph_model.joblib not found - train first. "
          "The app will return an error for predictions.")


def predict_with_uncertainty(features):
    model = bundle["model"]
    x = features.reshape(1, -1)
    if hasattr(model, "estimators_"):          # random forest
        per_tree = np.array([t.predict(x)[0] for t in model.estimators_])
        return float(per_tree.mean()), float(per_tree.std())
    # gradient boosting has no simple per-tree spread; use CV MAE
    return float(model.predict(x)[0]), float(bundle["cv_mae"])


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    if bundle is None:
        return jsonify(error="No trained model on the server. "
                             "Run train_model.py first."), 503
    data = request.get_json(silent=True) or {}
    sample = data.get("sample_rgb")
    gray = data.get("gray_rgb")  # may be null
    if not sample or len(sample) != 3:
        return jsonify(error="sample_rgb must be [r, g, b]."), 400

    feats = rgb_to_features(sample, gray)
    ph, spread = predict_with_uncertainty(feats)

    lo, hi = bundle["ph_range"]
    ph = float(np.clip(ph, lo, hi))
    # combine tree spread with the model's honest CV error
    uncertainty = float(max(spread, bundle["cv_mae"]))

    return jsonify(
        ph=round(ph, 2),
        uncertainty=round(uncertainty, 2),
        low_confidence=bool(spread > 1.0),
        model=bundle["model_name"],
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
