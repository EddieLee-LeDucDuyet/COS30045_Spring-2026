# COS30045 — Exercise 6: Interactive TV Energy Consumption

Live site → **https://\<your-username\>.github.io/\<your-repo-name\>/**

## What's included

| Exercise | Chart | Interaction |
|---|---|---|
| 6.1 | Histogram — Energy Consumption distribution | Filter by screen technology (LCD / LED / OLED) and screen size |
| 6.2 | Scatterplot — Energy Consumption vs Star Rating | Colour-coded by screen tech · hover circles for tooltip (size, brand, model) |

Both charts update together when a filter button is clicked.

## Project structure

```
├── index.html
├── Ex6_TVdata.csv
├── css/
│   ├── base.css        # page layout, typography, filter buttons
│   └── chart.css       # SVG / chart-specific styles
└── js/
    ├── shared-constants.js   # margins, scales, bin generator, colour scale
    ├── histogram.js          # drawHistogram(), updateBars()
    ├── scatterplot.js        # drawScatterplot(), updateScatterplot()
    ├── interactions.js       # populateFilters(), updateHistogram(), createTooltip(), handleMouseEvents()
    └── main.js               # loadData() entry point
```

## Running locally

Requires a local HTTP server (browsers block `d3.csv()` on `file://`).

```bash
# Option 1 — VS Code Live Server extension
# Right-click index.html → Open with Live Server

# Option 2 — Python
python -m http.server 8080
# then open http://localhost:8080

# Option 3 — Node
npx serve .
```

## Deploying to GitHub Pages

See `.github/workflows/deploy.yml` — pushes to `main` automatically deploy the site.

**One-time setup:**
1. Push this repo to GitHub
2. Go to **Settings → Pages → Source** and select **GitHub Actions**
3. The next push triggers the workflow and your site goes live