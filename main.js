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
// Arrow visible everywhere above the Act Now section; hides once Act Now
// enters the viewport, reappears if the user scrolls back up.
// Mobile hiding is handled by CSS media query.
(function () {
  var sh = document.getElementById('sh');
  var cta = document.getElementById('act-now');
  if (!sh || !cta) return;
  sh.classList.remove('gone');
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      sh.classList.toggle('gone', e.isIntersecting);
    });
  }, { threshold: 0 }).observe(cta);
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
// .cy-lit when the user has scrolled through the corresponding
// fraction of the .cycle-stage runway, and loses it on scroll-up.
//
// The cycle-pin stays sticky while the user scrolls the runway, so
// the diagram is "scroll-locked" until all four stages have revealed —
// same pattern as the TDA flowchart's flow-left + flow-right.
(function () {
  var mount = document.getElementById('cycle-svg-mount');
  var cycleSection = document.querySelector('section.prob-designed');
  var stage = document.querySelector('.cycle-stage');
  if (!mount || !cycleSection) return;
  if (!cycleSection.id) cycleSection.id = 'cycle-anchor';
  // Stage triggers as fractions of the runway scroll. 0 = pin just
  // engaging (stage top hits top of viewport-ish), 1 = pin releasing.
  var thresholds = [0.05, 0.30, 0.55, 0.80];
  var parts = [];

  function update() {
    var vh = window.innerHeight;
    var p;
    if (stage) {
      // Progress through the cycle-stage runway: 0 when stage top
      // reaches the top of the viewport (sticky pin engages), 1 when
      // stage bottom reaches that same line (pin releases).
      var rect = stage.getBoundingClientRect();
      var travel = stage.offsetHeight - vh;
      if (travel <= 0) return;
      p = (-rect.top) / travel;
    } else {
      // Fallback: section-relative progress (used when stage missing,
      // e.g. mobile layout where the pin is dropped).
      var srect = cycleSection.getBoundingClientRect();
      var span = cycleSection.offsetHeight + vh;
      if (span <= 0) return;
      p = (vh - srect.top) / span;
    }
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
    document.querySelectorAll('.pill[data-algo]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-algo') === key);
    });
    document.querySelectorAll('.algo-mount').forEach(function (m) {
      m.classList.toggle('active', m.getAttribute('data-algo') === key);
    });
  }

  document.querySelectorAll('.pill[data-algo]').forEach(function (btn) {
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

// ── Problem 1 scroll-featured cards ─────────────────
(function () {
  var seq = document.getElementById('prob-bio-seq');
  if (!seq) return;
  var cards = Array.from(seq.querySelectorAll('.prob-card'));
  var N = cards.length;
  var txCache = new Array(N).fill(0);
  var txReady = false;

  function computeTx() {
    var vw2 = window.innerWidth / 2;
    cards.forEach(function (card, i) {
      var r = card.getBoundingClientRect();
      txCache[i] = vw2 - (r.left + r.width / 2);
    });
    txReady = true;
  }

  function update() {
    var rect = seq.getBoundingClientRect();
    var scrolled = -rect.top;
    var total = seq.offsetHeight - window.innerHeight;
    var p = Math.max(0, Math.min(1, scrolled / total));

    if (scrolled < 0) {
      cards.forEach(function (c) {
        c.classList.remove('pbc--featured', 'pbc--settled');
        c.classList.add('pbc--hidden');
        c.style.removeProperty('--tx');
      });
      return;
    }

    if (!txReady) { computeTx(); }

    var stage = p * (N + 1);
    cards.forEach(function (card, i) {
      if (stage < i) {
        card.classList.remove('pbc--featured', 'pbc--settled');
        card.classList.add('pbc--hidden');
        card.style.removeProperty('--tx');
      } else if (stage >= i && stage < i + 1) {
        card.classList.remove('pbc--hidden', 'pbc--settled');
        card.classList.add('pbc--featured');
        card.style.setProperty('--tx', txCache[i] + 'px');
      } else {
        card.classList.remove('pbc--hidden', 'pbc--featured');
        card.classList.add('pbc--settled');
        card.style.removeProperty('--tx');
      }
    });
  }

  // Set initial hidden state
  cards.forEach(function (c) { c.classList.add('pbc--hidden'); });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', function () { txReady = false; update(); });
  update();
})();

// ── Slope chart (Evidence viz 01) ────────────────────────────────────────────
(function () {
  var svg = document.getElementById('slope-svg');
  var tip = document.getElementById('slope-tip');
  if (!svg) return;

  var DATA = [
    { id: 'Guinea',      cat: 'country', v: [1.1, 3.4, 0.3] },
    { id: 'Niger',       cat: 'country', v: [0.8, 2.2, 1.5] },
    { id: 'Nigeria',     cat: 'country', v: [3.0, 5.9, 5.9] },
    { id: 'South Sudan', cat: 'country', v: [2.3, 4.1, 3.5] },
    { id: 'Uganda',      cat: 'country', v: [0.0, 0.8, 0.2] },
    { id: 'All',         cat: 'all',     v: [1.5, 2.3, 2.9] },
  ];
  var COLS = [
    ['Before diagnostic', 'flowcharts'],
    ['MSF study with', 'diagnostic flowcharts'],
    ['With diagnostic', 'flowcharts*']
  ];
  var C_COUNTRY = '#878AD9';
  var C_ALL     = '#ee0202';
  var YMAX = 7;
  var NS = 'http://www.w3.org/2000/svg';

  function mk(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }
  function txt(attrs, label) {
    var e = mk('text', attrs);
    e.textContent = label;
    return e;
  }

  function render() {
    var W  = svg.parentElement.clientWidth || 600;
    var H  = 400;
    var small = W < 500;
    var PL = small ? 100 : 150;
    var PR = small ? 60  : 130;
    var PT = 20, PB = 64;
    var IW = W - PL - PR;
    var IH = H - PT - PB;

    function xp(i) { return PL + (i / 2) * IW; }
    function yp(v) { return PT + IH * (1 - v / YMAX); }

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width',  W);
    svg.setAttribute('height', H);
    svg.innerHTML = '';

    // Axis columns
    for (var ci = 0; ci < 3; ci++) {
      svg.appendChild(mk('line', {
        x1: xp(ci), y1: PT, x2: xp(ci), y2: PT + IH,
        stroke: '#e4e4e4', 'stroke-width': 1
      }));
    }

    // Draw country lines first, All on top
    var order = DATA.filter(function (d) { return d.cat === 'country'; })
                    .concat(DATA.filter(function (d) { return d.cat === 'all'; }));

    order.forEach(function (d) {
      var isAll   = d.cat === 'all';
      var color   = isAll ? C_ALL : C_COUNTRY;
      var opacity = isAll ? 1 : 0.6;
      var sw      = isAll ? 3 : 1.5;
      var indices = (isAll ? [0, 2] : [0, 1, 2]);
      var pts     = indices.map(function (i) { return xp(i) + ',' + yp(d.v[i]); }).join(' ');

      var line = mk('polyline', {
        points: pts, fill: 'none', stroke: color,
        'stroke-width': sw, 'stroke-opacity': opacity,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      svg.appendChild(line);

      indices.forEach(function (i) {
        svg.appendChild(mk('circle', {
          cx: xp(i), cy: yp(d.v[i]), r: isAll ? 5 : 3.5,
          fill: color, 'fill-opacity': opacity
        }));
      });

      // Wide invisible hit area
      var hit = mk('polyline', {
        points: pts, fill: 'none', stroke: 'transparent',
        'stroke-width': 24, style: 'cursor:pointer'
      });
      hit.addEventListener('mouseenter', function () {
        line.setAttribute('stroke-opacity', 1);
        line.setAttribute('stroke-width', isAll ? 4 : 2.5);
        if (tip) {
          tip.innerHTML = '<strong>' + d.id + '</strong><br>' +
            'Before flowcharts: ' + d.v[0] + '<br>' +
            'MSF study: ' + d.v[1] + '<br>' +
            'With flowcharts: ' + d.v[2];
          tip.style.display = 'block';
        }
      });
      hit.addEventListener('mousemove', function (e) {
        if (tip) {
          var r = svg.getBoundingClientRect();
          tip.style.left = (e.clientX - r.left + 14) + 'px';
          tip.style.top  = (e.clientY - r.top  - 10) + 'px';
        }
      });
      hit.addEventListener('mouseleave', function () {
        line.setAttribute('stroke-opacity', opacity);
        line.setAttribute('stroke-width', sw);
        if (tip) tip.style.display = 'none';
      });
      svg.appendChild(hit);
    });

    // Left labels — sorted by y, then de-overlapped
    var MIN_GAP = 15;
    function deOverlap(labels) {
      labels.sort(function (a, b) { return a.y - b.y; });
      for (var i = 1; i < labels.length; i++) {
        if (labels[i].y - labels[i-1].y < MIN_GAP) {
          labels[i].y = labels[i-1].y + MIN_GAP;
        }
      }
      return labels;
    }

    var leftLbls = deOverlap(DATA.map(function (d) {
      return { id: d.id, cat: d.cat, val: d.v[0], y: yp(d.v[0]) };
    }));

    leftLbls.forEach(function (lb) {
      var isAll = lb.cat === 'all';
      var color = isAll ? C_ALL : C_COUNTRY;
      var fs    = small ? 10 : (isAll ? 13 : 11);
      var fw    = isAll ? '700' : '400';
      // value
      svg.appendChild(txt({
        x: xp(0) - 8, y: lb.y,
        'text-anchor': 'end', 'dominant-baseline': 'middle',
        'font-family': 'DM Sans,sans-serif', 'font-size': fs,
        fill: color, 'font-weight': fw
      }, lb.val));
      // name
      if (!small) {
        svg.appendChild(txt({
          x: xp(0) - 34, y: lb.y,
          'text-anchor': 'end', 'dominant-baseline': 'middle',
          'font-family': 'DM Sans,sans-serif', 'font-size': fs,
          fill: color, 'font-weight': fw
        }, lb.id));
      }
    });

    // Right labels
    var rightLbls = deOverlap(DATA.map(function (d) {
      return { id: d.id, cat: d.cat, val: d.v[2], y: yp(d.v[2]) };
    }));

    rightLbls.forEach(function (lb) {
      var isAll = lb.cat === 'all';
      var color = isAll ? C_ALL : C_COUNTRY;
      var fs    = small ? 10 : (isAll ? 13 : 11);
      var fw    = isAll ? '700' : '400';
      svg.appendChild(txt({
        x: xp(2) + 8, y: lb.y,
        'text-anchor': 'start', 'dominant-baseline': 'middle',
        'font-family': 'DM Sans,sans-serif', 'font-size': fs,
        fill: color, 'font-weight': fw
      }, lb.val));
      if (!small) {
        svg.appendChild(txt({
          x: xp(2) + 30, y: lb.y,
          'text-anchor': 'start', 'dominant-baseline': 'middle',
          'font-family': 'DM Sans,sans-serif', 'font-size': fs,
          fill: color, 'font-weight': fw
        }, lb.id));
      }
    });

    // Column labels at bottom
    COLS.forEach(function (lines, i) {
      lines.forEach(function (line, j) {
        svg.appendChild(txt({
          x: xp(i), y: PT + IH + 18 + j * 15,
          'text-anchor': 'middle',
          'font-family': 'DM Sans,sans-serif', 'font-size': small ? 9 : 11,
          fill: '#666'
        }, line));
      });
    });
  }

  // Defer until layout is painted so clientWidth is non-zero
  if (document.readyState === 'complete') {
    requestAnimationFrame(render);
  } else {
    window.addEventListener('load', function () { requestAnimationFrame(render); });
  }
  window.addEventListener('resize', render);
})();

// ── Stacked pictogram: days until diagnosis ──────────────────────────────────
(function () {
  var wrap = document.getElementById('picto-wrap');
  var tip  = document.getElementById('picto-tip');
  if (!wrap || !tip) return;

  var COUNTRIES = [
    { name: 'Guinea',      color: '#E31612' },
    { name: 'Niger',       color: '#F58BAE' },
    { name: 'Nigeria',     color: '#4AAE9B' },
    { name: 'South Sudan', color: '#6B6FB6' },
    { name: 'Uganda',      color: '#F5A037' },
  ];

  var DATASETS = {
    all: [
      { label: '1–3',   Guinea: 96, Niger: 20, Nigeria: 32, 'South Sudan': 98, Uganda: 78 },
      { label: '4–7',   Guinea: 7,  Niger: 10, Nigeria: 25, 'South Sudan': 17, Uganda: 12 },
      { label: '8–14',  Guinea: 1,  Niger: 6,  Nigeria: 37, 'South Sudan': 10, Uganda: 16 },
      { label: '15–21', Guinea: 0,  Niger: 1,  Nigeria: 8,  'South Sudan': 3,  Uganda: 4  },
      { label: '22–30', Guinea: 0,  Niger: 0,  Nigeria: 4,  'South Sudan': 0,  Uganda: 4  },
      { label: '31–60', Guinea: 1,  Niger: 1,  Nigeria: 5,  'South Sudan': 1,  Uganda: 1  },
      { label: '61+',   Guinea: 0,  Niger: 0,  Nigeria: 0,  'South Sudan': 3,  Uganda: 1  },
    ],
    hiv: [
      { label: '1–3',   Guinea: 96, Niger: 1,  Nigeria: 2,  'South Sudan': 11, Uganda: 17 },
      { label: '4–7',   Guinea: 7,  Niger: 2,  Nigeria: 0,  'South Sudan': 1,  Uganda: 2  },
      { label: '8–14',  Guinea: 1,  Niger: 0,  Nigeria: 0,  'South Sudan': 1,  Uganda: 1  },
      { label: '15–21', Guinea: 0,  Niger: 0,  Nigeria: 0,  'South Sudan': 0,  Uganda: 0  },
      { label: '22–30', Guinea: 0,  Niger: 0,  Nigeria: 0,  'South Sudan': 0,  Uganda: 0  },
      { label: '31–60', Guinea: 1,  Niger: 0,  Nigeria: 0,  'South Sudan': 0,  Uganda: 1  },
      { label: '61+',   Guinea: 0,  Niger: 0,  Nigeria: 0,  'South Sudan': 0,  Uganda: 0  },
    ],
    under2: [
      { label: '1–3',   Guinea: 10, Niger: 10, Nigeria: 13, 'South Sudan': 64, Uganda: 44 },
      { label: '4–7',   Guinea: 1,  Niger: 6,  Nigeria: 11, 'South Sudan': 12, Uganda: 9  },
      { label: '8–14',  Guinea: 1,  Niger: 2,  Nigeria: 20, 'South Sudan': 5,  Uganda: 6  },
      { label: '15–21', Guinea: 0,  Niger: 0,  Nigeria: 4,  'South Sudan': 2,  Uganda: 3  },
      { label: '22–30', Guinea: 0,  Niger: 0,  Nigeria: 0,  'South Sudan': 0,  Uganda: 3  },
      { label: '31–60', Guinea: 0,  Niger: 1,  Nigeria: 0,  'South Sudan': 0,  Uganda: 0  },
      { label: '61+',   Guinea: 0,  Niger: 0,  Nigeria: 0,  'South Sudan': 2,  Uganda: 0  },
    ],
    sam: [
      { label: '1–3',   Guinea: 7,  Niger: 20, Nigeria: 27, 'South Sudan': 78, Uganda: 10 },
      { label: '4–7',   Guinea: 0,  Niger: 10, Nigeria: 25, 'South Sudan': 16, Uganda: 5  },
      { label: '8–14',  Guinea: 0,  Niger: 6,  Nigeria: 35, 'South Sudan': 6,  Uganda: 6  },
      { label: '15–21', Guinea: 0,  Niger: 1,  Nigeria: 7,  'South Sudan': 3,  Uganda: 3  },
      { label: '22–30', Guinea: 0,  Niger: 0,  Nigeria: 3,  'South Sudan': 0,  Uganda: 4  },
      { label: '31–60', Guinea: 0,  Niger: 1,  Nigeria: 5,  'South Sudan': 0,  Uganda: 0  },
      { label: '61+',   Guinea: 0,  Niger: 0,  Nigeria: 0,  'South Sudan': 2,  Uganda: 0  },
    ],
  };

  var currentGroup = 'all';

  var CR   = 4;              // circle radius
  var CGAP = 2;              // gap between circles
  var STEP = CR * 2 + CGAP; // 10px per circle step
  var PAD_X = 24;
  var PAD_T = 36;            // above circles for count labels
  var PAD_B = 46;            // below for day labels + axis title
  var FONT  = 'DM Sans,sans-serif';
  var ns    = 'http://www.w3.org/2000/svg';

  function el(tag, attrs) {
    var e = document.createElementNS(ns, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  // groupMap[ci][countryName] = <g> element
  var groupMap = [];
  var svgEl;

  function clearHover() {
    groupMap.forEach(function (col) {
      Object.keys(col).forEach(function (k) {
        col[k].querySelectorAll('circle').forEach(function (c) { c.setAttribute('fill-opacity', '1'); });
      });
    });
    tip.style.display = 'none';
  }

  function render() {
    wrap.innerHTML = '';
    groupMap = [];
    tip.style.display = 'none';

    var ROWS = DATASETS[currentGroup];
    var W    = wrap.offsetWidth || 800;
    var nCol = ROWS.length;
    var grandTotal = ROWS.reduce(function (s, row) {
      return s + COUNTRIES.reduce(function (ss, c) { return ss + (row[c.name] || 0); }, 0);
    }, 0);
    var colW = (W - PAD_X * 2) / nCol;
    var CPR  = Math.max(1, Math.floor(colW * 0.87 / STEP)); // leaves visible inter-column gap
    var colTotals = ROWS.map(function (row) {
      return COUNTRIES.reduce(function (s, c) { return s + (row[c.name] || 0); }, 0);
    });

    // tallest column in rows
    var maxRows = 0;
    ROWS.forEach(function (row) {
      var tot = COUNTRIES.reduce(function (s, c) { return s + (row[c.name] || 0); }, 0);
      maxRows = Math.max(maxRows, Math.ceil(tot / CPR));
    });

    var chartH = maxRows * STEP;
    var totalH = PAD_T + chartH + PAD_B;
    var baseY  = PAD_T + chartH;

    var svg = el('svg', { width: W, height: totalH });
    svg.style.cssText = 'display:block;overflow:visible';
    svgEl = svg;

    ROWS.forEach(function (row, ci) {
      var colLeft    = PAD_X + colW * ci;
      var colCx      = colLeft + colW / 2;
      var circAreaW  = CPR * STEP;
      var circStartX = colLeft + (colW - circAreaW) / 2;
      var tot = COUNTRIES.reduce(function (s, c) { return s + (row[c.name] || 0); }, 0);
      var nRows = Math.ceil(tot / CPR);

      groupMap[ci] = {};
      var globalIdx = 0;

      COUNTRIES.forEach(function (c) {
        var n = row[c.name] || 0;
        if (n === 0) return;

        var startIdx = globalIdx;
        globalIdx += n;
        var endIdx   = globalIdx;
        var startRow = Math.floor(startIdx / CPR);
        var endRow   = Math.floor((endIdx - 1) / CPR);

        var g = el('g', {});
        g._meta = { ci: ci, country: c.name, color: c.color, day: row.label, count: n };

        for (var j = startIdx; j < endIdx; j++) {
          var rj = Math.floor(j / CPR);
          var cj = j % CPR;
          g.appendChild(el('circle', {
            cx: circStartX + cj * STEP + CR,
            cy: baseY - rj * STEP - CR - CGAP / 2,
            r: CR, fill: c.color
          }));
        }

        // transparent hit rect spanning the segment's row band
        g.appendChild(el('rect', {
          x: colLeft + 1,
          y: baseY - (endRow + 1) * STEP,
          width:  colW - 2,
          height: (endRow - startRow + 1) * STEP,
          fill: 'transparent', cursor: 'pointer'
        }));

        svg.appendChild(g);
        groupMap[ci][c.name] = g;
      });

      // percentage + raw count label above column
      if (tot > 0) {
        var pctVal = (tot / grandTotal * 100).toFixed(1) + '%';
        var lbl = el('text', { x: colCx, y: baseY - nRows * STEP - 8,
          'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700,
          fill: '#222', 'font-family': FONT });
        var sp1 = document.createElementNS(ns, 'tspan');
        sp1.textContent = pctVal;
        var sp2 = document.createElementNS(ns, 'tspan');
        sp2.setAttribute('fill', '#bbb');
        sp2.setAttribute('font-size', '10');
        sp2.setAttribute('font-weight', '400');
        sp2.setAttribute('dx', '5');
        sp2.textContent = tot;
        lbl.appendChild(sp1);
        lbl.appendChild(sp2);
        svg.appendChild(lbl);
      }

      // x-axis label
      var xl = el('text', { x: colCx, y: baseY + 16,
        'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600,
        fill: '#333', 'font-family': FONT });
      xl.textContent = row.label;
      svg.appendChild(xl);
    });

    // x-axis title
    var axT = el('text', { x: W / 2, y: totalH - 6,
      'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700,
      fill: '#222', 'font-family': FONT });
    axT.textContent = 'Days until diagnosis';
    svg.appendChild(axT);

    // hover via mousemove on SVG for pixel-accurate country detection
    var lastKey = null;

    svg.addEventListener('mousemove', function (e) {
      var svgRect = svg.getBoundingClientRect();
      var mx = e.clientX - svgRect.left;
      var my = e.clientY - svgRect.top;

      var ci = Math.floor((mx - PAD_X) / colW);
      if (ci < 0 || ci >= nCol) { if (lastKey) { clearHover(); lastKey = null; } return; }

      var row     = ROWS[ci];
      var colLeft = PAD_X + colW * ci;
      var circAreaW  = CPR * STEP;
      var circStartX = colLeft + (colW - circAreaW) / 2;

      var dy = baseY - my;
      var rj = Math.floor(dy / STEP);
      var dx = mx - circStartX;
      var cj = Math.floor(dx / STEP);

      if (rj < 0 || cj < 0 || cj >= CPR) { if (lastKey) { clearHover(); lastKey = null; } return; }

      var totalIdx = rj * CPR + cj;
      var tot = COUNTRIES.reduce(function (s, c) { return s + (row[c.name] || 0); }, 0);
      if (totalIdx >= tot) { if (lastKey) { clearHover(); lastKey = null; } return; }

      var cum = 0, hovC = null;
      for (var k = 0; k < COUNTRIES.length; k++) {
        var n = row[COUNTRIES[k].name] || 0;
        if (totalIdx < cum + n) { hovC = COUNTRIES[k]; break; }
        cum += n;
      }
      if (!hovC) { if (lastKey) { clearHover(); lastKey = null; } return; }

      var key = ci + ':' + hovC.name;
      if (key !== lastKey) {
        lastKey = key;
        // dim everything
        groupMap.forEach(function (col) {
          Object.keys(col).forEach(function (name) {
            col[name].querySelectorAll('circle').forEach(function (c) {
              c.setAttribute('fill-opacity', '0.2');
            });
          });
        });
        // highlight hovered group
        if (groupMap[ci] && groupMap[ci][hovC.name]) {
          groupMap[ci][hovC.name].querySelectorAll('circle').forEach(function (c) {
            c.setAttribute('fill-opacity', '1');
          });
        }
        var count = row[hovC.name] || 0;
        var colTotal = colTotals[ci];
        var colPct   = (count / colTotal * 100).toFixed(1) + '%';
        var grandPct = (count / grandTotal * 100).toFixed(1) + '%';
        tip.innerHTML =
          '<strong style="font-size:13px">' + row.label + ' days</strong><br>' +
          '<span style="color:' + hovC.color + ';font-weight:600">' + hovC.name + '</span><br>' +
          '<strong>' + count + '</strong> children' +
          ' <span style="color:#aaa">(' + colPct + ' of group · ' + grandPct + ' of total)</span>';
        tip.style.display = 'block';
      }

      // position tooltip
      var pr  = tip.parentElement.getBoundingClientRect();
      var tx  = e.clientX - pr.left + 14;
      var ty  = e.clientY - pr.top  - 10;
      if (tx + 170 > pr.width) tx = e.clientX - pr.left - 170;
      tip.style.left = tx + 'px';
      tip.style.top  = ty + 'px';
    });

    svg.addEventListener('mouseleave', function () {
      clearHover();
      lastKey = null;
    });

    wrap.appendChild(svg);

    // legend
    var leg = document.getElementById('picto-leg');
    if (!leg) return;
    leg.innerHTML = '';
    var scl = document.createElement('div');
    scl.className = 'picto-leg-item';
    scl.innerHTML =
      '<svg width="10" height="10" viewBox="0 0 10 10" style="vertical-align:middle;margin-right:4px">' +
      '<circle cx="5" cy="5" r="4" fill="#999"/></svg><span style="margin-right:16px">= 1 child</span>';
    leg.appendChild(scl);
    COUNTRIES.forEach(function (c) {
      var item = document.createElement('div');
      item.className = 'picto-leg-item';
      item.innerHTML =
        '<svg width="10" height="10" viewBox="0 0 10 10" style="vertical-align:middle;margin-right:5px">' +
        '<circle cx="5" cy="5" r="4" fill="' + c.color + '"/></svg>' + c.name;
      leg.appendChild(item);
    });
  }

  function wireFilters() {
    document.querySelectorAll('#picto-filter .picto-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#picto-filter .picto-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentGroup = btn.getAttribute('data-grp');
        render();
      });
    });
  }

  if (document.readyState === 'complete') {
    wireFilters();
    requestAnimationFrame(render);
  } else {
    window.addEventListener('load', function () { wireFilters(); requestAnimationFrame(render); });
  }
  window.addEventListener('resize', render);
})();

// -- Sankey: reasons for diagnosis (vertical, top->bottom) -----------------
(function () {
  var wrap = document.getElementById('sankey-wrap');
  if (!wrap) return;
  var NS = 'http://www.w3.org/2000/svg';

  var COUNTRIES = [
    { name: 'Guinea',       color: '#E31612' },
    { name: 'Niger',        color: '#F58BAE' },
    { name: 'Nigeria',      color: '#4AAE9B' },
    { name: 'South Sudan',  color: '#6B6FB6' },
    { name: 'Uganda',       color: '#F5A037' },
  ];

  // Ordered largest total first
  var REASONS = [
    'Algorithm B score >10',
    'Algorithm A score >10',
    'TB contact',
    'Positive TB-LAM test',
    'Positive GeneXpert',
    'Clinical suspicion',
    'Other TB test',
  ];

  // Abbreviated display names for the horizontal labels
  var SHORT = {
    'Algorithm B score >10': 'Alg. B >10',
    'Algorithm A score >10': 'Alg. A >10',
    'TB contact':            'TB contact',
    'Positive TB-LAM test':  'TB-LAM+',
    'Positive GeneXpert':    'GeneXpert+',
    'Clinical suspicion':    'Clinical',
    'Other TB test':         'Other TB',
  };

  var RAW = [
    { s: 'Guinea',       t: 'Positive TB-LAM test',  v: 24 },
    { s: 'Guinea',       t: 'TB contact',             v: 24 },
    { s: 'Guinea',       t: 'Algorithm A score >10',  v: 36 },
    { s: 'Guinea',       t: 'Algorithm B score >10',  v: 18 },
    { s: 'Niger',        t: 'Positive GeneXpert',     v: 8  },
    { s: 'Niger',        t: 'TB contact',             v: 6  },
    { s: 'Niger',        t: 'Algorithm A score >10',  v: 23 },
    { s: 'Nigeria',      t: 'Positive GeneXpert',     v: 14 },
    { s: 'Nigeria',      t: 'TB contact',             v: 8  },
    { s: 'Nigeria',      t: 'Algorithm A score >10',  v: 31 },
    { s: 'Nigeria',      t: 'Algorithm B score >10',  v: 56 },
    { s: 'South Sudan',  t: 'Positive GeneXpert',     v: 3  },
    { s: 'South Sudan',  t: 'Positive TB-LAM test',   v: 2  },
    { s: 'South Sudan',  t: 'TB contact',             v: 18 },
    { s: 'South Sudan',  t: 'Algorithm B score >10',  v: 93 },
    { s: 'South Sudan',  t: 'Clinical suspicion',     v: 16 },
    { s: 'Uganda',       t: 'Positive GeneXpert',     v: 3  },
    { s: 'Uganda',       t: 'Positive TB-LAM test',   v: 4  },
    { s: 'Uganda',       t: 'Other TB test',          v: 2  },
    { s: 'Uganda',       t: 'TB contact',             v: 38 },
    { s: 'Uganda',       t: 'Algorithm A score >10',  v: 39 },
    { s: 'Uganda',       t: 'Algorithm B score >10',  v: 28 },
    { s: 'Uganda',       t: 'Clinical suspicion',     v: 2  },
  ];

  var TOTAL = RAW.reduce(function (a, f) { return a + f.v; }, 0);
  var srcTot = {}, tgtTot = {};
  COUNTRIES.forEach(function (c) { srcTot[c.name] = 0; });
  REASONS.forEach(function (r)   { tgtTot[r] = 0; });
  RAW.forEach(function (f) { srcTot[f.s] += f.v; tgtTot[f.t] += f.v; });

  var tipEl = null;
  function getTip() {
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.style.cssText = 'display:none;position:fixed;background:#111;color:#fff;font-size:12px;font-family:"DM Sans",sans-serif;line-height:1.5;padding:8px 12px;border-radius:6px;pointer-events:none;z-index:1000;white-space:nowrap';
      document.body.appendChild(tipEl);
    }
    return tipEl;
  }

  function render() {
    wrap.innerHTML = '';

    var W   = Math.max(wrap.offsetWidth || 700, 500);
    var PL  = 10;
    var PR  = 10;
    var PT  = 48;   // top: room for country name labels
    var NW  = 14;   // node bar height (thickness)
    var NG  = 6;    // horizontal gap between nodes
    var MID = 230;  // vertical flow area
    // bottom: 14px for name label + 16px for pct label + 10px margin
    var PB  = 40;
    var H   = PT + NW + MID + NW + PB;

    var AW  = W - PL - PR;
    var nT  = REASONS.length;

    // Scale: fit target row (7 nodes, 6 gaps)
    var sc = (AW - (nT - 1) * NG) / TOTAL;

    function svgEl(tag, attrs) {
      var e = document.createElementNS(NS, tag);
      if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
      return e;
    }

    // Source (country) nodes -- centred horizontally
    var srcRowW = TOTAL * sc + (COUNTRIES.length - 1) * NG;
    var cxStart = PL + (AW - srcRowW) / 2;
    var srcNodes = COUNTRIES.map(function (c) {
      var w = srcTot[c.name] * sc;
      var node = { name: c.name, color: c.color, x: cxStart, y: PT, w: w };
      cxStart += w + NG;
      return node;
    });

    // Target (reason) nodes -- fill full AW
    var txStart = PL;
    var tgtY = PT + NW + MID;
    var tgtNodes = REASONS.map(function (r) {
      var w = tgtTot[r] * sc;
      var node = { name: r, x: txStart, y: tgtY, w: w };
      txStart += w + NG;
      return node;
    });

    // Build flows sorted by target order (consistent left-to-right stacking)
    var sorted = RAW.slice().sort(function (a, b) {
      return REASONS.indexOf(a.t) - REASONS.indexOf(b.t);
    });
    var sCur = {}, tCur = {};
    COUNTRIES.forEach(function (c) { sCur[c.name] = 0; });
    REASONS.forEach(function (r)   { tCur[r] = 0; });

    var midY = PT + NW + MID / 2;

    var flows = sorted.map(function (f) {
      var sn  = srcNodes.find(function (n) { return n.name === f.s; });
      var tn  = tgtNodes.find(function (n) { return n.name === f.t; });
      var col = COUNTRIES.find(function (c) { return c.name === f.s; }).color;
      var fw  = f.v * sc;
      var sx0 = sn.x + sCur[f.s],  sx1 = sx0 + fw;
      var tx0 = tn.x + tCur[f.t],  tx1 = tx0 + fw;
      sCur[f.s] += fw;
      tCur[f.t] += fw;
      var srcBot = sn.y + NW;
      var tgtTop = tn.y;
      var d = 'M' + sx0 + ',' + srcBot
            + 'C' + sx0 + ',' + midY + ' ' + tx0 + ',' + midY + ' ' + tx0 + ',' + tgtTop
            + 'L' + tx1 + ',' + tgtTop
            + 'C' + tx1 + ',' + midY + ' ' + sx1 + ',' + midY + ' ' + sx1 + ',' + srcBot + 'Z';
      return { d: d, color: col, src: f.s, tgt: f.t, val: f.v };
    });

    var svg = svgEl('svg', { width: W, height: H, overflow: 'visible' });

    // Flow ribbons
    var fg = svgEl('g', {});
    flows.forEach(function (f) {
      var p = svgEl('path', { d: f.d, fill: f.color, 'fill-opacity': '0.42', cursor: 'pointer' });
      p.addEventListener('mouseenter', function () {
        fg.querySelectorAll('path').forEach(function (x) { x.setAttribute('fill-opacity', '0.08'); });
        p.setAttribute('fill-opacity', '0.88');
        var t    = getTip();
        var pct  = Math.round(f.val / TOTAL * 100);
        var sPct = Math.round(f.val / srcTot[f.src] * 100);
        t.innerHTML = '<strong>' + f.src + '</strong> to ' + f.tgt
          + '<br>' + f.val + ' children  ·  <strong>' + pct + '%</strong> of all diagnosed  ·  ' + sPct + '% of ' + f.src;
        t.style.display = 'block';
      });
      p.addEventListener('mousemove', function (e) {
        var t = getTip();
        t.style.left = (e.clientX + 14) + 'px';
        t.style.top  = (e.clientY - 42) + 'px';
      });
      p.addEventListener('mouseleave', function () {
        fg.querySelectorAll('path').forEach(function (x) { x.setAttribute('fill-opacity', '0.42'); });
        getTip().style.display = 'none';
      });
      fg.appendChild(p);
    });
    svg.appendChild(fg);

    // Source (country) node bars + labels above
    srcNodes.forEach(function (n) {
      svg.appendChild(svgEl('rect', {
        x: n.x, y: n.y, width: Math.max(n.w, 2), height: NW, fill: n.color, rx: 2,
      }));
      var lbl = svgEl('text', {
        x: n.x + n.w / 2, y: n.y - 6,
        'text-anchor': 'middle',
        'font-size': '11', 'font-family': 'DM Sans,sans-serif', 'font-weight': '600', fill: '#222',
      });
      lbl.textContent = n.name;
      svg.appendChild(lbl);
    });

    // Target (reason) node bars + horizontal two-line labels below
    // Line 1: abbreviated name  Line 2: percentage in red
    tgtNodes.forEach(function (n) {
      var pct    = Math.round(tgtTot[n.name] / TOTAL * 100);
      var pctStr = pct < 1 ? '<1%' : pct + '%';
      var cx     = n.x + Math.max(n.w, 2) / 2;

      svg.appendChild(svgEl('rect', {
        x: n.x, y: n.y, width: Math.max(n.w, 2), height: NW, fill: '#333', rx: 2,
      }));

      // Name (abbreviated)
      var nm = svgEl('text', {
        x: cx, y: n.y + NW + 13,
        'text-anchor': 'middle',
        'font-size': '10', 'font-family': 'DM Sans,sans-serif', 'font-weight': '500', fill: '#555',
      });
      nm.textContent = SHORT[n.name] || n.name;
      svg.appendChild(nm);

      // Percentage
      var pt = svgEl('text', {
        x: cx, y: n.y + NW + 27,
        'text-anchor': 'middle',
        'font-size': '11', 'font-family': 'DM Sans,sans-serif', 'font-weight': '700', fill: '#ee0202',
      });
      pt.textContent = pctStr;
      svg.appendChild(pt);
    });

    wrap.appendChild(svg);
  }

  if (document.readyState === 'complete') {
    requestAnimationFrame(render);
  } else {
    window.addEventListener('load', function () { requestAnimationFrame(render); });
  }
  window.addEventListener('resize', render);
})();
