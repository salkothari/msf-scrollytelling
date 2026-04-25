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

// ── Scroll hint ─────────────────────────────
// Arrow visible on load, hides when the first section after the hero is
// well into the viewport (offset 0.4 = 40% from top), reappears on scroll-up.
// Mobile hiding is handled by CSS media query.
(function () {
  var sh = document.getElementById('sh');
  if (!sh) return;
  sh.classList.remove('gone'); // ensure visible on load
  var firstPost = document.querySelector('section.prob-section');
  if (!firstPost) return;
  if (!firstPost.id) firstPost.id = 'post-hero-anchor';
  window.onSectionEnter(
    '#' + firstPost.id,
    function () { sh.classList.add('gone'); },
    function () { sh.classList.remove('gone'); },
    0.4
  );
})();

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

// Guard: the #node-display/#algo-toggle-wrap/#prog/.tda-step DOM elements
// referenced above were removed from the HTML in an earlier edit, which made
// updateNode(0) throw and aborted every later <script> on the page. Phase 5
// will rebuild the TDA flowchart against the current .flow-step markup; until
// then, only run the legacy init when its target elements still exist.
if (document.getElementById('node-display')) updateNode(0);

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

// ── Hero chain reveal (scroll-progress based) ─
// Raw scroll listener instead of scrollama, because scrollama throttles
// small progress updates and the chain items need to reveal in the
// first ~150px of hero scroll (thresholds below are in scrolled pixels).
(function () {
  var items = [
    { id: 'hc1', at: 20 },  // More diagnosis
    { id: 'ha1', at: 50 },  // arrow →
    { id: 'hc2', at: 80 },  // More treatment
    { id: 'ha2', at: 110 }, // arrow →
    { id: 'hc3', at: 140 }, // More life saved
  ];
  function check() {
    var y = window.scrollY;
    items.forEach(function (it) {
      if (y >= it.at) {
        var el = document.getElementById(it.id);
        if (el) el.classList.add('visible');
      }
    });
  }
  window.addEventListener('scroll', check, { passive: true });
  check(); // run once in case user is already scrolled on load
})();

