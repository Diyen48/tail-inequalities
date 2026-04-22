/**
 * Chernoff Bound — Interactive Visualization
 * P(X ≥ a) ≤ inf_{t>0} E[e^{tX}] / e^{ta}
 */

export class ChernoffAnimation {
  constructor(svg, width, height, margin) {
    this.svg = svg;
    this.width = width;
    this.height = height;
    this.margin = margin;
    this.innerWidth  = width  - margin.left - margin.right;
    this.innerHeight = height - margin.top  - margin.bottom;
    this.mean      = 2;
    this.variance  = 4;
    this.threshold = 5;
    this.step_index = 0;
  }

  static theory = {
    title: 'Chernoff Bound',

    definition: `The Chernoff bound is the most powerful of the classical tail inequalities, achieving exponential decay in the tail probability. It works by applying Markov's inequality to e^{tX} — an exponential transform of X — rather than X itself, then optimizing over the free parameter t > 0. This technique connects tail bounds to the moment generating function (MGF) and, ultimately, to the Kullback-Leibler divergence.`,

    formula: 'P(X \\geq a) \\leq \\inf_{t > 0} \\frac{E[e^{tX}]}{e^{ta}}',

    description: `
      <strong>What it tells us:</strong> For sums of independent random variables, the probability of exceeding
      the threshold a decays exponentially with a. This is qualitatively superior to both Markov (1/a decay)
      and Chebyshev (1/k² polynomial decay).
      <br><br>
      <strong>Why the exponential?</strong> Multiplying X by t and exponentiating magnifies the difference
      between the threshold a and the bulk of the distribution. The optimal t zeros in on the point where
      the MGF "tilts" away from the tail.
      <br><br>
      <strong>Trade-off:</strong> Unlike Markov and Chebyshev, Chernoff requires the moment generating
      function to exist in a neighborhood of 0. This rules out very heavy-tailed distributions (Pareto, Cauchy)
      but covers Poisson, Binomial, Gaussian, and exponential families.
    `,

    insights: `
      • <strong>Exponential decay:</strong> P(X ≥ (1+δ)μ) ≤ e^{−μδ²/2} — far stronger than 1/k² for large deviations
      <br>• <strong>MGF-based:</strong> Requires the moment generating function M_X(t) = E[e^{tX}] to be finite near t=0
      <br>• <strong>KL divergence connection:</strong> The optimal bound equals exp(−D_KL(Bernoulli(a/n) ‖ Bernoulli(μ/n)))
      <br>• <strong>Foundation of ML theory:</strong> Powers PAC learning bounds, VC dimension analysis, generalization error
      <br>• <strong>Hoeffding as special case:</strong> For bounded random variables, Hoeffding's inequality is a refined Chernoff
    `,

    intuition: `Exponentiating X dramatically inflates the region X ≥ a relative to the bulk of the distribution. When you apply Markov to e^{tX}, the numerator E[e^{tX}] reflects the entire distribution but the denominator e^{ta} anchors at the threshold. The optimal t is chosen to make this ratio as small as possible, effectively "focusing" the bound on the tail.`,

    bounds: `
      • Requires: finite MGF M_X(t) for t in some interval (0, b) — stronger than variance alone
      <br>• <strong>Multiplicative form:</strong> P(X ≥ (1+δ)μ) ≤ (e^δ/(1+δ)^{1+δ})^μ
      <br>• Often tight up to polynomial factors — near-optimal for sums of independent bounded r.v.s
      <br>• Strictly dominates Chebyshev whenever both apply (same conditions + MGF exists)
    `,

    applications: `
      <ol style="margin:0; padding-left:1.5rem; line-height:2;">
        <li><strong>Randomized algorithms</strong> — proving high-probability correctness for hashing, sketching, sampling</li>
        <li><strong>Machine learning theory</strong> — PAC learning sample complexity, VC dimension, generalization bounds</li>
        <li><strong>Distributed systems</strong> — leader election, consensus protocols, fault-tolerance analysis</li>
        <li><strong>Streaming algorithms</strong> — Count-Min Sketch accuracy, HyperLogLog cardinality estimation</li>
        <li><strong>Network science</strong> — epidemic thresholds, percolation, influence propagation bounds</li>
      </ol>`,

    references: [
      { author: 'Chernoff, H.', year: 1952, title: 'A measure of asymptotic efficiency for tests of a hypothesis based on the sum of observations', journal: 'Annals of Mathematical Statistics', doi: 'DOI: 10.1214/aoms/1177729330' },
      { author: 'Alon, N. & Spencer, J. H.', year: 2016, title: 'The Probabilistic Method (4th ed.)', journal: 'Wiley-Interscience', doi: 'ISBN 978-1-119-06195-3' },
      { author: 'Mitzenmacher, M. & Upfal, E.', year: 2017, title: 'Probability and Computing (2nd ed.)', journal: 'Cambridge University Press', doi: 'ISBN 978-1-107-15488-9' }
    ],

    code: `// Chernoff Bound — multiplicative form for non-negative X with mean μ
// P(X >= (1+δ)μ) ≤ exp(−μδ²/2)  for δ ∈ (0,1]
// P(X >= (1+δ)μ) ≤ exp(−μδ/3)   for δ > 1

function chernoffBound(mean, threshold) {
  if (threshold <= mean) return 1; // trivially below threshold
  const delta = threshold / mean - 1; // δ = (a/μ) − 1 > 0
  return delta <= 1
    ? Math.exp(-mean * delta * delta / 2)
    : Math.exp(-mean * delta / 3);
}

// Example: Poisson(μ=3), threshold=9 (3× mean, δ=2 > 1)
const chernoff = chernoffBound(3, 9); // exp(−3×2/3) = exp(−2) ≈ 0.135
const markov   = 3 / 9;              // 0.333 — Chernoff is 2.5× tighter
const chebyshev = 1 / (((9-3)/Math.sqrt(4))**2); // k=3 → 1/9 ≈ 0.111

// For much larger deviations (δ >> 1), Chernoff dominates dramatically:
const bound100 = chernoffBound(3, 300); // δ=99 → exp(−99) ≈ 10^{-43}
const markov100 = 3/300;               // 0.01 — Chernoff is astronomically better`
  };

