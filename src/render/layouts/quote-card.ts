import type {FlexBlockType} from '../flex-blocks.js';
import {firstKind, renderBlock} from './primitives.js';
import type {LayoutDefinition} from './types.js';

export const quoteCardLayout: LayoutDefinition = {
  id: 'quote-card',
  label: 'Trích dẫn · Thẻ nhận định',
  group: 'explain',
  variants: ['editorial', 'glass', 'split'],
  defaultVariant: 'editorial',
  accepts: ['heading', 'quote', 'body', 'media', 'source'],
  slots: {
    heading: {accepts: ['heading'], max: 1},
    quote: {accepts: ['quote'], min: 1, max: 1},
    note: {accepts: ['body'], max: 1},
    media: {accepts: ['media'], max: 1},
    source: {accepts: ['source'], max: 1},
  },
  budget: {maxBlocks: 5, maxChars: 360, maxItems: 1},
  mediaSlots: 1,
  defaultMotion: 'cinematic',
  motionOptions: ['calm', 'editorial', 'cinematic', 'dynamic', 'tech'],
  motionByKind: {heading: 'fade-rise', quote: 'blur-focus', body: 'fade-rise', media: 'scale-pop', source: 'fade-rise'},
  affinity: ['news', 'review', 'tutorial'],
  sample: {
    template: 'flex',
    layout: 'quote-card',
    variant: 'editorial',
    blocks: [
      {kind: 'heading', text: 'Điểm cốt lõi', eyebrow: 'NHẬN ĐỊNH'},
      {kind: 'quote', text: 'Công cụ chỉ hữu ích khi nội dung trên màn hình giúp người xem hiểu nhanh hơn lời đọc.', author: 'Nhóm biên tập', role: 'Ghi chú nội bộ'},
      {kind: 'body', text: 'Một câu nhận định ngắn, có nguồn hoặc được ghi rõ là ý kiến.'},
      {kind: 'source', label: 'Nguồn', value: 'Tài liệu dự án'},
    ],
  },
  render(ctx) {
    const blocks = ctx.blocks;
    const heading = firstKind(blocks, 'heading');
    const quote = firstKind(blocks, 'quote');
    const note = firstKind(blocks, 'body');
    const media = firstKind(blocks, 'media');
    const source = firstKind(blocks, 'source');
    if (!quote) return '';
    const head = heading ? renderBlock(heading, ctx, blocks.indexOf(heading)) : '';
    const quoteHtml = renderBlock(quote, ctx, blocks.indexOf(quote));
    const noteHtml = note ? renderBlock(note, ctx, blocks.indexOf(note)) : '';
    const mediaHtml = media ? `<div class="flex-quote-media" data-slot="media">${renderBlock(media, ctx, blocks.indexOf(media))}</div>` : '';
    const sourceHtml = source ? `<footer class="flex-layout-footer">${renderBlock(source, ctx, blocks.indexOf(source))}</footer>` : '';
    return `<div class="flex-layout-inner flex-variant-${ctx.variant}">
      ${head}
      <div class="flex-quote-row">
        <div class="flex-quote-copy" data-slot="quote">${quoteHtml}${noteHtml}</div>
        ${mediaHtml}
      </div>
      ${sourceHtml}
    </div>`;
  },
};
