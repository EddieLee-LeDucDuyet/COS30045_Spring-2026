// ── main.js
// Entry point: loads Ex6_TVdata.csv, then calls drawHistogram and populateFilters.

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

    // Draw chart and filters
    drawHistogram(allData);
    populateFilters(allData);

    // Update UI labels
    document.getElementById('chart-subtitle').textContent = 'Showing: All technologies';
    document.getElementById('count-badge').textContent    =
      `${allData.length.toLocaleString()} TVs`;

    console.log('Data loaded:', allData.length, 'rows');
    console.log('Sample row:', allData[0]);
  })
  .catch(err => {
    console.error('Failed to load CSV:', err);
    document.getElementById('chart').innerHTML =
      '<div class="state-msg">⚠ Could not load Ex6_TVdata.csv — make sure it is in the same folder as index.html and you are running a local server.</div>';
  });
}

loadData();