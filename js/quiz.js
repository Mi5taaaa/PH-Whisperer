/* ============================================================
   pH Whisperer — learning mode / quiz engine
   Template-generated questions from a pH value. No server, no AI:
   every question is computed, so every answer is exactly checkable.
   ============================================================ */
"use strict";

/* ---------- helpers ---------- */
const Q = {
  ph: 7, difficulty: "normal", idx: 0, score: 0, questions: [],
  streak: 0, fromScan: false,
};
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
const fmt = x => (Math.round(x*100)/100).toString();
const isInt = x => Math.abs(x - Math.round(x)) < 1e-9;

/* express 10^-n mol/L in the most convenient metric unit (integer n) */
function convenientConc(n){
  const table = [[3,"mmol/L"],[6,"µmol/L"],[9,"nmol/L"],[12,"pmol/L"]];
  if(n <= 0) return {v: 10**(-n), u: "mol/L"};
  for(const [e,u] of table){
    const v = 10**(e-n);
    if(v >= 1 && v < 1000) return {v, u};
  }
  return {v: 10**(3+12-n)/1000, u: "pmol/L"};
}

/* ---------- question generators ----------
   Each returns {prompt, type:'mc'|'num', options?, answer, explain}
   or null when it doesn't apply to this pH.                    */

const GEN_NORMAL = [
  function indicatorColor(ph){
    const color = ph<=2?"Red":ph<=4?"Orange":ph<=6?"Yellow":ph<7.6?"Green":ph<=9?"Blue-green":ph<=11?"Blue":"Violet";
    const others = ["Red","Orange","Yellow","Green","Blue-green","Blue","Violet"].filter(c=>c!==color);
    return {prompt:`Roughly what color would a universal indicator show at pH ${fmt(ph)}?`,
      type:"mc", options:shuffle([color,...shuffle(others).slice(0,3)]), answer:color,
      explain:`Universal indicator runs red → orange → yellow → green (≈7) → blue → violet as pH rises; at ${fmt(ph)} it sits at ${color.toLowerCase()}.`};
  },
  function ionProduct(ph){
    const right = "10⁻¹⁴ mol²/L²";
    return {prompt:`In your solution at pH ${fmt(ph)} (25 °C), what is the product [H⁺]·[OH⁻]?`,
      type:"mc", options:shuffle([right,"10⁻⁷ mol²/L²","10⁻²⁸ mol²/L²","It depends on the pH"]),
      answer:right,
      explain:`Kw = [H⁺][OH⁻] = 10⁻¹⁴ at 25 °C for every aqueous solution — the two always trade off, whatever the pH.`};
  },
  function neutralize(ph){
    if(ph > 6.4 && ph < 7.6) return null;
    const right = ph < 7 ? "Add a base" : "Add an acid";
    return {prompt:`You want to bring your pH ${fmt(ph)} solution toward neutral. What do you add?`,
      type:"mc", options:shuffle(["Add an acid","Add a base","Nothing — it is already neutral"]),
      answer:right,
      explain:`pH ${fmt(ph)} is ${ph<7?"acidic, so a base neutralizes the excess H⁺":"basic, so an acid neutralizes the excess OH⁻"}.`};
  },
  function whichMoreAcidic(ph){
    const d = rnd([1,1.5,2,3]) * rnd([-1,1]);
    const other = Math.round((ph+d)*2)/2;
    if(other < 1 || other > 13.5) return null;
    const right = `pH ${fmt(Math.min(ph,other))}`;
    return {prompt:`Which solution has the higher concentration of H⁺ ions: pH ${fmt(ph)} or pH ${fmt(other)}?`,
      type:"mc", options:[`pH ${fmt(ph)}`,`pH ${fmt(other)}`].sort(), answer:right,
      explain:`Lower pH = more H⁺. The scale runs backwards from the concentration.`};
  },
  function pOH(ph){
    return {prompt:`Your solution has pH ${fmt(ph)}. What is its pOH?`,
      type:"num", answer:14-ph,
      explain:`pH + pOH = 14 (at 25 °C), so pOH = 14 − ${fmt(ph)} = ${fmt(14-ph)}.`};
  },
  function hExponent(ph){
    return {prompt:`At pH ${fmt(ph)}, the concentration of H⁺ ions is 10⁻ˣ mol/L. What is x?`,
      type:"num", answer:ph,
      explain:`pH = −log₁₀[H⁺], so [H⁺] = 10⁻ᵖᴴ = 10^−${fmt(ph)} mol/L.`};
  },
  function ohExponent(ph){
    return {prompt:`At pH ${fmt(ph)}, the concentration of OH⁻ ions is 10⁻ʸ mol/L. What is y?`,
      type:"num", answer:14-ph,
      explain:`[H⁺][OH⁻] = 10⁻¹⁴, so [OH⁻] = 10^−(14−pH) = 10^−${fmt(14-ph)} mol/L.`};
  },
  function convenientUnit(ph){
    if(!isInt(ph) || ph < 1) return null;
    const n = Math.round(ph), c = convenientConc(n);
    const right = `${fmt(c.v)} ${c.u}`;
    const wrongs = new Set();
    [[c.v*10,c.u],[c.v/10||0.1,c.u],
     [c.v,{ "mmol/L":"µmol/L","µmol/L":"nmol/L","nmol/L":"µmol/L","pmol/L":"nmol/L","mol/L":"mmol/L"}[c.u]]]
     .forEach(([v,u])=>wrongs.add(`${fmt(v)} ${u}`));
    return {prompt:`At pH ${n}, what is [H⁺] in the most convenient unit?`,
      type:"mc", options:shuffle([right,...[...wrongs].slice(0,3)]), answer:right,
      explain:`[H⁺] = 10⁻${n} mol/L = ${right}.`};
  },
  function classify(ph){
    const right = ph < 6.9 ? "Acidic" : ph > 7.1 ? "Basic" : "Neutral";
    return {prompt:`A solution with pH ${fmt(ph)} is…`,
      type:"mc", options:["Acidic","Neutral","Basic"], answer:right,
      explain:`pH below 7 is acidic, 7 is neutral, above 7 is basic.`};
  },
  function timesMoreAcidic(ph){
    if(ph > 11.5) return null;
    const k = rnd([1,2,3]);
    const right = `${10**k}× more acidic`;
    return {prompt:`How much more acidic is pH ${fmt(ph)} than pH ${fmt(ph+k)}?`,
      type:"mc",
      options:shuffle([right,`${k}× more acidic`,`${2*k}× more acidic`,`${10**(k+1)}× more acidic`]),
      answer:right,
      explain:`Each pH unit is a factor of 10 in [H⁺]; ${k} unit${k>1?"s":""} = 10^${k} = ${10**k}×.`};
  },
  function protonation(ph){
    const d = rnd([-2,-1,1,2]);
    const pka = Math.round((ph+d)*10)/10;
    if(pka < 0 || pka > 14) return null;
    const right = ph > pka ? "Mostly deprotonated (A⁻)" : "Mostly protonated (HA)";
    return {prompt:`An acid with pKa = ${fmt(pka)} is dissolved in your solution at pH ${fmt(ph)}. In what form is it mainly found?`,
      type:"mc",
      options:shuffle(["Mostly protonated (HA)","Mostly deprotonated (A⁻)","Exactly half and half"]),
      answer:right,
      explain:`When pH > pKa the acid gives up its proton (deprotonated); when pH < pKa it keeps it. Here pH ${ph>pka?">":"<"} pKa.`};
  },
  function substanceQ(ph){
    if(typeof SUBSTANCES === "undefined" || SUBSTANCES.length < 6) return null;
    const sorted = [...SUBSTANCES].sort((a,b)=>Math.abs(a.ph-ph)-Math.abs(b.ph-ph));
    const right = sorted[0];
    if(Math.abs(right.ph - ph) > 0.7) return null;
    const far = sorted.filter(s=>Math.abs(s.ph-ph) >= 2);
    if(far.length < 3) return null;
    const wrongs = shuffle(far).slice(0,3).map(s=>s.name);
    return {prompt:`Which of these has a pH closest to your ${fmt(ph)}?`,
      type:"mc", options:shuffle([right.name,...wrongs]), answer:right.name,
      explain:`${right.name} sits around pH ${fmt(right.ph)}.`};
  },
  function safety(ph){
    const right = ph <= 2 ? "Corrosive — can burn skin; gloves and goggles"
      : ph <= 5 ? "Irritant — avoid eyes and prolonged skin contact"
      : ph <= 9 ? "Generally safe to handle with normal care"
      : ph <= 12 ? "Irritant — avoid eyes and prolonged skin contact"
      : "Corrosive — can burn skin; gloves and goggles";
    return {prompt:`How should you treat a solution at pH ${fmt(ph)} for safety?`,
      type:"mc",
      options:shuffle(["Corrosive — can burn skin; gloves and goggles",
        "Irritant — avoid eyes and prolonged skin contact",
        "Generally safe to handle with normal care"]),
      answer:right,
      explain:`Roughly: pH ≤ 2 or ≥ 12 corrosive, 2–5 and 9–12 irritant, 5–9 mild. Extremes burn.`};
  },
];

