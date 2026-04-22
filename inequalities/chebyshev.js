/**
 * Chebyshev's Inequality — Interactive Visualization
 * P(|X − μ| ≥ kσ) ≤ 1/k²
 */

export class ChebyshevAnimation {
  constructor(svg, width, height, margin) {
    this.svg = svg;
    this.width = width;
    this.height = height;
    this.margin = margin;
    this.innerWidth  = width  - margin.left - margin.right;
    this.innerHeight = height - margin.top  - margin.bottom;
    this.mean      = 2;
    this.variance  = 4;   // fixed σ² = 4 → σ = 2
    this.threshold = 5;
    this.step_index = 0;
  }

  static theory = {
    title: "Chebyshev's Inequality",

    definition: `Chebyshev's Inequality is the universally applicable two-sided tail bound. For any random variable X possessing a finite mean μ and finite variance σ², it bounds the probability of X deviating from its mean by at least k standard deviations — regardless of the underlying distribution. This single result underlies the Weak Law of Large Numbers and virtually all distribution-free statistical inference.`,

    formula: "P\\!\\left(|X - \\mu| \\geq k\\sigma\\right) \\leq \\dfrac{1}{k^2}",

    description: `
      <strong>What it tells us:</strong> No matter what distribution X follows (provided it has finite variance),
      at most 1/k² of the probability can lie further than k standard deviations from the mean.
      At k = 2, that's at most 25%; at k = 3, at most 11.1%.
      <br><br>
      <strong>Why it's powerful:</strong> Unlike parametric bounds, Chebyshev requires only two numbers: the mean
      and the variance. There's no assumption about normality, symmetry, or tail shape.
      <br><br>
      <strong>The trade-off:</strong> This universality makes the bound conservative. A normal distribution
      has only 4.6% outside 2σ — Chebyshev allows up to 25%. The gap reflects the price of ignorance
      about distributional form.
    `,

    insights: `
      • <strong>Universal guarantee:</strong> Applies to every distribution with finite variance — symmetric or skewed, unimodal or multimodal
      <br>• <strong>Two-sided bound:</strong> Captures deviation in both directions simultaneously, unlike Markov's one-sided bound
      <br>• <strong>Polynomial decay:</strong> 1/k² decay is weaker than Chernoff's exponential, but stronger than Markov's 1/k
      <br>• <strong>Tight bound:</strong> Achieved by a specific two-point mass distribution — no sharper universal bound exists
      <br>• <strong>Weak Law foundation:</strong> Directly proves that the sample mean converges to the population mean in probability
    `,

    intuition: `Chebyshev is secretly Markov in disguise: it squares the deviation (X−μ)² and applies Markov to this non-negative quantity. The key insight is that E[(X−μ)²] = σ², so the variance directly controls how dispersed the distribution can be. More variance → heavier potential tails → weaker bound.`,

    bounds: `
      • Requires: finite variance σ² &lt; ∞ — slightly stronger than Markov
      <br>• <strong>Tight case:</strong> P(X = μ+kσ) = P(X = μ−kσ) = 1/(2k²), P(X = μ) = 1 − 1/k²
      <br>• Conservative for light-tailed distributions: for Normal, actual is e^{−k²/2} × polynomial, far smaller than 1/k²
      <br>• Cannot be improved without additional distributional assumptions
    `,

    applications: `
      <ol style="margin:0; padding-left:1.5rem; line-height:2;">
        <li><strong>Weak Law of Large Numbers</strong> — the formal proof that sample averages converge to the population mean</li>
        <li><strong>Distribution-free confidence intervals</strong> — valid for any population with known variance, without normality</li>
        <li><strong>Statistical process control</strong> — bounding process variation without distributional assumptions</li>
        <li><strong>Signal processing</strong> — quantifying noise levels in arbitrary signal distributions</li>
        <li><strong>Finance / risk management</strong> — conservative VaR estimates requiring only mean and variance</li>
      </ol>`,

    references: [
      { author: 'Chebyshev, P. L.', year: 1867, title: 'Des valeurs moyennes', journal: 'Journal de Mathématiques Pures et Appliquées' },
      { author: 'Feller, W.', year: 1968, title: 'An Introduction to Probability Theory and Its Applications (Vol. 1)', journal: 'Wiley', doi: 'ISBN 0-471-25708-7' },
      { author: 'Billingsley, P.', year: 1995, title: 'Probability and Measure (3rd ed.)', journal: 'Wiley-Interscience', doi: 'ISBN 0-471-00710-2' }
    ],

    code: `// Chebyshev's Inequality — P(|X - μ| >= kσ) <= 1/k²
function chebyshevBound(variance, threshold, mean) {
  const sigma = Math.sqrt(variance);
  const k = Math.abs(threshold - mean) / sigma; // deviations from mean in σ units
  if (k <= 0) return 1;
  return Math.min(1, 1 / (k * k));              // 1/k²
}

// Normal N(μ=2, σ²=4), asking about |X - 2| >= 4 → k=2
const bound  = chebyshevBound(4, 6, 2); // k = (6-2)/2 = 2 → 1/4 = 25%
const actual = 2 * (1 - Φ(2));          // ≈ 4.55% for normal
// Chebyshev is 5.5× the actual — conservative but distribution-free

// Direct k-form:
function chebyshevK(k) {
  return Math.min(1, 1 / (k * k));
}
// k=3: ≤ 11.1%  |  k=4: ≤ 6.25%  |  k=10: ≤ 1%`
  };

