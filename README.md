# pH Whisperer

**Turn any phone into a pH reader for the price of indicator solution.**

pH Whisperer estimates the pH of a solution from the color of a pH indicator,
using the phone's camera. A gray reference card in the frame corrects for
lighting, the color is analyzed in CIELAB space, and the pH is interpolated
between user-made calibration points — with an uncertainty value on every
reading, and an explicit low-confidence warning when the color is unlike
anything calibrated.

**Live app:** https://mi5taaaa.github.io/PH-Whisperer/ *(update after
enabling GitHub Pages — see guides/PUBLISHING_GUIDE.md)*

## How it works

1. **Calibrate** — photograph reference solutions of known pH (verified with
   a meter or fresh buffers) with your indicator. Eight or more points across
   your range is a good start.
2. **Share** — the whole calibration packs into a short code with a checksum.
   Share the code, or generate a QR that opens the app with the calibration
   pre-loaded. No server, no accounts, no expiry.
3. **Measure** — frame the sample in the circle with the gray card visible,
   press Read pH.

## What it is and isn't

pH Whisperer is a screening tool for education, fieldwork, and home use —
classrooms without enough pH meters, first-line water checks, aquariums and
hydroponics. It is not a certified instrument, and a pH inside the WHO
drinking-water guideline (6.5–8.5) does not by itself mean water is safe to
drink.

## Repository layout

- `index.html` — the entire app (single file, no build step, no backend)
- `guides/` — publishing, photo protocol, and outreach guides
- `research/` — the Python research pipeline: leakage-safe model training
  (grouped cross-validation), feature extraction, and a Flask prototype.
  Not needed to run the app; kept here as the scientific basis of the project.

## Credits

Created by Amina Asan and Luca Aurelian Anghelescu, students at Colegiul Național de
Informatică "Tudor Vianu", București, as part of a project on low-cost
colorimetric water screening.

*Suggested license: MIT (add via GitHub → Add file → Create new file →
name it `LICENSE` → choose the MIT template).*