const GEN_HARD = [
  function ratioExponent(ph){
    const k = rnd([2,3,4]);
    if(ph + k > 13.5) return null;
    return {prompt:`Solution A has your pH ${fmt(ph)}; solution B has pH ${fmt(ph+k)}. [H⁺]ₐ / [H⁺]ᵦ = 10ˣ. What is x?`,
      type:"num", answer:k,
      explain:`[H⁺]ₐ/[H⁺]ᵦ = 10⁻${fmt(ph)}/10⁻${fmt(ph+k)} = 10^(${fmt(ph+k)}−${fmt(ph)}) = 10^${k}.`};
  },
  function halfIonized(ph){
    if(ph < 2 || ph > 12) return null;
    const right = "50 %";
    return {prompt:`An acid happens to have pKa exactly equal to your measured pH (${fmt(ph)}). What fraction of it is deprotonated?`,
      type:"mc", options:shuffle([right,"100 %","0 %","25 %"]), answer:right,
      explain:`When pH = pKa, [HA] = [A⁻]: exactly half has given up its proton. That's the definition point of pKa.`};
  },
  function kaEstimate(ph){
    if(ph > 6 || !isInt(ph)) return null;
    const pC = rnd([1,2]);               // C = 0.1 or 0.01 M
    const pKa = 2*ph - pC;
    if(pKa <= 0) return null;
    return {prompt:`A weak monoprotic acid at ${pC===1?"0.1":"0.01"} M gives your measured pH ${fmt(ph)}. Its Ka ≈ 10⁻ᶻ. What is z?`,
      type:"num", answer:pKa,
      explain:`Ka ≈ [H⁺]²/C = (10⁻${ph})²/10⁻${pC} = 10^−(${2*ph}−${pC}) = 10⁻${pKa}.`};
  },
  function kbEstimate(ph){
    if(ph < 8 || !isInt(ph)) return null;
    const pOH = 14-ph, pC = rnd([1,2]);
    const pKb = 2*pOH - pC;
    if(pKb <= 0) return null;
    return {prompt:`A weak base at ${pC===1?"0.1":"0.01"} M gives your measured pH ${fmt(ph)} (so pOH ${fmt(pOH)}). Its Kb ≈ 10⁻ʷ. What is w?`,
      type:"num", answer:pKb,
      explain:`Kb ≈ [OH⁻]²/C = (10⁻${pOH})²/10⁻${pC} = 10⁻${pKb}.`};
  },
  function ionization(ph){
    if(ph > 6 || !isInt(ph)) return null;
    const pC = rnd([1,2]);
    const alpha = 10**(pC-ph)*100;
    if(alpha >= 100 || alpha < 0.001) return null;
    const right = `${fmt(alpha)} %`;
    return {prompt:`A weak acid at ${pC===1?"0.1":"0.01"} M gives your measured pH ${fmt(ph)}. What percentage of its molecules are ionized?`,
      type:"mc",
      options:shuffle([right,`${fmt(alpha*10)} %`,`${fmt(alpha/10)} %`,`${fmt(alpha*100 > 100 ? 50 : alpha*100)} %`]),
      answer:right,
      explain:`α = [H⁺]/C = 10⁻${ph}/10⁻${pC} = 10^−${ph-pC} = ${fmt(alpha)} %.`};
  },
  function dilution(ph){
    if(ph >= 6 || ph < 1) return null;
    const right = `pH ${fmt(Math.min(ph+1,7))}`;
    return {prompt:`You dilute a strong acid solution of pH ${fmt(ph)} ten times with pure water. The new pH is about…`,
      type:"mc",
      options:shuffle([right,`pH ${fmt(ph)}`,`pH ${fmt(Math.max(ph-1,0))}`,`pH ${fmt(ph+2)}`]),
      answer:right,
      explain:`10× dilution divides [H⁺] by 10, which raises pH by one unit (it can never pass 7 by dilution alone).`};
  },
];