  setup(meanOverride = null, thresholdOverride = null) {
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Add clipping path to prevent content from extending beyond chart bounds
    const clipId = `clip-chernoff-${Date.now()}`;
    this.svg.append('defs').append('clipPath').attr('id', clipId)
      .append('rect').attr('width', this.innerWidth).attr('height', this.innerHeight);

    if (meanOverride      !== null) this.mean      = meanOverride;
    else { const s = document.getElementById('mean');      if (s) this.mean      = parseFloat(s.value); }
    if (thresholdOverride !== null) this.threshold = thresholdOverride;
    else { const s = document.getElementById('threshold'); if (s) this.threshold = parseFloat(s.value); }

    this.data = this._expData();

    this.xScale = d3.scaleLinear().domain([0, 12]).range([0, this.innerWidth]);
    this.yScale = d3.scaleLinear().domain([0, 1]).range([this.innerHeight, 0]);

    // Apply clipping path to the main group
    this.g.attr('clip-path', `url(#${clipId})`);

    // Axes
    this.g.append('g').attr('transform', `translate(0,${this.innerHeight})`)
      .call(d3.axisBottom(this.xScale).ticks(6))
      .call(g => g.select('.domain').style('stroke', 'rgba(255,255,255,0.15)'))
      .call(g => g.selectAll('text').style('fill', '#6a8aaa').style('font-family', 'JetBrains Mono,monospace').style('font-size', '11px'));

    this.g.append('g').call(d3.axisLeft(this.yScale).ticks(5))
      .call(g => g.select('.domain').style('stroke', 'rgba(255,255,255,0.15)'))
      .call(g => g.selectAll('text').style('fill', '#6a8aaa').style('font-family', 'JetBrains Mono,monospace').style('font-size', '11px'));

    this.g.append('text').attr('x', this.innerWidth / 2).attr('y', this.innerHeight + 38)
      .attr('text-anchor', 'middle').attr('fill', '#6a8aaa').attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono,monospace').text('x');

    this._drawDist();
    this._drawLines();
    this.updateExplanation();
  }

  _expData() {
    return Array.from({ length: 241 }, (_, i) => {
      const x = i * 0.05;
      return { x, y: Math.exp(-x / this.mean) };
    });
  }

