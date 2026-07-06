/* ============================================================
   pH Whisperer — learning mode / quiz engine
   Template-generated questions from a pH value. No server, no AI:
   every question is computed, so every answer is exactly checkable.
   ============================================================ */
"use strict";

/* ---------- helpers ---------- */
const Q = {
  ph: 7, difficulty: "normal", idx: 0, score: 0, questions: [],
  fromScan: false,
};
const rnd = a => a[Math.floor(Math.random() * a.length)];
const pv = (...opts) => rnd(opts);
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

/* swatch color for a pH (same gradient the app uses) */
const SW_STOPS=[[1,"#EF4E23"],[2,"#F7941D"],[3,"#FFF200"],[4,"#BFD730"],[5,"#8DC63F"],[6,"#39B54A"],[7,"#00A651"],[8,"#00A878"],[9,"#00AAA6"],[10,"#4BA6DF"],[11,"#2E5FA3"],[12,"#4D4D9F"],[13,"#662D91"],[13.5,"#52258B"]];
function phSwatchColor(ph){
  for(let i=1;i<SW_STOPS.length;i++) if(ph<=SW_STOPS[i][0]){
    const [p0,c0]=SW_STOPS[i-1],[p1,c1]=SW_STOPS[i],t=(ph-p0)/(p1-p0);
    const hex=s=>[1,3,5].map(k=>parseInt(s.slice(k,k+2),16));
    const a=hex(c0),b=hex(c1);
    return `rgb(${a.map((v,k)=>Math.round(v+t*(b[k]-v))).join(",")})`;
  }
  return SW_STOPS.at(-1)[1];
}

/* ---------- question generators ----------
   Each returns {prompt, type:'mc'|'num', options?, answer, explain}
   or null when it doesn't apply to this pH.                    */

