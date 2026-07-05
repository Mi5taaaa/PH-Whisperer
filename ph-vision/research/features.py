"""
Shared color-feature extraction for the pH vision project.

Used by BOTH train_model.py and app.py so that the features the model
was trained on are exactly the features computed at prediction time.
(A silent mismatch here is a classic source of "it worked in training
but not in the app" bugs.)

Key ideas
---------
1. White-balance correction with the gray card: we scale each RGB
   channel so the gray card patch becomes neutral. This removes most
   of the effect of the light source's color temperature.
2. Hue is a CIRCULAR quantity (0 deg and 360 deg are the same red).
   Feeding raw hue to a model creates a fake discontinuity, so we
   encode it as (sin, cos) instead.
3. We also include CIELAB coordinates: Lab is designed so that
   distances roughly match *perceived* color differences, which is
   exactly what an indicator scale encodes.
"""

import colorsys
import numpy as np

FEATURE_NAMES = [
    "r", "g", "b",            # white-balanced, normalized RGB
    "hue_sin", "hue_cos",     # circular hue encoding
    "saturation", "value",    # HSV S and V
    "lab_L", "lab_a", "lab_b" # CIELAB
]


def white_balance(rgb, gray_rgb=None):
    """Scale channels so the gray-card patch becomes neutral gray.

    rgb, gray_rgb: array-like of 3 floats in [0, 255].
    If no gray card is provided, returns rgb unchanged (and your
    accuracy will depend on how well-controlled the lighting is).
    """
    rgb = np.asarray(rgb, dtype=float)
    if gray_rgb is None:
        return rgb
    gray = np.asarray(gray_rgb, dtype=float)
    gray = np.clip(gray, 1e-6, None)          # avoid division by zero
    target = gray.mean()                       # keep overall brightness
    corrected = rgb * (target / gray)
    return np.clip(corrected, 0.0, 255.0)


def _srgb_to_lab(rgb01):
    """sRGB (0..1) -> CIELAB, D65 illuminant. Implemented manually to
    avoid extra dependencies; formulas are the standard CIE ones."""
    rgb01 = np.asarray(rgb01, dtype=float)
    # inverse gamma (sRGB companding)
    linear = np.where(rgb01 <= 0.04045,
                      rgb01 / 12.92,
                      ((rgb01 + 0.055) / 1.055) ** 2.4)
    # linear RGB -> XYZ (sRGB matrix, D65)
    M = np.array([[0.4124564, 0.3575761, 0.1804375],
                  [0.2126729, 0.7151522, 0.0721750],
                  [0.0193339, 0.1191920, 0.9503041]])
    xyz = M @ linear
    # normalize by D65 white point
    xyz /= np.array([0.95047, 1.00000, 1.08883])

    def f(t):
        return np.where(t > (6 / 29) ** 3,
                        np.cbrt(t),
                        t / (3 * (6 / 29) ** 2) + 4 / 29)

    fx, fy, fz = f(xyz)
    L = 116 * fy - 16
    a = 500 * (fx - fy)
    b = 200 * (fy - fz)
    return np.array([L, a, b])


def rgb_to_features(rgb, gray_rgb=None):
    """Turn one measured RGB color (+ optional gray-card RGB) into the
    model's feature vector. Returns a 1-D numpy array matching
    FEATURE_NAMES."""
    corrected = white_balance(rgb, gray_rgb)
    r01, g01, b01 = corrected / 255.0

    h, s, v = colorsys.rgb_to_hsv(r01, g01, b01)  # h in [0, 1)
    hue_angle = 2 * np.pi * h
    lab = _srgb_to_lab([r01, g01, b01])

    return np.array([
        r01, g01, b01,
        np.sin(hue_angle), np.cos(hue_angle),
        s, v,
        lab[0], lab[1], lab[2],
    ])


def mean_patch_rgb(img_array, cx, cy, half):
    """Mean RGB of a square patch centered at (cx, cy) with half-width
    `half`, from an HxWx3 uint8 image array. Uses the MEDIAN per
    channel, which is more robust to glare/specular highlights than
    the mean (glare pixels are extreme outliers)."""
    h, w = img_array.shape[:2]
    x0, x1 = max(cx - half, 0), min(cx + half, w)
    y0, y1 = max(cy - half, 0), min(cy + half, h)
    patch = img_array[y0:y1, x0:x1].reshape(-1, 3).astype(float)
    return np.median(patch, axis=0)