  _drawDist() {
    const line = d3.line().x(d => this.xScale(d.x)).y(d => this.yScale(d.y));
    const area = d3.area().x(d => this.xScale(d.x)).y0(this.innerHeight).y1(d => this.yScale(d.y));

    const tailData = this.data.filter(d => d.x >= this.threshold);

    this.g.append('path').datum(this.data)
      .attr('fill', '#fbbf24').attr('fill-opacity', 0.07).attr('d', area);

    this.tailPath = this.g.append('path').datum(tailData)
      .attr('fill', '#f87171').attr('fill-opacity', 0.38).attr('d', area);

    this.g.append('path').datum(this.data)
      .attr('fill', 'none').attr('stroke', '#fbbf24').attr('stroke-width', 2.5).attr('d', line);

    // MGF curve (scaled) to illustrate e^{tX} concept
    const tOpt = Math.max(0.01, Math.log(Math.max(this.threshold, this.mean + 0.1) / this.mean) / this.threshold);
    const mgfData = this.data.map(d => ({
      x: d.x,
      y: Math.min(1, d.y * Math.exp(tOpt * d.x) / Math.exp(tOpt * this.threshold))
    }));
    this.g.append('path').datum(mgfData)
      .attr('fill', 'none').attr('stroke', '#a78bfa').attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3').attr('opacity', 0.55).attr('d', line);
  }

  _drawLines() {
    const bound = this._chernoffBound();

    this.g.append('line')
      .attr('x1', this.xScale(this.mean)).attr('x2', this.xScale(this.mean))
      .attr('y1', 0).attr('y2', this.innerHeight)
      .attr('stroke', '#34d399').attr('stroke-width', 2).attr('stroke-dasharray', '6,3');
    this.g.append('text').attr('x', this.xScale(this.mean) + 4).attr('y', 14)
      .attr('fill', '#34d399').attr('font-size', '11px').attr('font-family', 'JetBrains Mono,monospace')
      .text(`μ = ${this.mean.toFixed(1)}`);

    this.g.append('line')
      .attr('x1', this.xScale(this.threshold)).attr('x2', this.xScale(this.threshold))
      .attr('y1', 0).attr('y2', this.innerHeight)
      .attr('stroke', '#f87171').attr('stroke-width', 2).attr('stroke-dasharray', '6,3');
    this.g.append('text').attr('x', this.xScale(this.threshold) + 4).attr('y', 14)
      .attr('fill', '#f87171').attr('font-size', '11px').attr('font-family', 'JetBrains Mono,monospace')
      .text(`a = ${this.threshold.toFixed(1)}`);
    this.g.append('text').attr('x', this.xScale(this.threshold) + 4).attr('y', 30)
      .attr('fill', '#fbbf24').attr('font-size', '10px').attr('font-family', 'JetBrains Mono,monospace')
      .text(`P ≤ ${bound.toExponential(2)}`);

    this.g.append('text').attr('x', 8).attr('y', this.innerHeight - 10)
      .attr('fill', '#a78bfa').attr('font-size', '9px').attr('font-family', 'JetBrains Mono,monospace')
      .attr('opacity', 0.7).text('─ ─ scaled e^{tX} (optimal t)');
  }

  _chernoffBound() {
    const delta = Math.max(0.1, this.threshold / this.mean - 1);
    return Math.min(1, delta <= 1 ? Math.exp(-this.mean * delta * delta / 2) : Math.exp(-this.mean * delta / 3));
  }

  updateThreshold(val) {
    this.threshold = val;
    this.svg.selectAll('*').remove();
    this.setup(this.mean, val);
    this.drawOutputVisualization();
    this.updateQuickStats();
  }

  updateMean(val) {
    this.mean = val;
    this.svg.selectAll('*').remove();
    this.setup(val, this.threshold);
    this.drawOutputVisualization();
    this.updateQuickStats();
  }

