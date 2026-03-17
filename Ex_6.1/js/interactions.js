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