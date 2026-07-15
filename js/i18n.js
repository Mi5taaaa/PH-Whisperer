/* ============================================================
   pH Whisperer — i18n (EN / RO)
   How it works: RO_TEXT maps every English text fragment on the
   page to its Romanian version. applyLang() walks the page's text
   nodes, remembers each node's original English, and swaps them.
   Adding another language later = adding another map like RO_TEXT.
   Dynamic strings (built in JS) go through t("key") using UI_STRINGS.
   ============================================================ */
"use strict";

let LANG = (() => {
  try { const s = localStorage.getItem("phw_lang"); if (s) return s; } catch(e) {}
  return (navigator.language || "en").toLowerCase().startsWith("ro") ? "ro" : "en";
})();

/* ---------- dynamic UI strings ---------- */
const UI_STRINGS = {
  en: {
    readPh: "Read pH", captureRef: "Capture reference",
    question: "Question", correct: "Correct! ", notQuite: "Not quite — the answer is",
    perfect: "Perfect round — the color has no secrets from you.",
    solid: "Solid! One more round makes it stick.",
    tryAgain: "Every chemist starts somewhere — try the same pH again.",
    quizThis: "Quiz this pH ≈ ", reading: "Reading…",
    codeCopied: "Code copied.", loaded: "Loaded calibration", points: "points",
    withinWho: "Within the WHO drinking-water pH guideline (6.5–8.5).",
    outsideWho: "Outside the WHO drinking-water pH guideline (6.5–8.5).",
    lowConf: "Low confidence — this color is far from every calibration point. Check lighting, the gray card, and glare.",
    demoWarn: "Reading uses the built-in DEMO calibration. Calibrate with your own indicator before trusting values.",
    flatBand: "Between pH 6 and 10 red cabbage barely shifts colour, so this figure is a rough placement, not a measurement. Read the trend, not the decimals.",
    noCal: "No calibration points yet — add references in the Calibrate tab.",
    measureAway: "Measure away.",
  },
  ro: {
    readPh: "Citește pH-ul", captureRef: "Capturează referința",
    question: "Întrebarea", correct: "Corect! ", notQuite: "Nu chiar — răspunsul corect e",
    perfect: "Rundă perfectă — culoarea nu mai are secrete pentru tine.",
    solid: "Bine de tot! Încă o rundă și se fixează.",
    tryAgain: "Orice chimist începe de undeva — mai încearcă o dată același pH.",
    quizThis: "Quiz pentru pH ≈ ", reading: "Se citește…",
    codeCopied: "Cod copiat.", loaded: "Calibrare încărcată", points: "puncte",
    withinWho: "În intervalul recomandat de OMS pentru apa potabilă (6,5–8,5).",
    outsideWho: "În afara intervalului recomandat de OMS pentru apa potabilă (6,5–8,5).",
    lowConf: "Încredere scăzută — culoarea asta e departe de toate punctele de calibrare. Verifică lumina, cartonul gri și reflexiile.",
    demoWarn: "Citirea folosește calibrarea DEMO inclusă. Calibrează cu indicatorul tău înainte să te bazezi pe valori.",
    flatBand: "Între pH 6 și 10 varza roșie aproape că nu-și schimbă culoarea, așa că cifra de mai sus e o aproximare, nu o măsurătoare. Uită-te la tendință, nu la zecimale.",
    noCal: "Nu există încă puncte de calibrare — adaugă referințe în fila „Calibrează”.",
    measureAway: "Spor la măsurat!",
  }
};
const t = k => (UI_STRINGS[LANG] && UI_STRINGS[LANG][k]) || UI_STRINGS.en[k] || k;

