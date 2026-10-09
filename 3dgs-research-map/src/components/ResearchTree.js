import * as d3 from 'd3';
import { categories } from '../data/categories.js';
import { papers } from '../data/papers.js';

const ROOT = papers[0];
const allBranchIds = new Set(categories.map(c => c.id));

export class ResearchTree {
  constructor(container, { onPaper, onCategory }) {
    this.container = container;
    this.onPaper = onPaper;
    this.onCategory = onCategory;
    this.expandedCategories = new Set();
    this.expandedSubcategories = new Set();
    this.filters = { query: '', category: '', year: '', status: '' };
    this.reading = {};
    this.selectedPaper = null;
    this.learningPath = false;
    this.svg = d3.select(container).append('svg').attr('class', 'tree-svg').attr('role', 'img').attr('aria-label', '3D Gaussian Splatting 研究方向交互树');
    this.viewport = this.svg.append('g').attr('class', 'viewport');
    this.links = this.viewport.append('g').attr('class', 'links');
    this.nodes = this.viewport.append('g').attr('class', 'nodes');
    this.zoom = d3.zoom().scaleExtent([0.15, 3.5]).on('zoom', event => this.viewport.attr('transform', event.transform));
    this.svg.call(this.zoom).on('dblclick.zoom', null);
    this.svg.on('click', () => this.onPaper(null));
    this.resizeObserver = new ResizeObserver(() => this.fitView(false));
    this.resizeObserver.observe(container);
    this.render(false);
    requestAnimationFrame(() => this.fitView(false));
  }

  setReading(reading) { this.reading = reading; this.render(false); }
  setSelected(id) { this.selectedPaper = id; this.render(false); }
  setFilters(filters) {
    this.filters = filters;
    if (this.isFiltered()) {
      for (const c of categories) this.expandedCategories.add(c.id);
      for (const c of categories) for (const s of c.subcategories) this.expandedSubcategories.add(`${c.id}:${s.id}`);
    }
    this.render(true);
  }
  isFiltered() { return Object.values(this.filters).some(Boolean); }
  matchingPapers() {
    const f = this.filters;
    const q = f.query.trim().toLocaleLowerCase();
    return papers.slice(1).filter(p =>
      (!f.category || p.primaryCategory === f.category) &&
      (!f.year || String(p.year) === String(f.year)) &&
      (!f.status || (this.reading[p.id]?.status || 'unread') === f.status) &&
      (!q || [p.title, p.shortName, p.venue, p.problem, p.idea, ...p.tags].join(' ').toLocaleLowerCase().includes(q))
    );
  }
  toggleCategory(id) {
    if (this.expandedCategories.has(id)) this.expandedCategories.delete(id); else this.expandedCategories.add(id);
    this.render(true);
  }
  toggleSubcategory(id) {
    if (this.expandedSubcategories.has(id)) this.expandedSubcategories.delete(id); else this.expandedSubcategories.add(id);
    this.render(true);
  }
  expandCategory(id) {
    this.expandedCategories.add(id);
    const c = categories.find(item => item.id === id);
    for (const s of c.subcategories) this.expandedSubcategories.add(`${id}:${s.id}`);
    this.render(true);
  }
  collapseAll() { this.expandedCategories.clear(); this.expandedSubcategories.clear(); this.render(true); }
  showAll() {
    for (const id of allBranchIds) this.expandedCategories.add(id);
    for (const c of categories) for (const s of c.subcategories) this.expandedSubcategories.add(`${c.id}:${s.id}`);
    this.render(true);
  }
  setLearningPath(value) {
    this.learningPath = value;
    if (value) {
      this.expandCategory('efficient'); this.expandCategory('dynamic'); this.expandCategory('slam');
    } else this.render(false);
  }

  buildSide(side, visiblePapers) {
    const filtered = this.isFiltered();
    const selected = new Set(visiblePapers.map(p => p.id));
    const members = categories.filter(c => c.side === side && (!filtered || visiblePapers.some(p => p.primaryCategory === c.id)));
    const raw = { id: `side-${side}`, type: 'side', children: members.map(c => {
      const subs = c.subcategories.map(s => {
        const items = papers.filter(p => p.primaryCategory === c.id && p.subcategory === s.id && (!filtered || selected.has(p.id)));
        return items.length ? { id: `${c.id}:${s.id}`, type: 'subcategory', category: c, subcategory: s, children: this.expandedSubcategories.has(`${c.id}:${s.id}`) ? items.map(p => ({ id: p.id, type: 'paper', category: c, paper: p })) : [] } : null;
      }).filter(Boolean);
      return { id: c.id, type: 'category', category: c, children: this.expandedCategories.has(c.id) ? subs : [] };
    }) };
    const root = d3.hierarchy(raw);
    d3.tree().nodeSize([63, 275]).separation((a, b) => a.parent === b.parent ? 1.16 : 1.55)(root);
    const nodes = root.descendants().filter(d => d.depth > 0).map(d => ({ ...d.data, x: (side === 'left' ? -1 : 1) * d.y, y: d.x, depth: d.depth, side }));
    const links = root.links().filter(l => l.target.depth > 0).map(l => ({
      id: l.target.data.id,
      source: { x: (side === 'left' ? -1 : 1) * l.source.y, y: l.source.x },
      target: { x: (side === 'left' ? -1 : 1) * l.target.y, y: l.target.x },
      color: l.target.data.category?.color || '#9cadbe',
      type: l.target.data.type
    }));
    return { nodes, links };
  }

