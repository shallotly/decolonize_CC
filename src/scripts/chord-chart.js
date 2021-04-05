import data from '../../data/chord-data.json';
import matrix from '../../data/matrix.json';
import corpus from '../../data/corpus.json';
import * as d3 from 'd3';

const width = 840;
const height = 840;
const innerRadius = Math.min(width, height) * 0.5 - 20
const outerRadius = innerRadius + 6
const color = d3.scaleOrdinal(names, d3.schemeCategory10)
const ribbon = d3.ribbonArrow()
    .radius(innerRadius - 0.5)
    .padAngle(1 / innerRadius)
const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)

const svg = d3.select('.chord-chart')
    .append('svg')
    .attr('height',height)
    .attr('width',width)