/* ---------- full-page text dictionary (EN -> RO) ---------- */
const RO_TEXT = {
"A pH meter, of all things":
  "Tocmai un pH-metru",
"Dip your indicator. Point your camera. Read the number. That's the whole lab.":
  "Pui indicatorul. Îndrepți camera. Citești numărul. Ăsta-i tot laboratorul.",
"Try it now":
  "Încearcă acum",
"Quiz":
  "Quiz",
"How it works":
  "Cum funcționează",
"The science":
  "Știința",
"What it's for":
  "La ce folosește",
"Our story":
  "Povestea noastră",
"Add a drop of pH indicator to your sample.":
  "Pune o picătură de indicator de pH în probă.",
"Frame it in the circle with the gray card beside it.":
  "Încadreaz-o în cerc, cu cartonul gri alături.",
"The card lets the app cancel out your lighting.":
  "Datorită cartonului, aplicația poate compensa lumina din jur.",
"Press Read pH — the color becomes a number, with an honest ± on it.":
  "Apasă „Citește pH-ul” — culoarea devine un număr, însoțit de un ± sincer.",
"⚗️ Readings use our own calibration, measured from red cabbage (anthocyanin) extract. Use the same extract, or capture your own references in Calibrate. Between pH 6 and 10 this extract changes colour very little, so readings there are approximate.":
  "⚗️ Citirile folosesc calibrarea noastră, măsurată din extract de varză roșie (antocianine). Folosește același extract sau înregistrează-ți propriile referințe în „Calibrează”. Între pH 6 și 10 extractul își schimbă culoarea foarte puțin, așa că acolo citirile sunt orientative.",
"Measure":
  "Măsoară",
"Calibrate":
  "Calibrează",
"Camera unavailable here.":
  "Camera nu poate fi pornită aici.",
"Use “Upload photo” below — it works in every browser.":
  "Folosește „Încarcă o poză” de mai jos — funcționează în orice browser.",
"Gray card visible in the dashed box (corrects lighting — strongly recommended)":
  "Cartonul gri vizibil în chenarul punctat (corectează lumina — foarte recomandat)",
"Read pH":
  "Citește pH-ul",
"Upload photo":
  "Încarcă o poză",
"estimated pH":
  "pH estimat",
"Point the sample into the circle and press Read pH.":
  "Adu proba în cerc și apasă „Citește pH-ul”.",
"Capture reference":
  "Capturează referința",
"Prepare a solution of known pH (verified with a pH meter or a fresh buffer), add your indicator, frame it like a normal measurement, enter its pH and capture. Aim for at least 8 points spread across the range you care about. Several captures at the same pH under different lighting make the model tougher.":
  "Pregătește o soluție cu pH cunoscut (verificat cu un pH-metru sau cu o soluție-tampon proaspătă), adaugă indicatorul, încadreaz-o ca la o măsurătoare normală, scrie pH-ul și capturează. Ideal e să ai cel puțin 8 puncte, împrăștiate pe intervalul care te interesează. Câteva capturi la același pH, în lumini diferite, fac modelul mai rezistent.",
"color":
  "culoare",
"Lab distance ref":
  "reper Lab",
"Share by code":
  "Partajează prin cod",
"A code contains the whole calibration — paste it anywhere: chat, email, a QR code. Anyone who enters it (or opens the share link) gets your exact calibration.":
  "Un cod conține toată calibrarea — îl poți lipi oriunde: pe chat, pe e-mail, într-un cod QR. Oricine îl introduce (sau deschide linkul) primește calibrarea ta exactă.",
"Get code":
  "Generează cod",
"Copy code":
  "Copiază codul",
"Show QR":
  "Afișează QR",
"Save QR image (PNG)":
  "Salvează imaginea QR (PNG)",
"Load":
  "Încarcă",
"Backup as file":
  "Copie de siguranță în fișier",
"Export calibration":
  "Exportă calibrarea",
"Import calibration":
  "Importă calibrarea",
"Learning mode":
  "Modul de învățare",
"Five questions per round, generated from a pH — scanned or random.":
  "Cinci întrebări pe rundă, generate dintr-un pH — scanat sau la întâmplare.",
"Normal":
  "Normal",
"Hard":
  "Greu",
"🎲 Random pH":
  "🎲 pH la întâmplare",
"🔥 Today's streak for this difficulty isn't safe yet — score at least 4/5 to keep it alive.":
  "🔥 Seria de azi la această dificultate nu e încă salvată — fă cel puțin 4/5 ca să nu o pierzi.",
"Check":
  "Verifică",
"Next →":
  "Următoarea →",
"round score":
  "scorul rundei",
"Same pH again":
  "Același pH încă o dată",
"🎲 New random pH":
  "🎲 Alt pH la întâmplare",
"Why a color can be a number.":
  "De ce o culoare poate fi un număr.",
"The chemistry behind pH Whisperer — from protons to pixels.":
  "Chimia din spatele pH Whisperer — de la protoni la pixeli.",
"What pH actually is":
  "Ce e, de fapt, pH-ul",
"pH measures how acidic or basic a solution is by counting its hydrogen ions:":
  "pH-ul măsoară cât de acidă sau de bazică e o soluție, numărându-i ionii de hidrogen:",
". The logarithm is the part people forget — each step of one pH unit means":
  ". Logaritmul e partea pe care toată lumea o uită — fiecare treaptă de o unitate de pH înseamnă de",
"ten times":
  "zece ori",
"more or fewer hydrogen ions. Lemon juice (~pH 2) isn't a bit more acidic than milk (~pH 6.7); it's tens of thousands of times more acidic. Water sits near 7, and the WHO guideline for drinking water is 6.5–8.5.":
  "mai mulți sau mai puțini ioni de hidrogen. Sucul de lămâie (~pH 2) nu e doar „un pic” mai acid decât laptele (~pH 6,7); e de zeci de mii de ori mai acid. Apa stă în jur de 7, iar recomandarea OMS pentru apa potabilă e 6,5–8,5.",
"Why indicators change color":
  "De ce indicatorii își schimbă culoarea",
"Light interacts with a substance at the level of its electron orbitals. A pH indicator is a molecule whose structure — and therefore its electron distribution — changes when it gains or loses protons, and protonation is directly tied to the pH of the solution around it.":
  "Lumina interacționează cu o substanță la nivelul orbitalilor electronici. Un indicator de pH e o moleculă a cărei structură — și, odată cu ea, distribuția electronilor — se schimbă când primește sau cedează protoni, iar protonarea depinde direct de pH-ul soluției din jur.",
"Each of these forms has its own distinct absorbance curve in the visible spectrum: it swallows some wavelengths and lets others pass. The color you see is the light that":
  "Fiecare dintre aceste forme are propria curbă de absorbanță în spectrul vizibil: înghite anumite lungimi de undă și le lasă pe celelalte să treacă. Culoarea pe care o vezi e lumina care",
"survives":
  "scapă",
". Change the pH → change the molecule's form → change which wavelengths are absorbed → a different color reaches your eye.":
  ". Schimbi pH-ul → se schimbă forma moleculei → se schimbă ce lungimi de undă sunt absorbite → la ochi îți ajunge altă culoare.",
"absorbed (500–550 nm)":
  "absorbit (500–550 nm)",
"transmitted (600–750 nm) → what you see":
  "transmis (600–750 nm) → ce vezi",
"Our indicator at pH 1: a broad absorbance maximum around 500–550 nm removes the green, the orange-red 600–750 nm passes through — and the solution looks carmine red.":
  "Indicatorul nostru la pH 1: un maxim larg de absorbanță pe la 500–550 nm scoate verdele, iar roșul-portocaliu dintre 600 și 750 nm trece mai departe — și soluția arată roșu-carmin.",
"Absorbance is itself a logarithmic scale: one extra unit of absorbance means ten times less light transmitted. pH is a logarithm read through another logarithm — and yet your eye does it effortlessly.":
  "Absorbanța e și ea o scară logaritmică: o unitate în plus de absorbanță înseamnă de zece ori mai puțină lumină transmisă. pH-ul e un logaritm citit printr-un alt logaritm — și totuși ochiul tău îl citește fără niciun efort.",
"From color to number":
  "De la culoare la număr",
"If each pH produces a characteristic color, then a photograph of the color carries information about the pH — a camera can do what your eye does, but objectively. The program behind pH Whisperer assigns a pH score to the color it sees, based on a database of reference photos it was trained on.":
  "Dacă fiecare pH produce o culoare caracteristică, atunci o fotografie a culorii poartă în ea informația despre pH — o cameră poate face ce face și ochiul tău, doar că obiectiv. Programul din spatele pH Whisperer dă un scor de pH culorii pe care o vede, pe baza unei colecții de fotografii de referință pe care a fost antrenat.",
"These programs are sensitive to small changes in conditions, which is why every photo includes a gray card as a color reference and why lighting is kept constant.":
  "Programele de felul ăsta sunt sensibile la cele mai mici schimbări de condiții — de-asta fiecare fotografie include un carton gri ca reper de culoare, iar lumina se ține constantă.",
"One drop, many jobs.":
  "O picătură, multe treburi.",
"Anywhere a color can speak, pH Whisperer can listen.":
  "Oriunde o culoare are ceva de spus, pH Whisperer o ascultă.",
"Water monitoring":
  "Monitorizarea apei",
"Check wells, tanks, rivers or tap water against the WHO guideline band (6.5–8.5), marked right on the scale. A quick first look that tells you when water deserves a proper lab test.":
  "Verifică fântâni, rezervoare, râuri sau apa de la robinet față de intervalul recomandat de OMS (6,5–8,5), marcat direct pe scală. O primă verificare rapidă, care îți spune când apa merită un test serios de laborator.",
"Soil pH for gardens":
  "pH-ul solului, pentru grădină",
"Mix a spoonful of soil with twice as much distilled water, shake, let it settle, and read the clear layer above. Soil pH decides which nutrients plants can actually absorb.":
  "Amestecă o lingură de pământ cu de două ori mai multă apă distilată, agită bine, lasă totul să se așeze și citește stratul limpede de deasupra. De pH-ul solului depinde ce nutrienți pot absorbi cu adevărat plantele.",
"School laboratories":
  "Laboratorul de la școală",
"One teacher calibrates, prints the QR code, and every student's phone becomes an instrument — the whole class measures at the same time.":
  "Un singur profesor calibrează, tipărește codul QR, și telefonul fiecărui elev devine instrument — toată clasa măsoară în același timp.",
"Learning at home":
  "Chimie acasă",
"Boil red cabbage for a homemade indicator and test the kitchen — lemon, soap, vinegar, milk. Everyday liquids are safe; stronger ones belong in adult hands.":
  "Fierbe niște varză roșie și ai un indicator făcut în casă; apoi testează bucătăria — lămâie, săpun, oțet, lapte. Lichidele de zi cu zi sunt sigure; cele mai agresive rămân în grija adulților.",
"And beyond":
  "Și mai departe",
"Aquariums and hydroponics live by pH — and any test strip that answers in color (nitrate, chlorine, hardness) could be read the same way.":
  "Acvariile și culturile hidroponice trăiesc după pH — iar orice bandeletă de test care răspunde printr-o culoare (nitrați, clor, duritate) ar putea fi citită exact la fel.",
"Why we made this.":
  "De ce am făcut asta.",
"pH Whisperer began as a project for a chemistry × AI conference, where we — Amina and Luca — presented our invention: a program that reads the pH of a solution from the color of its indicator. We're 11th-grade students at Tudor Vianu National Computer Science College.":
  "pH Whisperer a pornit ca proiect pentru o conferință de chimie × AI, la care noi doi — Amina și Luca — ne-am prezentat invenția: un program care citește pH-ul unei soluții din culoarea indicatorului. Suntem elevi în clasa a XI-a la Colegiul Național de Informatică „Tudor Vianu”.",
"After the conference, a simple fact kept bothering us: a good pH meter costs from tens to hundreds of euros, needs calibration buffers, storage solution, and careful maintenance, while a phone with a camera is already in almost everyone's pocket. So we rebuilt the idea as a free web app: for schools that can't buy a meter for every bench, for anyone checking their water or soil, for kids discovering chemistry at home.":
  "După conferință, un lucru simplu nu ne-a mai dat pace: un pH-metru bun costă de la câteva zeci până la câteva sute de euro și are nevoie de soluții-tampon, soluție de păstrare și întreținere atentă — în timp ce un telefon cu cameră e deja în buzunarul aproape oricui. Așa că am refăcut ideea sub forma unei aplicații web gratuite: pentru școlile care nu-și permit câte un pH-metru pe fiecare bancă, pentru oricine vrea să-și verifice apa sau solul, pentru copiii care descoperă chimia acasă.",
"Every reading comes with a ± value, and the app tells you when a color is unlike anything it has been calibrated on instead of inventing a confident number.":
  "Fiecare citire vine cu o valoare ±, iar când o culoare nu seamănă cu nimic din calibrare, aplicația ți-o spune sincer — în loc să inventeze un număr cu aer sigur pe el.",
"pH Whisperer estimates pH from indicator color. It is a screening tool, not a certified instrument — a pH inside 6.5–8.5 (the WHO drinking-water guideline) does not by itself mean water is safe to drink.":
  "pH Whisperer estimează pH-ul din culoarea indicatorului. E un instrument de verificare rapidă, nu unul certificat — un pH între 6,5 și 8,5 (recomandarea OMS pentru apa potabilă) nu înseamnă, de unul singur, că apa e bună de băut.",
"Calibrations live in this session; get a share code to keep or share them.":
  "Calibrările trăiesc doar în sesiunea curentă; generează un cod ca să le păstrezi sau să le dai mai departe.",
"Made with curiosity by Amina & Luca · Tudor Vianu, București":
  "Făcut cu curiozitate de Amina & Luca · Tudor Vianu, București",
"Întrebările din quiz sunt deocamdată în engleză — traducerea lor e pe drum.":
  "Întrebările din quiz sunt deocamdată în engleză — traducerea lor e pe drum.",
};

