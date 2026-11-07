import type {FlexBlockType} from '../flex-blocks.js';
import {firstKind, renderBlock} from './primitives.js';
import type {LayoutDefinition} from './types.js';

export const timelineLayout: LayoutDefinition = {
  id: 'timeline',
  label: 'Dòng thời gian · Các bước',
  group: 'explain',
  variants: ['vertical', 'horizontal', 'compact'],
  defaultVariant: 'vertical',
  accepts: ['heading', 'steps', 'body', 'source'],
  slots: {
    heading: {accepts: ['heading'], max: 1},
    steps: {accepts: ['steps'], min: 1, max: 1},
    note: {accepts: ['body'], max: 1},
    source: {accepts: ['source'], max: 1},
  },
  budget: {maxBlocks: 4, maxChars: 320, maxItems: 5},
  mediaSlots: 0,
  defaultMotion: 'tech',
  motionOptions: ['calm', 'editorial', 'tech', 'dynamic', 'kinetic'],
  motionByKind: {heading: 'mask-wipe', steps: 'card-stack', body: 'fade-rise', source: 'fade-rise'},
  affinity: ['tutorial', 'repo', 'news'],
  sample: {
    template: 'flex',
    layout: 'timeline',
    variant: 'vertical',
    blocks: [
      {kind: 'heading', text: 'Cách hoạt động', eyebrow: 'QUY TRÌNH'},
      {kind: 'steps', items: [
        {label: 'Nhận nội dung', detail: 'Đọc văn bản hoặc SRT đã duyệt'},
        {label: 'Chọn bố cục', detail: 'Khớp nội dung với layout phù hợp'},
        {label: 'Render', detail: 'Xuất video 9:16 có caption'},
      ]},
      {kind: 'source', label: 'Nguồn', value: 'Tài liệu hướng dẫn'},
    ],
  },
  render(ctx) {
    const blocks = ctx.blocks;
    const heading = firstKind(blocks, 'heading');
    const steps = firstKind(blocks, 'steps');
    const note = firstKind(blocks, 'body');
    const source = firstKind(blocks, 'source');
    const head = heading ? renderBlock(heading, ctx, blocks.indexOf(heading)) : '';
    const stepsHtml = steps ? renderBlock(steps, ctx, blocks.indexOf(steps)) : '';
    const noteHtml = note ? renderBlock(note, ctx, blocks.indexOf(note)) : '';
    const sourceHtml = source ? `<footer class="flex-layout-footer">${renderBlock(source, ctx, blocks.indexOf(source))}</footer>` : '';
    return `<div class="flex-layout-inner flex-variant-${ctx.variant}">
      ${head}
      <div class="flex-timeline" data-slot="steps">${stepsHtml}</div>
      ${noteHtml}
      ${sourceHtml}
    </div>`;
  },
};
