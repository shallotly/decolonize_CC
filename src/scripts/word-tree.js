import corpus from '../../data/corpus.json';

import * as d3 from 'd3';

/*-------------------Data Processing---------------------*/
const searchWord = 'india';

const tokenized = [];
for (let i = 0; i < corpus.length; i++) {
  corpus[i].text = corpus[i].text.toLowerCase().replace(/(\r\n|\n|\r)/gm, ' ');
  var arr = corpus[i].text
    .replace(/[^\w\s]|_/g, function ($1) {
      return ' ' + $1 + ' ';
    })
    .replace(/[ ]+/g, ' ')
    .split(' ');
  tokenized.push(arr);
}

let prefix = new Map();
const head = createNode(searchWord);
prefix.set(searchWord, head);
let parent = head;

const len = 35;
for (let i = 0; i < tokenized.length; i++) {
  for (let j = 0; j < tokenized[i].length; j++) {
    if (tokenized[i][j] != searchWord) {
      continue;
    } else {
      for (let k = 1; k < len; k++) {
        let prf = tokenized[i].slice(j, j + k);
        let s = prf.join(' ');
        if (prefix.has(s)) {
          parent = prefix.get(s);
        } else {
          let node = createNode(tokenized[i][j + k - 1]);
          prefix.set(s, node);
          parent.children.push(node);
          parent = node;
        }
      }
    }
  }
}

function createNode(word) {
  return {
    token: word,
    children: [],
  };
}

let test = {};
test = Object.assign(test, head);

function traverseTree(node) {
  if (node.children.length > 1) {
    for (let i = 0; i < node.children.length; i++) {
      traverseTree(node.children[i]);
    }
  } else if (node.children.length == 1) {
    compressChild(node);
    traverseTree(node);
  } else {
    return null;
  }
}

function compressChild(node) {
  //if (node.children.length == 0){
  //  node.children = undefined
  //} else if(node.children.length<2 ){
  let child = node.children.pop();
  node.token = node.token + ' ' + child.token;
  node.children = child.children;
  //}
}

traverseTree(head);
console.log(head);

/*-------------------Word Tree---------------------*/
const margin = { top: 10, right: 120, bottom: 10, left: 160 };
const width = 1200;
const height = 720;
const dx = 10;
const dy = width / 10;
const tree = d3.tree().size([width, height-200]);

const textWidths = {}; // Mapping from numChild to width of <text> element

const diagonal = d3
  .linkHorizontal()
  .x(d => d.y)
  .y(d => d.x);
const root = d3.hierarchy(head);
const maxFont = 54;

root.sort((a, b) => b.data.children.length - a.data.children.length);
root.x0 = dy / 2;
root.y0 = 0;
root.descendants().forEach((d, i) => {
  //console.log(d)
  d.id = i;
  d._children = d.children;
  if (!d.height) d.children = null; //&& d.data.token.length !== 7
});

const svg = d3
  .select('.word-tree')
  .append('svg')
  .attr('viewBox', [-margin.left, -margin.top, width, dx])
  .attr('height', height)
  .attr('width', width);

const gLink = svg
  .append('g')
  .attr('fill', 'none')
  .attr('stroke', '#555')
  .attr('stroke-opacity', 0.4)
  .attr('stroke-width', 1.5);

const gNode = svg
  .append('g')
  .attr('cursor', 'pointer')
  .attr('pointer-events', 'all');

// When we click source, we want to set the parent's children to just source.
function update(source) {
  const duration = d3.event && d3.event.altKey ? 2500 : 250;
  const nodes = root.descendants().reverse();
  const links = root.links();

  // Compute the new tree layout.
  tree(root);

  let left = root;
  let right = root;
  root.eachBefore(node => {
    if (node.x < left.x) left = node;
    if (node.x > right.x) right = node;
  });

  const height = right.x - left.x + margin.top + margin.bottom;
  console.log([-margin.left, left.x - margin.top, width, height])
  const transition = svg
    .transition()
    .duration(duration)
    .attr('viewBox', [-margin.left, left.x - margin.top, width, height])
    .tween(
      'resize',
      window.ResizeObserver ? null : () => () => svg.dispatch('toggle'),
    );

  // Update the nodes…
  const node = gNode.selectAll('g').data(nodes, d => d.id);

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .append('g')
    .attr('transform', d => `translate(${source.y0},${source.x0})`)
    .attr('fill-opacity', 0)
    .attr('stroke-opacity', 0)
    .on('click', (event, d) => {
      const ancestors = d.ancestors();
      for (let i = 1; i < ancestors.length; i++) {
        ancestors[i].children = [ancestors[i - 1]];
      }
      d.children = d._children;
      update(d);
    });

  // nodeEnter
  //   .append('circle')
  //   .attr('r', 2.5)
  //   .attr('fill', d => (d._children ? '#555' : '#999'))
  //   .attr('stroke-width', 10);

  nodeEnter
    .append('text')
    .attr('dy', '0.31em')
    .attr('x', d => (d._children ? -6 : 6))
    .attr('text-anchor', d => (d.parent ? 'start' : 'end'))
    .attr('font-size', d => {
      let numChild = d.data.children.length;
      if (numChild > 15) {
        return numChild + 'px';
      } else if (numChild <= 1) {
        return '14px';
      } else {
        let size = 20 + 2 * numChild;
        return size + 'px';
      }
    })
    .text(d => d.data.token)
    .each(function (d, i) {
      textWidths[d.data.token] = this.getBoundingClientRect().width;
    })
    .clone(true)
    .lower()
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', 3)
    .attr('stroke', 'white');

  // Transition nodes to their new position.
  const nodeUpdate = node
    .merge(nodeEnter)
    .transition(transition)
    .attr('transform', d => `translate(${d.y},${d.x})`)
    .attr('fill-opacity', 1)
    .attr('stroke-opacity', 1);

  // Transition exiting nodes to the parent's new position.
  const nodeExit = node
    .exit()
    .transition(transition)
    .remove()
    .attr('transform', d => `translate(${source.y},${source.x})`)
    .attr('fill-opacity', 0)
    .attr('stroke-opacity', 0);

  // Update the links…
  const link = gLink.selectAll('path').data(links, d => d.target.id);

  // Enter any new links at the parent's previous position.
  const linkEnter = link
    .enter()
    .append('path')
    .attr('d', (d, i) => {
      const o = {
        x: source.x0,
        y: source.y0,
      };
      return diagonal({ source: o, target: o });
    });

  // Transition links to their new position.
  link
    .merge(linkEnter)
    .transition(transition)
    .attr('d', d => {
      return diagonal({
        source: {
          y: d.source.y + (d.source.parent ? textWidths[d.source.data.token] : 0),
          x: d.source.x,
        },
        target: d.target,
      });
    });

  // Transition exiting nodes to the parent's new position.
  link
    .exit()
    .transition(transition)
    .remove()
    .attr('d', d => {
      const o = { x: source.x, y: source.y };
      return diagonal({ source: o, target: o });
    });

  // Stash the old positions for transition.
  root.eachBefore(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

update(root);
