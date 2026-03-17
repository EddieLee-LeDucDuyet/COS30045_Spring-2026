/**
 * bar.js — Mean energy consumption by screen technology
 *
 * Computes means live from the filtered tvData (not from a pre-aggregated CSV)
 * so the chart updates dynamically as users filter brands, sizes, etc.
 */

(function () {
  const CONTAINER = "#bar-chart";
  const MARGIN = { top: 16, right: 90, bottom: 52, left: 64 };
  const COLOR   = { LCD:"var(--c-lcd)", LED:"var(--c-led)", OLED:"var(--c-oled)" };

  const container = document.querySelector(CONTAINER);
  let currentData = [];

  DASH.subscribe((tvData) => {
    currentData = tvData;
    draw();
  });

  new ResizeObserver(draw).observe(container);

  function draw() {
    const raw = currentData;
    d3.select(container).selectAll("*").remove();

    // Aggregate: mean energy per tech from the filtered set
    const groups = d3.rollup(raw, v => d3.mean(v, d=>d.energy), d=>d.tech);
    const data = [...groups.entries()]
      .map(([tech, mean]) => ({ tech, mean }))
      .sort((a,b) => a.mean - b.mean);

    if (!data.length) {
      d3.select(container).append("div").attr("class","empty-state")
        .text("No data matches the current filters.");
      return;
    }

    const W  = container.clientWidth;
    const H  = Math.max(220, Math.min(320, W * 0.55));
    const iW = W - MARGIN.left - MARGIN.right;
    const iH = H - MARGIN.top  - MARGIN.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox",`0 0 ${W} ${H}`).attr("width",W).attr("height",H);
    const g = svg.append("g").attr("transform",`translate(${MARGIN.left},${MARGIN.top})`);

    const y = d3.scaleBand().domain(data.map(d=>d.tech)).range([0,iH]).padding(0.35);
    const x = d3.scaleLinear().domain([0, d3.max(data,d=>d.mean)*1.18]).range([0,iW]).nice();

    // Grid
    g.append("g").attr("class","grid").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(x).tickSize(-iH).tickFormat(""));

    // Axes
    g.append("g").attr("class","axis").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(x).ticks(5));
    g.append("g").attr("class","axis").call(d3.axisLeft(y));

    // Axis label
    g.append("text").attr("class","axis-label")
      .attr("x",iW/2).attr("y",iH+44).attr("text-anchor","middle")
      .text("Mean Energy Consumption (kWh/year)");

    const tooltip = window._dashTooltip;

    // Bars
    g.selectAll(".bar").data(data).join("rect")
      .attr("class","bar")
      .attr("x",0).attr("y",d=>y(d.tech))
      .attr("width",d=>x(d.mean)).attr("height",y.bandwidth())
      .attr("fill",d=>COLOR[d.tech]||"var(--accent3)").attr("rx",4)
      .on("mouseover",(event,d)=>{
        tooltip.style("opacity",1)
          .html(`<strong>${d.tech}</strong>${d.mean.toFixed(1)} kWh/year`);
      })
      .on("mousemove",e=>tooltip.style("left",(e.pageX+12)+"px").style("top",(e.pageY-28)+"px"))
      .on("mouseout",()=>tooltip.style("opacity",0));

    // Value labels
    g.selectAll(".bar-label").data(data).join("text")
      .attr("class","bar-label")
      .attr("x",d=>x(d.mean)+6).attr("y",d=>y(d.tech)+y.bandwidth()/2)
      .attr("dominant-baseline","middle").attr("font-size","12px")
      .attr("fill","var(--ink-muted)")
      .text(d=>d.mean.toFixed(0)+" kWh");
  }
})();