/* reverse map for RO -> EN */
const EN_TEXT = {};
for (const k in RO_TEXT) EN_TEXT[RO_TEXT[k]] = k;

/* ---------- the walker ---------- */
function walkTextNodes(fn){
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: n => {
      const p = n.parentElement;
      if (!p || ["SCRIPT","STYLE"].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      return n.nodeValue.trim().length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  let n; while ((n = w.nextNode())) fn(n);
}
const norm = s => s.replace(/\s+/g, " ").trim();

function applyLang(){
  document.documentElement.lang = LANG;
  walkTextNodes(n => {
    if (n.__en === undefined) n.__en = norm(n.nodeValue);   // remember the English original
    const en = n.__en;
    if (LANG === "ro" && RO_TEXT[en]) n.nodeValue = RO_TEXT[en];
    else if (LANG === "en") n.nodeValue = en;
  });
  const b = document.getElementById("langToggle");
  if (b) b.textContent = LANG === "en" ? "RO" : "EN";
  const note = document.getElementById("quizLangNote");
  if (note) note.hidden = (LANG === "en");
  const ab = document.getElementById("actionBtn");
  if (ab && typeof mode !== "undefined")
    ab.textContent = mode === "measure" ? t("readPh") : t("captureRef");
}
function setLang(l){
  LANG = l;
  try { localStorage.setItem("phw_lang", l); } catch(e) {}
  applyLang();
}
