import type {FlexBlockType} from '../flex-blocks.js';
import {countKind, firstKind, renderBlock} from './primitives.js';
import type {LayoutDefinition} from './types.js';

export const metricGridLayout: LayoutDefinition = {
  id: 'metric-grid',
  label: 'Lưới số liệu · KPI',
  group: 'data',
  variants: ['cards', 'spotlight', 'compact'],
  defaultVariant: 'cards',
  accepts: ['heading', 'body', 'metric', 'tags', 'source'],
  slots: {
    heading: {accepts: ['heading'], max: 1},
    body: {accepts: ['body'], max: 1},
    metrics: {accepts: ['metric'], min: 2, max: 4},
    footer: {accepts: ['tags', 'source'], max: 2},
  },
  budget: {maxBlocks: 7, maxChars: 260, maxItems: 6},
  mediaSlots: 0,
  defaultMotion: 'editorial',
  motionOptions: ['calm', 'editorial', 'dynamic', 'kinetic', 'cinematic', 'tech'],
  motionByKind: {heading: 'mask-wipe', metric: 'counter', body: 'fade-rise', tags: 'fade-rise', source: 'fade-rise'},
  affinity: ['news', 'review', 'repo', 'tutorial'],
  sample: {
    template: 'flex',
    layout: 'metric-grid',
    variant: 'cards',
    blocks: [
      {kind: 'heading', text: 'Những con số đáng chú ý', eyebrow: 'DỮ LIỆU TỪ NGUỒN'},
      {kind: 'metric', value: '82,7%', label: 'Tăng trưởng', detail: 'So với cùng kỳ', tone: 'mint'},
      {kind: 'metric', value: '3,2×', label: 'Tốc độ xử lý', detail: 'Bài kiểm thử nội bộ', tone: 'accent'},
      {kind: 'metric', value: '12', label: 'Tính năng mới', detail: 'Có trong bản cập nhật'},
      {kind: 'source', label: 'Nguồn', value: 'Tài liệu dự án'},
    ],
  },
  render(ctx) {
    const blocks = ctx.blocks;
    const heading = firstKind(blocks, 'heading');
    const body = firstKind(blocks, 'body');
    const metrics = blocks.filter((block): block is Extract<FlexBlockType, {kind: 'metric'}> => block.kind === 'metric');
    const footer = blocks.filter(block => block.kind === 'tags' || block.kind === 'source');
    const head = heading || body
      ? `<header class="flex-layout-header">
          ${heading ? renderBlock(heading, ctx, blocks.indexOf(heading)) : ''}
          ${body ? renderBlock(body, ctx, blocks.indexOf(body)) : ''}
        </header>`
      : '';
    const cards = `<div class="flex-metrics count-${metrics.length}">
      ${metrics.map(block => renderBlock(block, ctx, blocks.indexOf(block))).join('')}
    </div>`;
    const foot = footer.length
      ? `<footer class="flex-layout-footer">${footer.map(block => renderBlock(block, ctx, blocks.indexOf(block))).join('')}</footer>`
      : '';
    const variantClass = `flex-variant-${ctx.variant}`;
    return `<div class="flex-layout-inner ${variantClass}" data-metrics="${countKind(blocks, 'metric')}">${head}${cards}${foot}</div>`;
  },
};
