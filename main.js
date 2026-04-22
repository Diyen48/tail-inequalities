import { MarkovAnimation }     from './inequalities/markov.js';
import { ChebyshevAnimation }  from './inequalities/chebyshev.js';
import { ChernoffAnimation }   from './inequalities/chernoff.js';
import { Visualization3D }     from './inequalities/visualization3d.js';

let svg = null;
const width  = 560;
const height = 300;
const margin = { top: 40, right: 30, bottom: 50, left: 55 };

let currentAnimation = null;
let currentSection   = 'markov';
let isDarkTheme      = true;
let currentComparison = null;
let visualization3D   = null;

const animations  = { markov: MarkovAnimation, chebyshev: ChebyshevAnimation, chernoff: ChernoffAnimation };
const theoryData  = { markov: MarkovAnimation.theory, chebyshev: ChebyshevAnimation.theory, chernoff: ChernoffAnimation.theory };

document.addEventListener('DOMContentLoaded', () => {
  svg = d3.select('#chart');
  svg.attr('width', width).attr('height', height);
  initParticles();
  init();
});

function init() {
  setupEventListeners();
  
  // Initialize slider visual feedback
  const meanSlider = document.getElementById('mean');
  if (meanSlider) {
    const min = parseFloat(meanSlider.min);
    const max = parseFloat(meanSlider.max);
    const value = parseFloat(meanSlider.value);
    const pct = ((value - min) / (max - min)) * 100;
    meanSlider.style.setProperty('--pct', `${pct}%`);
  }
  
  const thresholdSlider = document.getElementById('threshold');
  if (thresholdSlider) {
    const min = parseFloat(thresholdSlider.min);
    const max = parseFloat(thresholdSlider.max);
    const value = parseFloat(thresholdSlider.value);
    const pct = ((value - min) / (max - min)) * 100;
    thresholdSlider.style.setProperty('--pct', `${pct}%`);
  }
  
  loadAnimation('markov');
  renderMath();
  setTimeout(() => currentAnimation?.play(), 800);
  setTimeout(() => updateComparisonChart(), 400);
}

