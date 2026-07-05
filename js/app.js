"use strict";
const $ = id => document.getElementById(id);
let mode = "measure", usingStill = false;

/* ============ demo calibration (approximate universal-indicator colors)
   Replace with your own: capture references, then Export. ============ */
let calibration = [
  {ph:1,  rgb:[200,49,36],  demo:true},
  {ph:3,  rgb:[224,110,45], demo:true},
  {ph:5,  rgb:[229,194,60], demo:true},
  {ph:7,  rgb:[92,166,78],  demo:true},
  {ph:8.5,rgb:[49,140,134], demo:true},
  {ph:10.5,rgb:[50,96,168], demo:true},
  {ph:12, rgb:[74,60,150],  demo:true},
  {ph:13.5,rgb:[91,46,145], demo:true},
];

/* ---------------- camera ---------------- */
(async () => {
  try {
    const s = await navigator.mediaDevices.getUserMedia(
      {video:{facingMode:"environment"}, audio:false});
    $("cam").srcObject = s;
  } catch(e){ $("cam").hidden = true; $("camMsg").style.display = "flex"; }
})();

$("fileIn").addEventListener("change", ev => {
  const f = ev.target.files[0]; if(!f) return;
  const still = $("still");
  still.src = URL.createObjectURL(f);
  still.style.display = "block"; $("cam").style.display = "none";
  usingStill = true;
  still.onload = () => capture();
});

/* ---------------- color math ---------------- */
function medianPatch(ctx,cx,cy,half){
  const d = ctx.getImageData(cx-half,cy-half,half*2,half*2).data;
  const ch=[[],[],[]];
  for(let i=0;i<d.length;i+=4){ch[0].push(d[i]);ch[1].push(d[i+1]);ch[2].push(d[i+2]);}
  return ch.map(a=>{a.sort((x,y)=>x-y);return a[a.length>>1];});
}
function whiteBalance(rgb,gray){
  if(!gray) return rgb.slice();
  const t=(gray[0]+gray[1]+gray[2])/3;
  return rgb.map((v,i)=>Math.min(255,Math.max(0,v*t/Math.max(gray[i],1e-6))));
}
function rgb2lab(rgb){
  let [r,g,b]=rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  let x=(.4124564*r+.3575761*g+.1804375*b)/.95047,
      y=(.2126729*r+.7151522*g+.0721750*b),
      z=(.0193339*r+.1191920*g+.9503041*b)/1.08883;
  const f=t=>t>0.008856?Math.cbrt(t):t/0.128418+4/29;
  const fx=f(x),fy=f(y),fz=f(z);
  return [116*fy-16,500*(fx-fy),200*(fy-fz)];
}
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

/* k-nearest-neighbor, inverse-distance-weighted interpolation in Lab space */
function predict(lab){
  const pts = calibration.map(c=>({ph:c.ph, d:dist(lab, c.lab || (c.lab=rgb2lab(c.rgb)))}))
                         .sort((a,b)=>a.d-b.d).slice(0,4);
  if(pts.length===0) return null;
  if(pts[0].d < 1e-6) return {ph:pts[0].ph, spread:0, nearest:0};
  const w = pts.map(p=>1/(p.d*p.d));
  const W = w.reduce((s,x)=>s+x,0);
  const ph = pts.reduce((s,p,i)=>s+w[i]*p.ph,0)/W;
  const spread = Math.sqrt(pts.reduce((s,p,i)=>s+w[i]*(p.ph-ph)**2,0)/W);
  return {ph, spread, nearest:pts[0].d};
}

/* ---------------- capture ---------------- */
function grabColors(){
  const src = usingStill ? $("still") : $("cam");
  const w = usingStill ? src.naturalWidth : src.videoWidth;
  const h = usingStill ? src.naturalHeight : src.videoHeight;
  if(!w) throw new Error("no image yet — allow the camera or upload a photo");
  const work=$("work"); work.width=w; work.height=h;
  const ctx=work.getContext("2d",{willReadFrequently:true});
  ctx.drawImage(src,0,0,w,h);
  const sample = medianPatch(ctx,(w/2)|0,(h/2)|0,(w*.055)|0);
  const gray = $("useGray").checked
      ? medianPatch(ctx,(w*.18)|0,(h/2)|0,(w*.04)|0) : null;
  return {sample, gray};
}

