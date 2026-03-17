const svg = d3.select("#pie")
  .append("svg")
  .attr("viewBox", "0 0 400 400")
  .append("g")
  .attr("transform", "translate(200,200)");

d3.csv("data/pie.csv", d => ({
  type: d.type,
  value: +d.value
})).then(data => {

  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc()
    .innerRadius(80)
    .outerRadius(150);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  svg.selectAll("path")
    .data(pie(data))
    .join("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.type));
});