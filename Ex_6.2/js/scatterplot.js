// ── scatterplot.js
// drawScatterplot(data) — builds the SVG and plots Energy Consumption vs Star Rating
// Circles are colour-coded by screenTech using colorScale (shared-constants.js)
// Tooltip (screen size) is wired up separately in interactions.js → createTooltip()

function drawScatterplot(data) {
  // Clear any previous chart
  document.getElementById('scatter').innerHTML = '';

  const svg = d3.select('#scatter')
    .append('svg')
      .attr('width',  width  + margin.left + margin.right)
      .attr('height', height + margin.top  + margin.bottom);

  // Step 2.2 — assign to the shared innerChartS (NOT a new const, already declared)
  innerChartS = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Step 2.3 — x scale: star rating  |  y scale: energy consumption
  xScaleS.domain([0, d3.max(data, d => d.star) * 1.05]);
  yScaleS.domain([0, d3.max(data, d => d.energyConsumption) * 1.08]);

  // Step 2.4 — colour scale is already configured in shared-constants.js

  // Step 2.5 — draw circles
  innerChartS.append('g')
    .attr('class', 'circles-group')
    .selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
      .attr('class', 'dot')
      .attr('cx',      d => xScaleS(d.star))
      .attr('cy',      d => yScaleS(d.energyConsumption))
      .attr('r',       4)
      .attr('fill',    d => colorScale(d.screenTech))
      .attr('opacity', 0.45)
      // store screenSize as an attribute so handleMouseEvents can read it
      .attr('data-size',  d => d.screenSize)
      .attr('data-brand', d => d.brand)
      .attr('data-model', d => d.model);

  // Step 2.6 — X axis (star rating)
  innerChartS.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${height})`)
    .call(
      d3.axisBottom(xScaleS)
        .ticks(6)
        .tickSize(-height)
    )
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(42,49,72,0.5)'));

  innerChartS.append('text')
    .attr('class', 'axis-label')
    .attr('x', width / 2)
    .attr('y', height + 44)
    .attr('text-anchor', 'middle')
    .text('Star Rating');

  // Step 2.6 — Y axis (energy consumption)
  innerChartS.append('g')
    .attr('class', 'axis axis--y')
    .call(
      d3.axisLeft(yScaleS)
        .ticks(6)
        .tickSize(-width)
    )
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(42,49,72,0.5)'));

  innerChartS.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -46)
    .attr('text-anchor', 'middle')
    .text('Energy Consumption (kWh/year)');

  // Step 2.7 — Legend
  const legendData = colorScale.domain();
  const legend = innerChartS.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 80}, 10)`);

  legendData.forEach((tech, i) => {
    const row = legend.append('g')
      .attr('transform', `translate(0, ${i * 22})`);

    row.append('circle')
      .attr('r', 5)
      .attr('cx', 5)
      .attr('cy', 5)
      .attr('fill', colorScale(tech))
      .attr('opacity', 0.85);

    row.append('text')
      .attr('x', 16)
      .attr('y', 9)
      .attr('fill', '#9aa3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .text(tech);
  });
}

// ── updateScatterplot ─────────────────────────────────────────────────────────
// Called by updateHistogram() in interactions.js whenever a filter changes.
// Uses enter/update/exit so circles animate smoothly rather than full redraw.
function updateScatterplot(data) {
  const circles = innerChartS.select('.circles-group')
    .selectAll('.dot')
    .data(data, d => d.brand + d.model); // key by brand+model for stable binding

  // EXIT — fade out removed points
  circles.exit()
    .transition().duration(300).ease(d3.easeCubicOut)
    .attr('r', 0)
    .attr('opacity', 0)
    .remove();

  // ENTER — new points appear at correct position, radius grows in
  const enter = circles.enter()
    .append('circle')
      .attr('class', 'dot')
      .attr('cx',      d => xScaleS(d.star))
      .attr('cy',      d => yScaleS(d.energyConsumption))
      .attr('r',       0)
      .attr('fill',    d => colorScale(d.screenTech))
      .attr('opacity', 0)
      .attr('data-size',  d => d.screenSize)
      .attr('data-brand', d => d.brand)
      .attr('data-model', d => d.model);

  // ENTER + UPDATE — animate to final state
  enter.merge(circles)
    .transition().duration(400).ease(d3.easeCubicOut)
      .attr('cx',      d => xScaleS(d.star))
      .attr('cy',      d => yScaleS(d.energyConsumption))
      .attr('r',       4)
      .attr('fill',    d => colorScale(d.screenTech))
      .attr('opacity', 0.45);

  // Re-wire mouse events onto the new merged selection
  // (transitions complete before events fire, so select after a tick)
  setTimeout(() => handleMouseEvents(), 450);

  // Update scatter badge count
  document.getElementById('scatter-badge').textContent =
    `${data.length.toLocaleString()} TVs`;
}