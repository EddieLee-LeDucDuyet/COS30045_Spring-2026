const svg = d3.select("#scatter")
  .append("svg")
  .attr("viewBox", "0 0 500 300");

d3.csv("data/scatter.csv", d => ({
  rating: +d.rating,
  energy: +d.energy
})).then(data => {

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.rating))
    .range([0, 500]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.energy))
    .range([300, 0]);

  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.rating))
    .attr("cy", d => y(d.energy))
    .attr("r", 4)
    .attr("fill", "steelblue");
});