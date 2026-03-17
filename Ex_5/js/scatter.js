/**
 * scatter.js — Energy consumption vs Star Rating scatter plot
 *
 * Subscribes to DASH.dispatch() so it redraws whenever filters change.
 * Fixed axis domains based on full dataset so axes never jump while filtering.
 */

(function () {
  const CONTAINER = "#scatter-chart";
  const COLOR = { LCD: "var(--c-lcd)", LED: "var(--c-led)", OLED: "var(--c-oled)" };
  const MARGIN = { top: 20, right: 150, bottom: 52, left: 64 };

  // One shared tooltip used across all charts
  const tooltip = d3.select("body").append("div").attr("class","tooltip");
  window._dashTooltip = tooltip;

  const container = document.querySelector(CONTAINER);
  let currentData = [];
  let fullDomains = null;

  DASH.subscribe((tvData) => {
    // Capture full-dataset domains once so axes stay stable during filtering
    if (!fullDomains && DASH.tvData.length) {
      fullDomains = {
        x: [1, d3.max(DASH.tvData, d => d.stars) + 0.3],
        y: [0, d3.max(DASH.tvData, d => d.energy) * 1.05],
        r: [d3.min(DASH.tvData, d => d.size), d3.max(DASH.tvData, d => d.size)],
      };
    }
    currentData = tvData;
    draw();
  });

  new ResizeObserver(draw).observe(container);

  function draw() {
    const data = currentData;
    const W  = container.clientWidth;
    const H  = Math.max(340, W * 0.42);
    const iW = W - MARGIN.left - MARGIN.right;
    const iH = H - MARGIN.top  - MARGIN.bottom;

    d3.select(container).selectAll("*").remove();

    if (!data.length) {
      d3.select(container).append("div").attr("class","empty-state")
        .text("No data matches the current filters.");
      return;
    }

    const fd = fullDomains || {
      x: [1, d3.max(data, d => d.stars) + 0.3],
      y: [0, d3.max(data, d => d.energy) * 1.05],
      r: [d3.min(data, d => d.size), d3.max(data, d => d.size)],
    };

    const svg = d3.select(container).append("svg")
      .attr("viewBox",`0 0 ${W} ${H}`).attr("width",W).attr("height",H);
    const g = svg.append("g").attr("transform",`translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleLinear().domain(fd.x).range([0, iW]);
    const y = d3.scaleLinear().domain(fd.y).range([iH, 0]);
    const r = d3.scaleSqrt().domain(fd.r).range([3, 11]);

    // Grid
    g.append("g").attr("class","grid").call(d3.axisLeft(y).tickSize(-iW).tickFormat(""));
    g.append("g").attr("class","grid").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(x).tickSize(iH).tickFormat(""));

    // Axes
    g.append("g").attr("class","axis").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(x).ticks(7));
    g.append("g").attr("class","axis").call(d3.axisLeft(y).ticks(6));

    // Axis labels
    g.append("text").attr("class","axis-label")
      .attr("x",iW/2).attr("y",iH+44).attr("text-anchor","middle")
      .text("Star Rating (Energy Efficiency)");
    g.append("text").attr("class","axis-label")
      .attr("transform","rotate(-90)").attr("x",-iH/2).attr("y",-50)
      .attr("text-anchor","middle").text("Energy Consumption (kWh/year)");

    // Dots
    const order = { LCD:0, LED:1, OLED:2 };
    const sorted = [...data].sort((a,b) => order[a.tech] - order[b.tech]);

    g.selectAll(".dot").data(sorted).join("circle")
      .attr("class","dot")
      .attr("cx", d => x(d.stars))
      .attr("cy", d => y(d.energy))
      .attr("r",  d => r(d.size))
      .attr("fill", d => COLOR[d.tech])
      .attr("opacity", 0.65)
      .attr("stroke","#fff").attr("stroke-width",0.7)
      .on("mouseover", (event, d) => {
        tooltip.style("opacity",1)
          .html(`<strong>${d.brand}</strong>${d.size}&Prime; &middot; ${d.tech}<br>${d.energy.toFixed(0)} kWh/yr &middot; ${d.stars}&#9733;`);
      })
      .on("mousemove", e => tooltip.style("left",(e.pageX+12)+"px").style("top",(e.pageY-28)+"px"))
      .on("mouseout", () => tooltip.style("opacity",0));

    // Legend
    const activeTechs = [...DASH.filters.techs];
    const legend = svg.append("g").attr("class","legend")
      .attr("transform",`translate(${W-MARGIN.right+18},${MARGIN.top+10})`);

    legend.append("text").attr("y",-6).attr("font-weight","600")
      .attr("font-size","11px").attr("fill","var(--ink-muted)").text("Screen Type");

    activeTechs.forEach((t,i) => {
      const row = legend.append("g").attr("transform",`translate(0,${i*24+8})`);
      row.append("circle").attr("r",6).attr("cx",6).attr("cy",6)
        .attr("fill",COLOR[t]).attr("opacity",.75);
      row.append("text").attr("x",18).attr("y",10)
        .attr("fill","var(--ink)").attr("font-size","12px").text(t);
    });
    legend.append("text").attr("y",activeTechs.length*24+20)
      .attr("font-size","10px").attr("fill","var(--ink-muted)")
      .text("Circle size \u221d screen size");

    document.getElementById("scatter-meta").textContent =
      `${data.length} model${data.length!==1?"s":""} shown`;
  }
})();