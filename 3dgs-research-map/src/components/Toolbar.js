import { categories } from '../data/categories.js';
import { statusLabels } from '../data/reading.js';

export function renderToolbar(element, callbacks) {
  element.innerHTML = `
    <div class="toolbar-heading"><span class="eyebrow">EXPLORE / 图谱工具</span><span class="toolbar-hint">点击方向逐层展开</span></div>
    <label class="field-label" for="search">论文 / 关键词</label>
    <div class="search-wrap"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="例如 4D、SLAM、优化…" autocomplete="off" /></div>
    <div class="filter-grid">
      <label><span class="field-label">研究方向</span><select id="filter-category"><option value="">全部方向</option>${categories.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}</select></label>
      <label><span class="field-label">年份</span><select id="filter-year"><option value="">全部年份</option><option>2023</option><option>2024</option><option>2026</option></select></label>
      <label><span class="field-label">阅读状态</span><select id="filter-status"><option value="">全部状态</option>${Object.entries(statusLabels).map(([id,label]) => `<option value="${id}">${label}</option>`).join('')}</select></label>
      <button id="reset-filters" class="text-button">重置筛选</button>
    </div>
    <div class="toolbar-divider"></div>
    <span class="field-label">快速聚焦方向</span>
    <div class="direction-list">${categories.map((c, i) => `<button type="button" class="direction-button" data-category="${c.id}"><i style="background:${c.color}"></i><span>${String(i + 1).padStart(2, '0')}</span>${c.label}<b>↗</b></button>`).join('')}</div>
    <div class="toolbar-divider"></div>
    <div class="toolbar-actions"><button id="collapse-all" class="outline-button">全部折叠</button><button id="expand-all" class="outline-button">全部展开</button></div>
    <button id="learning-path" class="learning-button">◇ &nbsp;我的学习路径</button>
    <div class="toolbar-footnote">颜色仅区分研究方向。所列为种子文献，不代表领域总量或排名。</div>`;
  const getFilters = () => ({ query: element.querySelector('#search').value, category: element.querySelector('#filter-category').value, year: element.querySelector('#filter-year').value, status: element.querySelector('#filter-status').value });
  element.querySelectorAll('input, select').forEach(input => input.addEventListener('input', () => callbacks.onFilters(getFilters())));
  element.querySelector('#reset-filters').addEventListener('click', () => { element.querySelectorAll('input, select').forEach(input => input.value = ''); callbacks.onFilters(getFilters()); });
  element.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => callbacks.onCategory(button.dataset.category)));
  element.querySelector('#collapse-all').addEventListener('click', callbacks.onCollapse);
  element.querySelector('#expand-all').addEventListener('click', callbacks.onExpand);
  element.querySelector('#learning-path').addEventListener('click', () => {
    const active = element.querySelector('#learning-path').classList.toggle('active');
    callbacks.onLearningPath(active);
  });
}
