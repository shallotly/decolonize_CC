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

// set the dimensions and margins of the graph
const margin = { top: 20, right: 30, bottom: 20, left: 30 },
  width = 1000 - margin.left - margin.right,
  height = 520 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3
  .select('.arc-chart')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// A linear scale to position the nodes on the X axis
const x = d3.scalePoint().range([0, width]).domain(names);

// Add the circle for the nodes
svg
  .selectAll('.arcNodes')
  .data(graph.nodes)
  .enter()
  .append('circle')
  .attr('cx', function (d) {
    return x(d.name);
  })
  .attr('cy', height - 30)
  .attr('r', 8)
  .style('fill', '#69b3a2');

// And give them a label
svg
  .selectAll('.arcNodeLabels')
  .data(graph.nodes)
  .enter()
  .append('text')
  .attr('dx', '-.8em')
  .attr('dy', '.15em')
  .attr('transform', 'rotate(-65)')
  .attr('x', function (d) {
    return x(d.name);
  })
  .attr('y', height - 10)
  .text(function (d) {
    return d.name;
  });

// Add the links
svg
  .selectAll('arcLinks')
  .data(graph.links)
  .enter()
  .append('path')
  .attr('d', function (d) {
    //console.log(d)
    let start = x(d.source); // X position of start node on the X axis
    let end = x(d.target); // X position of end node
    return [
      'M',
      start,
      height - 30, // the arc starts at the coordinate x=start, y=height-30 (where the starting node is)
      'A', // This means we're gonna build an elliptical arc
      (start - end) / 2,
      ',', // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
      (start - end) / 2,
      0,
      0,
      ',',
      start < end ? 1 : 0,
      end,
      ',',
      height - 30,
    ] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
      .join(' ');
  })
  .style('fill', 'none')
  .attr('stroke', 'black');
