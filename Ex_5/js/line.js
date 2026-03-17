const svg = d3.select("#line")
  .append("svg")
  .attr("viewBox", "0 0 500 300");

d3.csv("data/line.csv", d => ({
  year: +d.year,
  price: +d.price
})).then(data => {

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([0, 500]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.price)])
    .range([300, 0]);

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.price));

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "pink")
    .attr("stroke-width", 2)
    .attr("d", line);
});