export const categories = [
  { id: 'efficient', label: '基础表示与高效优化', english: 'Efficient & Optimized Gaussian Splatting', color: '#3978C6', side: 'left', question: '如何提高 Gaussian 表示、训练和渲染效率？', subcategories: [
    { id: 'representation', label: '结构化表示', english: 'Gaussian Representation' },
    { id: 'optimization', label: '密度控制与训练优化', english: 'Densification & Optimization' },
    { id: 'rendering', label: '渲染质量与抗锯齿', english: 'Rendering Quality' },
    { id: 'compression', label: '压缩与存储', english: 'Compression' }
  ] },
  { id: 'geometry', label: '几何与表面重建', english: 'Geometry & Surface Reconstruction', color: '#329B91', side: 'left', question: '如何从 Gaussian 获得更准确、一致、可用的三维几何？', subcategories: [
    { id: 'surface', label: '表面表示', english: 'Surface Representation' },
    { id: 'regularization', label: '几何约束', english: 'Geometry Regularization' },
    { id: 'mesh', label: 'Gaussian 转网格', english: 'Gaussian-to-Mesh' }
  ] },
  { id: 'sparse', label: '少视角与泛化重建', english: 'Sparse-view & Generalizable Reconstruction', color: '#BA914A', side: 'left', question: '如何使用更少输入图像完成重建，并泛化到新场景？', subcategories: [
    { id: 'fewshot', label: '少视角场景优化', english: 'Few-shot / Sparse-view Optimization' },
    { id: 'feedforward', label: '前馈 Gaussian 预测', english: 'Feed-forward Gaussian Prediction' },
    { id: 'generalizable', label: '跨场景泛化重建', english: 'Generalizable Reconstruction' }
  ] },
  { id: 'dynamic', label: '动态与时空建模', english: 'Dynamic Scene & 4D Gaussian Splatting', color: '#9670C4', side: 'left', question: '如何表示随时间运动和变化的三维世界？', subcategories: [
    { id: 'deformation', label: '形变场', english: 'Deformation Field' },
    { id: 'temporal', label: '时间 Gaussian 表示', english: 'Temporal Gaussian Representation' },
    { id: 'tracking', label: '运动跟踪与动态建模', english: 'Motion Tracking & Dynamic Modeling' }
  ] },
  { id: 'semantic', label: '语义与语言理解', english: 'Semantic & Language Gaussian Splatting', color: '#C06E91', side: 'right', question: '如何让 Gaussian 表达对象、语义与语言信息？', subcategories: [
    { id: 'features', label: '语义特征场', english: 'Semantic Feature Fields' },
    { id: 'language', label: '开放词汇语言理解', english: 'Open-vocabulary Language Understanding' },
    { id: 'instances', label: '实例分割与分组', english: 'Instance Segmentation & Grouping' }
  ] },
  { id: 'generative', label: '生成、编辑与交互', english: 'Generative & Editable Gaussian Splatting', color: '#D48C58', side: 'right', question: '如何生成三维内容，并可控修改已有场景？', subcategories: [
    { id: 'generation', label: '文生 / 图生三维', english: 'Text-to-3D / Image-to-3D' },
    { id: 'editing', label: 'Gaussian 场景编辑', english: 'Gaussian Scene Editing' },
    { id: 'manipulation', label: '对象操作', english: 'Object Manipulation' }
  ] },
  { id: 'slam', label: '在线建图与大规模场景', english: 'SLAM & Large-scale Gaussian Splatting', color: '#508DA5', side: 'right', question: '如何支持在线定位、增量建图和大范围场景表示？', subcategories: [
    { id: 'rgbd', label: 'RGB-D Gaussian SLAM', english: 'RGB-D Gaussian SLAM' },
    { id: 'visual', label: '单目 / 视觉 Gaussian SLAM', english: 'Monocular / Visual Gaussian SLAM' },
    { id: 'large', label: '大规模重建与渲染', english: 'Large-scale Reconstruction & Rendering' }
  ] }
];

export const categoryById = Object.fromEntries(categories.map(item => [item.id, item]));
export function subcategoryFor(paper) {
  return categoryById[paper.primaryCategory]?.subcategories.find(item => item.id === paper.subcategory);
}
