import matrix from '../../data/matrix.json';
import corpus from '../../data/corpus.json';
import * as d3 from 'd3';

const names = corpus.map((i, d) => i['author']);
console.log(names);

const height = 720;
const width = height;
const innerRadius = Math.min(width, height) * 0.5 - 20;
const outerRadius = innerRadius + 6;
//const color = d3.scaleOrdinal(names, d3.schemeCategory10);
const scale = d3.scaleOrdinal(corpus.map(d=>d.author),corpus.map((d,i) => {
  return i*(1.0/(corpus.length-1.0))
}))
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
  .attr('viewBox', [-width / 2, -height / 2, width, height])
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
    .classed('chord', true)
    .attr('d', ribbon)
    .attr('fill', d => d3.interpolateTurbo(scale(names[d.target.index])))
    .style('mix-blend-mode', 'multiply');

  const chordPaths = d3.selectAll('.chord');
  chordPaths.on('mouseover', function (event, d) {
    const [xpos, ypos] = alert_coords(event);
    chordPaths.attr('fill', '#d3d3d3');
    d3.select(this).attr('fill', d => d3.interpolateTurbo(scale(names[d.target.index])));
    tgrp.attr('transform', (d, i) => `translate(${xpos},${ypos})`);
    tgrp
      .select('rect')
      .attr('opacity',1)
      .attr('x', -110)
      .attr('y', -15)
      .attr('height', '20px')
      .attr('width', '220px')
      .attr('fill', 'white')
      .attr('stroke', 'gray')
      .attr('stroke-width', 0.5);
    tgrp
      .select('text')
      .attr('opacity',1)
      .attr('x', 0)
      .attr('y', -2.5)
      .attr('text-anchor', 'start')
      .attr('font-family', 'sans-serif')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', 'black')
      .text(
        `${names[d.source.index]} cites ${names[d.target.index]} ${
          d.source.value
        } times`,
      );
  });

chordPaths.on('mouseout',function (event, d) {
    d3.select(this).attr('fill', d => d3.interpolateTurbo(scale(names[d.target.index])));//color(names[d.target.index]));
    chordPaths.attr('fill', d => d3.interpolateTurbo(scale(names[d.target.index])));//color(names[d.target.index]));
    tgrp.select('rect').attr('opacity',0);
    tgrp.select('text').attr('opacity',0);
});

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
        .attr('fill', d => d3.interpolateTurbo(scale(names[d.index])))//color(names[d.index]))
        .attr('stroke', '#fff'),
    )
    .call(g =>
      g
        .append('text')
        .attr('dy', -3)
        .append('textPath')
        .attr('xlink:href', '#' + textId)
        .attr(
          'startOffset',
          d => ((d.startAngle + d.endAngle) / 2) * outerRadius,
        )
        .text(d => names[d.index]),
    );

    const tgrp = svg.append('g').attr('id', 'tooltip');
    tgrp.append('rect');
    tgrp.append('text');
  
}
drawChords();

var pt = svg.node().createSVGPoint(); // Created once for document

function alert_coords(evt) {
  pt.x = evt.clientX;
  pt.y = evt.clientY;

  // The cursor point, translated into svg coordinates
  var cursorpt = pt.matrixTransform(svg.node().getScreenCTM().inverse());
  return [cursorpt.x, cursorpt.y];
}