/* ---------- daily streak (remembers between visits on this device) ---------- */
function loadDaily(){
  try{ return JSON.parse(localStorage.getItem("phw_daily")) || {last:"",streak:0,best:0}; }
  catch(e){ return {last:"",streak:0,best:0}; }
}
function saveDaily(d){ try{ localStorage.setItem("phw_daily", JSON.stringify(d)); }catch(e){} }
function markDailyRound(){
  const d = loadDaily();
  const today = new Date().toISOString().slice(0,10);
  if(d.last === today) { /* already counted today */ }
  else {
    const y = new Date(Date.now()-86400000).toISOString().slice(0,10);
    d.streak = (d.last === y) ? d.streak + 1 : 1;
    d.last = today;
    if(d.streak > d.best) d.best = d.streak;
    saveDaily(d);
  }
  updateDailyChip(d);
}
function updateDailyChip(d){
  d = d || loadDaily();
  const el = qel("quizDaily");
  if(el) el.textContent = "📅 " + d.streak + (d.best>d.streak ? " (best "+d.best+")" : "");
}

/* ---------- round construction ---------- */
function buildRound(ph, difficulty){
  const pool = difficulty === "hard" ? [...GEN_HARD, ...GEN_NORMAL] : [...GEN_NORMAL];
  const qs = [];
  for(const gen of shuffle(pool)){
    const q = gen(ph);
    if(q) qs.push(q);
    if(qs.length === 5) break;
  }
  return qs;
}
function randomPh(){
  return rnd([1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,11,11.5,12,12.5,13]);
}