// ═══════════════════════════════════════════════════════════
//  PARTICLES BACKGROUND
// ═══════════════════════════════════════════════════════════
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  function createParticles() {
    particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      alpha: Math.random() * 0.5 + 0.15,
      hue: Math.random() < 0.6 ? 195 : (Math.random() < 0.5 ? 260 : 160)
    }));
  }
  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `hsla(195, 80%, 65%, ${(1 - dist/120)*0.07})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `hsla(${p.hue}, 80%, 65%, 0.4)`;
      ctx.fill();
      ctx.shadowBlur = 0;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });
    requestAnimationFrame(drawParticles);
  }
  window.addEventListener('resize', () => { resize(); createParticles(); });
  resize(); createParticles(); drawParticles();
}

// ═══════════════════════════════════════════════════════════
//  LOAD ANIMATION
// ═══════════════════════════════════════════════════════════
function loadAnimation(name) {
  currentSection = name;
  if (!svg) return;
  svg.selectAll('*').remove();

  const AnimClass = animations[name];
  currentAnimation = new AnimClass(svg, width, height, margin);
  currentAnimation.setup();

  const titles = {
    markov:    "Markov's Inequality",
    chebyshev: "Chebyshev's Inequality",
    chernoff:  'Chernoff Bound'
  };
  document.getElementById('viz-title').textContent = titles[name];

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active');

  loadTheorySection(name);
  currentAnimation.updateExplanation?.();
  currentAnimation.drawOutputVisualization?.();
  currentAnimation.updateQuickStats?.();

  renderMath();
  updateComparisonChart();
  document.querySelectorAll('.compare-btn').forEach(b => b.classList.remove('active'));
}

// ═══════════════════════════════════════════════════════════
//  THEORY SECTION
// ═══════════════════════════════════════════════════════════
function loadTheorySection(name) {
  const theory = theoryData[name];
  if (!theory) return;

  const set     = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  const setHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML  = html; };

  set('theory-definition', theory.definition);
  setHTML('theory-formula', `$$${theory.formula}$$`);
  set('theory-intuition',  theory.intuition);
  setHTML('theory-bounds', theory.bounds);

  buildProofModal(name, theory);

  setHTML('formula',      `$$${theory.formula}$$`);
  setHTML('description',  theory.description  || '');
  setHTML('insights',     theory.insights     || '');
  setHTML('applications', theory.applications || '');
  set('code-example',     theory.code         || '');

  const titleEl = document.getElementById('proof-modal-title');
  if (titleEl) titleEl.textContent = `${theory.title} — Step-by-Step Proof`;

  if (theory.references?.length) {
    setHTML('references', theory.references.map((ref, i) => `
      <li>
        <strong>[${i+1}]</strong> ${ref.author} (${ref.year}). <em>${ref.title}</em>.
        ${ref.journal ? `<strong>${ref.journal}</strong>. ` : ''}
        ${ref.doi ? `<code>${ref.doi}</code>` : ''}
      </li>`).join(''));
  }

  renderMath();
  setTimeout(() => {
    currentAnimation?.drawOutputVisualization?.();
    currentAnimation?.updateQuickStats?.();
  }, 120);
}

// ═══════════════════════════════════════════════════════════
//  PROOF MODAL — Step-by-Step with proper math formatting
// ═══════════════════════════════════════════════════════════
const proofSteps = {
  markov: [
    {
      title: "What are we trying to prove?",
      text:  "We want to show that for any non-negative random variable X (values ≥ 0) and any positive threshold a, the probability that X is at least a cannot exceed E[X] / a.",
      math:  "\\textbf{Goal:} \\quad P(X \\geq a) \\leq \\frac{E[X]}{a}"
    },
    {
      title: "Construct a clever indicator",
      text:  "Define an indicator random variable I that equals 1 when X ≥ a and 0 otherwise. The key trick: notice that a · I ≤ X always holds — when X < a then 0 ≤ X; when X ≥ a then a ≤ X.",
      math:  "I = \\begin{cases} 1 & \\text{if } X \\geq a \\\\ 0 & \\text{otherwise} \\end{cases} \\implies a \\cdot I \\leq X \\quad (\\text{always true})"
    },
    {
      title: "Take expectations of both sides",
      text:  "Since a · I ≤ X holds everywhere, taking expectations preserves the inequality. The expected value of I equals the probability P(X ≥ a).",
      math:  "\\mathbb{E}[a \\cdot I] \\leq \\mathbb{E}[X] \\implies a \\cdot P(X \\geq a) \\leq \\mathbb{E}[X]"
    },
    {
      title: "Divide both sides by a",
      text:  "Since a > 0, we can divide both sides by a without flipping the inequality. This gives us exactly Markov's inequality.",
      math:  "P(X \\geq a) \\leq \\frac{\\mathbb{E}[X]}{a} \\qquad \\square"
    },
    {
      title: "When is this bound tight?",
      text:  "The bound is achieved (equality holds) when X takes only two values: 0 with probability 1 − E[X]/a, and a with probability E[X]/a. In this extremal distribution, exactly E[X]/a of the probability mass sits at the threshold.",
      math:  "\\text{Tight distribution:} \\quad P(X = a) = \\frac{\\mathbb{E}[X]}{a}, \\quad P(X = 0) = 1 - \\frac{\\mathbb{E}[X]}{a}"
    }
  ],
  chebyshev: [
    {
      title: "What are we trying to prove?",
      text:  "We want to bound the probability that X deviates from its mean μ by at least k standard deviations. This applies to ANY distribution with finite mean and variance.",
      math:  "\\textbf{Goal:} \\quad P\\!\\left(|X - \\mu| \\geq k\\sigma\\right) \\leq \\frac{1}{k^2}"
    },
    {
      title: "Square the deviation",
      text:  "Define Y = (X − μ)², the squared deviation from the mean. Its expected value is the variance: E[Y] = σ². This transformation converts a two-sided problem into a one-sided one.",
      math:  "Y = (X - \\mu)^2 \\implies \\mathbb{E}[Y] = \\operatorname{Var}(X) = \\sigma^2"
    },
    {
      title: "Apply Markov's inequality to Y",
      text:  "Y is always non-negative (it's a square), so Markov's inequality applies. We use the threshold k²σ² because the event |X − μ| ≥ kσ is exactly the same as Y ≥ k²σ².",
      math:  "P\\!\\left(Y \\geq k^2\\sigma^2\\right) \\leq \\frac{\\mathbb{E}[Y]}{k^2\\sigma^2} = \\frac{\\sigma^2}{k^2\\sigma^2} = \\frac{1}{k^2}"
    },
    {
      title: "Recognize the equivalent event",
      text:  "The event {Y ≥ k²σ²} is identical to {(X−μ)² ≥ k²σ²}, which is identical to {|X−μ| ≥ kσ}. So we directly get Chebyshev's inequality.",
      math:  "P\\!\\left(|X - \\mu| \\geq k\\sigma\\right) = P\\!\\left(Y \\geq k^2\\sigma^2\\right) \\leq \\frac{1}{k^2} \\qquad \\square"
    },
    {
      title: "Why is this remarkable?",
      text:  "Chebyshev requires ONLY that variance is finite — no assumption about the distribution shape at all. At k=2 it guarantees at most 25% outside 2σ; for a normal distribution the true value is just 4.6%. The bound is conservative but universal.",
      math:  "k=2: P \\leq 25\\% \\qquad k=3: P \\leq 11.1\\% \\qquad k=4: P \\leq 6.25\\%"
    }
  ],
  chernoff: [
    {
      title: "What are we trying to prove?",
      text:  "We want exponentially small tail bounds — much tighter than Markov or Chebyshev. The key idea is to 'exponentiate' the random variable before applying Markov, turning the problem into one about the moment generating function (MGF).",
      math:  "\\textbf{Goal:} \\quad P(X \\geq a) \\leq \\inf_{t > 0} \\frac{\\mathbb{E}[e^{tX}]}{e^{ta}}"
    },
    {
      title: "Exponentiate both sides of X ≥ a",
      text:  "For any t > 0, the function e^{tx} is strictly increasing, so the event {X ≥ a} is exactly the same as {e^{tX} ≥ e^{ta}}. This is the crucial trick.",
      math:  "\\{X \\geq a\\} \\iff \\{e^{tX} \\geq e^{ta}\\} \\qquad \\forall\\, t > 0"
    },
    {
      title: "Apply Markov's inequality to e^{tX}",
      text:  "Since e^{tX} is always non-negative, Markov's inequality applies directly. The expected value E[e^{tX}] is the moment generating function (MGF) of X, evaluated at t.",
      math:  "P\\!\\left(e^{tX} \\geq e^{ta}\\right) \\leq \\frac{\\mathbb{E}[e^{tX}]}{e^{ta}} = M_X(t) \\cdot e^{-ta}"
    },
    {
      title: "Optimize over t to get the tightest bound",
      text:  "The inequality holds for ALL t > 0, so we choose t to minimize the right-hand side. Taking the infimum over all valid t gives the Chernoff bound. For a Poisson(λ) with a = (1+δ)λ, the optimal t = ln(1+δ).",
      math:  "P(X \\geq a) \\leq \\inf_{t > 0} \\, \\mathbb{E}[e^{tX}] \\cdot e^{-ta}"
    },
    {
      title: "Why does this give exponential decay?",
      text:  "When a = (1+δ)μ, the bound evaluates to e^{−μδ²/2} for small δ, or e^{−μδ/3} for large δ. This decays exponentially in μ — astronomically better than Chebyshev's 1/k² polynomial decay for large deviations.",
      math:  "P\\!\\left(X \\geq (1+\\delta)\\mu\\right) \\leq \\begin{cases} e^{-\\mu\\delta^2/2} & \\delta \\leq 1 \\\\ e^{-\\mu\\delta/3} & \\delta > 1 \\end{cases} \\qquad \\square"
    }
  ]
};

function buildProofModal(name, theory) {
  const steps = proofSteps[name];
  if (!steps) return;

  const html = steps.map((step, i) => `
    <div class="proof-step">
      <div class="proof-step-number">${i + 1}</div>
      <div class="proof-step-content">
        <h4>${step.title}</h4>
        <p>${step.text}</p>
        <div class="math-block">$$${step.math}$$</div>
      </div>
    </div>
  `).join('');

  const conclusion = `
    <div class="proof-conclusion">
      ✓ Proof complete for ${theory.title}.
      This result holds for any qualifying distribution — no additional assumptions needed beyond those stated.
    </div>`;

  document.getElementById('modal-proof-content').innerHTML = html + conclusion;
}

// ═══════════════════════════════════════════════════════════
//  COMPARISON — Quick Evaluate
// ═══════════════════════════════════════════════════════════
window.selectComparison = function(inequality) {
  currentComparison = inequality;
  document.querySelectorAll('.compare-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`cmp-${inequality}`)?.classList.add('active');
  const selEl = document.getElementById('selected-compare');
  if (selEl) {
    selEl.style.display = 'inline-block';
    selEl.textContent = `Selected: ${inequality.charAt(0).toUpperCase() + inequality.slice(1)}`;
  }
};

window.evaluateComparison = function() {
  if (!currentComparison) { alert('Please select an inequality to compare with first.'); return; }
  const threshold = parseFloat(document.getElementById('threshold').value);
  const mean      = currentAnimation?.mean     || 2;
  const variance  = currentAnimation?.variance || 4;
  const { markovB, chebyshevB, chernoffB } = computeAllBounds(mean, variance, threshold);
  const bounds = { markov: markovB, chebyshev: chebyshevB, chernoff: chernoffB };
  const names  = { markov: 'Markov', chebyshev: 'Chebyshev', chernoff: 'Chernoff' };
  const curBound = bounds[currentSection];
  const cmpBound = bounds[currentComparison];
  const sigma    = Math.sqrt(variance);
  const k        = threshold / sigma;
  const expActual  = Math.exp(-threshold / mean);
  const normActual = 2 * (1 - normalCDF(k));
  const actualByType = { markov: expActual, chebyshev: normActual, chernoff: expActual };
  const tA = curBound > 0 ? (actualByType[currentSection]  / curBound * 100).toFixed(1) : '∞';
  const tB = cmpBound > 0 ? (actualByType[currentComparison] / cmpBound * 100).toFixed(1) : '∞';
  const ratio = curBound > 0 ? (cmpBound / curBound * 100).toFixed(1) : '∞';
  const rc = document.getElementById('result-content');
  rc.innerHTML = `
    <p><strong>${names[currentSection]}</strong> bound: <span style="color:var(--primary);">${curBound.toFixed(6)}</span></p>
    <p><strong>${names[currentComparison]}</strong> bound: <span style="color:var(--accent-green);">${cmpBound.toFixed(6)}</span></p>
    <p><strong>Tightness (${names[currentSection]}):</strong> ${tA}%</p>
    <p><strong>Tightness (${names[currentComparison]}):</strong> ${tB}%</p>
    ${cmpBound < curBound
      ? `<p style="color:var(--accent-green); font-weight:700; margin-top:0.75rem;">✓ ${names[currentComparison]} is tighter (${ratio}% of ${names[currentSection]})</p>`
      : `<p style="color:var(--accent-amber); font-weight:700; margin-top:0.75rem;">✗ ${names[currentSection]} is already the tighter bound</p>`
    }`;
  document.getElementById('comparison-result').style.display = 'block';
};

// ═══════════════════════════════════════════════════════════
//  CUSTOM COMPARISON
// ═══════════════════════════════════════════════════════════
window.runCustomComparison = function() {
  const mean      = parseFloat(document.getElementById('custom-mean').value);
  const variance  = parseFloat(document.getElementById('custom-variance').value);
  const threshold = parseFloat(document.getElementById('custom-threshold').value);
  if (isNaN(mean) || isNaN(variance) || isNaN(threshold) || mean <= 0 || variance <= 0 || threshold <= 0) {
    alert('Please enter valid positive numbers for all fields.');
    return;
  }
  const { markovB, chebyshevB, chernoffB } = computeAllBounds(mean, variance, threshold);
  const sigma  = Math.sqrt(variance);
  const k      = threshold / sigma;
  const actual = Math.min(1, 2 * (1 - normalCDF(k)));
  const bounds = [
    { name: 'Markov',    value: markovB,    color: '#38bdf8', condition: 'X ≥ 0, finite mean' },
    { name: 'Chebyshev', value: chebyshevB, color: '#34d399', condition: 'Finite mean + variance' },
    { name: 'Chernoff',  value: chernoffB,  color: '#fbbf24', condition: 'Finite MGF near 0' }
  ];
  const minBound = Math.min(markovB, chebyshevB, chernoffB);
  const gridEl = document.getElementById('custom-result-grid');
  gridEl.style.display = 'grid';
  gridEl.innerHTML = bounds.map(b => `
    <div class="custom-result-card ${b.value === minBound ? 'best' : ''}">
      <div class="card-name">${b.name} ${b.value === minBound ? '⭐' : ''}</div>
      <div class="card-value" style="color:${b.value === minBound ? 'var(--accent-green)' : b.color};">
        ${b.value < 0.0001 ? b.value.toExponential(3) : (b.value * 100).toFixed(3) + '%'}
      </div>
      <div class="card-label">P(X ≥ ${threshold})</div>
      <div class="card-label" style="margin-top:0.3rem; font-size:0.65rem; color:var(--text-muted);">${b.condition}</div>
    </div>
  `).join('');
  const bestBound  = bounds.find(b => b.value === minBound);
  const worstBound = bounds.find(b => b.value === Math.max(markovB, chebyshevB, chernoffB));
  const improveFactor = worstBound.value > 0 ? (worstBound.value / minBound).toFixed(1) : '∞';
  const interpEl = document.getElementById('custom-interpretation');
  interpEl.style.display = 'block';
  interpEl.innerHTML = `
    📌 <strong>Summary:</strong> For μ = ${mean}, σ² = ${variance}, a = ${threshold} (k = ${k.toFixed(2)}σ):<br>
    — <strong>${bestBound.name}</strong> gives the tightest guarantee at <strong>${minBound < 0.0001 ? minBound.toExponential(3) : (minBound*100).toFixed(4)+'%'}</strong><br>
    — <strong>${worstBound.name}</strong> is the loosest, <strong>${improveFactor}×</strong> weaker than the best<br>
    — Actual tail (approx. normal): ~${(actual*100).toFixed(4)}% | Bound tightness: ${minBound > 0 ? (actual/minBound*100).toFixed(1)+'%' : '—'}<br>
    — Recommendation: Use Chernoff when MGF exists; Chebyshev when only variance is known; Markov as a last resort.
  `;
};

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function computeAllBounds(mean, variance, threshold) {
  const sigma  = Math.sqrt(variance);
  const k      = threshold / sigma;
  const delta  = Math.max(0.1, threshold / mean - 1);
  const markovB    = Math.min(1, mean / threshold);
  const chebyshevB = Math.min(1, 1 / (k * k));
  const chernoffB  = Math.min(1, delta <= 1
    ? Math.exp(-mean * delta * delta / 2)
    : Math.exp(-mean * delta / 3));
  return { markovB, chebyshevB, chernoffB };
}

function normalCDF(x) {
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5*t + a4)*t + a3)*t + a2)*t + a1) * t * Math.exp(-x*x);
  return 0.5 * (1 + sign * y);
}

// ═══════════════════════════════════════════════════════════
//  COMPARISON CHART
// ═══════════════════════════════════════════════════════════
function updateComparisonChart() {
  const threshold = parseFloat(document.getElementById('threshold')?.value || 5);
  const mean      = currentAnimation?.mean     || 2;
  const variance  = currentAnimation?.variance || 4;
  const { markovB, chebyshevB, chernoffB } = computeAllBounds(mean, variance, threshold);
  const sigma      = Math.sqrt(variance);
  const k          = threshold / sigma;
  const expActual  = Math.exp(-threshold / mean);
  const normActual = Math.min(1, 2 * (1 - normalCDF(k)));
  const compDiv = d3.select('#comparison-chart');
  compDiv.selectAll('*').remove();
  const W = 560, H = 220;
  const m = { top: 20, right: 20, bottom: 40, left: 52 };
  const iW = W - m.left - m.right;
  const iH = H - m.top - m.bottom;
  const data = [
    { name: 'Markov',    bound: markovB,    actual: expActual,  color: '#38bdf8' },
    { name: 'Chebyshev', bound: chebyshevB, actual: normActual, color: '#34d399' },
    { name: 'Chernoff',  bound: chernoffB,  actual: expActual,  color: '#fbbf24' }
  ];
  const svg2 = compDiv.append('svg').attr('width', W).attr('height', H);
  const g    = svg2.append('g').attr('transform', `translate(${m.left},${m.top})`);
  const xOuter = d3.scaleBand().domain(data.map(d => d.name)).range([0, iW]).padding(0.28);
  const xInner = d3.scaleBand().domain(['Bound', 'Actual']).range([0, xOuter.bandwidth()]).padding(0.12);
  const yScale = d3.scaleLinear().domain([0, 1]).range([iH, 0]);
  g.append('g').call(d3.axisLeft(yScale).tickSize(-iW).tickFormat(''))
    .style('stroke', 'rgba(255,255,255,0.04)').style('stroke-dasharray', '3')
    .select('.domain').remove();
  g.selectAll('.bar-bound').data(data).enter().append('rect')
    .attr('x', d => xOuter(d.name) + xInner('Bound')).attr('y', d => yScale(d.bound))
    .attr('width', xInner.bandwidth()).attr('height', d => iH - yScale(d.bound))
    .attr('fill', d => d.color).attr('opacity', 0.9).attr('rx', 4)
    .style('filter', d => `drop-shadow(0 0 5px ${d.color}66)`);
  g.selectAll('.bar-actual').data(data).enter().append('rect')
    .attr('x', d => xOuter(d.name) + xInner('Actual')).attr('y', d => yScale(d.actual))
    .attr('width', xInner.bandwidth()).attr('height', d => iH - yScale(d.actual))
    .attr('fill', d => d.color).attr('opacity', 0.3).attr('rx', 4);
  g.selectAll('.lbl-bound').data(data).enter().append('text')
    .attr('x', d => xOuter(d.name) + xInner('Bound') + xInner.bandwidth()/2)
    .attr('y', d => yScale(d.bound) - 4)
    .attr('text-anchor', 'middle').attr('fill', '#c8dff0')
    .attr('font-size', '9px').attr('font-weight', '700').attr('font-family', 'Space Mono, monospace')
    .text(d => (d.bound * 100).toFixed(1) + '%');
  g.selectAll('.lbl-actual').data(data).enter().append('text')
    .attr('x', d => xOuter(d.name) + xInner('Actual') + xInner.bandwidth()/2)
    .attr('y', d => yScale(d.actual) - 4)
    .attr('text-anchor', 'middle').attr('fill', '#6a8aaa')
    .attr('font-size', '9px').attr('font-family', 'Space Mono, monospace')
    .text(d => (d.actual * 100).toFixed(2) + '%');
  g.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(xOuter))
    .style('color', '#6a8aaa').style('font-family', 'Space Mono, monospace').style('font-size', '11px')
    .select('.domain').style('stroke', 'rgba(255,255,255,0.1)');
  g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d => Math.round(d*100) + '%'))
    .style('color', '#6a8aaa').style('font-size', '10px').style('font-family', 'Space Mono, monospace')
    .select('.domain').style('stroke', 'rgba(255,255,255,0.1)');
  const legend = svg2.append('g').attr('transform', `translate(${W - 110}, ${m.top})`);
  [['Bound', 0.9], ['Actual (est.)', 0.3]].forEach(([label, op], i) => {
    legend.append('rect').attr('y', i*16).attr('width', 10).attr('height', 10).attr('rx', 2)
      .attr('fill', '#38bdf8').attr('opacity', op);
    legend.append('text').attr('x', 14).attr('y', i*16+9)
      .attr('fill', '#6a8aaa').attr('font-size', '9px').attr('font-family', 'Space Mono, monospace')
      .text(label);
  });
}

// ═══════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ═══════════════════════════════════════════════════════════
function setupEventListeners() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => loadAnimation(btn.dataset.section));
  });
  document.getElementById('play')?.addEventListener('click',  () => currentAnimation?.play());
  document.getElementById('step')?.addEventListener('click',  () => currentAnimation?.step());
  document.getElementById('reset')?.addEventListener('click', () => loadAnimation(currentSection));
  document.getElementById('mean')?.addEventListener('input', e => {
    const value = parseFloat(e.target.value);
    const min = parseFloat(e.target.min);
    const max = parseFloat(e.target.max);
    const pct = ((value - min) / (max - min)) * 100;
    e.target.style.setProperty('--pct', `${pct}%`);
    currentAnimation?.updateMean(value);
    updateComparisonChart();
  });
  document.getElementById('threshold')?.addEventListener('input', e => {
    const value = parseFloat(e.target.value);
    const min = parseFloat(e.target.min);
    const max = parseFloat(e.target.max);
    const pct = ((value - min) / (max - min)) * 100;
    e.target.style.setProperty('--pct', `${pct}%`);
    currentAnimation?.updateThreshold(value);
    updateComparisonChart();
  });
  document.getElementById('toggle-theme')?.addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('light-theme');
    document.getElementById('toggle-theme').textContent = isDarkTheme ? '🌙' : '☀️';
  });
  document.getElementById('toggle-3d')?.addEventListener('click',      () => toggle3DView());
  document.getElementById('viz-3d-close')?.addEventListener('click',   () => toggle3DView(false));
  document.getElementById('viz-3d-zoom-in')?.addEventListener('click', () => visualization3D?.zoomIn());
  document.getElementById('viz-3d-zoom-out')?.addEventListener('click',() => visualization3D?.zoomOut());
  document.getElementById('viz-3d-toggle-rot')?.addEventListener('click', () => visualization3D?.toggleRotation());
  document.getElementById('viz-3d-mean')?.addEventListener('input', e => {
    const value = parseFloat(e.target.value);
    const min = parseFloat(e.target.min);
    const max = parseFloat(e.target.max);
    const pct = ((value - min) / (max - min)) * 100;
    e.target.style.setProperty('--pct', `${pct}%`);
    const mean = value;
    document.getElementById('viz-3d-mean-value').textContent = mean.toFixed(1);
    update3DVisualization(mean, parseFloat(document.getElementById('viz-3d-threshold')?.value || 5));
  });
  document.getElementById('viz-3d-threshold')?.addEventListener('input', e => {
    const value = parseFloat(e.target.value);
    const min = parseFloat(e.target.min);
    const max = parseFloat(e.target.max);
    const pct = ((value - min) / (max - min)) * 100;
    e.target.style.setProperty('--pct', `${pct}%`);
    const thr = value;
    document.getElementById('viz-3d-threshold-value').textContent = thr.toFixed(1);
    update3DVisualization(parseFloat(document.getElementById('viz-3d-mean')?.value || 2), thr);
  });
  document.getElementById('download-chart')?.addEventListener('click', downloadChartsAsSVG);
  document.getElementById('copy-formula')?.addEventListener('click',   copyFormulaToClipboard);
  document.getElementById('toggle-help')?.addEventListener('click',    openHelpModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeProofModal(); closeHelpModal(); toggle3DView(false); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); copyFormulaToClipboard(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); downloadChartsAsSVG(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); openProofModal(); }
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key === '1') loadAnimation('markov');
      if (e.key === '2') loadAnimation('chebyshev');
      if (e.key === '3') loadAnimation('chernoff');
      if (e.key === 'h' || e.key === 'H') openHelpModal();
    }
  });
}

function update3DVisualization(mean, threshold) {
  if (!visualization3D) return;
  if      (currentSection === 'markov')    visualization3D.createMarkovVisualization(mean, threshold);
  else if (currentSection === 'chebyshev') visualization3D.createChebyshevVisualization(mean, threshold);
  else if (currentSection === 'chernoff')  visualization3D.createChernoffVisualization(mean, threshold);
}

function toggle3DView(show) {
  const modal = document.getElementById('viz-3d-modal');
  if (!modal) return;
  const isVisible  = modal.style.display !== 'none' && modal.style.display !== '';
  const shouldShow = typeof show === 'boolean' ? show : !isVisible;
  if (shouldShow) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (!visualization3D) {
      try { visualization3D = new Visualization3D('viz-3d-container'); }
      catch(e) { console.error('3D init failed:', e); return; }
    }
    const mean = parseFloat(document.getElementById('mean')?.value || 2);
    const thr  = parseFloat(document.getElementById('threshold')?.value || 5);
    const m = document.getElementById('viz-3d-mean');
    const t = document.getElementById('viz-3d-threshold');
    if (m) { 
      m.value = mean; 
      document.getElementById('viz-3d-mean-value').textContent = mean.toFixed(1);
      const min = parseFloat(m.min);
      const max = parseFloat(m.max);
      const pct = ((mean - min) / (max - min)) * 100;
      m.style.setProperty('--pct', `${pct}%`);
    }
    if (t) { 
      t.value = thr;  
      document.getElementById('viz-3d-threshold-value').textContent = thr.toFixed(1);
      const min = parseFloat(t.min);
      const max = parseFloat(t.max);
      const pct = ((thr - min) / (max - min)) * 100;
      t.style.setProperty('--pct', `${pct}%`);
    }
    update3DVisualization(mean, thr);
  } else {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function renderMath() {
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true  },
        { left: '$',  right: '$',  display: false }
      ],
      throwOnError: false
    });
  }
}

// ─── MODALS ───────────────────────────────────────────────
function openProofModal() {
  const modal = document.getElementById('proof-modal');
  modal?.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => renderMath(), 120);
}
function closeProofModal(event) {
  if (event) {
    const isOverlay = event.target?.id === 'proof-modal';
    const isClose   = event.target?.classList?.contains('modal-close');
    if (!isOverlay && !isClose) return;
  }
  document.getElementById('proof-modal')?.classList.remove('active');
  document.body.style.overflow = 'auto';
}
function openHelpModal() {
  document.getElementById('help-modal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeHelpModal(event) {
  if (event) {
    const isOverlay = event.target?.id === 'help-modal';
    const isClose   = event.target?.classList?.contains('modal-close');
    if (!isOverlay && !isClose) return;
  }
  document.getElementById('help-modal')?.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// ═══════════════════════════════════════════════════════════
//  EXPORT — Both charts + description as composite SVG
// ═══════════════════════════════════════════════════════════
function downloadChartsAsSVG() {
  const inputSvgEl  = document.getElementById('chart');
  const outputSvgEl = document.getElementById('output-chart');
  if (!inputSvgEl || !outputSvgEl) return;

  const theory     = theoryData[currentSection];
  const mean       = currentAnimation?.mean     || 2;
  const threshold  = currentAnimation?.threshold || 5;
  const bound      = (() => {
    if (currentSection === 'markov')    return Math.min(1, mean / threshold);
    if (currentSection === 'chebyshev') { const k = threshold / Math.sqrt(4); return Math.min(1, 1/(k*k)); }
    const delta = Math.max(0.1, threshold/mean-1);
    return Math.min(1, delta<=1 ? Math.exp(-mean*delta*delta/2) : Math.exp(-mean*delta/3));
  })();

  const inputW  = parseInt(inputSvgEl.getAttribute('width'))  || 560;
  const inputH  = parseInt(inputSvgEl.getAttribute('height')) || 300;
  const outputW = parseInt(outputSvgEl.getAttribute('width')) || 400;
  const outputH = parseInt(outputSvgEl.getAttribute('height'))|| 300;

  const PAD   = 32;
  const GAP   = 24;
  const TITLE_H = 80;
  const INFO_H  = 130;
  const FOOTER_H= 40;

  const totalW = PAD + inputW + GAP + outputW + PAD;
  const totalH = TITLE_H + Math.max(inputH, outputH) + GAP + INFO_H + FOOTER_H;

  const inputInner  = inputSvgEl.innerHTML;
  const outputInner = outputSvgEl.innerHTML;

  // Description text (plain text from description element)
  const descEl  = document.getElementById('description');
  const descText= descEl ? (descEl.textContent || '').trim().replace(/\s+/g,' ').slice(0, 280) : '';

  // Wrap text helper (manual word-wrap for SVG)
  function wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > maxChars) {
        if (line) lines.push(line.trim());
        line = w;
      } else {
        line += ' ' + w;
      }
    }
    if (line) lines.push(line.trim());
    return lines;
  }

  const descLines = wrapText(descText, 120);
  const descSVG   = descLines.slice(0,4).map((l,i) =>
    `<text x="${PAD}" y="${TITLE_H + Math.max(inputH,outputH) + GAP + 60 + i*18}"
      font-family="monospace" font-size="10" fill="#7fa3c8">${l}</text>`
  ).join('\n');

  const titleNames = { markov: "Markov's Inequality", chebyshev: "Chebyshev's Inequality", chernoff: "Chernoff Bound" };

  const composite = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${totalW}" height="${totalH}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      text { font-family: 'Space Mono', monospace; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${totalW}" height="${totalH}" fill="#03070f"/>
  <rect width="${totalW}" height="${totalH}" fill="url(#grad)" opacity="0.3"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001832"/>
      <stop offset="100%" stop-color="#030a18"/>
    </linearGradient>
  </defs>

  <!-- Top accent line -->
  <rect x="0" y="0" width="${totalW}" height="2" fill="url(#accent)"/>
  <defs>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="30%" stop-color="#00d4ff"/>
      <stop offset="70%" stop-color="#00e5a0"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
  </defs>

  <!-- Title -->
  <text x="${PAD}" y="${TITLE_H - 44}"
    font-family="'Syne', sans-serif" font-size="22" font-weight="800"
    fill="#00d4ff" letter-spacing="1">
    ${titleNames[currentSection]}
  </text>
  <text x="${PAD}" y="${TITLE_H - 20}"
    font-family="monospace" font-size="11" fill="#3d5a78">
    μ = ${mean.toFixed(2)}   ·   threshold a = ${threshold.toFixed(2)}   ·   bound = ${bound.toFixed(6)}
  </text>

  <!-- Divider -->
  <line x1="${PAD}" y1="${TITLE_H - 6}" x2="${totalW - PAD}" y2="${TITLE_H - 6}"
    stroke="#0d2840" stroke-width="1"/>

  <!-- Left chart label -->
  <text x="${PAD}" y="${TITLE_H - 10}"
    font-family="monospace" font-size="9" fill="#3d5a78" letter-spacing="1.5">PROBABILITY DISTRIBUTION</text>

  <!-- Right chart label -->
  <text x="${PAD + inputW + GAP}" y="${TITLE_H - 10}"
    font-family="monospace" font-size="9" fill="#3d5a78" letter-spacing="1.5">BOUND VS ACTUAL TAIL</text>

  <!-- Input chart group -->
  <g transform="translate(${PAD}, ${TITLE_H})">
    ${inputInner}
  </g>

  <!-- Output chart group -->
  <g transform="translate(${PAD + inputW + GAP}, ${TITLE_H})">
    ${outputInner}
  </g>

  <!-- Info divider -->
  <line x1="${PAD}" y1="${TITLE_H + Math.max(inputH,outputH) + GAP/2}"
    x2="${totalW - PAD}" y2="${TITLE_H + Math.max(inputH,outputH) + GAP/2}"
    stroke="#0d2840" stroke-width="1"/>

  <!-- Formula label -->
  <text x="${PAD}" y="${TITLE_H + Math.max(inputH,outputH) + GAP + 22}"
    font-family="monospace" font-size="9" fill="#3d5a78" letter-spacing="1.5">FORMULA</text>
  <text x="${PAD}" y="${TITLE_H + Math.max(inputH,outputH) + GAP + 40}"
    font-family="monospace" font-size="12" fill="#ffb700">
    ${theory?.formula?.replace(/\\[a-zA-Z]+/g, '').replace(/[{}_^]/g, '') || ''}
  </text>

  <!-- Description -->
  <text x="${PAD}" y="${TITLE_H + Math.max(inputH,outputH) + GAP + 58}"
    font-family="monospace" font-size="9" fill="#3d5a78" letter-spacing="1.5">DESCRIPTION</text>
  ${descSVG}

  <!-- Footer -->
  <text x="${totalW / 2}" y="${totalH - 14}"
    text-anchor="middle" font-family="monospace" font-size="9"
    fill="#1a3050" letter-spacing="1">
    Interactive Tail Inequalities · Markov · Chebyshev · Chernoff
  </text>
</svg>`;

  const blob = new Blob([composite], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `tail-inequality-${currentSection}-${Date.now()}.svg`
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification('✓ Both charts exported as SVG');
}

function copyFormulaToClipboard() {
  const theory = theoryData[currentSection];
  if (!theory) return;
  const text = theory.formula;
  navigator.clipboard?.writeText(text).then(() => showNotification('✓ LaTeX formula copied!')).catch(() => {
    const ta = Object.assign(document.createElement('textarea'), { value: text, style: 'position:fixed;opacity:0' });
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); showNotification('✓ LaTeX formula copied!');
  });
}

function showNotification(msg, type = 'success') {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:3000;
    background:${type === 'success' ? 'var(--accent-green)' : 'var(--accent-rose)'};
    color:#000; padding:0.65rem 1.3rem; border-radius:10px;
    font-weight:700; font-family:'Space Mono',monospace; font-size:0.78rem;
    box-shadow:0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(0,229,160,0.3);
    animation:slideInUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
    letter-spacing:0.04em;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'slideOutDown 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

// Expose globals
window.openProofModal         = openProofModal;
window.closeProofModal        = closeProofModal;
window.openHelpModal          = openHelpModal;
window.closeHelpModal         = closeHelpModal;
window.downloadChartsAsSVG    = downloadChartsAsSVG;
window.copyFormulaToClipboard = copyFormulaToClipboard;