function capture(){
  let colors;
  try{ colors = grabColors(); }
  catch(e){ setVerdict(e.message,true); return; }
  const balanced = whiteBalance(colors.sample, colors.gray);

  if(mode==="calibrate"){
    const ph = parseFloat($("calPh").value);
    if(Number.isNaN(ph)){ alert("Enter the known pH of this reference first."); return; }
    calibration = calibration.filter(c=>!c.demo);   // first real point retires the demo set
    calibration.push({ph, rgb:balanced.map(Math.round)});
    renderCal();
  } else {
    showPrediction(predict(rgb2lab(balanced)));
  }
}

/* ---------------- measure UI ---------------- */
const STOPS=[[1,"#C22F22"],[3,"#DF6C2A"],[5,"#E7C23A"],[7,"#59A64C"],
             [8.5,"#2E8C86"],[10.5,"#2F5FA8"],[13.5,"#5B2E91"]];
function phColor(ph){
  for(let i=1;i<STOPS.length;i++) if(ph<=STOPS[i][0]){
    const [p0,c0]=STOPS[i-1],[p1,c1]=STOPS[i],t=(ph-p0)/(p1-p0);
    const hex=s=>[1,3,5].map(k=>parseInt(s.slice(k,k+2),16));
    const a=hex(c0),b=hex(c1);
    return `rgb(${a.map((v,k)=>Math.round(v+t*(b[k]-v))).join(",")})`;
  }
  return STOPS.at(-1)[1];
}
function setVerdict(msg,warn){const v=$("verdict");v.className=warn?"warn":"";v.textContent=msg;}
function inkify(c){ // darken a tint so it reads well on the cream background
  const m=c.match(/\d+/g).map(Number);
  return `rgb(${m.map(v=>Math.round(v*0.72)).join(",")})`;
}
function showPrediction(p){
  if(!p){ setVerdict("No calibration points yet — add references in the Calibrate tab.",true); return; }
  const ph=Math.min(13.5,Math.max(1,p.ph));
  $("phValue").textContent=ph.toFixed(2);
  document.documentElement.style.setProperty("--reading",inkify(phColor(ph)));
  const unc=Math.max(p.spread,0.1);
  $("phUnc").textContent="± "+unc.toFixed(2);
  $("needle").style.left=((ph-1)/12.5*100).toFixed(1)+"%";
  const off=$("quizOffer");
  if(off){
    off.hidden=false;
    const b=$("quizOfferBtn");
    b.textContent="Quiz this pH ≈ "+(Math.round(ph*2)/2).toFixed(1)+" →";
    b.onclick=()=>startQuizFromScan(ph);
  }
  const demo=calibration.some(c=>c.demo);
  if(p.nearest>18)
    setVerdict("Low confidence — this color is far from every calibration point. Check lighting, the gray card, and glare.",true);
  else if(demo)
    setVerdict("Reading uses the built-in DEMO calibration. Calibrate with your own indicator before trusting values.",true);
  else if(ph>=6.5&&ph<=8.5)
    setVerdict("Within the WHO drinking-water pH guideline (6.5–8.5).");
  else
    setVerdict("Outside the WHO drinking-water pH guideline (6.5–8.5).",true);
}

