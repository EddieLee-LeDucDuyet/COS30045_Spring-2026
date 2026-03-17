// ── main.js
// Entry point: loads Ex6_TVdata.csv, then calls all draw / populate functions.

let allData = []; // global — used by interactions.js

function loadData() {
  d3.csv('Ex6_TVdata.csv', d => ({
    brand:             d.brand,
    model:             d.model,
    screenSize:        +d.screenSize,
    screenTech:        d.screenTech,
    energyConsumption: +d.energyConsumption,
    star:              +d.star
  }))
  .then(data => {
    allData = data;

    // Fix binGenerator domain to the full dataset extent
    const extent = d3.extent(allData, d => d.energyConsumption);
    binGenerator.domain(extent);

    // ── Exercise 6.1 — Histogram + filters ──────────────────────────────────
    drawHistogram(allData);
    populateFilters(allData);
    document.getElementById('chart-subtitle').textContent = 'Showing: All technologies';
    document.getElementById('count-badge').textContent    =
      `${allData.length.toLocaleString()} TVs`;

    // ── Exercise 6.2 — Scatterplot + tooltip ────────────────────────────────
    drawScatterplot(allData);
    createTooltip();       // Step 3: append tooltip SVG elements to innerChartS
    handleMouseEvents();   // Step 3: wire up mouseenter / mouseleave on circles

    document.getElementById('scatter-badge').textContent = allData.length.toLocaleString() + ' TVs';
    console.log('Data loaded:', allData.length, 'rows');
    console.log('Sample row:', allData[0]);
  })
  .catch(err => {
    console.error('Failed to load CSV:', err);
    document.getElementById('chart').innerHTML =
      '<div class="state-msg">⚠ Could not load Ex6_TVdata.csv</div>';
  });
}

loadData();