/**
 * Markov's Inequality — Interactive Visualization
 * P(X ≥ a) ≤ E[X] / a
 */

export class MarkovAnimation {
  constructor(svg, width, height, margin) {
    this.svg = svg;
    this.width = width;
    this.height = height;
    this.margin = margin;
    this.innerWidth  = width  - margin.left - margin.right;
    this.innerHeight = height - margin.top  - margin.bottom;
    this.mean      = 2;
    this.threshold = 5;
    this.variance  = 4;
    this.step_index = 0;
  }

  static theory = {
    title: "Markov's Inequality",

    definition: `Markov's Inequality is the most fundamental tail bound in probability theory. For any non-negative random variable X with finite mean E[X], and any threshold a > 0, it provides a hard upper bound on how much probability mass can accumulate beyond a. Remarkably, it requires no knowledge of the distribution's shape — only the mean.`,

    formula: "P(X \\geq a) \\leq \\dfrac{E[X]}{a}",

    description: `
      <strong>What it tells us:</strong> At most E[X]/a of the total probability can lie at or above the threshold a.
      If the mean is 2 and your threshold is 10, no more than 20% of outcomes can be that extreme.
      <br><br>
      <strong>Why it's useful:</strong> This bound requires nothing beyond the mean — no distributional assumptions,
      no shape constraints. This universality comes at a price: the bound is often quite loose.
      <br><br>
      <strong>Key limitation:</strong> For the exponential distribution Exp(λ=2), the bound at a=5 gives 40%,
      while the true tail probability is only 8.2% — Markov overestimates by nearly 5×.
    `,

    insights: `
      • <strong>Distribution-agnostic:</strong> Applies to every non-negative distribution with finite mean — Poisson, exponential, Pareto, and beyond
      <br>• <strong>Only needs the mean:</strong> No variance, no moment generating function, no shape assumptions required
      <br>• <strong>Foundation stone:</strong> Chebyshev's inequality and Chernoff bounds are both derived directly from Markov
      <br>• <strong>Often conservative:</strong> Real distributions tend to concentrate their mass far more than Markov predicts
      <br>• <strong>Tight bound exists:</strong> The two-point distribution achieving the bound shows no tighter universal bound is possible
    `,

    intuition: `If the average value is small, then very large values must be rare — otherwise they would pull the average upward. Markov formalizes this intuition: the mean places a strict limit on how heavy any tail can be. Think of it as the "conservation of expectation" argument.`,

    bounds: `
      • Requires only: X ≥ 0 and E[X] &lt; ∞ — the weakest possible conditions
      <br>• <strong>Tight case:</strong> Achieved by X = a w.p. E[X]/a, and X = 0 otherwise — a "concentrated-then-zero" distribution
      <br>• Bound is trivially 1 when a ≤ E[X]; informative only when a > E[X]
      <br>• For heavy-tailed distributions (Pareto, Cauchy), Markov may be the only available tool
    `,

    applications: `
      <ol style="margin:0; padding-left:1.5rem; line-height:2;">
        <li><strong>Algorithm analysis</strong> — Bounding worst-case runtime of randomized algorithms via expected runtime</li>
        <li><strong>Probabilistic method</strong> — Proving combinatorial existence results (e.g., large independent sets)</li>
        <li><strong>Queueing theory</strong> — Upper bounding buffer overflow probability in network queues</li>
        <li><strong>Finance</strong> — Conservative VaR estimates when only mean loss is known</li>
        <li><strong>Quality control</strong> — Guaranteeing defect rates when only average defect count is tracked</li>
      </ol>`,

    references: [
      { author: 'Markov, A. A.', year: 1890, title: 'On the distribution of values of a random variable', journal: 'Classical result — attributed posthumously' },
      { author: 'Williams, D.', year: 1991, title: 'Probability with Martingales', journal: 'Cambridge University Press', doi: 'ISBN 0-521-40605-6' },
      { author: 'Motwani, R. & Raghavan, P.', year: 1995, title: 'Randomized Algorithms', journal: 'Cambridge University Press', doi: 'ISBN 0-521-47465-5' }
    ],

    code: `// Markov's Inequality — P(X >= a) <= E[X] / a
function markovBound(mean, threshold) {
  if (threshold <= 0 || mean < 0) throw new Error('Invalid inputs');
  return Math.min(1, mean / threshold);
}

// Example: Exponential(λ) has E[X] = λ
const mean      = 2;     // E[X]
const threshold = 5;     // a

const bound  = markovBound(mean, threshold); // 2/5 = 0.400 (40%)
const actual = Math.exp(-threshold / mean);  // e^{-2.5} ≈ 0.082 (8.2%)

console.log(\`Markov bound : \${(bound  * 100).toFixed(1)}%\`);
console.log(\`Actual tail  : \${(actual * 100).toFixed(1)}%\`);
console.log(\`Looseness    : \${(bound / actual).toFixed(1)}x\`);
// Bound is 4.9× the actual probability — loose but universal`
  };

