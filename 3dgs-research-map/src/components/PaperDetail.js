import { categoryById, subcategoryFor } from '../data/categories.js';
import { statusLabels } from '../data/reading.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const link = (url, label) => url ? `<a class="detail-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>` : '';

export function renderPaperDetail(element, paper, reading) {
  if (!paper) { element.classList.remove('is-open'); element.innerHTML = ''; return; }
  const category = categoryById[paper.primaryCategory];
  const sub = subcategoryFor(paper);
  const personal = reading[paper.id] || { status: 'unread', note: '' };
  element.classList.add('is-open');
  element.innerHTML = `
    <div class="detail-top"><span class="eyebrow">PAPER NOTE / 文献详情</span><button class="icon-button close-detail" aria-label="关闭论文详情">×</button></div>
    <div class="detail-scroll">
      <div class="detail-year">${paper.year} <span>·</span> ${escapeHtml(paper.venue)}</div>
      <h2>${escapeHtml(paper.title)}</h2>
      <div class="detail-short">${escapeHtml(paper.shortName)}</div>
      <div class="detail-rule"></div>
      <div class="detail-section"><div class="detail-heading">研究定位</div><p>${category ? `<span class="category-mark" style="background:${category.color}"></span>${escapeHtml(category.label)} <span class="muted">/ ${escapeHtml(sub?.label || '')}</span>` : '3DGS 奠基论文'}</p></div>
      <div class="detail-section"><div class="detail-heading">研究问题</div><p>${escapeHtml(paper.problem || '待补充')}</p></div>
      <div class="detail-section"><div class="detail-heading">核心思想</div><p>${escapeHtml(paper.idea || '待补充')}</p></div>
      <div class="detail-section"><div class="detail-heading">关键技术</div><div class="tags">${paper.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div></div>
      ${paper.relatedDirections.length ? `<div class="detail-section"><div class="detail-heading">交叉方向</div><p>${paper.relatedDirections.map(id => escapeHtml(categoryById[id]?.label || id)).join('、')}</p></div>` : ''}
      <div class="detail-section"><div class="detail-heading">我的阅读状态</div><p><span class="status-pill">${escapeHtml(statusLabels[personal.status] || statusLabels.unread)}</span>${personal.note ? ` <span class="personal-note">${escapeHtml(personal.note)}</span>` : ''}</p></div>
      <div class="detail-actions">${link(paper.paperUrl, '打开论文来源')}${link(paper.projectUrl, '官方项目')}${link(paper.codeUrl, '代码仓库')}</div>
      <p class="detail-source">来源见 sources.md · 状态：${paper.verificationStatus === 'verified' ? '已核对来源' : '待核实'}</p>
    </div>`;
  element.querySelector('.close-detail').addEventListener('click', () => element.dispatchEvent(new CustomEvent('close-paper')));
}
