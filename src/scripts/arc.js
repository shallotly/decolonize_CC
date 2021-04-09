import corpus from '../../data/corpus.json';
import links from '../../data/chordData.json';

import * as d3 from 'd3';

const names = corpus.map((i, d) => i['author']);
const nodes = names.map((d, i) => {
  let sourceLinks = [];
  let targetLinks = [];
  for (let i = 0; i < links.length; i++) {
    if (links[i].source == d) {
      sourceLinks.push(links[i]);
    }
    if (links[i].target == d) {
      targetLinks.push(links[i]);
    }
  }
  return {
    name: d,
    sourceLinks: sourceLinks,
    targetLinks: targetLinks,
  };
});

const graph = { nodes: nodes, links: links };
let selected = graph.nodes.map(d => d.name);
// set the dimensions and margins of the graph
const margin = { top: 20, right: 30, bottom: 20, left: 60 },
  width = 300 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

const color = d3.scaleOrdinal(names, d3.schemeCategory10);
// append the svg object to the body of the page
var svg = d3
  .select('.arc-chart')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// A linear scale to position the nodes on the X axis
const y = d3.scalePoint(
  graph.nodes.map(d => d.name),
  [margin.top, height - margin.bottom],
);

const label = svg
  .append('g')
  .attr('font-family', 'sans-serif')
  .attr('font-size', 10)
  .attr('text-anchor', 'end')
  .selectAll('g')
  .data(graph.nodes)
  .join('g')
  .attr('transform', d => `translate(${margin.left},${(d.y = y(d.name))})`)
  .call(g =>
    g
      .append('text')
      .attr('x', -6)
      .attr('dy', '0.35em')
      .attr('fill', 'black') // d => d3.lab(color(d.group)).darker(2))
      .text(d => d.name),
  );

const path = svg
  .insert('g', '*')
  .attr('fill', 'none')
  .attr('stroke-opacity', 0.6)
  .attr('stroke-width', 1.5)
  .selectAll('path')
  .data(graph.links)
  .join('path')
  .attr('d', arc);

function update(selection) {
  label.call(g =>
    g
      .append('circle')
      .attr('r', 5)
      .attr('fill', d => {
        if (selection.includes(d.name)) {
          return color(d.name);
        } else return '#333';
      })
      .on('click',(event, d) => {
        if (selection.includes(d.name)){
          selection.pop(d.name)
        } else {
          selection.push(d.name)
        }
        update(selection)
      })
  );

  path.attr('stroke', d => {
    if (selection.includes(d.target)) {
      return color(d.target);
    } else return '#333';
  });
}

update(selected);

function arc(d) {
  const y1 = y(d.source);
  const y2 = y(d.target);
  const r = Math.abs(y2 - y1) / 2;
  return `M${margin.left},${y1}A${r},${r} 0,0,${y1 < y2 ? 1 : 0} ${
    margin.left
  },${y2}`;
}
