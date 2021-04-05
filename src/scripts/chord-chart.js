import matrix from '../../data/matrix.json';
import corpus from '../../data/corpus.json';
import * as d3 from 'd3';

const names = corpus.map((i, d) => i['author']);
console.log(names);

const height = 720;
const width = height;
const innerRadius = Math.min(width, height) * 0.5 - 20;
const outerRadius = innerRadius + 6;
const color = d3.scaleOrdinal(names, d3.schemeCategory10);
const ribbon = d3
  .ribbonArrow()
  .radius(innerRadius - 0.5)
  .padAngle(1 / innerRadius);
const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
const chord = d3
  .chordDirected()
  .padAngle(12 / innerRadius)
  .sortSubgroups(d3.descending)
  .sortChords(d3.descending);

const svg = d3
  .select('.chord-chart')
  .append('svg')
  .attr("viewBox", [-width / 2, -height / 2, width, height])
  .attr('height', height)
  .attr('width', width);

function drawChords() {
  const chords = chord(matrix);

  const textId = 'jason';

  svg
    .append('path')
    .attr('id', textId)
    .attr('fill', 'none')
    .attr('d', d3.arc()({ outerRadius, startAngle: 0, endAngle: 2 * Math.PI }));

  svg
    .append('g')
    .attr('fill-opacity', 0.75)
    .selectAll('g')
    .data(chords)
    .join('path')
    .attr('d', ribbon)
    .attr('fill', d => color(names[d.target.index]))
    .style('mix-blend-mode', 'multiply');

  svg
    .append('g')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .selectAll('g')
    .data(chords.groups)
    .join('g')
    .call(g =>
      g
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color(names[d.index]))
        .attr('stroke', '#fff'),
    )
    .call(g =>
      g
        .append('text')
        .attr('dy', -3)
        .append('textPath')
        .attr('xlink:href', '#'+textId)
        .attr('startOffset', d => (d.startAngle + d.endAngle) / 2 * outerRadius)
        .text(d => names[d.index]),
    );
}
drawChords();
