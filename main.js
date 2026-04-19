// Main logic — extracted from original index.html

// ── Image loading & counter ─────────────────
document.getElementById('hp').style.backgroundImage=`url(${IMGS.xray})`;
['tent','bp','family','check','smile','xray'].forEach(k=>{const e=document.getElementById('img-'+k);if(e)e.src=IMGS[k]});
// Load policy sticky panel images (separate IDs)
[['ps-tent','tent'],['ps-check','check'],['ps-family','family'],['ps-smile','smile']].forEach(function(pair){
  var e=document.getElementById(pair[0]); if(e) e.src=IMGS[pair[1]];
});

const t0=Date.now();
function tick(){const n=Math.floor((Date.now()-t0)/180000);['c1','c3'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=n})}
setInterval(tick,1000);tick();

// ── Scroll hint (Phase 2 will replace) ──────
const sh=document.getElementById('sh');let gone=false;
window.addEventListener('scroll',()=>{if(!gone&&window.scrollY>40){gone=true;sh.classList.add('gone')}},{passive:true});

// ── Baby grid fills ─────────────────────────
['fb','fa'].forEach((id,i)=>{const el=document.getElementById(id);if(!el)return;const pct=i===0?8:36;for(let j=0;j<100;j++){const s=document.createElement('span');s.className='fg'+(j>=pct?' fgo':'');s.textContent='👶';el.appendChild(s);}});

// ── TDA logic ───────────────────────────────
// TDA scroll logic
const NODES = [
  {type:'question',label:'Presence of danger signs needing urgent medical care?',sub:'Entry point · All children under 10 with presumptive TB symptoms',yes:'Stabilise and transfer',no:'Continue assessment'},
  {type:'action',label:'Stabilise and/or transfer',sub:'Emergency stabilisation. Retain if stabilised, transfer if not.',via:'YES',viaColor:'#ee0202'},
  {type:'question',label:'Is the child "high risk"?',sub:'Under 2 years old · HIV-positive · Severely malnourished (SAM)',yes:'Test immediately',no:'Treat likely non-TB illness'},
  {type:'action',label:'Treat most likely non-TB illness',sub:'Follow up in 1–2 weeks. If symptoms persist, re-enter algorithm.',via:'NO',viaColor:'rgba(255,255,255,0.3)'},
  {type:'action',label:'Test with mWRD + urine LF-LAM',sub:'GeneXpert MTB/RIF. Positive result → treat immediately.',via:'YES — high risk or persistent symptoms',viaColor:'#ee0202',badge:{text:'Positive test → treat immediately',color:'#44bba4'}},
  {type:'question',label:'Close or household TB contact in the last 12 months?',sub:'When test is unavailable OR negative.',yes:'START TB TREATMENT',no:'Score signs & symptoms'},
  {type:'score'},
  {type:'question',label:'Is the total score ≥ 10?',sub:'Same threshold for both algorithms.',yes:'START TB TREATMENT',no:'No TB treatment · Follow up 1–2 weeks'},
  {type:'treat',label:'START TB TREATMENT',sub:'Initiated via: positive test · confirmed contact · score ≥ 10'}
];

const SCORES = {
  B: {
    syms:[['Cough > 2 weeks','+5'],['Fever > 2 weeks','+10'],['Lethargy','+4'],['Weight loss','+5'],['Coughing blood','+9'],['Night sweats','+6'],['Swollen lymph nodes','+7'],['Tachycardia','+4'],['Tachypnoea','+2']],
    xray:null, note:'Signs & symptoms only — no chest X-ray required'
  },
  A: {
    syms:[['Cough > 2 weeks','+2'],['Fever > 2 weeks','+5'],['Lethargy','+3'],['Weight loss','+3'],['Coughing blood','+4'],['Night sweats','+2'],['Swollen lymph nodes','+4'],['Tachycardia','+2'],['Tachypnoea','+1']],
    xray:[['Cavity','+6'],['Enlarged lymph nodes','+17'],['Opacities','+5'],['Miliary pattern','+15'],['Effusion','+8']],
    note:'Signs & symptoms + chest X-ray findings'
  }
};

let currentAlgo='B';
let currentStep=0;

