"""
Train the pH color model with an HONEST evaluation.

Dataset layout expected:

    dataset/
        pH_1.0/
            pH_1.0_batchA_01.jpg
            pH_1.0_batchA_02.jpg
            pH_1.0_batchB_01.jpg
            ...
        pH_1.5/
            ...

"batchX" identifies an independently prepared solution. Photos of the
same solution must share a batch name. If your filenames have no batch
tag (your current dataset!), every photo in a folder is treated as ONE
batch and the script will warn you that cross-validation cannot be
done honestly -- that is the pseudo-replication problem.

What this script does:
1. Extracts color features from the sample patch of each photo,
   white-balanced against the gray-card patch.
2. Evaluates RandomForest vs HistGradientBoosting with GROUPED
   cross-validation: entire batches are held out, so the model is
   always tested on solutions it has never seen. This is the honest
   version of your +-0.5 number.
3. Trains the best model on everything and saves it for the app.

Usage:
    python train_model.py --data ./dataset
Adjust the PATCH CONFIG below to where your sample and gray card sit
in the frame (fractions of image width/height).
"""

import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

import joblib
import numpy as np
from PIL import Image
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.model_selection import GroupKFold
from sklearn.metrics import mean_absolute_error

from features import rgb_to_features, mean_patch_rgb, FEATURE_NAMES

# ---------------- PATCH CONFIG (edit to match your photo setup) ------
SAMPLE_CENTER = (0.50, 0.50)   # (x, y) as fraction of image size
SAMPLE_HALF   = 0.08           # patch half-width as fraction of width
GRAY_CENTER   = (0.15, 0.85)   # where the gray card sits in frame
GRAY_HALF     = 0.05
USE_GRAY_CARD = True
# ----------------------------------------------------------------------

PH_DIR_RE = re.compile(r"pH[_\- ]?(\d+(?:\.\d+)?)", re.IGNORECASE)
BATCH_RE  = re.compile(r"batch[_\- ]?(\w+?)[_\-.]", re.IGNORECASE)


def extract_from_image(path: Path):
    img = np.asarray(Image.open(path).convert("RGB"))
    h, w = img.shape[:2]
    scx, scy = int(SAMPLE_CENTER[0] * w), int(SAMPLE_CENTER[1] * h)
    sample_rgb = mean_patch_rgb(img, scx, scy, int(SAMPLE_HALF * w))
    gray_rgb = None
    if USE_GRAY_CARD:
        gcx, gcy = int(GRAY_CENTER[0] * w), int(GRAY_CENTER[1] * h)
        gray_rgb = mean_patch_rgb(img, gcx, gcy, int(GRAY_HALF * w))
    return rgb_to_features(sample_rgb, gray_rgb)


def load_dataset(root: Path):
    X, y, groups = [], [], []
    batches_per_ph = defaultdict(set)
    for folder in sorted(root.iterdir()):
        if not folder.is_dir():
            continue
        m = PH_DIR_RE.search(folder.name)
        if not m:
            print(f"  skipping folder without pH label: {folder.name}")
            continue
        ph = float(m.group(1))
        for img_path in sorted(folder.glob("*")):
            if img_path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
                continue
            bm = BATCH_RE.search(img_path.name)
            batch = bm.group(1) if bm else "single"
            group = f"{ph}_{batch}"
            try:
                X.append(extract_from_image(img_path))
            except Exception as e:
                print(f"  failed on {img_path.name}: {e}")
                continue
            y.append(ph)
            groups.append(group)
            batches_per_ph[ph].add(batch)
    return np.array(X), np.array(y), np.array(groups), batches_per_ph


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="dataset", help="dataset root folder")
    ap.add_argument("--out", default="ph_model.joblib")
    args = ap.parse_args()

    root = Path(args.data)
    if not root.exists():
        sys.exit(f"Dataset folder not found: {root}")

    print("Loading dataset and extracting features...")
    X, y, groups, batches_per_ph = load_dataset(root)
    print(f"  {len(y)} photos, pH {y.min():.1f} to {y.max():.1f}, "
          f"{len(set(groups))} independent solutions")

    single_batch = [ph for ph, b in batches_per_ph.items() if len(b) < 2]
    if single_batch:
        print("\n  WARNING - pseudo-replication detected!")
        print(f"  {len(single_batch)} pH levels have only ONE prepared solution.")
        print("  Grouped CV will hold out entire pH levels instead, which")
        print("  underestimates accuracy. Re-photograph with independent")
        print("  batches (see README) for a trustworthy error estimate.\n")

    models = {
        "RandomForest": RandomForestRegressor(
            n_estimators=400, min_samples_leaf=2, n_jobs=-1, random_state=0),
        "HistGradientBoosting": HistGradientBoostingRegressor(
            max_depth=4, learning_rate=0.08, max_iter=500, random_state=0),
    }

    n_splits = min(5, len(set(groups)))
    cv = GroupKFold(n_splits=n_splits)
    results = {}
    print(f"Grouped {n_splits}-fold cross-validation "
          f"(whole solutions held out):")
    for name, model in models.items():
        maes = []
        for tr, te in cv.split(X, y, groups):
            model.fit(X[tr], y[tr])
            maes.append(mean_absolute_error(y[te], model.predict(X[te])))
        results[name] = (np.mean(maes), np.std(maes))
        print(f"  {name:22s} MAE = {np.mean(maes):.3f} "
              f"+- {np.std(maes):.3f} pH units")

    best_name = min(results, key=lambda k: results[k][0])
    print(f"\nBest model: {best_name}. Training on the full dataset...")
    best = models[best_name]
    best.fit(X, y)

    joblib.dump({
        "model": best,
        "model_name": best_name,
        "feature_names": FEATURE_NAMES,
        "cv_mae": results[best_name][0],
        "uses_gray_card": USE_GRAY_CARD,
        "ph_range": (float(y.min()), float(y.max())),
    }, args.out)
    print(f"Saved to {args.out}. Run `python app.py` to launch the app.")


if __name__ == "__main__":
    main()
