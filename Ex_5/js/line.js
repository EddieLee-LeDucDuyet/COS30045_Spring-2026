/**
 * line.js — Australian wholesale electricity spot prices
 *
 * Subscribes to DASH so it redraws when the year range filter changes.
 * Individual state lines shown faintly; bold average line highlighted.
 */

(function () {
  const CONTAINER = "#line-chart";
  const MARGIN = { top: 20, right: 50, bottom: 70, left: 68 };

  const STATE_COLORS = { QLD:"#b5956a", NSW:"#8aab8a", VIC:"#7a9ec0", SA:"#c09f7a", TAS:"#b08aaa" };
  const STATE_KEYS   = ["QLD","NSW","VIC","SA","TAS"];

  // Which state lines are currently visible — persists across redraws
  const activeStates = new Set(STATE_KEYS);

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

    // State lines — visible by default, toggled by the legend buttons
    const statePaths = {};
    STATE_KEYS.forEach(k => {
      const lineGen = d3.line().x(d=>x(d.year)).y(d=>y(d[k])).defined(d=>d[k]!=null);
      statePaths[k] = clip.append("path").datum(data)
        .attr("class", `state-line state-line-${k}`)
        .attr("fill","none")
        .attr("stroke", STATE_COLORS[k])
        .attr("stroke-width", 1.8)
        .attr("opacity", activeStates.has(k) ? 0.75 : 0)
        .attr("d", lineGen);
    });

    // Average area + line
    const area = d3.area().x(d=>x(d.year)).y0(iH).y1(d=>y(d.avg));
    clip.append("path").datum(data).attr("fill","var(--accent)").attr("opacity",.12).attr("d",area);

    const lineGen = d3.line().x(d=>x(d.year)).y(d=>y(d.avg));
    clip.append("path").datum(data)
      .attr("fill","none").attr("stroke","var(--accent)").attr("stroke-width",2.5).attr("d",lineGen);

    // Hover dots on average line
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
        .text("Avg");
    }

    // Clickable state legend — click to show/hide each state line
    const legendGroup = svg.append("g")
      .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top + iH + 34})`);

    // "Average" legend item (always on)
    legendGroup.append("line")
      .attr("x1",0).attr("x2",20).attr("y1",8).attr("y2",8)
      .attr("stroke","var(--accent)").attr("stroke-width",2.5);
    legendGroup.append("text")
      .attr("x",24).attr("y",12).attr("font-size","11px").attr("fill","var(--ink)")
      .text("Average");

    // State legend items — clickable toggles
    STATE_KEYS.forEach((k, i) => {
      const lx = 90 + i * 52;
      const itemG = legendGroup.append("g")
        .attr("transform", `translate(${lx},0)`)
        .style("cursor","pointer")
        .on("click", function() {
          if (activeStates.has(k)) {
            activeStates.delete(k);
          } else {
            activeStates.add(k);
          }
          const isOn = activeStates.has(k);
          // Toggle opacity on the path
          statePaths[k].attr("opacity", isOn ? 0.75 : 0);
          // Toggle visual style of this legend item
          d3.select(this).select("line").attr("opacity", isOn ? 1 : 0.25);
          d3.select(this).select("text").attr("opacity", isOn ? 1 : 0.35);
        });

      itemG.append("line")
        .attr("x1",0).attr("x2",20).attr("y1",8).attr("y2",8)
        .attr("stroke", STATE_COLORS[k]).attr("stroke-width",2)
        .attr("opacity", activeStates.has(k) ? 1 : 0.25);
      itemG.append("text")
        .attr("x",24).attr("y",12).attr("font-size","11px")
        .attr("fill", STATE_COLORS[k])
        .attr("opacity", activeStates.has(k) ? 1 : 0.35)
        .text(k);
    });

    legendGroup.append("text")
      .attr("x", 90 + STATE_KEYS.length*52 + 8).attr("y",12)
      .attr("font-size","10px").attr("fill","var(--ink-muted)").attr("font-style","italic")
      .text("(click to toggle)");

    // Year range meta label
    const lo = data[0]?.year, hi = data[data.length-1]?.year;
    document.getElementById("line-meta").textContent =
      lo && hi ? `${lo}–${hi}` : "";
  }
})();