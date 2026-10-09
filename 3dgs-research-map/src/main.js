import './styles.css';
import { categories } from './data/categories.js';
import { papers, paperById } from './data/papers.js';
import { initialReading } from './data/reading.js';
import { ResearchTree } from './components/ResearchTree.js';
import { renderPaperDetail } from './components/PaperDetail.js';
import { renderToolbar } from './components/Toolbar.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="shell">
    <header class="page-header">
      <div class="brand"><div class="brand-symbol"><span></span><span></span><span></span></div><div><div class="brand-kicker">COMPUTER VISION / RESEARCH ATLAS</div><h1>3DGS <span>Research Landscape</span></h1></div></div>
      <div class="header-right"><div class="header-stats"><strong>07</strong><span>研究方向</span><i></i><strong>23</strong><span>种子论文</span></div><button id="presentation" class="presentation-button">▣ <span>演示模式</span></button></div>
    </header>
    <div class="main-layout">
      <aside class="toolbar"></aside>
      <main class="map-panel">
        <div class="map-topbar"><div><span class="map-title">INTERACTIVE RESEARCH TREE</span><span class="map-subtitle">从基础表示到大规模场景 · 点击节点探索</span></div><div class="map-controls"><button id="zoom-out" title="缩小" aria-label="缩小">−</button><button id="zoom-in" title="放大" aria-label="放大">+</button><button id="fit-view" title="适配视图">适配视图</button></div></div>
        <div id="tree-container"></div>
        <div class="map-bottom"><div class="map-status"><span class="status-dot"></span><span id="result-count">显示 23 篇种子文献</span></div><div class="map-legend"><span>滚轮缩放</span><b>·</b><span>拖拽平移</span><b>·</b><span>点击展开</span></div></div>
        <div class="export-controls"><label for="export-size">导出分辨率</label><select id="export-size"><option value="1920">1920 × 1080</option><option value="3840">3840 × 2160</option></select><button id="export-png" class="export-button">↓ 导出 PNG</button></div>
      </main>
      <aside class="paper-detail" aria-live="polite"></aside>
      <aside class="category-detail" aria-live="polite"></aside>
    </div>
    <footer class="page-footer"><span>3D Gaussian Splatting · Research Map</span><span>文献来源见 sources.md &nbsp; / &nbsp; 信息仅用于学术讨论</span></footer>
  </div>`;

const detailElement = app.querySelector('.paper-detail');
const categoryElement = app.querySelector('.category-detail');
const reading = structuredClone(initialReading);
let selectedPaper = null;

const tree = new ResearchTree(app.querySelector('#tree-container'), {
  onPaper(id) {
    selectedPaper = id;
    tree.setSelected(id);
    categoryElement.classList.remove('is-open');
    renderPaperDetail(detailElement, id ? paperById[id] : null, reading);
  },
  onCategory(category) {
    if (detailElement.classList.contains('is-open')) return;
    categoryElement.innerHTML = `<div class="detail-top"><span class="eyebrow">DIRECTION / 研究方向</span><button class="icon-button" aria-label="关闭方向说明">×</button></div><div class="category-detail-content"><div class="category-accent" style="background:${category.color}"></div><h2>${category.label}</h2><p class="category-english">${category.english}</p><div class="detail-rule"></div><div class="detail-heading">核心科学问题</div><p>${category.question}</p><div class="detail-heading">技术分支</div><ul>${category.subcategories.map(s => `<li>${s.label}<small>${s.english}</small></li>`).join('')}</ul><div class="detail-heading">种子论文</div><p>此方向收录 ${papers.filter(p => p.primaryCategory === category.id).length} 篇种子文献。点击子方向查看论文。</p></div>`;
    categoryElement.classList.add('is-open');
    categoryElement.querySelector('button').addEventListener('click', () => categoryElement.classList.remove('is-open'));
  }
});

renderToolbar(app.querySelector('.toolbar'), {
  onFilters(filters) {
    tree.setFilters(filters);
    const count = tree.matchingPapers().length;
    app.querySelector('#result-count').textContent = filters.query || filters.category || filters.year || filters.status ? `筛选命中 ${count} 篇种子文献` : `显示 ${count} 篇种子文献`;
  },
  onCategory(id) { tree.expandCategory(id); tree.onCategory(categories.find(c => c.id === id)); },
  onCollapse() { tree.collapseAll(); categoryElement.classList.remove('is-open'); },
  onExpand() { tree.showAll(); },
  onLearningPath(value) { tree.setLearningPath(value); }
});
detailElement.addEventListener('close-paper', () => tree.onPaper(null));
app.querySelector('#fit-view').addEventListener('click', () => tree.fitView(true));
app.querySelector('#zoom-in').addEventListener('click', () => tree.zoomBy(1.25));
app.querySelector('#zoom-out').addEventListener('click', () => tree.zoomBy(.8));
app.querySelector('#export-png').addEventListener('click', async event => {
  const button = event.currentTarget; const label = button.textContent;
  button.disabled = true; button.textContent = '正在导出…';
  try { const width = Number(app.querySelector('#export-size').value); await tree.exportPng(width, width * 9 / 16); button.textContent = '✓ 导出成功'; }
  catch (error) { console.error(error); button.textContent = '导出失败，请重试'; }
  window.setTimeout(() => { button.disabled = false; button.textContent = label; }, 2400);
});

const presentationButton = app.querySelector('#presentation');
async function setPresentation(active) {
  app.classList.toggle('presentation-mode', active);
  presentationButton.querySelector('span').textContent = active ? '退出演示' : '演示模式';
  if (active) {
    try { await document.documentElement.requestFullscreen(); } catch { /* Inline presentation still works. */ }
  } else if (document.fullscreenElement) await document.exitFullscreen();
  window.setTimeout(() => tree.fitView(true), 120);
}
presentationButton.addEventListener('click', () => setPresentation(!app.classList.contains('presentation-mode')));
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && app.classList.contains('presentation-mode')) setPresentation(false); });
document.addEventListener('keydown', event => {
  const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  if (event.key === 'Escape' && app.classList.contains('presentation-mode')) setPresentation(false);
  if (!app.classList.contains('presentation-mode') || typing) return;
  if (['+', '='].includes(event.key)) { event.preventDefault(); tree.zoomBy(1.2); }
  if (event.key === '-') { event.preventDefault(); tree.zoomBy(1 / 1.2); }
  const step = 45;
  if (event.key === 'ArrowLeft') { event.preventDefault(); tree.panBy(-step, 0); }
  if (event.key === 'ArrowRight') { event.preventDefault(); tree.panBy(step, 0); }
  if (event.key === 'ArrowUp') { event.preventDefault(); tree.panBy(0, -step); }
  if (event.key === 'ArrowDown') { event.preventDefault(); tree.panBy(0, step); }
});