  setup(meanOverride = null, thresholdOverride = null) {
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Add clipping path to prevent content from extending beyond chart bounds
    const clipId = `clip-markov-${Date.now()}`;
    this.svg.append('defs').append('clipPath').attr('id', clipId)
      .append('rect').attr('width', this.innerWidth).attr('height', this.innerHeight);

    if (meanOverride      !== null) this.mean      = meanOverride;
    else { const s = document.getElementById('mean');      if (s) this.mean      = parseFloat(s.value); }
    if (thresholdOverride !== null) this.threshold = thresholdOverride;
    else { const s = document.getElementById('threshold'); if (s) this.threshold = parseFloat(s.value); }

    this.data = this._expData(this.mean, 300);

    this.xScale = d3.scaleLinear().domain([0, 12]).range([0, this.innerWidth]);
    this.yScale = d3.scaleLinear().domain([0, 0.6]).range([this.innerHeight, 0]);

    // Apply clipping path to the main group
    this.g.attr('clip-path', `url(#${clipId})`);

    // Axes
    this.g.append('g').attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.innerHeight})`)
      .call(d3.axisBottom(this.xScale).ticks(6))
      .call(g => g.select('.domain').style('stroke', 'rgba(255,255,255,0.15)'))
      .call(g => g.selectAll('.tick line').style('stroke', 'rgba(255,255,255,0.08)'))
      .call(g => g.selectAll('text').style('fill', '#6a8aaa').style('font-family', 'JetBrains Mono,monospace').style('font-size', '11px'));

    this.g.append('g').attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale).ticks(5))
      .call(g => g.select('.domain').style('stroke', 'rgba(255,255,255,0.15)'))
      .call(g => g.selectAll('.tick line').style('stroke', 'rgba(255,255,255,0.08)'))
      .call(g => g.selectAll('text').style('fill', '#6a8aaa').style('font-family', 'JetBrains Mono,monospace').style('font-size', '11px'));

    this.g.append('text').attr('x', this.innerWidth / 2).attr('y', this.innerHeight + 38)
      .attr('text-anchor', 'middle').attr('fill', '#6a8aaa').attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono,monospace').text('x');

    this.g.append('text').attr('transform', 'rotate(-90)').attr('y', -42).attr('x', -this.innerHeight / 2)
      .attr('text-anchor', 'middle').attr('fill', '#6a8aaa').attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono,monospace').text('f(x)');

    this._drawDist();
    this._drawLines();
    this.updateExplanation();
  }

  _expData(lambda, n) {
    return Array.from({ length: n + 1 }, (_, i) => {
      const x = (i / n) * 12;
      return { x, y: (1 / lambda) * Math.exp(-x / lambda) };
    });
  }

  _drawDist() {
    const line = d3.line().x(d => this.xScale(d.x)).y(d => this.yScale(d.y)).curve(d3.curveMonotoneX);
    const area = d3.area().x(d => this.xScale(d.x)).y0(this.innerHeight).y1(d => this.yScale(d.y)).curve(d3.curveMonotoneX);

    this.fullArea = this.g.append('path').datum(this.data)
      .attr('fill', '#38bdf8').attr('fill-opacity', 0.1).attr('d', area);

    const tailData = this.data.filter(d => d.x >= this.threshold);
    this.tailPath = this.g.append('path').datum(tailData)
      .attr('fill', '#f87171').attr('fill-opacity', 0.38).attr('d', area);

    this.g.append('path').datum(this.data)
      .attr('fill', 'none').attr('stroke', '#38bdf8').attr('stroke-width', 2.5).attr('d', line);
  }

  _drawLines() {
    const bound = Math.min(1, this.mean / this.threshold);

    this.meanLine = this.g.append('line')
      .attr('x1', this.xScale(this.mean)).attr('x2', this.xScale(this.mean))
      .attr('y1', 0).attr('y2', this.innerHeight)
      .attr('stroke', '#34d399').attr('stroke-width', 2).attr('stroke-dasharray', '6,3');

    this.meanLabel = this.g.append('text')
      .attr('x', this.xScale(this.mean) + 5).attr('y', 14)
      .attr('fill', '#34d399').attr('font-size', '11px').attr('font-family', 'JetBrains Mono,monospace')
      .text(`μ = ${this.mean.toFixed(1)}`);

    this.threshLine = this.g.append('line')
      .attr('x1', this.xScale(this.threshold)).attr('x2', this.xScale(this.threshold))
      .attr('y1', 0).attr('y2', this.innerHeight)
      .attr('stroke', '#f87171').attr('stroke-width', 2).attr('stroke-dasharray', '6,3');

    this.threshLabel = this.g.append('text')
      .attr('x', this.xScale(this.threshold) + 5).attr('y', 14)
      .attr('fill', '#f87171').attr('font-size', '11px').attr('font-family', 'JetBrains Mono,monospace')
      .text(`a = ${this.threshold.toFixed(1)}`);

    this.boundLabel = this.g.append('text')
      .attr('x', this.xScale(this.threshold) + 5).attr('y', 30)
      .attr('fill', '#fbbf24').attr('font-size', '10px').attr('font-family', 'JetBrains Mono,monospace')
      .text(`P ≤ ${bound.toFixed(3)}`);
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
    const bound = Math.min(1, this.mean / this.threshold);
    const fEl = document.getElementById('formula');
    const dEl = document.getElementById('description');
    if (fEl) fEl.innerHTML = `$$P(X \\geq ${this.threshold}) \\leq \\frac{${this.mean}}{${this.threshold}} = ${bound.toFixed(4)}$$`;
    if (dEl) dEl.textContent = `For any non-negative distribution with mean ${this.mean}, at most ${(bound*100).toFixed(1)}% of outcomes can be ≥ ${this.threshold}. The actual tail for Exp(μ=${this.mean}) is ${(this.calculateActualTailProbability()*100).toFixed(2)}%.`;
    if (window.renderMathInElement) renderMathInElement(document.body, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
  }

  play()  { this.step_index = 0; this._animate(); }

  _animate() {
    const steps = [
      () => this._showDist(),
      () => this._showMean(),
      () => this._showThresh(),
      () => this._showTail(),
      () => this.updateExplanation()
    ];
    if (this.step_index < steps.length) {
      steps[this.step_index++]();
      setTimeout(() => this._animate(), 1200);
    }
  }

  step() {
    const steps = [
      () => this._showDist(),
      () => this._showMean(),
      () => this._showThresh(),
      () => this._showTail(),
      () => this.updateExplanation()
    ];
    if (this.step_index < steps.length) steps[this.step_index++]();
  }

  _showDist()   { this.fullArea?.attr('fill-opacity', 0).transition().duration(700).attr('fill-opacity', 0.1); }
  _showMean()   { this.meanLine?.attr('opacity', 0).transition().duration(500).attr('opacity', 1); this.meanLabel?.attr('opacity', 0).transition().duration(500).attr('opacity', 1); }
  _showThresh() { this.threshLine?.attr('opacity', 0).transition().duration(500).attr('opacity', 1); this.threshLabel?.attr('opacity', 0).transition().duration(500).attr('opacity', 1); }
  _showTail()   { this.tailPath?.attr('fill-opacity', 0).transition().duration(700).attr('fill-opacity', 0.38); }

  calculateActualTailProbability() {
    return Math.exp(-this.threshold / this.mean);
  }

  drawOutputVisualization() {
    const outSvg = d3.select('#output-chart');
    if (outSvg.empty()) return;
    outSvg.selectAll('*').remove();

    const W=400, H=300, m={top:25,right:25,bottom:55,left:60};
    const iW=W-m.left-m.right, iH=H-m.top-m.bottom;
    outSvg.attr('width', W).attr('height', H);

    const bound  = Math.min(1, this.mean / this.threshold);
    const actual = this.calculateActualTailProbability();
    const data   = [
      { label: 'Markov Bound', value: bound,  color: '#f87171' },
      { label: 'Actual Tail',  value: actual, color: '#34d399' }
    ];
    this._drawBarChart(outSvg, data, iW, iH, m, W, H);
  }

  _drawBarChart(svg, data, iW, iH, m, W, H) {
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
    const xScale = d3.scaleBand().domain(data.map(d => d.label)).range([0, iW]).padding(0.4);
    const yMax   = Math.max(...data.map(d => d.value), 0.05);
    const yScale = d3.scaleLinear().domain([0, Math.min(1, yMax * 1.25)]).range([iH, 0]);

    g.append('g').call(d3.axisLeft(yScale).tickSize(-iW).tickFormat(''))
      .style('stroke', 'rgba(255,255,255,0.04)').style('stroke-dasharray', '3')
      .select('.domain').remove();

    g.selectAll('rect').data(data).enter().append('rect')
      .attr('x', d => xScale(d.label)).attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth()).attr('height', d => iH - yScale(d.value))
      .attr('fill', d => d.color).attr('opacity', 0.88).attr('rx', 5)
      .style('filter', d => `drop-shadow(0 0 8px ${d.color}55)`);

    g.selectAll('.vlabel').data(data).enter().append('text').attr('class', 'vlabel')
      .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2).attr('y', d => yScale(d.value) - 6)
      .attr('text-anchor', 'middle').attr('fill', '#c8dff0').attr('font-size', '11px')
      .attr('font-weight', '700').attr('font-family', 'JetBrains Mono,monospace')
      .text(d => (d.value * 100).toFixed(2) + '%');

    g.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(xScale))
      .call(g => g.select('.domain').style('stroke', 'rgba(255,255,255,0.1)'))
      .call(g => g.selectAll('text').style('fill', '#6a8aaa').style('font-family', 'JetBrains Mono,monospace').style('font-size', '10px'));

    g.append('g').call(d3.axisLeft(yScale).ticks(4).tickFormat(d => Math.round(d * 100) + '%'))
      .call(g => g.select('.domain').style('stroke', 'rgba(255,255,255,0.1)'))
      .call(g => g.selectAll('text').style('fill', '#6a8aaa').style('font-family', 'JetBrains Mono,monospace').style('font-size', '10px'));

    svg.append('text').attr('transform', 'rotate(-90)').attr('y', 14).attr('x', -(H / 2))
      .attr('text-anchor', 'middle').attr('fill', '#6a8aaa').attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono,monospace').text('Probability');
  }

  updateQuickStats() {
    const bound   = Math.min(1, this.mean / this.threshold);
    const actual  = this.calculateActualTailProbability();
    const tight   = bound > 0 ? (actual / bound * 100).toFixed(1) + '%' : '—';
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('stat-mean',      this.mean.toFixed(3));
    set('stat-threshold', this.threshold.toFixed(3));
    set('stat-bound',     bound.toFixed(4));
    set('stat-actual',    (actual * 100).toFixed(2) + '%');
    set('stat-tightness', tight);
  }
}