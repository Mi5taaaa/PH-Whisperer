/* ============================================================
   HAND-WRITTEN QUESTION BANK — pH Whisperer
   ============================================================

   Format per entry:
   { min: 1, max: 13.5,        <- pH range where this question fits
     mode: "any",              <- "any", "normal", or "hard"
     prompt: "…",
     options: ["A","B","C","D"],  <- 2-4 choices
     answer: "A",                 <- must match one option exactly
     explain: "…" }
   ============================================================ */

const CUSTOM_QUESTIONS = [
  { min: 1, max: 13.5, mode: "any",
    prompt: "Why does the app photograph a gray card next to every sample?",
    options: ["To correct for the color of the lighting",
              "To measure the temperature",
              "Gray neutralizes the acid",
              "It makes the photo look professional"],
    answer: "To correct for the color of the lighting",
    explain: "A gray reference lets the software cancel the light source's color cast — the same trick photographers use for white balance." },

  { min: 6, max: 8.5, mode: "any",
    prompt: "Your water sample reads inside the WHO pH guideline (6.5–8.5). What does that prove?",
    options: ["Only that the pH is acceptable — nothing about other contaminants",
              "The water is safe to drink",
              "The water is sterile",
              "The water contains no metals"],
    answer: "Only that the pH is acceptable — nothing about other contaminants",
    explain: "pH is one parameter of many. Clear, pH-neutral water can still carry bacteria, nitrates, or metals — that's why pH Whisperer is a screening tool." },

  { min: 1, max: 13.5, mode: "hard",
    prompt: "Why can't a color-based method distinguish pH 13 from pH 13.5 as easily as pH 4 from pH 4.5?",
    options: ["The indicator's color barely changes at the extremes of its range",
              "Cameras cannot see violet",
              "OH⁻ ions absorb the light",
              "The gray card stops working above pH 12"],
    answer: "The indicator's color barely changes at the extremes of its range",
    explain: "Indicator resolution isn't uniform: where the absorbance curve shifts little per pH unit, colors converge and any eye or camera loses precision." },
];