  setup(meanOverride = null, thresholdOverride = null) {
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Add clipping path to prevent content from extending beyond chart bounds
    const clipId = `clip-chebyshev-${Date.now()}`;
    this.svg.append('defs').append('clipPath').attr('id', clipId)
      .append('rect').attr('width', this.innerWidth).attr('height', this.innerHeight);

    if (meanOverride      !== null) this.mean      = meanOverride;
    else { const s = document.getElementById('mean');      if (s) this.mean      = parseFloat(s.value); }
    if (thresholdOverride !== null) this.threshold = thresholdOverride;
    else { const s = document.getElementById('threshold'); if (s) this.threshold = parseFloat(s.value); }

    this.data = this._normalData();

    this.xScale = d3.scaleLinear().domain([0, 12]).range([0, this.innerWidth]);
    this.yScale = d3.scaleLinear().domain([0, 0.25]).range([this.innerHeight, 0]);

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

    this._drawDist();
    this._drawLines();
    this.updateExplanation();
  }

  _normalData() {
    const sigma = Math.sqrt(this.variance);
    return Array.from({ length: 241 }, (_, i) => {
      const x = i * 0.05;
      const y = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - this.mean) ** 2) / (2 * this.variance));
      return { x, y };
    });
  }

  _drawDist() {
    const line = d3.line().x(d => this.xScale(d.x)).y(d => this.yScale(d.y));
    const area = d3.area().x(d => this.xScale(d.x)).y0(this.innerHeight).y1(d => this.yScale(d.y));

    const leftTail  = this.data.filter(d => d.x <= this.mean - this.threshold);
    const rightTail = this.data.filter(d => d.x >= this.mean + this.threshold);

    this.leftTailPath = this.g.append('path').datum(leftTail)
      .attr('fill', '#f87171').attr('fill-opacity', 0.38).attr('d', area);
    this.rightTailPath = this.g.append('path').datum(rightTail)
      .attr('fill', '#f87171').attr('fill-opacity', 0.38).attr('d', area);

    this.g.append('path').datum(this.data)
      .attr('fill', '#34d399').attr('fill-opacity', 0.07).attr('d', area);

    this.g.append('path').datum(this.data)
      .attr('fill', 'none').attr('stroke', '#34d399').attr('stroke-width', 2.5).attr('d', line);
  }

  _drawLines() {
    const left  = this.mean - this.threshold;
    const right = this.mean + this.threshold;
    const sigma = Math.sqrt(this.variance);
    const k     = this.threshold / sigma;
    const bound = Math.min(1, 1 / (k * k));

    // Mean line
    this.g.append('line')
      .attr('x1', this.xScale(this.mean)).attr('x2', this.xScale(this.mean))
      .attr('y1', 0).attr('y2', this.innerHeight)
      .attr('stroke', '#34d399').attr('stroke-width', 2).attr('stroke-dasharray', '6,3');
    this.g.append('text').attr('x', this.xScale(this.mean) + 4).attr('y', 14)
      .attr('fill', '#34d399').attr('font-size', '11px').attr('font-family', 'JetBrains Mono,monospace')
      .text(`μ = ${this.mean.toFixed(1)}`);

    // Left threshold
    if (left >= 0) {
      this.g.append('line')
        .attr('x1', this.xScale(left)).attr('x2', this.xScale(left))
        .attr('y1', 0).attr('y2', this.innerHeight)
        .attr('stroke', '#f87171').attr('stroke-width', 2).attr('stroke-dasharray', '6,3');
    }

    // Right threshold
    this.g.append('line')
      .attr('x1', this.xScale(right)).attr('x2', this.xScale(right))
      .attr('y1', 0).attr('y2', this.innerHeight)
      .attr('stroke', '#f87171').attr('stroke-width', 2).attr('stroke-dasharray', '6,3');

    this.g.append('text').attr('x', this.xScale(right) + 4).attr('y', 14)
      .attr('fill', '#f87171').attr('font-size', '11px').attr('font-family', 'JetBrains Mono,monospace')
      .text(`μ ± ${this.threshold.toFixed(1)}`);

    this.g.append('text').attr('x', this.xScale(right) + 4).attr('y', 30)
      .attr('fill', '#fbbf24').attr('font-size', '10px').attr('font-family', 'JetBrains Mono,monospace')
      .text(`k = ${k.toFixed(2)}, P ≤ ${bound.toFixed(3)}`);
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
    const sigma = Math.sqrt(this.variance);
    const k     = this.threshold / sigma;
    const bound = Math.min(1, 1 / (k * k));
    const fEl   = document.getElementById('formula');
    const dEl   = document.getElementById('description');
    if (fEl) fEl.innerHTML = `$$P(|X - ${this.mean}| \\geq ${this.threshold}) \\leq \\frac{1}{k^2} = \\frac{1}{${k.toFixed(2)}^2} = ${bound.toFixed(4)}$$`;
    if (dEl) dEl.textContent = `With k = ${k.toFixed(2)} standard deviations, at most ${(bound*100).toFixed(2)}% of any distribution lies outside the interval [${(this.mean-this.threshold).toFixed(1)}, ${(this.mean+this.threshold).toFixed(1)}]. For a normal distribution, the actual value is ${(this.calculateActualTailProbability()*100).toFixed(3)}%.`;
    if (window.renderMathInElement) renderMathInElement(document.body, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
  }

  play() { this.step_index = 0; this._animate(); }

  _animate() {
    const steps = [() => this._showDist(), () => this._showLines(), () => this._showTails(), () => this.updateExplanation()];
    if (this.step_index < steps.length) { steps[this.step_index++](); setTimeout(() => this._animate(), 1200); }
  }

  step() {
    const steps = [() => this._showDist(), () => this._showLines(), () => this._showTails(), () => this.updateExplanation()];
    if (this.step_index < steps.length) steps[this.step_index++]();
  }

  _showDist() {
    this.g.selectAll('path').attr('opacity', 0).transition().duration(700).attr('opacity', 1);
  }
  _showLines() {
    this.g.selectAll('line').attr('opacity', 0).transition().duration(500).attr('opacity', 1);
    this.g.selectAll('text').attr('opacity', 0).transition().duration(500).attr('opacity', 1);
  }
  _showTails() {
    this.leftTailPath?.attr('fill-opacity',  0).transition().duration(700).attr('fill-opacity', 0.38);
    this.rightTailPath?.attr('fill-opacity', 0).transition().duration(700).attr('fill-opacity', 0.38);
  }

  // Normal CDF approximation
  _normalCDF(x) {
    const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
    const sign = x < 0 ? -1 : 1; x = Math.abs(x);
    const t = 1 / (1 + p * x);
    const y = 1 - ((((a5*t + a4)*t + a3)*t + a2)*t + a1) * t * Math.exp(-x*x);
    return 0.5 * (1 + sign * y);
  }

  calculateActualTailProbability() {
    const sigma = Math.sqrt(this.variance);
    const k     = this.threshold / sigma;
    return Math.min(1, 2 * (1 - this._normalCDF(k)));
  }

  drawOutputVisualization() {
    const outSvg = d3.select('#output-chart');
    if (outSvg.empty()) return;
    outSvg.selectAll('*').remove();

    const W=400, H=300, m={top:25,right:25,bottom:55,left:60};
    const iW=W-m.left-m.right, iH=H-m.top-m.bottom;
    outSvg.attr('width', W).attr('height', H);

    const sigma = Math.sqrt(this.variance);
    const k     = this.threshold / sigma;
    const bound = Math.min(1, 1 / (k * k));
    const actual = this.calculateActualTailProbability();
    const data  = [
      { label: 'Chebyshev Bound', value: bound,  color: '#f87171' },
      { label: 'Actual Tail',     value: actual, color: '#34d399' }
    ];
    this._drawBarChart(outSvg, data, iW, iH, m, W, H);
  }

  _drawBarChart(svg, data, iW, iH, m, W, H) {
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);
    const xScale = d3.scaleBand().domain(data.map(d => d.label)).range([0, iW]).padding(0.4);
    const yMax   = Math.max(...data.map(d => d.value), 0.05);
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
      .attr('font-family', 'JetBrains Mono,monospace').text(d => (d.value * 100).toFixed(2) + '%');

    g.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(xScale))
      .call(g => g.select('.domain').style('stroke', 'rgba(255,255,255,0.1)'))
      .call(g => g.selectAll('text').style('fill', '#6a8aaa').style('font-family', 'JetBrains Mono,monospace').style('font-size', '10px'));

    g.append('g').call(d3.axisLeft(yScale).ticks(4).tickFormat(d => Math.round(d*100) + '%'))
      .call(g => g.select('.domain').style('stroke', 'rgba(255,255,255,0.1)'))
      .call(g => g.selectAll('text').style('fill', '#6a8aaa').style('font-family', 'JetBrains Mono,monospace').style('font-size', '10px'));

    svg.append('text').attr('transform', 'rotate(-90)').attr('y', 14).attr('x', -(H / 2))
      .attr('text-anchor', 'middle').attr('fill', '#6a8aaa').attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono,monospace').text('Probability');
  }

  updateQuickStats() {
    const sigma = Math.sqrt(this.variance);
    const k     = this.threshold / sigma;
    const bound = Math.min(1, 1 / (k * k));
    const actual = this.calculateActualTailProbability();
    const tight  = bound > 0 ? (actual / bound * 100).toFixed(1) + '%' : '—';
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('stat-mean',      this.mean.toFixed(3));
    set('stat-threshold', this.threshold.toFixed(3));
    set('stat-bound',     bound.toFixed(4));
    set('stat-actual',    (actual * 100).toFixed(2) + '%');
    set('stat-tightness', tight);
  }
}