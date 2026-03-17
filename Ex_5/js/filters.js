/**
 * filters.js — loads all data, builds the filter panel, drives DASH.dispatch()
 *
 * This module is responsible for:
 *  1. Loading both CSV files and storing them on window.DASH
 *  2. Building the dynamic brand checkbox list
 *  3. Wiring every filter control (toggles, sliders, brand search, reset)
 *  4. Calling DASH.dispatch() whenever anything changes so all charts redraw
 */

(function () {
  const TV_FILE    = "data/Ex5_TV_energy.csv";
  const PRICE_FILE = "data/Ex5_ARE_Spot_Prices.csv";

  const techCategory = t =>
    t === "OLED" ? "OLED" : t.includes("LED") ? "LED" : "LCD";

  // ── Load both files, then initialise ──────────────────────────
  Promise.all([d3.csv(TV_FILE), d3.csv(PRICE_FILE)]).then(([rawTV, rawPrice]) => {

    // Parse TV data
    DASH.tvData = rawTV
      .filter(d => +d.energy_consumpt > 0 && +d.star2 > 0)
      .map(d => ({
        brand:  d.brand.trim(),
        tech:   techCategory(d.screen_tech),
        size:   +d.screensize,
        energy: +d.energy_consumpt,
        stars:  +d.star2,
        count:  +d.count || 1,
      }));

    // Parse price data
    DASH.priceData = rawPrice
      .filter(d => d["Year"] && d["Average Price (notTas-Snowy)"])
      .map(d => ({
        year: +d["Year"],
        avg:  +d["Average Price (notTas-Snowy)"],
        QLD:  +d["Queensland ($ per megawatt hour)"] || null,
        NSW:  +d["New South Wales ($ per megawatt hour)"] || null,
        VIC:  +d["Victoria ($ per megawatt hour)"] || null,
        SA:   +d["South Australia ($ per megawatt hour)"] || null,
        TAS:  +d["Tasmania ($ per megawatt hour)"] || null,
      }));

    buildBrandList();
    wireControls();
    DASH.dispatch();   // initial render
  });

  // ── Build brand checkbox list ──────────────────────────────────
  function buildBrandList() {
    const brands = [...new Set(DASH.tvData.map(d => d.brand))].sort();
    const list   = document.getElementById("brand-list");
    const count  = document.getElementById("brand-count");
    count.textContent = `(${brands.length} total)`;

    list.innerHTML = "";
    brands.forEach(brand => {
      const label = document.createElement("label");
      label.className = "brand-item";

      const cb = document.createElement("input");
      cb.type    = "checkbox";
      cb.value   = brand;
      cb.checked = true;
      cb.addEventListener("change", onBrandChange);

      label.appendChild(cb);
      label.appendChild(document.createTextNode(brand));
      list.appendChild(label);
    });
  }

  // ── Read which brands are checked ─────────────────────────────
  function getSelectedBrands() {
    const boxes = document.querySelectorAll("#brand-list input[type=checkbox]");
    const all   = [...boxes];
    const checked = all.filter(cb => cb.checked).map(cb => cb.value);
    // If all are checked, return null (= no brand filter = faster)
    return checked.length === all.length ? null : new Set(checked);
  }

  // ── Brand search filter (hides rows in the list, doesn't deselect) ──
  document.getElementById("brand-search").addEventListener("input", function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll("#brand-list .brand-item").forEach(label => {
      const name = label.textContent.toLowerCase();
      label.style.display = name.includes(q) ? "" : "none";
    });
  });

  // ── Brand checkbox change ──────────────────────────────────────
  function onBrandChange() {
    DASH.filters.brands = getSelectedBrands();
    DASH.dispatch();
  }

  // ── Wire all controls ──────────────────────────────────────────
  function wireControls() {

    // Tech toggles
    document.querySelectorAll("#filter-tech .toggle").forEach(btn => {
      btn.addEventListener("click", function () {
        this.classList.toggle("active");
        const active = [...document.querySelectorAll("#filter-tech .toggle.active")]
          .map(b => b.dataset.value);
        DASH.filters.techs = new Set(active);
        DASH.dispatch();
      });
    });

    // Size sliders
    const sizeMin = document.getElementById("size-min");
    const sizeMax = document.getElementById("size-max");
    const sizeMinLabel = document.getElementById("size-min-label");
    const sizeMaxLabel = document.getElementById("size-max-label");

    function onSizeChange() {
      let lo = +sizeMin.value, hi = +sizeMax.value;
      if (lo > hi) { [lo, hi] = [hi, lo]; }
      sizeMinLabel.textContent = lo + "″";
      sizeMaxLabel.textContent = hi + "″";
      DASH.filters.sizeMin = lo;
      DASH.filters.sizeMax = hi;
      DASH.dispatch();
    }
    sizeMin.addEventListener("input", onSizeChange);
    sizeMax.addEventListener("input", onSizeChange);

    // Star sliders
    const starMin = document.getElementById("star-min");
    const starMax = document.getElementById("star-max");
    const starMinLabel = document.getElementById("star-min-label");
    const starMaxLabel = document.getElementById("star-max-label");

    function onStarChange() {
      let lo = +starMin.value, hi = +starMax.value;
      if (lo > hi) { [lo, hi] = [hi, lo]; }
      starMinLabel.textContent = lo + "★";
      starMaxLabel.textContent = hi + "★";
      DASH.filters.starMin = lo;
      DASH.filters.starMax = hi;
      DASH.dispatch();
    }
    starMin.addEventListener("input", onStarChange);
    starMax.addEventListener("input", onStarChange);

    // Year sliders (only affects the line chart)
    const yearMin = document.getElementById("year-min");
    const yearMax = document.getElementById("year-max");
    const yearMinLabel = document.getElementById("year-min-label");
    const yearMaxLabel = document.getElementById("year-max-label");

    function onYearChange() {
      let lo = +yearMin.value, hi = +yearMax.value;
      if (lo > hi) { [lo, hi] = [hi, lo]; }
      yearMinLabel.textContent = lo;
      yearMaxLabel.textContent = hi;
      DASH.filters.yearMin = lo;
      DASH.filters.yearMax = hi;
      DASH.dispatch();
    }
    yearMin.addEventListener("input", onYearChange);
    yearMax.addEventListener("input", onYearChange);

    // Reset button
    document.getElementById("reset-filters").addEventListener("click", () => {
      // Tech toggles
      document.querySelectorAll("#filter-tech .toggle").forEach(b => b.classList.add("active"));
      DASH.filters.techs = new Set(["LCD","LED","OLED"]);

      // Size
      sizeMin.value = 16; sizeMax.value = 114;
      sizeMinLabel.textContent = "16″"; sizeMaxLabel.textContent = "114″";
      DASH.filters.sizeMin = 16; DASH.filters.sizeMax = 114;

      // Stars
      starMin.value = 1; starMax.value = 8;
      starMinLabel.textContent = "1★"; starMaxLabel.textContent = "8★";
      DASH.filters.starMin = 1; DASH.filters.starMax = 8;

      // Brands
      document.querySelectorAll("#brand-list input[type=checkbox]").forEach(cb => cb.checked = true);
      document.getElementById("brand-search").value = "";
      document.querySelectorAll("#brand-list .brand-item").forEach(l => l.style.display = "");
      DASH.filters.brands = null;

      // Years
      yearMin.value = 1998; yearMax.value = 2024;
      yearMinLabel.textContent = "1998"; yearMaxLabel.textContent = "2024";
      DASH.filters.yearMin = 1998; DASH.filters.yearMax = 2024;

      DASH.dispatch();
    });
  }

})();