// ── Vicious cycle highlight (Phase 4) ────────
// Inject cycle-tagged.svg into #cycle-svg-mount, then drive a
// progressive scroll-reveal: each .cy-dullable[data-order="N"] gains
// .cy-lit when scroll progress through .prob-designed crosses
// thresholds[N-1], and loses it again on scroll-up.
//
// Uses a raw scroll listener (not scrollama) so we can:
//   * compute progress = (viewport-bottom - section.top) / (section.h + vh)
//     so reveals start the moment the section first enters the
//     viewport, not when its top hits the very top of the viewport
//   * remove .cy-lit on scroll-up for a fully reversible reveal
(function () {
  var mount = document.getElementById('cycle-svg-mount');
  var cycleSection = document.querySelector('section.prob-designed');
  if (!mount || !cycleSection) return;
  if (!cycleSection.id) cycleSection.id = 'cycle-anchor';
  // Stage triggers in section-progress units (0 = just entering view,
  // 1 = just left). Spaced wider than the previous compressed values
  // so stages don't blur together.
  var thresholds = [0.20, 0.32, 0.44, 0.56];
  var parts = [];

  function update() {
    var rect = cycleSection.getBoundingClientRect();
    var vh = window.innerHeight;
    var span = cycleSection.offsetHeight + vh;
    if (span <= 0) return;
    var p = (vh - rect.top) / span;
    if (p < 0) p = 0;
    if (p > 1) p = 1;
    parts.forEach(function (el) {
      var n = parseInt(el.getAttribute('data-order'), 10);
      if (!n) return;
      if (p >= thresholds[n - 1]) el.classList.add('cy-lit');
      else el.classList.remove('cy-lit');
    });
  }

  function wireScroll() {
    parts = Array.prototype.slice.call(
      cycleSection.querySelectorAll('.cy-dullable')
    );
    if (!parts.length) return;
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  fetch('cycle-tagged.svg')
    .then(function (r) { return r.text(); })
    .then(function (txt) {
      mount.innerHTML = txt;
      // Make the SVG scale to its container
      var svg = mount.querySelector('svg');
      if (svg) {
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.display = 'block';
      }
      wireScroll();
    })
    .catch(function (e) { console.warn('cycle SVG load failed:', e); });
})();

// ── TDA progressive reveal (Phase 5, v2 with A/B toggle) ─
// Two algorithm SVGs (algo-a-tagged.svg / algo-b-tagged.svg) live
// in #algo-mount-a and #algo-mount-b. The .algo-pill buttons toggle
// which one is visible. Both SVGs share the same depth-banding
// scheme (data-depth=1..7) so the same scroll-progress thresholds
// drive whichever one is active.
//
// Reveal is bidirectional: scrolling up un-reveals the higher-depth
// shapes, mirroring the cycle behaviour from earlier.
(function () {
  var section = document.querySelector('section.flow-section');
  if (!section) return;
  if (!section.id) section.id = 'tda-anchor';
  var mounts = {
    a: document.getElementById('algo-mount-a'),
    b: document.getElementById('algo-mount-b'),
  };
  if (!mounts.a || !mounts.b) return;
  var steps = Array.prototype.slice.call(section.querySelectorAll('.flow-step'));
  // Depth thresholds in section-progress units (raw scroll math same
  // as the cycle: 0 = section just entering, 1 = just left). Seven
  // depths spaced from 0.05 → 0.55, ~0.08 between each — full reveal
  // by the time the section is roughly half-passed.
  var depthThresholds = [0.05, 0.13, 0.21, 0.29, 0.37, 0.45, 0.53];
  // Mirror those onto the seven .flow-step cards on the right.
  var stepThresholds = depthThresholds.slice();

  function update() {
    var rect = section.getBoundingClientRect();
    var vh = window.innerHeight;
    var span = section.offsetHeight + vh;
    if (span <= 0) return;
    var p = (vh - rect.top) / span;
    if (p < 0) p = 0;
    if (p > 1) p = 1;
    // Light depth groups across BOTH mounts (only one is visible
    // anyway, but keeping the inactive one in sync means switching
    // doesn't pop everything in/out).
    Object.keys(mounts).forEach(function (key) {
      var parts = mounts[key].querySelectorAll('.dep-dullable');
      parts.forEach(function (el) {
        var d = parseInt(el.getAttribute('data-depth'), 10);
        if (!d) return;
        if (p >= depthThresholds[d - 1]) el.classList.add('dep-lit');
        else el.classList.remove('dep-lit');
      });
    });
    steps.forEach(function (step, i) {
      if (p >= stepThresholds[i]) step.classList.add('active');
      else step.classList.remove('active');
    });
  }

  function loadSvg(key) {
    return fetch('algo-' + key + '-tagged.svg')
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        mounts[key].innerHTML = txt;
        var svg = mounts[key].querySelector('svg');
        if (!svg) return;
        // The exporter uses width="..px" height="..px" with no viewBox.
        // Convert to a viewBox so the SVG scales with the container,
        // then drop the absolute dimensions.
        if (!svg.getAttribute('viewBox')) {
          var w = parseFloat(svg.getAttribute('width') || '0');
          var h = parseFloat(svg.getAttribute('height') || '0');
          if (w > 0 && h > 0) {
            svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
          }
        }
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.width = '100%';
        svg.style.height = 'auto';
      });
  }

  function activate(key) {
    document.querySelectorAll('.algo-pill').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-algo') === key);
    });
    document.querySelectorAll('.algo-mount').forEach(function (m) {
      m.classList.toggle('active', m.getAttribute('data-algo') === key);
    });
  }

  document.querySelectorAll('.algo-pill').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activate(btn.getAttribute('data-algo'));
      // Layout shifts when the mounts swap (A and B have slightly
      // different aspect ratios). Recompute reveal state once the
      // browser has applied the new layout.
      requestAnimationFrame(update);
    });
  });

  Promise.all([loadSvg('a'), loadSvg('b')]).then(function () {
    activate('a');
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }).catch(function (e) { console.warn('algorithm SVG load failed:', e); });
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
