/* ============================================================
   SUBSTANCE DATABASE — pH Whisperer quiz
   ============================================================
   REPLACE THE SAMPLE ENTRIES BELOW WITH YOUR OWN DATABASE.
   Format per entry:  { name: "Substance name", ph: 7.0 }
   - ph can be a single typical value (use the middle of a range)
   - aim for good coverage of the whole 1–13.5 scale
   - the quiz picks the substance closest to the measured pH as
     the correct answer, and distant ones as wrong options, so
     the more entries you add, the better the questions get.
   ============================================================ */

const SUBSTANCES = [
  { name: "Battery acid",        ph: 0.8 },
  { name: "Gastric acid",        ph: 1.5 },
  { name: "Lemon juice",         ph: 2.4 },
  { name: "Vinegar",             ph: 2.8 },
  { name: "Orange juice",        ph: 3.5 },
  { name: "Black coffee",        ph: 5.0 },
  { name: "Clean rain",          ph: 5.6 },
  { name: "Milk",                ph: 6.6 },
  { name: "Pure water",          ph: 7.0 },
  { name: "Human blood",         ph: 7.4 },
  { name: "Seawater",            ph: 8.1 },
  { name: "Baking soda solution",ph: 8.3 },
  { name: "Hand soap",           ph: 10.0 },
  { name: "Household ammonia",   ph: 11.5 },
  { name: "Bleach",              ph: 12.5 },
  { name: "Drain cleaner (NaOH)",ph: 13.5 },
];
