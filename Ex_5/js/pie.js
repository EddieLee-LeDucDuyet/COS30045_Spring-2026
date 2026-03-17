/**
 * pie.js — Donut chart: model distribution by screen technology
 *
 * Counts models (weighted by 'count' field) from the filtered tvData.
 * Updates live whenever any TV-related filter changes.
 */

(function () {
  const CONTAINER = "#pie-chart";
  const COLOR = { LCD:"var(--c-lcd)", LED:"var(--c-led)", OLED:"var(--c-oled)" };

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

    // Aggregate by tech, weighted by count
    const groups = d3.rollup(raw, v => d3.sum(v, d=>d.count), d=>d.tech);
    const data = [...groups.entries()].map(([tech,value]) => ({tech,value}));

    if (!data.length) {
      d3.select(container).append("div").attr("class","empty-state")
        .text("No data matches the current filters.");
      return;
    }

    const W = container.clientWidth;
    const H = Math.max(260, Math.min(W, 360));
    const radius = Math.min(W,H)/2 * 0.76;
    const innerR  = radius * 0.52;

    const svg = d3.select(container).append("svg")
      .attr("viewBox",`0 0 ${W} ${H}`).attr("width",W).attr("height",H);
    const g = svg.append("g").attr("transform",`translate(${W/2},${H/2})`);

    const pie  = d3.pie().value(d=>d.value).sort(null);
    const arc  = d3.arc().innerRadius(innerR).outerRadius(radius).cornerRadius(4).padAngle(0.025);
    const arcH = d3.arc().innerRadius(innerR).outerRadius(radius+10).cornerRadius(4).padAngle(0.025);
    const labelArc = d3.arc().innerRadius(radius*1.12).outerRadius(radius*1.12);

    const total   = d3.sum(data,d=>d.value);
    const tooltip = window._dashTooltip;

    const arcs = g.selectAll(".arc-group").data(pie(data)).join("g").attr("class","arc-group");

    arcs.append("path")
      .attr("d",arc)
      .attr("fill",d=>COLOR[d.data.tech]).attr("opacity",0.88)
      .style("cursor","pointer")
      .on("mouseover",function(event,d){
        d3.select(this).attr("d",arcH).attr("opacity",1);
        tooltip.style("opacity",1)
          .html(`<strong>${d.data.tech}</strong>${d.data.value.toLocaleString()} models<br>${(d.data.value/total*100).toFixed(1)}%`);
      })
      .on("mousemove",e=>tooltip.style("left",(e.pageX+12)+"px").style("top",(e.pageY-28)+"px"))
      .on("mouseout",function(){
        d3.select(this).attr("d",arc).attr("opacity",0.88);
        tooltip.style("opacity",0);
      });

    // Percentage inside slice
    arcs.append("text")
      .attr("transform",d=>`translate(${arc.centroid(d)})`)
      .attr("text-anchor","middle").attr("dominant-baseline","middle")
      .attr("font-size","13px").attr("font-weight","600").attr("fill","#fff")
      .text(d=>{
        const pct = d.data.value/total*100;
        return pct>8 ? pct.toFixed(0)+"%" : "";
      });

    // Leader lines + labels
    arcs.each(function(d){
      const mid = (d.startAngle+d.endAngle)/2;
      const sign = mid < Math.PI ? 1 : -1;
      const elbow = [labelArc.centroid(d)[0]*1.0, labelArc.centroid(d)[1]*1.0];
      const end   = [sign*(radius*1.22), elbow[1]];

      g.append("polyline")
        .attr("points",[arc.centroid(d),elbow,end].map(p=>p.join(",")).join(" "))
        .attr("fill","none").attr("stroke","var(--border)").attr("stroke-width",1);

      g.append("text")
        .attr("x",end[0]+sign*4).attr("y",end[1])
        .attr("text-anchor",sign>0?"start":"end")
        .attr("dominant-baseline","middle")
        .attr("font-size","12px").attr("fill","var(--ink)")
        .text(d.data.tech);
    });

    // Centre total
    g.append("text").attr("text-anchor","middle").attr("y",-10)
      .attr("font-family","'DM Serif Display',serif")
      .attr("font-size","1.5rem").attr("fill","var(--ink)")
      .text(total.toLocaleString());
    g.append("text").attr("text-anchor","middle").attr("y",14)
      .attr("font-size","10px").attr("fill","var(--ink-muted)")
      .attr("letter-spacing",".08em").text("TOTAL MODELS");
  }
})();