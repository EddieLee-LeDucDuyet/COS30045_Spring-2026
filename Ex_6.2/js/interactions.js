// ── interactions.js
// populateFilters(data) — renders tech + size buttons and wires up click events
// updateHistogram()     — refilters allData and redraws bars

// ── Active filter state ───────────────────────────────────────────────────────
// activeTech is tracked via filters_tech[].isActive (single-select)
// activeSizes is a Set of size strings for multi-select
const activeSizes = new Set();

// ── updateHistogram ───────────────────────────────────────────────────────────
function updateHistogram() {
  // 1. Work out which tech is selected
  const techFilter = filters_tech.find(f => f.isActive)?.id || 'all';

  // 2. Filter allData
  let filtered = allData;
  if (techFilter !== 'all') {
    filtered = filtered.filter(d => d.screenTech === techFilter);
  }
  if (activeSizes.size > 0) {
    filtered = filtered.filter(d => activeSizes.has(String(d.screenSize)));
  }

  // 3. Re-bin the filtered data using the shared binGenerator
  const updatedBins = binGenerator(filtered);

  // 4. Redraw bars with transition
  updateBars(updatedBins);

  // 5. Update the subtitle and count badge
  const techLabel  = techFilter === 'all' ? 'All technologies' : techFilter;
  const sizeLabels = [...activeSizes].sort((a, b) => +a - +b).map(s => s + '"').join(', ');
  const sizeNote   = sizeLabels ? ` · ${sizeLabels}` : '';

  // 6. Also update the scatterplot with the same filtered data
  updateScatterplot(filtered);

  document.getElementById('chart-subtitle').textContent = `Showing: ${techLabel}${sizeNote}`;
  document.getElementById('count-badge').textContent    = `${filtered.length.toLocaleString()} TVs`;
}

// ── populateFilters ───────────────────────────────────────────────────────────
function populateFilters(data) {

  // ── Screen Technology buttons (single-select) ──────────────────────────────
  const techDiv = document.getElementById('filters-tech');

  filters_tech.forEach((f, i) => {
    const btn = document.createElement('button');
    btn.className    = 'btn' + (f.isActive ? ' active' : '');
    btn.dataset.type = f.id;
    btn.textContent  = f.label;

    btn.addEventListener('click', () => {
      // Toggle: deactivate all, activate clicked
      filters_tech.forEach(ff => ff.isActive = false);
      f.isActive = true;

      // Reflect in DOM
      techDiv.querySelectorAll('.btn').forEach((b, j) => {
        b.classList.toggle('active', filters_tech[j].isActive);
      });

      updateHistogram();
    });

    techDiv.appendChild(btn);
  });

  // ── Screen Size buttons (multi-select toggle) ──────────────────────────────
  const sizeDiv = document.getElementById('filters-size');

  filters_size.forEach(f => {
    const btn = document.createElement('button');
    btn.className    = 'btn' + (f.isActive ? ' active' : '');
    btn.dataset.size = f.id;
    btn.textContent  = f.label;

    btn.addEventListener('click', () => {
      f.isActive = !f.isActive;
      btn.classList.toggle('active', f.isActive);

      if (f.isActive) activeSizes.add(f.id);
      else            activeSizes.delete(f.id);

      updateHistogram();
    });

    sizeDiv.appendChild(btn);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOLTIP — Exercise 6.2
// createTooltip()      — appends the SVG tooltip group to innerChartS
// handleMouseEvents()  — selects all circles and wires mouseenter / mouseleave
// ─────────────────────────────────────────────────────────────────────────────

// Step 3.1 / 3.2 — tooltip group appended to the scatterplot's innerChartS
function createTooltip() {
  // Append tooltip group; hidden (opacity 0) until mouse enters a circle
  const tooltipGroup = innerChartS.append('g')
    .attr('class', 'scatter-tooltip')
    .style('opacity', 0)           // .style() so it overrides any CSS text rules
    .attr('pointer-events', 'none');

  // Step 3.3 — background rectangle
  tooltipGroup.append('rect')
    .attr('class', 'tooltip-rect')
    .attr('width',  tooltipWidth)
    .attr('height', tooltipHeight)
    .attr('rx', 6)
    .attr('ry', 6)
    .attr('fill',    '#1e2332')
    .attr('stroke',  '#2a3148')
    .attr('stroke-width', 1)
    .attr('opacity', 0.92);

  // Step 3.4 — tooltip text lines
  tooltipGroup.append('text')
    .attr('class', 'tooltip-line1')   // screen size
    .attr('x', tooltipWidth / 2)
    .attr('y', 16)
    .attr('text-anchor', 'middle')
    .attr('fill', '#4df0c0')
    .attr('font-family', 'monospace')
    .attr('font-size', '11px');

  tooltipGroup.append('text')
    .attr('class', 'tooltip-line2')   // brand · model
    .attr('x', tooltipWidth / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9aa3b8')
    .attr('font-family', 'monospace')
    .attr('font-size', '10px');
}

// Step 3.5 — HandleMouseEvents (outside createTooltip so it can call it)
function handleMouseEvents() {
  const tooltipGroup = innerChartS.select('.scatter-tooltip');

  // Step 3.6 — select all circles in the scatterplot
  innerChartS.selectAll('.dot')

    // Step 3.7 — mouseenter: show tooltip
    .on('mouseenter', function(e, d) {
      console.log('mouseenter', e, d);

      // Read position from the circle element
      const cx = +this.getAttribute('cx');
      const cy = +this.getAttribute('cy');

      // Step 3.8 — update text content
      tooltipGroup.select('.tooltip-line1')
        .text(`${d.screenSize}" screen`);

      tooltipGroup.select('.tooltip-line2')
        .text(`${d.brand} · ${d.model}`);

      // Position tooltip above-right of the circle; clamp to chart edges
      const tx = Math.min(cx + 10, width  - tooltipWidth  - 4);
      const ty = Math.max(cy - tooltipHeight - 8, 4);

      tooltipGroup
        .attr('transform', `translate(${tx},${ty})`)
        .transition().duration(150)
        .style('opacity', 1);

      // Highlight the hovered circle
      d3.select(this).attr('r', 6).attr('opacity', 0.9);
    })

    // Step 3.7 — mouseleave: hide tooltip
    .on('mouseleave', function(e, d) {
      console.log('mouseleave', d);

      tooltipGroup
        .transition().duration(200)
        .style('opacity', 0)
        .on('end', () => tooltipGroup.attr('transform', 'translate(-9999,-9999)'));

      // Restore circle
      d3.select(this).attr('r', 4).attr('opacity', 0.45);
    });
}