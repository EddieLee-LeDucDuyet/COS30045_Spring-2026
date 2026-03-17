// ── shared-constants.js
// Margins, scales, bin generator, and filter state shared across all modules.

const margin = { top: 20, right: 30, bottom: 55, left: 60 };
const width  = 680 - margin.left - margin.right;
const height = 380 - margin.top  - margin.bottom;

// Colour map for screen technologies
const techColors = {
  all:  '#ffd166',
  LCD:  '#4da6ff',
  LED:  '#4df0c0',
  OLED: '#c77dff'
};

// Filter state — screen technology (single-select)
const filters_tech = [
  { id: 'all',  label: 'All',  isActive: true  },
  { id: 'LCD',  label: 'LCD',  isActive: false },
  { id: 'LED',  label: 'LED',  isActive: false },
  { id: 'OLED', label: 'OLED', isActive: false },
];

// Filter state — screen sizes (multi-select); most common from dataset
const filters_size = [
  { id: '24', label: '24"', isActive: false },
  { id: '32', label: '32"', isActive: false },
  { id: '43', label: '43"', isActive: false },
  { id: '55', label: '55"', isActive: false },
  { id: '65', label: '65"', isActive: false },
  { id: '75', label: '75"', isActive: false },
  { id: '98', label: '98"', isActive: false },
];

// D3 scales (ranges set here; domains set in drawHistogram after data loads)
const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

// Bin generator — defined here so updateHistogram() can reuse it on filtered data
const binGenerator = d3.bin()
  .value(d => d.energyConsumption)
  .thresholds(30);