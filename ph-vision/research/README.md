# pH Vision — colorimetric water screening

Camera → color features → regression model → pH estimate with uncertainty.

## Quick start

```bash
pip install flask scikit-learn pillow numpy joblib
python train_model.py --data ./dataset
python app.py
```

Open `http://<computer-ip>:5000` on a phone on the same Wi-Fi.
Phone browsers block the camera on plain HTTP, so during development
either use the built-in **Upload photo** button (works everywhere), or
connect the phone by USB and run `adb reverse tcp:5000 tcp:5000`, then
open `http://localhost:5000` on the phone.

## Dataset layout and photo protocol (the important part)

```
dataset/
  pH_4.5/
    pH_4.5_batchA_01.jpg
    pH_4.5_batchA_02.jpg
    pH_4.5_batchB_01.jpg   <- batchB = an independently prepared solution
  pH_5.0/
    ...
```

Rules for a dataset the model can honestly learn from:

1. **5–10 independent solutions per pH level**, each prepared
   separately and verified with a calibrated pH meter. Photos of the
   same solution share a `batch` tag in the filename.
2. **Vary the conditions on purpose**: at least 2 phones and 2
   lighting setups across batches. The model must learn "this color =
   pH 4.5", not "this lamp = pH 4.5".
3. **Gray card in every frame**, same position (default: lower-left).
   The sample sits in the center. Positions are configurable at the
   top of `train_model.py` and must match the reticle in the app.
4. Avoid glare on the liquid surface; the code uses per-channel
   medians to resist small highlights, but a big reflection will
   still poison the reading.

Evaluation uses **GroupKFold**: whole solutions are held out, so the
reported MAE is the error on solutions the model has never seen —
the honest version of accuracy. A random split over near-duplicate
photos of one solution leaks data and inflates accuracy.

## For real water samples

- Photograph a **blank** (sample without indicator) first. Turbid or
  tinted water shifts colors; comparing against the blank tells you
  what the water contributed on its own.
- pH alone is not "cleanliness". Frame results as screening; a pH in
  6.5–8.5 (WHO guideline) does not certify safe water.

## Roadmap ideas

- Same pipeline, new strips: nitrate, free chlorine, hardness — only
  the dataset and the label change.
- Export the model to run fully on-device (no server) with a small
  neural net + TensorFlow Lite, or convert the forest to JS.
- Log readings with GPS timestamps → a community water-quality map.
