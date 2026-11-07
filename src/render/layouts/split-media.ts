import type {FlexBlockType} from '../flex-blocks.js';
import {firstKind, renderBlock} from './primitives.js';
import type {LayoutDefinition} from './types.js';

export const splitMediaLayout: LayoutDefinition = {
  id: 'split-media',
  label: 'Chia đôi · Nội dung + media',
  group: 'media',
  variants: ['media-left', 'media-right', 'media-top'],
  defaultVariant: 'media-right',
  accepts: ['heading', 'body', 'bullets', 'media', 'callout', 'tags', 'source'],
  slots: {
    heading: {accepts: ['heading'], max: 1},
    copy: {accepts: ['body', 'bullets'], min: 1, max: 2},
    media: {accepts: ['media'], min: 1, max: 1},
    aside: {accepts: ['callout', 'tags'], max: 2},
    source: {accepts: ['source'], max: 1},
  },
  budget: {maxBlocks: 6, maxChars: 360, maxItems: 6},
  mediaSlots: 1,
  defaultMotion: 'dynamic',
  motionOptions: ['calm', 'editorial', 'dynamic', 'kinetic', 'tech', 'cinematic'],
  motionByKind: {heading: 'mask-wipe', body: 'fade-rise', bullets: 'card-stack', media: 'blur-focus', callout: 'scale-pop', tags: 'fade-rise', source: 'fade-rise'},
  affinity: ['news', 'review', 'repo', 'tutorial'],
  sample: {
    template: 'flex',
    layout: 'split-media',
    variant: 'media-right',
    blocks: [
      {kind: 'heading', text: 'Giao diện mới', eyebrow: 'TỪ NGUỒN'},
      {kind: 'bullets', items: [
        {text: 'Bố cục rõ ràng hơn'},
        {text: 'Thao tác trên một màn hình'},
        {text: 'Vẫn giữ dữ liệu gốc'},
      ]},
      {kind: 'media', caption: 'Ảnh minh họa từ tài liệu', fit: 'contain'},
      {kind: 'source', label: 'Nguồn', value: 'Tài liệu dự án'},
    ],
  },
  render(ctx) {
    const blocks = ctx.blocks;
    const heading = firstKind(blocks, 'heading');
    const media = firstKind(blocks, 'media');
    const copy = blocks.filter((block): block is Extract<FlexBlockType, {kind: 'body' | 'bullets'}> => block.kind === 'body' || block.kind === 'bullets');
    const aside = blocks.filter(block => block.kind === 'callout' || block.kind === 'tags');
    const source = firstKind(blocks, 'source');
    const head = heading ? renderBlock(heading, ctx, blocks.indexOf(heading)) : '';
    const copyHtml = copy.map(block => renderBlock(block, ctx, blocks.indexOf(block))).join('');
    const mediaHtml = media ? `<div class="flex-split-media" data-slot="media">${renderBlock(media, ctx, blocks.indexOf(media))}</div>` : '';
    const asideHtml = aside.length ? `<div class="flex-split-aside">${aside.map(block => renderBlock(block, ctx, blocks.indexOf(block))).join('')}</div>` : '';
    const sourceHtml = source ? `<footer class="flex-layout-footer">${renderBlock(source, ctx, blocks.indexOf(source))}</footer>` : '';
    return `<div class="flex-layout-inner flex-variant-${ctx.variant}">
      ${head}
      <div class="flex-split-grid">
        <div class="flex-split-copy" data-slot="copy">${copyHtml}${asideHtml}</div>
        ${mediaHtml}
      </div>
      ${sourceHtml}
    </div>`;
  },
};