  updateExplanation() {
    const delta = Math.max(0.1, this.threshold / this.mean - 1);
    const bound = Math.min(1, delta <= 1 ? Math.exp(-this.mean * delta * delta / 2) : Math.exp(-this.mean * delta / 3));
    const markovBound = Math.min(1, this.mean / this.threshold);
    const fEl = document.getElementById('formula');
    const dEl = document.getElementById('description');
    if (fEl) fEl.innerHTML = `$$P(X \\geq ${this.threshold}) \\leq e^{-\\mu\\delta^2/2} = e^{-${(this.mean * Math.min(delta, 1) ** 2 / 2).toFixed(2)}} \\approx ${bound.toExponential(3)}$$`;
    if (dEl) dEl.textContent = `Chernoff gives exponential decay: P(X ≥ ${this.threshold}) ≤ ${(bound*100).toFixed(4)}% with δ = ${delta.toFixed(2)}. This is ${(markovBound / bound).toFixed(0)}× tighter than Markov's bound of ${(markovBound*100).toFixed(1)}%.`;
    if (window.renderMathInElement) renderMathInElement(document.body, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
  }

  play() { this.step_index = 0; this._animate(); }

  _animate() {
    const steps = [() => this._showDist(), () => this._showLines(), () => this._showTail(), () => this.updateExplanation()];
    if (this.step_index < steps.length) { steps[this.step_index++](); setTimeout(() => this._animate(), 1200); }
  }

  step() {
    const steps = [() => this._showDist(), () => this._showLines(), () => this._showTail(), () => this.updateExplanation()];
    if (this.step_index < steps.length) steps[this.step_index++]();
  }

  _showDist()  { this.g.selectAll('path').attr('opacity', 0).transition().duration(700).attr('opacity', 1); }
  _showLines() { this.g.selectAll('line, text').attr('opacity', 0).transition().duration(500).attr('opacity', 1); }
  _showTail()  { this.tailPath?.attr('fill-opacity', 0).transition().duration(700).attr('fill-opacity', 0.38); }

  calculateActualTailProbability() {
    return Math.max(1e-9, Math.exp(-this.threshold / this.mean));
  }

  drawOutputVisualization() {
    const outSvg = d3.select('#output-chart');
    if (outSvg.empty()) return;
    outSvg.selectAll('*').remove();

    const W=400, H=300, m={top:25,right:25,bottom:55,left:60};
    const iW=W-m.left-m.right, iH=H-m.top-m.bottom;
    outSvg.attr('width', W).attr('height', H);

    const bound  = this._chernoffBound();
    const actual = this.calculateActualTailProbability();
    const data   = [
      { label: 'Chernoff Bound', value: bound,  color: '#f87171' },
      { label: 'Actual Tail',    value: actual, color: '#34d399' }
    ];
    this._drawBarChart(outSvg, data, iW, iH, m, W, H);
  }

  _drawBarChart(svg, data, iW, iH, m, W, H) {
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
    const xScale = d3.scaleBand().domain(data.map(d => d.label)).range([0, iW]).padding(0.4);
    const yMax   = Math.max(...data.map(d => d.value), 0.01);
    const yScale = d3.scaleLinear().domain([0, Math.min(1, yMax * 1.25)]).range([iH, 0]);

    g.append('g').call(d3.axisLeft(yScale).tickSize(-iW).tickFormat(''))
      .style('stroke', 'rgba(255,255,255,0.04)').style('stroke-dasharray', '3').select('.domain').remove();

    g.selectAll('rect').data(data).enter().append('rect')
      .attr('x', d => xScale(d.label)).attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth()).attr('height', d => iH - yScale(d.value))
      .attr('fill', d => d.color).attr('opacity', 0.88).attr('rx', 5)
      .style('filter', d => `drop-shadow(0 0 8px ${d.color}55)`);

    g.selectAll('.vlabel').data(data).enter().append('text').attr('class', 'vlabel')
      .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2).attr('y', d => yScale(d.value) - 6)
      .attr('text-anchor', 'middle').attr('fill', '#c8dff0').attr('font-size', '11px').attr('font-weight', '700')
      .attr('font-family', 'JetBrains Mono,monospace')
      .text(d => d.value < 0.0001 ? d.value.toExponential(2) : (d.value * 100).toFixed(3) + '%');

    g.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(xScale))
      .call(g => g.select('.domain').style('stroke', 'rgba(255,255,255,0.1)'))
      .call(g => g.selectAll('text').style('fill', '#6a8aaa').style('font-family', 'JetBrains Mono,monospace').style('font-size', '10px'));

    g.append('g').call(d3.axisLeft(yScale).ticks(4).tickFormat(d => d < 0.001 ? d.toExponential(0) : Math.round(d*100)/10 + '%'))
      .call(g => g.select('.domain').style('stroke', 'rgba(255,255,255,0.1)'))
      .call(g => g.selectAll('text').style('fill', '#6a8aaa').style('font-family', 'JetBrains Mono,monospace').style('font-size', '10px'));

    svg.append('text').attr('transform', 'rotate(-90)').attr('y', 14).attr('x', -(H / 2))
      .attr('text-anchor', 'middle').attr('fill', '#6a8aaa').attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono,monospace').text('Probability');
  }

  updateQuickStats() {
    const bound  = this._chernoffBound();
    const actual = this.calculateActualTailProbability();
    const tight  = bound > 0 ? (actual / bound * 100).toFixed(1) + '%' : '—';
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('stat-mean',      this.mean.toFixed(3));
    set('stat-threshold', this.threshold.toFixed(3));
    set('stat-bound',     bound.toExponential(3));
    set('stat-actual',    (actual * 100).toFixed(3) + '%');
    set('stat-tightness', tight);
  }
}