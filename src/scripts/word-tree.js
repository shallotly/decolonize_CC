import corpus from '../../data/corpus.json';

import * as d3 from 'd3';

/*-------------------Data Processing---------------------*/
let head;
let root;
const color = d3.scaleOrdinal(corpus.map(d=>d.author), d3.schemeCategory10);

export function updateData(selection, searchWord) {
  const tokenized = [];
  for (let i = 0; i < corpus.length; i++) {
    if (selection.includes(corpus[i].author)) {
      corpus[i].text = corpus[i].text
        .toLowerCase()
        .replace(/(\r\n|\n|\r)/gm, ' ');
      var arr = corpus[i].text
        .replace(/[^\w\s]|_/g, function ($1) {
          return ' ' + $1 + ' ';
        })
        .replace(/[ ]+/g, ' ')
        .split(' ');
      tokenized.push(arr);
    }
  }

  let prefix = new Map();
  head = createNode(searchWord,null);
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
            let node = createNode(tokenized[i][j + k - 1],corpus[i].author);
            prefix.set(s, node);
            parent.children.push(node);
            parent = node;
          }
        }
      }
    }
  }

  traverseTree(head);
  console.log(head)
  root = d3
    .hierarchy(head)
    .sort((a, b) => b.data.children.length - a.data.children.length);
  root._x0 = 0;
  root._x1 = width; // or is it height?
  root._y0 = 0;
  root._y1 = 133.33;
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    if (!d.height) d.children = null; //&& d.data.token.length !== 7
  });

  update(root);
}

function createNode(word,author) {
  return {
    token: word,
    author: author,
    children: [],
  };
}

function traverseTree(node) {
  if (node.children.length > 1) {
    for (let i = 0; i < node.children.length; i++) {
      traverseTree(node.children[i]);
    }
  } else if (node.children.length == 1) {
    compressChild(node);
    traverseTree(node);
  } else {
    node.value = 1;
    return null;
  }
}

function compressChild(node) {
  let child = node.children.pop();
  node.token = node.token + ' ' + child.token;
  node.children = child.children;
}

/*-------------------Word Tree---------------------*/
const margin = { top: 10, right: 120, bottom: 10, left: 160 };
const width = 1000;
const height = 720;

const partition = d3
  .partition()
  .size([height - margin.top - margin.bottom, 600])
  .padding([0.5]);

const textWidths = {}; // Mapping from numChild to width of <text> element

const diagonal = d3
  .linkHorizontal()
  .x(d => d.y)
  .y(d => d.x);

const svg = d3
  .select('.word-tree')
  .append('svg')
  // .attr('viewBox', [-margin.left, -margin.top, width, dx])
  .attr('height', height)
  .attr('width', width);

const gLink = svg
  .append('g')
  .attr('fill', 'none')
  .attr('stroke', '#555')
  .attr('stroke-opacity', 0.4)
  .attr('stroke-width', 1.5)
  .attr('transform', `translate(${margin.left}, 0)`);

const gNode = svg
  .append('g')
  .attr('cursor', 'pointer')
  .attr('pointer-events', 'all')
  .attr('transform', `translate(${margin.left}, 0)`);

// When we click source, we want to set the parent's children to just source.
function update(source) {
  const duration = d3.event && d3.event.altKey ? 2500 : 250;
  const nodes = root.descendants().reverse();
  const links = root.links();

  // Compute the new tree layout.
  partition(root.sum(d => d.value));
  const transition = svg
    .transition()
    .duration(duration)
    .tween(
      'resize',
      window.ResizeObserver ? null : () => () => svg.dispatch('toggle'),
    );

  // Update the nodes…
  const node = gNode.selectAll('g').data(nodes, d => d.data.token);//d.id);

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .append('g')
    .attr('transform', d => `translate(${source.y0},${(source.x0 + source.x1) / 2})`)
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

  nodeEnter
    .append('text')
    .attr('dy', '0.31em')
    .attr('x', d => (d._children ? -6 : 6))
    .attr('text-anchor', d => (d.parent ? 'start' : 'end'))
    .attr('font-size', d => { 
      const max = 30;
      const min = (nodes.length>125) ? 7 : 12;
      let numChild = d.data.children.length;
      if ((numChild + min) > max) {
        return max + 'px';
      } else if (numChild < 2) {
        return min + 'px';
      } else return (numChild+min) + 'px';
    })
    .attr('fill', d =>(d.children ? 'black': color(d.data.author)))
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
    .attr('transform', d => `translate(${d.y0},${(d.x0 + d.x1) / 2})`)
    .attr('fill-opacity', 1)
    .attr('stroke-opacity', 1)
    .selectAll('text')
    .attr('font-size', d => {
      const max = 30;
      const min = (nodes.length>125) ? 7 : 12;
      let numChild = d.data.children.length;
      if ((numChild + min) > max) {
        return max + 'px';
      } else if (numChild < 2) {
        return min + 'px';
      } else return (numChild+min) + 'px';
    });

  // Transition exiting nodes to the parent's new position.
  const nodeExit = node.exit().remove();

  // Update the links…
  const link = gLink.selectAll('path').data(links, d => d.target.id);

  // Enter any new links at the parent's previous position.
  const linkEnter = link
    .enter()
    .append('path')
    .attr('d', (d, i) => {
      const o = {
        y: source._y0 + (source.parent ? textWidths[source.data.token] : 0),
        x: (source._x1 + source._x0) / 2,
      };
      return diagonal({
        source: o,
        target: o,
      });
    });

  // Transition links to their new position.
  link
    .merge(linkEnter)
    .transition(transition)
    .attr('d', d => {
      return diagonal({
        source: {
          y:
            d.source.y0 +
            (d.source.parent ? textWidths[d.source.data.token] : 0),
          x: (d.source.x1 + d.source.x0) / 2,
        },
        target: {
          y: d.target.y0,
          x: (d.target.x1 + d.target.x0) / 2,
        },
      });
    });

  // Transition exiting nodes to the parent's new position.
  link.exit().remove();

  // Stash the old positions for transition.
  root.eachBefore(d => {
    d._x0 = d.x0;
    d._y0 = d.y0;
    d._x1 = d.x1;
    d._y1 = d.y1;
  });
}