function buildNode(i, algo) {
  const n=NODES[i];
  if(!n) return '';
  if(n.type==='score') {
    const s=SCORES[algo];
    const xHtml=s.xray?`<div class="score-section">Chest X-ray findings</div>${s.xray.map(r=>`<div class="score-row"><span>${r[0]}</span><span class="score-val">${r[1]}</span></div>`).join('')}`:'';
    return `<div class="tda-node score">
      <div class="node-via" style="color:rgba(255,255,255,0.35)">NO contact confirmed</div>
      <div class="node-label">Score signs &amp; symptoms${s.xray?' + X-ray':''}</div>
      <div style="font-size:.75rem;color:rgba(255,255,255,.4);font-style:italic;margin-bottom:10px">${s.note}</div>
      <div class="score-grid">
        <div class="score-section">Signs &amp; symptoms</div>
        ${s.syms.map(r=>`<div class="score-row"><span>${r[0]}</span><span class="score-val">${r[1]}</span></div>`).join('')}
        ${xHtml}
      </div>
      <div class="score-threshold">Treat if total score ≥ 10</div>
    </div>`;
  }
  if(n.type==='treat') return `<div class="tda-node treat"><div class="node-label">${n.label}</div><div class="node-sub">${n.sub}</div></div>`;
  const branches = n.yes ? `<div class="node-branches"><div class="branch yes"><div class="branch-line"></div><span>YES → ${n.yes}</span></div><div class="branch no"><div class="branch-line"></div><span>NO → ${n.no}</span></div></div>` : '';
  const badge = n.badge ? `<div style="display:inline-block;font-size:.75rem;font-weight:600;border-radius:100px;padding:4px 14px;margin-top:12px;background:${n.badge.color}20;color:${n.badge.color};border:1px solid ${n.badge.color}40">${n.badge.text}</div>` : '';
  const via = n.via ? `<div class="node-via" style="color:${n.viaColor}">${n.via}</div>` : '';
  return `<div class="tda-node ${n.type==='action'?'action':'question'}">
    ${via}<div class="node-label">${n.label}</div><div class="node-sub">${n.sub}</div>${badge}${branches}
  </div>`;
}

function updateNode(i) {
  const display=document.getElementById('node-display');
  const toggle=document.getElementById('algo-toggle-wrap');
  const isScore=(i===6);
  toggle.style.display=isScore?'block':'none';
  display.style.opacity='0';
  display.style.transform='translateY(10px)';
  setTimeout(()=>{
    display.innerHTML=buildNode(i,isScore?currentAlgo:'B');
    display.style.opacity='1';
    display.style.transform='translateY(0)';
    display.style.transition='opacity .25s ease,transform .25s ease';
  },180);
  const dots=document.getElementById('prog');
  dots.innerHTML=NODES.map((_,j)=>`<div class="tda-prog-dot${j<i?' done':j===i?' active':''}"></div>`).join('');
}

window.switchAlgo=function(a){
  currentAlgo=a;
  document.getElementById('pill-a').classList.toggle('on',a==='A');
  document.getElementById('pill-b').classList.toggle('on',a==='B');
  updateNode(6);
};

updateNode(0);

// Intersection observer for scroll steps
const stepEls=document.querySelectorAll('.tda-step');
const obs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      stepEls.forEach(s=>s.classList.remove('on'));
      e.target.classList.add('on');
      const s=parseInt(e.target.dataset.s);
      if(s!==currentStep){currentStep=s;updateNode(s);}
    }
  });
},{threshold:0.5});
stepEls.forEach(s=>obs.observe(s));

// ── Hero chain reveal (Phase 3 will replace)
// Hero chain scroll reveal
(function() {
  var items = ['hc1','ha1','hc2','ha2','hc3'];
  var delays = [0, 300, 600, 900, 1200];
  var revealed = false;

  function revealChain() {
    if (revealed) return;
    revealed = true;
    items.forEach(function(id, i) {
      setTimeout(function() {
        var el = document.getElementById(id);
        if (el) el.classList.add('visible');
      }, delays[i]);
    });
  }

  window.addEventListener('scroll', function() {
    if (window.scrollY > 80) revealChain();
  }, { passive: true });

  // Auto-reveal after 2.2s if user doesn't scroll
  setTimeout(revealChain, 2200);
})();

// ── Feasibility horizontal scroll ───────────
// Feasibility horizontal scroll
(function() {
  var track = document.getElementById('feas-track');
  var dotsEl = document.getElementById('feas-dots');
  if (!track) return;
  var cards = track.querySelectorAll('.feas-qcard');
  var total = cards.length;
  var current = 0;

  // Build dots
  for (var i = 0; i < total; i++) {
    var d = document.createElement('div');
    d.className = 'feas-dot' + (i === 0 ? ' active' : '');
    dotsEl.appendChild(d);
  }

  function update() {
    var cardW = cards[0].offsetWidth + 24;
    track.style.transform = 'translateX(-' + (current * cardW) + 'px)';
    dotsEl.querySelectorAll('.feas-dot').forEach(function(d, i) {
      d.classList.toggle('active', i === current);
    });
  }

  window.feasScroll = function(dir) {
    current = Math.max(0, Math.min(total - 1, current + dir));
    update();
  };
})();

// ── Feasibility nav ─────────────────────────
(function() {
  var positions = {};
  window.feasNav = function(trackId, dir) {
    var track = document.getElementById(trackId);
    if (!track) return;
    var card = track.querySelector('.feas-qcard');
    if (!card) return;
    var cardW = card.offsetWidth + 16;
    var total = track.querySelectorAll('.feas-qcard').length;
    positions[trackId] = positions[trackId] || 0;
    positions[trackId] = Math.max(0, Math.min(total - 1, positions[trackId] + dir));
    track.style.transform = 'translateX(-' + (positions[trackId] * cardW) + 'px)';
  };
})();
