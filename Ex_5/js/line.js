/**
 * line.js — Australian wholesale electricity spot prices
 *
 * Subscribes to DASH so it redraws when the year range filter changes.
 * Individual state lines shown faintly; bold average line highlighted.
 */

(function () {
  const CONTAINER = "#line-chart";
  const MARGIN = { top: 20, right: 50, bottom: 52, left: 68 };

  const STATE_COLORS = { QLD:"#b5956a", NSW:"#8aab8a", VIC:"#7a9ec0", SA:"#c09f7a", TAS:"#b08aaa" };
  const STATE_KEYS   = ["QLD","NSW","VIC","SA","TAS"];

  const container = document.querySelector(CONTAINER);
  let currentPrices = [];
  let fullYDomain = null;

  DASH.subscribe((_tv, prices) => {
    if (!fullYDomain && DASH.priceData.length) {
      const allVals = DASH.priceData.flatMap(d =>
        [d.avg, d.QLD, d.NSW, d.VIC, d.SA, d.TAS].filter(v => v)
      );
      fullYDomain = [0, d3.max(allVals) * 1.08];
    }
    currentPrices = prices;
    draw();
  });

  new ResizeObserver(draw).observe(container);

  function draw() {
    const data = currentPrices;
    const W  = container.clientWidth;
    const H  = Math.max(280, W * 0.35);
    const iW = W - MARGIN.left - MARGIN.right;
    const iH = H - MARGIN.top  - MARGIN.bottom;

    d3.select(container).selectAll("*").remove();

    if (!data.length) {
      d3.select(container).append("div").attr("class","empty-state")
        .text("No years in selected range.");
      return;
    }

    const svg = d3.select(container).append("svg")
      .attr("viewBox",`0 0 ${W} ${H}`).attr("width",W).attr("height",H);

    // Clip to prevent overflow
    svg.append("defs").append("clipPath").attr("id","line-clip")
      .append("rect").attr("width",iW).attr("height",iH);

    const g = svg.append("g").attr("transform",`translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleLinear().domain(d3.extent(data,d=>d.year)).range([0,iW]);
    const yd = fullYDomain || [0, d3.max(data, d=>d.avg)*1.1];
    const y  = d3.scaleLinear().domain(yd).range([iH,0]).nice();

    // Grid
    g.append("g").attr("class","grid").call(d3.axisLeft(y).tickSize(-iW).tickFormat(""));

    // Axes
    g.append("g").attr("class","axis").attr("transform",`translate(0,${iH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(Math.min(data.length,12)));
    g.append("g").attr("class","axis")
      .call(d3.axisLeft(y).ticks(6).tickFormat(d=>`$${d}`));

    // Axis labels
    g.append("text").attr("class","axis-label")
      .attr("x",iW/2).attr("y",iH+44).attr("text-anchor","middle").text("Year");
    g.append("text").attr("class","axis-label")
      .attr("transform","rotate(-90)").attr("x",-iH/2).attr("y",-56)
      .attr("text-anchor","middle").text("Price ($ per megawatt hour)");

    const clip = g.append("g").attr("clip-path","url(#line-clip)");

    // State lines (faint)
    STATE_KEYS.forEach(k => {
      const lineGen = d3.line().x(d=>x(d.year)).y(d=>y(d[k])).defined(d=>d[k]!=null);
      clip.append("path").datum(data)
        .attr("fill","none").attr("stroke",STATE_COLORS[k])
        .attr("stroke-width",1).attr("opacity",.3)
        .attr("d",lineGen);
    });

    // Average area + line
    const area = d3.area().x(d=>x(d.year)).y0(iH).y1(d=>y(d.avg));
    clip.append("path").datum(data).attr("fill","var(--accent)").attr("opacity",.12).attr("d",area);

    const lineGen = d3.line().x(d=>x(d.year)).y(d=>y(d.avg));
    clip.append("path").datum(data)
      .attr("fill","none").attr("stroke","var(--accent)").attr("stroke-width",2.5).attr("d",lineGen);

    // Hover dots
    const tooltip = window._dashTooltip;
    clip.selectAll(".dot-line").data(data).join("circle")
      .attr("class","dot-line")
      .attr("cx",d=>x(d.year)).attr("cy",d=>y(d.avg))
      .attr("r",4).attr("fill","var(--accent)").attr("stroke","#fff").attr("stroke-width",1.5)
      .on("mouseover",(event,d)=>{
        tooltip.style("opacity",1).html(
          `<strong>${d.year}</strong>` +
          `Avg: $${d.avg}/MWh<br>` +
          STATE_KEYS.filter(k=>d[k]).map(k=>`${k} $${d[k]}`).join(" &middot; ")
        );
      })
      .on("mousemove",e=>tooltip.style("left",(e.pageX+12)+"px").style("top",(e.pageY-28)+"px"))
      .on("mouseout",()=>tooltip.style("opacity",0));

    // "Average" end label
    const last = data[data.length-1];
    if (last) {
      svg.append("text").attr("x",MARGIN.left+x(last.year)+6).attr("y",MARGIN.top+y(last.avg))
        .attr("fill","var(--accent)").attr("font-size","11px").attr("dominant-baseline","middle")
        .text("Average");
    }

    // State colour legend — small strip top-right
    const lx0 = MARGIN.left + iW - STATE_KEYS.length*28 + 4;
    STATE_KEYS.forEach((k,i) => {
      svg.append("line")
        .attr("x1",lx0+i*28).attr("x2",lx0+i*28+18)
        .attr("y1",MARGIN.top+8).attr("y2",MARGIN.top+8)
        .attr("stroke",STATE_COLORS[k]).attr("stroke-width",1.5).attr("opacity",.6);
      svg.append("text")
        .attr("x",lx0+i*28+9).attr("y",MARGIN.top+20)
        .attr("text-anchor","middle").attr("font-size","9px").attr("fill","var(--ink-muted)")
        .text(k);
    });

    // Year range meta
    const lo = data[0]?.year, hi = data[data.length-1]?.year;
    document.getElementById("line-meta").textContent =
      lo && hi ? `${lo}–${hi}` : "";
  }
})();