/* ---------- UI ---------- */
const qel = id => document.getElementById(id);

function startQuiz(ph, fromScan){
  Q.ph = Math.min(13, Math.max(1, Math.round(ph*2)/2));
  Q.fromScan = !!fromScan;
  Q.idx = 0; Q.score = 0;
  Q.questions = buildRound(Q.ph, Q.difficulty);
  qel("quizPhChip").textContent = "pH " + fmt(Q.ph);
  updateDailyChip();
  showView("learn");
  renderQuestion();
}
function startQuizFromScan(ph){ startQuiz(ph, true); }
function startRandomQuiz(){ startQuiz(randomPh(), false); }

function setDifficulty(d){
  Q.difficulty = d;
  qel("diffNormal").classList.toggle("active", d==="normal");
  qel("diffHard").classList.toggle("active", d==="hard");
  startQuiz(Q.ph, Q.fromScan);   // rebuild round at new difficulty
}

function renderQuestion(){
  const q = Q.questions[Q.idx];
  qel("quizSummary").hidden = true;
  qel("quizCard").hidden = false;
  qel("quizProgress").textContent = `Question ${Q.idx+1} / ${Q.questions.length}`;
  qel("quizPrompt").textContent = q.prompt;
  qel("quizFeedback").textContent = "";
  qel("quizFeedback").className = "qfeedback";
  qel("quizNext").hidden = true;
  const opts = qel("quizOptions"); opts.innerHTML = "";
  const numrow = qel("quizNumRow");
  if(q.type === "mc"){
    numrow.hidden = true;
    q.options.forEach(o=>{
      const b = document.createElement("button");
      b.className = "qopt"; b.textContent = o;
      b.onclick = ()=>answer(o === q.answer, q, b);
      opts.appendChild(b);
    });
  } else {
    numrow.hidden = false;
    qel("quizNum").value = "";
    qel("quizNum").focus();
  }
}
function submitNum(){
  const q = Q.questions[Q.idx];
  const v = parseFloat(qel("quizNum").value.replace(",", "."));
  if(Number.isNaN(v)) return;
  answer(Math.abs(v - q.answer) < 0.051, q);
}
function answer(correct, q, btn){
  document.querySelectorAll("#quizOptions .qopt").forEach(b=>{
    b.disabled = true;
    if(b.textContent === String(q.answer)) b.classList.add("right");
  });
  if(btn && !correct) btn.classList.add("wrong");
  qel("quizNumRow").hidden = true;
  const f = qel("quizFeedback");
  if(correct){ Q.score++; Q.streak++; f.textContent = "Correct! " + q.explain; f.className = "qfeedback ok"; }
  else { Q.streak = 0; f.textContent = `Not quite — the answer is ${q.answer}. ` + q.explain; f.className = "qfeedback bad"; }
  qel("quizStreak").textContent = "🔥 " + Q.streak;
  qel("quizNext").hidden = false;
}
function nextQuestion(){
  Q.idx++;
  if(Q.idx < Q.questions.length) renderQuestion();
  else {
    qel("quizCard").hidden = true;
    markDailyRound();
    const s = qel("quizSummary"); s.hidden = false;
    qel("quizScoreLine").textContent = `${Q.score} / ${Q.questions.length}`;
    qel("quizVerdictLine").textContent =
      Q.score === 5 ? "Perfect round — the color has no secrets from you." :
      Q.score >= 3 ? "Solid! One more round makes it stick." :
      "Every chemist starts somewhere — try the same pH again.";
  }
}