const GEN_NORMAL = [
  function litmus(ph){
    if(ph > 6.4 && ph < 7.6) return null;
    const right = ph < 7 ? "Blue litmus turns red" : "Red litmus turns blue";
    return {prompt:`You dip litmus paper into your pH ${fmt(ph)} solution. What happens?`,
      type:"mc", options:shuffle(["Blue litmus turns red","Red litmus turns blue","Neither paper changes color"]),
      answer:right,
      explain:`Acids (pH<7) turn blue litmus red; bases turn red litmus blue. Litmus is a one-bit pH meter.`};
  },
  function moreIons(ph){
    if(ph > 6.4 && ph < 7.6) return null;
    const right = ph < 7 ? "H⁺ ions" : "OH⁻ ions";
    return {prompt:pv(
      `In your pH ${fmt(ph)} solution, which ions outnumber the other?`,
      `pH ${fmt(ph)}: which ion is winning, H⁺ or OH⁻?`),
      type:"mc", options:["H⁺ ions","OH⁻ ions","Exactly equal amounts"], answer:right,
      explain:`Below 7, H⁺ dominates; above 7, OH⁻ does. They're equal only at neutral.`};
  },
  function pohToPh(ph){
    return {prompt:`A different solution has pOH ${fmt(14-ph)}. What is its pH?`,
      type:"num", answer:ph,
      explain:`pH = 14 − pOH = 14 − ${fmt(14-ph)} = ${fmt(ph)}.`};
  },
  function factorToNeutral(ph){
    const k = Math.abs(7-ph);
    if(k < 0.9 || !isInt(ph)) return null;
    return {prompt:`To bring your pH ${fmt(ph)} to neutral, [H⁺] must ${ph<7?"decrease":"increase"} by a factor of 10ˣ. What is x?`,
      type:"num", answer:k,
      explain:`Each pH unit is one factor of 10, and neutral is ${k} unit${k>1?"s":""} away.`};
  },
  function estimateFromColor(ph){
    return {prompt:"This swatch is the color your universal indicator shows. Estimate its pH (±0.75 accepted):",
      type:"num", answer:ph, tol:0.75, swatch:phSwatchColor(ph),
      explain:`This shade sits at about pH ${fmt(ph)} on the indicator scale. Training your eye is the whole game.`};
  },
  function indicatorColor(ph){
    const color = ph<=1.5?"Red":ph<=2.5?"Orange":ph<=3.5?"Yellow":ph<=5.5?"Yellow-green"
      :ph<=7.5?"Green":ph<=9.5?"Blue-green":ph<=11.5?"Blue":"Violet";
    const others = ["Red","Orange","Yellow","Yellow-green","Green","Blue-green","Blue","Violet"].filter(c=>c!==color);
    return {prompt:`Roughly what color would a universal indicator show at pH ${fmt(ph)}?`,
      type:"mc", options:shuffle([color,...shuffle(others).slice(0,3)]), answer:color,
      explain:`On the universal-indicator chart, pH ${fmt(ph)} sits at ${color.toLowerCase()}.`};
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
    const wording = rnd([
      `Your solution has pH ${fmt(ph)}. What is its pOH?`,
      `pH ${fmt(ph)} — quick: pOH = ?`,
      `A classmate measured pOH instead of pH. Your reading is pH ${fmt(ph)}; what should their number be?`]);
    return {prompt:wording,
      type:"num", answer:14-ph,
      explain:`pH + pOH = 14 (at 25 °C), so pOH = 14 − ${fmt(ph)} = ${fmt(14-ph)}.`};
  },
  function hExponent(ph){
    const wording2 = rnd([
      `At pH ${fmt(ph)}, the concentration of H⁺ ions is 10⁻ˣ mol/L. What is x?`,
      `Write [H⁺] of your pH ${fmt(ph)} solution as a power of ten: 10⁻ˣ mol/L. x = ?`]);
    return {prompt:wording2,
      type:"num", answer:ph,
      explain:`pH = −log₁₀[H⁺], so [H⁺] = 10⁻ᵖᴴ = 10^−${fmt(ph)} mol/L.`};
  },
  function ohExponent(ph){
    return {prompt:pv(
      `At pH ${fmt(ph)}, the concentration of OH⁻ ions is 10⁻ʸ mol/L. What is y?`,
      `Flip side: at pH ${fmt(ph)}, [OH⁻] = 10⁻ʸ mol/L. Find y.`,
      `Your solution reads pH ${fmt(ph)}. How concentrated are the OH⁻ ions, as 10⁻ʸ mol/L?`),
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
    return {prompt:pv(
      `A solution with pH ${fmt(ph)} is…`,
      `Classify your pH ${fmt(ph)} sample:`,
      `pH ${fmt(ph)} — acidic, neutral, or basic?`),
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
  function phFromKa(ph){
    if(!isInt(ph) || ph < 2 || ph > 6) return null;
    const pC = rnd([1,2]);
    const pKa = 2*ph - pC;
    if(pKa <= 0 || pKa > 12) return null;
    return {prompt:`A weak acid has Ka = 10⁻${pKa}. What pH does its ${pC===1?"0.1":"0.01"} M solution have?`,
      type:"num", answer:ph,
      explain:`pH ≈ (pKa + pC)/2 = (${pKa} + ${pC})/2 = ${fmt(ph)} for a weak acid. (The inverse of estimating Ka from pH.)`};
  },
  function conjugatePair(ph){
    return {prompt:`For any conjugate acid–base pair in water at 25 °C, pKa + pKb equals…`,
      type:"mc", options:shuffle(["14","7","0","28"]), answer:"14",
      explain:`Ka·Kb = Kw = 10⁻¹⁴, so pKa + pKb = 14 — the pair always splits the water constant between them.`};
  },
  function saltHydrolysis(ph){
    const basic = rnd([true,false]);
    const right = basic ? "Basic" : "Acidic";
    return {prompt: basic
      ? `You dissolve in pure water the salt of a WEAK acid and a STRONG base (like sodium acetate). The solution turns out…`
      : `You dissolve in pure water the salt of a STRONG acid and a WEAK base (like ammonium chloride). The solution turns out…`,
      type:"mc", options:shuffle(["Acidic","Basic","Neutral"]), answer:right,
      explain: basic
      ? `The weak-acid anion steals H⁺ from water, leaving OH⁻ behind — hydrolysis makes it basic.`
      : `The weak-base cation donates H⁺ to water — hydrolysis makes it acidic.`};
  },
  function bestBuffer(ph){
    if(ph < 3 || ph > 11 || !isInt(ph)) return null;
    const right = `One with pKa ≈ ${fmt(ph)}`;
    return {prompt:`You need a buffer that holds your measured pH ${fmt(ph)} steady. Which acid should you build it from?`,
      type:"mc",
      options:shuffle([right,`One with pKa ≈ ${fmt(ph-2)}`,`One with pKa ≈ ${fmt(ph+2)}`,"Any acid — pKa doesn't matter"]),
      answer:right,
      explain:`A buffer resists change best where pH = pKa: there the acid and its conjugate base are equally stocked in both directions.`};
  },
  function henderson(ph){
    const k = rnd([-2,-1,1,2]);
    const pka = ph - k;
    if(pka < 1 || pka > 13 || !isInt(ph)) return null;
    return {prompt:`An acid with pKa ${fmt(pka)} sits in your pH ${fmt(ph)} solution. The ratio [A⁻]/[HA] = 10ˣ. What is x? (x can be negative)`,
      type:"num", answer:k,
      explain:`Henderson–Hasselbalch: pH = pKa + log([A⁻]/[HA]), so x = pH − pKa = ${fmt(ph)} − ${fmt(pka)} = ${k}.`};
  },
  function mixing(ph){
    if(!isInt(ph) || ph > 5) return null;
    const right = `≈ pH ${fmt(ph+0.3)}`;
    return {prompt:`You mix equal volumes of two strong-acid solutions: pH ${fmt(ph)} and pH ${fmt(ph+2)}. The mixture's pH is…`,
      type:"mc",
      options:shuffle([right,`pH ${fmt(ph+1)} (the average)`,`pH ${fmt(ph)}`,`pH ${fmt(ph+2)}`]),
      answer:right,
      explain:`Concentrations average, not pH: [H⁺] ≈ (10⁻${ph} + 10⁻${ph+2})/2 ≈ 10⁻${ph}/2, and log₁₀2 ≈ 0.3, so pH ≈ ${fmt(ph+0.3)}. The stronger acid dominates.`};
  },
  function dilutionTrap(ph){
    const k = 8 - Math.round(ph);
    if(!isInt(ph) || k < 2 || k > 6) return null;
    const right = "Just below 7";
    return {prompt:`You dilute your strong acid (pH ${fmt(ph)}) by a factor of 10^${k}. Naively that gives pH ${Math.round(ph)+k} — what is the real pH?`,
      type:"mc", options:shuffle([right,`pH ${Math.round(ph)+k}`,"Exactly 7",`pH ${fmt(ph)}`]),
      answer:right,
      explain:`Dilution can never push an acid past neutral: near 10⁻⁷ M, water's own autoionization dominates and pH approaches 7 from below.`};
  },
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

/* ---------- daily streaks: separate per difficulty ----------
   A day counts only if you score >= 4/5. Miss one day and a freeze
   (earned every 7-day milestone, max 2) is spent automatically. */
function loadDaily(){
  try{
    const d = JSON.parse(localStorage.getItem("phw_daily_v2"));
    if(d && d.normal && d.hard) return d;
  }catch(e){}
  return {normal:{last:"",streak:0,best:0,freezes:0},
          hard:  {last:"",streak:0,best:0,freezes:0}};
}
function saveDaily(d){ try{ localStorage.setItem("phw_daily_v2", JSON.stringify(d)); }catch(e){} }
const dayStr = off => new Date(Date.now()+off*86400000).toISOString().slice(0,10);

function markDailyRound(diff, score){
  if(score >= 4){
    const all = loadDaily(), d = all[diff], today = dayStr(0);
    if(d.last !== today){
      if(d.last === dayStr(-1)) d.streak++;
      else if(d.last === dayStr(-2) && d.freezes > 0){ d.freezes--; d.streak++; }
      else d.streak = 1;
      d.last = today;
      if(d.streak > d.best) d.best = d.streak;
      if(d.streak % 7 === 0) d.freezes = Math.min(d.freezes+1, 2);
      saveDaily(all);
    }
  }
  updateStreakUI();
}
function updateStreakUI(){
  const d = loadDaily()[Q.difficulty];
  const s = qel("quizDaily");
  if(s) s.textContent = "📅 " + d.streak + (d.best>d.streak ? " (best "+d.best+")" : "");
  const f = qel("quizFreeze");
  if(f) f.textContent = "🧊 " + d.freezes;
  const r = qel("streakReminder");
  if(r) r.hidden = (d.last === dayStr(0));
}

/* generator families: one question per family per round, so three
   "what's the exponent" questions can't crowd a single round */
const FAM = {pOH:"exp",hExponent:"exp",ohExponent:"exp",convenientUnit:"exp",
  classify:"class",whichMoreAcidic:"class",timesMoreAcidic:"ratio",
  ratioExponent:"ratio",protonation:"pka",henderson:"pka",halfIonized:"pka",
  kaEstimate:"kx",kbEstimate:"kx",ionization:"kx",substanceQ:"subst",
  safety:"safety",indicatorColor:"color",estimateFromColor:"color",
  ionProduct:"kw",neutralize:"neut",dilution:"dilut",dilutionTrap:"dilut",mixing:"mix",
  pohToPh:"exp",factorToNeutral:"ratio",litmus:"class",moreIons:"class",
  phFromKa:"kx",conjugatePair:"kw",saltHydrolysis:"salt",bestBuffer:"pka"};
let lastRoundGens = new Set();

/* ---------- round construction ---------- */
function buildRound(ph, difficulty){
  const qs = [], usedFams = new Set(), usedGens = new Set();
  const take = (pool, max, strict)=>{
    for(const gen of shuffle(pool)){
      if(qs.length >= max) return;
      const fam = FAM[gen.name] || gen.name;
      if(usedFams.has(fam) || usedGens.has(gen.name)) continue;
      if(strict && lastRoundGens.has(gen.name)) continue;  // fresh vs last round
      const question = gen(ph);
      if(!question) continue;
      question._gen = gen.name;
      qs.push(question); usedFams.add(fam); usedGens.add(gen.name);
    }
  };
  // one hand-written question when the bank has a match for this pH
  if(typeof CUSTOM_QUESTIONS !== "undefined"){
    const pool = CUSTOM_QUESTIONS.filter(c =>
      ph >= c.min && ph <= c.max &&
      (c.mode === "any" || c.mode === difficulty) &&
      !lastRoundGens.has("custom:"+c.prompt));
    if(pool.length && Math.random() < 0.8){
      const c = rnd(pool);
      qs.push({prompt:c.prompt, type:"mc", options:shuffle([...c.options]),
               answer:c.answer, explain:c.explain, _gen:"custom:"+c.prompt});
    }
  }
  if(difficulty === "hard"){ take(GEN_HARD, 3, true); take(GEN_NORMAL, 5, true);
                             take(GEN_HARD, 3, false); take(GEN_NORMAL, 5, false); }
  else { take(GEN_NORMAL, 5, true); take(GEN_NORMAL, 5, false); }
  lastRoundGens = new Set(qs.map(x=>x._gen));
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
  updateStreakUI();
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
  qel("quizProgress").textContent = `${t("question")} ${Q.idx+1} / ${Q.questions.length}`;
  qel("quizPrompt").textContent = q.prompt;
  const sw = qel("quizSwatch");
  if(sw){ sw.hidden = !q.swatch; if(q.swatch) sw.style.background = q.swatch; }
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
  answer(Math.abs(v - q.answer) < (q.tol || 0.051), q);
}
function answer(correct, q, btn){
  document.querySelectorAll("#quizOptions .qopt").forEach(b=>{
    b.disabled = true;
    if(b.textContent === String(q.answer)) b.classList.add("right");
  });
  if(btn && !correct) btn.classList.add("wrong");
  qel("quizNumRow").hidden = true;
  const f = qel("quizFeedback");
  if(correct){ Q.score++; f.textContent = t("correct") + q.explain; f.className = "qfeedback ok"; }
  else { f.textContent = `${t("notQuite")} ${q.answer}. ` + q.explain; f.className = "qfeedback bad"; }
  qel("quizNext").hidden = false;
}
function nextQuestion(){
  Q.idx++;
  if(Q.idx < Q.questions.length) renderQuestion();
  else {
    qel("quizCard").hidden = true;
    markDailyRound(Q.difficulty, Q.score);
    const s = qel("quizSummary"); s.hidden = false;
    qel("quizScoreLine").textContent = `${Q.score} / ${Q.questions.length}`;
    qel("quizVerdictLine").textContent =
      Q.score === 5 ? t("perfect") :
      Q.score >= 3 ? t("solid") :
      t("tryAgain");
  }
}

/* Enter key submits a numeric answer */
(function(){ const n = qel("quizNum");
  if(n) n.addEventListener("keydown", e => { if(e.key === "Enter") submitNum(); });
})();