/* ---------------- calibrate UI ---------------- */
function renderCal(){
  const badge=$("betaBadge");
  if(badge) badge.hidden = !calibration.some(c=>c.demo);
  const tb=$("calTable").querySelector("tbody");
  tb.innerHTML="";
  calibration.slice().sort((a,b)=>a.ph-b.ph).forEach(c=>{
    const tr=document.createElement("tr");
    const lab=c.lab||(c.lab=rgb2lab(c.rgb));
    tr.innerHTML=
      `<td><span class="swatch" style="background:rgb(${c.rgb.map(Math.round).join(",")})"></span>${c.demo?'<span class="demo-tag">demo</span>':''}</td>
       <td>${c.ph.toFixed(1)}</td>
       <td>L ${lab[0].toFixed(0)}</td><td></td>`;
    const del=document.createElement("button");
    del.textContent="remove"; del.className="ghost";
    del.onclick=()=>{calibration=calibration.filter(x=>x!==c);renderCal();};
    tr.lastElementChild.appendChild(del);
    tb.appendChild(tr);
  });
}
function exportCal(){
  const data=calibration.filter(c=>!c.demo).map(({ph,rgb})=>({ph,rgb}));
  if(!data.length){alert("Nothing to export yet — capture at least one real reference.");return;}
  const blob=new Blob([JSON.stringify({app:"pH Whisperer",version:1,points:data},null,2)],
                      {type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="ph-whisperer-calibration.json";
  a.click();
}
$("calIn").addEventListener("change",ev=>{
  const f=ev.target.files[0]; if(!f) return;
  f.text().then(t=>{
    try{
      const j=JSON.parse(t);
      if(!Array.isArray(j.points)) throw 0;
      calibration=j.points.map(p=>({ph:+p.ph,rgb:p.rgb.map(Number)}));
      renderCal();
      setVerdict(`Imported ${calibration.length} calibration points.`);
    }catch(e){alert("That file doesn't look like a pH Whisperer calibration.");}
  });
});

/* ---------------- share codes ----------------
   The code IS the calibration: version + name + points packed into
   bytes, base64url-encoded, with a checksum to catch typos. */
const B64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
let lastCode=null;

function encodeCal(name){
  const pts=calibration.filter(c=>!c.demo);
  if(!pts.length) return null;
  const nm=(name||"").slice(0,16);
  const bytes=[1, nm.length];                       // version, name length
  for(const ch of nm) bytes.push(ch.charCodeAt(0)&255);
  bytes.push(pts.length);
  for(const p of pts){
    bytes.push(Math.max(0,Math.min(140,Math.round(p.ph*10))));   // pH*10 in 1 byte
    p.rgb.forEach(v=>bytes.push(Math.max(0,Math.min(255,Math.round(v)))));
  }
  bytes.push(bytes.reduce((s,b)=>s+b,0)&255);       // checksum
  let out="";
  for(let i=0;i<bytes.length;i+=3){
    const b0=bytes[i], b1=bytes[i+1]??0, b2=bytes[i+2]??0;
    out+=B64[b0>>2]+B64[((b0&3)<<4)|(b1>>4)]+B64[((b1&15)<<2)|(b2>>6)]+B64[b2&63];
  }
  return out.match(/.{1,4}/g).join(".");            // dots for readability
}

function decodeCal(code){
  const clean=(code||"").trim().replace(/[.\s]/g,"");
  if(!clean) throw new Error("empty code");
  const idx=[...clean].map(c=>B64.indexOf(c));
  if(idx.some(v=>v<0)) throw new Error("the code contains invalid characters");
  const bytes=[];
  for(let i=0;i<idx.length;i+=4){
    const c=idx.slice(i,i+4);
    bytes.push((c[0]<<2)|((c[1]??0)>>4));
    if(c.length>2) bytes.push(((c[1]&15)<<4)|(c[2]>>2));
    if(c.length>3) bytes.push(((c[2]&3)<<6)|c[3]);
  }
  let p=0;
  if(bytes[p++]!==1) throw new Error("unknown code version");
  const nLen=bytes[p++];
  let name=""; for(let i=0;i<nLen;i++) name+=String.fromCharCode(bytes[p++]);
  const count=bytes[p++];
  if(!count || p+count*4>bytes.length) throw new Error("the code looks truncated");
  const pts=[];
  for(let i=0;i<count;i++)
    pts.push({ph:bytes[p++]/10, rgb:[bytes[p++],bytes[p++],bytes[p++]]});
  const sum=bytes.slice(0,p).reduce((s,b)=>s+b,0)&255;
  if(bytes[p]!==sum) throw new Error("checksum failed — the code was mistyped or cut off");
  return {name, pts};
}

function makeCode(){
  const code=encodeCal($("shareName").value);
  const box=$("codeBox");
  $("qrArea").style.display="none";
  if(!code){box.style.display="block";box.textContent="Capture at least one real reference first — demo points are not shared.";return;}
  lastCode=code;
  box.style.display="block"; box.textContent=code;
  $("copyRow").style.display="flex";
}
function copyCode(){
  if(!lastCode) return;
  navigator.clipboard?.writeText(lastCode).then(
    ()=>setVerdict("Code copied."),
    ()=>prompt("Copy this:",lastCode));
}
function showQR(){
  if(!lastCode) return;
  if(typeof QRCode==="undefined"){
    setVerdict("The QR generator couldn't load — check the internet connection and reload the page.",true);
    return;
  }
  const isWeb=/^https?:$/.test(location.protocol);
  const payload=isWeb
    ? location.origin+location.pathname+"#cal="+lastCode
    : lastCode;
  const t=$("qrTarget"); t.innerHTML="";
  new QRCode(t,{text:payload,width:512,height:512,
                correctLevel:QRCode.CorrectLevel.M});
  $("qrCaption").textContent=isWeb
    ? "Scanning opens pH Whisperer with this calibration already loaded. Save it and print it on your gray card."
    : "Offline preview: this QR carries the raw code (paste it into the app). Once the app is published online, regenerate here to get a QR that opens the app directly.";
  $("qrArea").style.display="block";
}
function saveQR(){
  const cv=$("qrTarget").querySelector("canvas");
  const img=$("qrTarget").querySelector("img");
  const url=cv?cv.toDataURL("image/png"):(img?img.src:null);
  if(!url) return;
  const a=document.createElement("a");
  a.href=url; a.download="ph-whisperer-calibration-qr.png"; a.click();
}
function loadCode(){
  try{
    const {name,pts}=decodeCal($("codeIn").value);
    calibration=pts; renderCal();
    setVerdict(`Loaded calibration ${name?`“${name}” `:""}— ${pts.length} points. Measure away.`);
    $("codeIn").value="";
  }catch(e){ setVerdict("Could not load: "+e.message,true); }
}
/* auto-load a calibration carried inside a share link */
(function(){
  const m=location.hash.match(/cal=([A-Za-z0-9\-_.%]+)/);
  if(!m) return;
  try{
    const {name,pts}=decodeCal(decodeURIComponent(m[1]));
    calibration=pts;
    setVerdict(`Loaded calibration ${name?`“${name}” `:""}from the link — ${pts.length} points.`);
  }catch(e){ setVerdict("The link carried a calibration code, but it could not be read.",true); }
})();

/* ---------------- tabs ---------------- */
function setMode(m){
  mode=m;
  $("tabMeasure").setAttribute("aria-selected",m==="measure");
  $("tabCal").setAttribute("aria-selected",m==="calibrate");
  $("paneMeasure").hidden = m!=="measure";
  $("paneCal").hidden = m!=="calibrate";
  $("actionBtn").textContent = m==="measure"?"Read pH":"Capture reference";
}
renderCal();

/* ---------------- single-page view switching ---------------- */
const VIEWS=["app","how","learn","science","uses","story"];
function showView(name){
  if(!VIEWS.includes(name)) name="app";
  VIEWS.forEach(v=>{
    const s=document.getElementById("view-"+v);
    if(s) s.hidden = v!==name;
  });
  document.querySelectorAll("#nav .nav").forEach(b=>{
    const on=b.dataset.view===name;
    b.classList.toggle("active",on);
    b.classList.toggle("solid",on);
  });
  if(!location.hash.startsWith("#cal="))
    try{ history.replaceState(null,"","#"+name); }catch(e){ /* sandboxed preview: no history access */ }
  if(name==="learn" && typeof Q!=="undefined" && Q.questions.length===0) startRandomQuiz();
}
document.querySelectorAll("#nav .nav").forEach(b=>
  b.addEventListener("click",()=>showView(b.dataset.view)));
window.addEventListener("hashchange",()=>{
  const h=location.hash.slice(1);
  if(!h.startsWith("cal=")) showView(h);
});
/* initial view: a share link opens the app; otherwise honor the hash */
showView(location.hash.startsWith("#cal=") ? "app" : location.hash.slice(1));