  render(fit = false) {
    const matches = this.matchingPapers();
    const sides = ['left', 'right'].map(side => this.buildSide(side, matches));
    const data = [{ id: ROOT.id, type: 'root', paper: ROOT, x: 0, y: 0 }, ...sides.flatMap(d => d.nodes)];
    const links = sides.flatMap(d => d.links);
    const path = d => {
      const mx = (d.source.x + d.target.x) / 2;
      return `M${d.source.x},${d.source.y} C${mx},${d.source.y} ${mx},${d.target.y} ${d.target.x},${d.target.y}`;
    };
    this.links.selectAll('path').data(links, d => d.id).join(
      enter => enter.append('path').attr('class', 'tree-link').attr('d', path).attr('stroke', d => d.color).attr('opacity', 0).call(s => s.transition().duration(240).attr('opacity', .34)),
      update => update.call(s => s.transition().duration(240).attr('d', path).attr('stroke', d => d.color).attr('opacity', .34)),
      exit => exit.remove()
    );
    const node = this.nodes.selectAll('g.tree-node').data(data, d => d.id).join(
      enter => {
        const g = enter.append('g').attr('class', d => `tree-node ${d.type}`).attr('transform', d => `translate(${d.x},${d.y})`).attr('opacity', 0);
        g.append('rect'); g.append('circle').attr('class', 'node-dot');
        g.append('text').attr('class', 'node-label');
        g.append('text').attr('class', 'node-meta');
        g.transition().duration(240).attr('opacity', 1);
        return g;
      },
      update => update.call(s => s.transition().duration(240).attr('transform', d => `translate(${d.x},${d.y})`).attr('opacity', 1)),
      exit => exit.remove()
    );
    node.attr('class', d => `tree-node ${d.type}${d.id === this.selectedPaper ? ' selected' : ''}${this.learningPath && ['3dgs-2023', 'faster-gs-2026', '4d-gs-2024'].includes(d.id) ? ' learning' : ''}`)
      .attr('data-category', d => d.category?.id || '')
      .style('--node-color', d => d.category?.color || '#335a82')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (d.type === 'root' || d.type === 'paper') this.onPaper(d.paper.id);
        if (d.type === 'category') { this.toggleCategory(d.id); this.onCategory(d.category); }
        if (d.type === 'subcategory') this.toggleSubcategory(d.id);
      });
    node.select('rect').attr('x', d => d.type === 'root' ? -142 : d.type === 'category' ? -111 : d.type === 'subcategory' ? -103 : -94)
      .attr('y', d => d.type === 'root' ? -46 : d.type === 'category' ? -34 : d.type === 'subcategory' ? -26 : -24)
      .attr('width', d => d.type === 'root' ? 284 : d.type === 'category' ? 222 : d.type === 'subcategory' ? 206 : 188)
      .attr('height', d => d.type === 'root' ? 92 : d.type === 'category' ? 68 : d.type === 'subcategory' ? 52 : 48)
      .attr('rx', d => d.type === 'root' ? 18 : 10);
    node.select('.node-dot').attr('display', d => d.type === 'category' ? null : 'none')
      .attr('cx', d => d.type === 'category' ? (d.side === 'left' ? 100 : -100) : 0)
      .attr('cy', 0).attr('r', 3.5);
    node.select('.node-label').attr('text-anchor', 'middle').attr('y', d => d.type === 'root' ? -5 : d.type === 'category' ? -4 : d.type === 'subcategory' ? 5 : 5)
      .text(d => d.type === 'root' ? '3D Gaussian Splatting' : d.type === 'category' ? d.category.label : d.type === 'subcategory' ? d.subcategory.label : `${d.paper.shortName} · ${d.paper.year}`);
    node.select('.node-meta').attr('text-anchor', 'middle').attr('y', d => d.type === 'root' ? 21 : d.type === 'category' ? 18 : 0)
      .text(d => d.type === 'root' ? 'RESEARCH LANDSCAPE  /  2023—2026' : d.type === 'category' ? `${d.category.english.split(' ').slice(0, 3).join(' ')}  ·  ${this.expandedCategories.has(d.id) ? '−' : '+'}` : '');
    if (fit) window.setTimeout(() => this.fitView(true), 270);
  }

  fitView(animate = true) {
    const box = this.viewport.node().getBBox();
    const width = this.container.clientWidth, height = this.container.clientHeight;
    if (!box.width || !width || !height) return;
    const padX = Math.min(90, width * .09), padY = Math.min(80, height * .12);
    const scale = Math.min(1.25, (width - padX * 2) / box.width, (height - padY * 2) / box.height);
    const tx = width / 2 - scale * (box.x + box.width / 2);
    const ty = height / 2 - scale * (box.y + box.height / 2);
    const t = d3.zoomIdentity.translate(tx, ty).scale(scale);
    (animate ? this.svg.transition().duration(350) : this.svg).call(this.zoom.transform, t);
  }
  zoomBy(factor) { this.svg.transition().duration(180).call(this.zoom.scaleBy, factor); }
  panBy(dx, dy) { this.svg.transition().duration(150).call(this.zoom.translateBy, dx, dy); }

  async exportPng(width = 1920, height = 1080) {
    await document.fonts.ready;
    const box = this.viewport.node().getBBox();
    const scale = Math.min((width - 150) / box.width, (height - 200) / box.height);
    const tx = (width - box.width * scale) / 2 - box.x * scale;
    const ty = 130 + (height - 185 - box.height * scale) / 2 - box.y * scale;
    const clone = this.viewport.node().cloneNode(true);
    clone.removeAttribute('transform');
    clone.setAttribute('transform', `translate(${tx} ${ty}) scale(${scale})`);
    clone.querySelectorAll('*').forEach(el => { if (el.hasAttribute('style')) el.removeAttribute('style'); });
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrapper.setAttribute('width', width); wrapper.setAttribute('height', height);
    wrapper.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `.tree-link{fill:none;stroke-width:1.5;opacity:.4}.tree-node rect{stroke-width:1.5}.root rect{fill:#234e77;stroke:#234e77}.root .node-label{fill:white;font:700 19px Arial,'Microsoft YaHei',sans-serif}.root .node-meta{fill:#cfe0ef;font:600 10px Arial,sans-serif;letter-spacing:2px}.category rect{fill:#f5f8fb;stroke:#9eb4c9}.category .node-label{fill:#20394f;font:700 14px Arial,'Microsoft YaHei',sans-serif}.category .node-meta{fill:#71869a;font:10px Arial,sans-serif}.subcategory rect{fill:white;stroke:#cbd6df}.subcategory .node-label{fill:#31485c;font:12px Arial,'Microsoft YaHei',sans-serif}.paper rect{fill:white;stroke:#cbd6df}.paper .node-label{fill:#344f65;font:12px Arial,'Microsoft YaHei',sans-serif}.node-dot{fill:#6e97b5}.selected rect,.learning rect{stroke:#183f65;stroke-width:3}${categories.map(c => `.tree-node[data-category="${c.id}"] rect{stroke:${c.color}}.tree-node[data-category="${c.id}"] .node-dot{fill:${c.color}}`).join('')}`;
    wrapper.append(style);
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', width); bg.setAttribute('height', height); bg.setAttribute('fill', '#f8fafc'); wrapper.append(bg);
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', 76); title.setAttribute('y', 68); title.setAttribute('fill', '#203b55');
    title.setAttribute('font-family', "Arial,'Microsoft YaHei',sans-serif"); title.setAttribute('font-size', 30); title.setAttribute('font-weight', 700);
    title.textContent = '3DGS Research Landscape'; wrapper.append(title);
    const subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subtitle.setAttribute('x', 78); subtitle.setAttribute('y', 99); subtitle.setAttribute('fill', '#71869a');
    subtitle.setAttribute('font-family', "Arial,'Microsoft YaHei',sans-serif"); subtitle.setAttribute('font-size', 17);
    subtitle.textContent = '3D Gaussian Splatting 研究方向图谱  ·  种子文献'; wrapper.append(subtitle);
    wrapper.append(clone);
    const svgBlob = new Blob([new XMLSerializer().serializeToString(wrapper)], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    try {
      const img = new Image(); img.src = svgUrl; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d'); context.drawImage(img, 0, 0);
      const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!pngBlob) throw new Error('PNG 编码失败');
      const pngUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement('a'); a.href = pngUrl; a.download = `3dgs-research-landscape-${width}x${height}.png`; a.click();
      window.setTimeout(() => URL.revokeObjectURL(pngUrl), 30000);
      return pngBlob;
    } finally { URL.revokeObjectURL(svgUrl); }
  }
}
