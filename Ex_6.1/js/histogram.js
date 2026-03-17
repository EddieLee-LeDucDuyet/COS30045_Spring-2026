// ── histogram.js
// drawHistogram(data)  — builds the SVG skeleton and draws bars for the first time
// updateBars(bins)     — called by interactions.js whenever a filter changes

let svgInner = null; // shared reference so updateBars can select inside it

// ── drawHistogram ─────────────────────────────────────────────────────────────
function drawHistogram(data) {
  // Clear any previous chart
  document.getElementById('chart').innerHTML = '';

  const svg = d3.select('#chart')
    .append('svg')
      .attr('width',  width  + margin.left + margin.right)
      .attr('height', height + margin.top  + margin.bottom);

  svgInner = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Set x domain from full dataset so the axis never shifts when filtering
  const allBins = binGenerator(data);
  xScale.domain([allBins[0].x0, allBins[allBins.length - 1].x1]);

  // Initial bins (unfiltered)
  const bins = binGenerator(data);
  const yMax = d3.max(bins, d => d.length) || 1;
  yScale.domain([0, yMax * 1.12]);

  // ── X axis ──────────────────────────────────────────────────────────────────
  svgInner.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${height})`)
    .call(
      d3.axisBottom(xScale)
        .ticks(8)
        .tickSize(-height)
    )
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(42,49,72,0.5)'));

  // X axis label
  svgInner.append('text')
    .attr('class', 'axis-label')
    .attr('x', width / 2)
    .attr('y', height + 44)
    .attr('text-anchor', 'middle')
    .text('Energy Consumption (kWh/year)');

  // ── Y axis ──────────────────────────────────────────────────────────────────
  svgInner.append('g')
    .attr('class', 'axis axis--y')
    .call(
      d3.axisLeft(yScale)
        .ticks(6)
        .tickSize(-width)
    )
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(42,49,72,0.5)'));

  // Y axis label
  svgInner.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -46)
    .attr('text-anchor', 'middle')
    .text('Number of TVs');

  // ── Bars group (empty — filled by updateBars) ────────────────────────────────
  svgInner.append('g').attr('class', 'bars-group');

  updateBars(bins);
}

// ── updateBars ────────────────────────────────────────────────────────────────
function updateBars(bins) {
  const activeTech = filters_tech.find(f => f.isActive)?.id || 'all';
  const color = techColors[activeTech] || techColors.all;

  const tooltip = document.getElementById('tooltip');
  const svgEl   = document.querySelector('#chart svg');

  // ── 1. Update yScale domain FIRST so all bar positions are correct ──────────
  const yMax = d3.max(bins, d => d.length) || 1;
  yScale.domain([0, yMax * 1.12]);

  // ── 2. Update Y axis ────────────────────────────────────────────────────────
  svgInner.select('.axis--y')
    .transition().duration(450)
    .call(d3.axisLeft(yScale).ticks(6).tickSize(-width))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(42,49,72,0.5)'));

  // ── 3. D3 enter / update / exit pattern ─────────────────────────────────────
  const bars = svgInner.select('.bars-group')
    .selectAll('.bar')
    .data(bins, d => d.x0);

  // EXIT — shrink removed bars down to the baseline then remove
  bars.exit()
    .transition().duration(300).ease(d3.easeCubicOut)
    .attr('y', yScale(0))
    .attr('height', 0)
    .remove();

  // ENTER — new bars start at the baseline (height 0)
  const barsEnter = bars.enter()
    .append('rect')
      .attr('class', 'bar')
      .attr('x',      d => xScale(d.x0) + 1)
      .attr('width',  d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 2))
      .attr('y',      yScale(0))
      .attr('height', 0)
      .attr('fill',   color)
      .attr('opacity', 0.85)
      .attr('rx', 2);

  // ENTER + UPDATE — wire up events then animate to correct position
  barsEnter.merge(bars)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 0.6);
      tooltip.style.opacity = '1';
      tooltip.innerHTML =
        `<strong>${d.x0}–${d.x1} kWh/yr</strong><span>${d.length} TVs</span>`;
    })
    .on('mousemove', function(event) {
      if (!svgEl) return;
      const r = svgEl.getBoundingClientRect();
      tooltip.style.left = (event.clientX - r.left + 12) + 'px';
      tooltip.style.top  = (event.clientY - r.top  - 10) + 'px';
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.85);
      tooltip.style.opacity = '0';
    })
    .transition().duration(450).ease(d3.easeCubicOut)
      .attr('x',      d => xScale(d.x0) + 1)
      .attr('width',  d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 2))
      .attr('y',      d => yScale(d.length))
      .attr('height', d => height - yScale(d.length))
      .attr('fill',   color);
}