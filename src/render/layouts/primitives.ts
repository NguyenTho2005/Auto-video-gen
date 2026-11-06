import type {FlexBlockType, FlexBlockKind, FlexTone} from '../flex-blocks.js';
import {flexBlockId} from '../flex-blocks.js';
import {sourceLabel} from '../source-label.js';
import type {MediaAssetRecord} from '../../media/media-manager.js';
import type {LayoutRenderContext} from './types.js';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/\n/g, ' ');
}

export type IconName = 'bolt' | 'quote' | 'check' | 'arrow' | 'spark' | 'play' | 'warn' | 'clock' | 'code' | 'source';

const ICONS: Record<IconName, string> = {
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7Z"/>',
  quote: '<path d="M7 7h4v10H3v-6c0-2.2 1.8-4 4-4Zm10 0h4v10h-8v-6c0-2.2 1.8-4 4-4Z"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  arrow: '<path d="M3 12h18m-6-6 6 6-6 6"/>',
  spark: '<path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4Z"/>',
  play: '<path d="m9 6 9 6-9 6Z"/>',
  warn: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v4m0 4h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-16-2 20"/>',
  source: '<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/>',
};

export function icon(name: IconName): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

export function toneClass(tone?: FlexTone): string {
  return tone ? ` flex-tone-${tone}` : '';
}

function blockMotion(block: FlexBlockType, ctx: LayoutRenderContext): string {
  return ctx.motionByKind[block.kind] ?? 'fade-rise';
}

export interface RenderBlockContext {
  ctx: LayoutRenderContext;
  index: number;
}

/** Shared wrapper: every primitive is one narration-timing block. */
function wrap(block: FlexBlockType, index: number, ctx: LayoutRenderContext, body: string, extraClass = ''): string {
  const id = flexBlockId(block, index);
  const classes = `flex-block flex-block-${block.kind}${extraClass}${toneClass(block.tone)}`;
  return `<div class="${classes}" id="flex-${escapeAttr(id)}" data-block-kind="${block.kind}" data-motion="${blockMotion(block, ctx)}">${body}</div>`;
}

function mediaMarkup(media: MediaAssetRecord | undefined, caption: string | undefined, fit: 'cover' | 'contain', alt: string): string {
  const captionHtml = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '';
  if (!media) {
    return `<figure class="flex-media flex-media-empty">${captionHtml}<div class="flex-media-placeholder">${icon('source')}<span>Chưa có tư liệu cho cảnh này</span></div></figure>`;
  }
  const fitClass = fit === 'contain' ? 'fit-contain' : 'fit-cover';
  const content = media.type === 'video'
    ? `<video class="${fitClass}" src="${escapeAttr(media.localRelPath)}" autoplay muted loop playsinline></video>`
    : `<img class="${fitClass}" src="${escapeAttr(media.localRelPath)}" alt="${escapeAttr(alt || caption || 'Tư liệu nguồn')}" />`;
  const credit = media.credit ? `<span class="flex-media-credit">${escapeHtml(sourceLabel(media.credit))}</span>` : '';
  return `<figure class="flex-media">${content}${captionHtml}${credit}</figure>`;
}

export function renderMediaFrame(
  ctx: LayoutRenderContext,
  options: {caption?: string; fit?: 'cover' | 'contain'; alt?: string} = {},
): string {
  return mediaMarkup(ctx.media, options.caption, options.fit ?? 'contain', options.alt ?? 'Tư liệu nguồn');
}

export function renderBlock(block: FlexBlockType, ctx: LayoutRenderContext, index: number): string {
  switch (block.kind) {
    case 'heading': {
      const eyebrow = block.eyebrow ? `<div class="flex-eyebrow">${escapeHtml(block.eyebrow)}</div>` : '';
      return wrap(block, index, ctx, `${eyebrow}<h2 class="flex-heading">${escapeHtml(block.text)}</h2>`);
    }
    case 'body':
      return wrap(block, index, ctx, `<p class="flex-body">${escapeHtml(block.text)}</p>`);
    case 'bullets': {
      const items = block.items.map((item, i) => `
        <li class="flex-bullet${toneClass(item.tone)}">
          <span class="flex-bullet-index">${String(i + 1).padStart(2, '0')}</span>
          <span class="flex-bullet-text">${escapeHtml(item.text)}</span>
        </li>`).join('');
      return wrap(block, index, ctx, `<ul class="flex-bullets">${items}</ul>`);
    }
    case 'metric': {
      const delta = block.delta ? `<span class="flex-metric-delta">${escapeHtml(block.delta)}</span>` : '';
      const detail = block.detail ? `<p class="flex-metric-detail">${escapeHtml(block.detail)}</p>` : '';
      return wrap(block, index, ctx, `
        <div class="flex-metric-value">${escapeHtml(block.value)}</div>
        <div class="flex-metric-label">${escapeHtml(block.label)}${delta}</div>
        ${detail}`, ' flex-card');
    }
    case 'steps': {
      const items = block.items.map((item, i) => `
        <li class="flex-step${toneClass(item.tone)}">
          <span class="flex-step-number">${String(i + 1).padStart(2, '0')}</span>
          <span class="flex-step-copy"><strong>${escapeHtml(item.label)}</strong>${item.detail ? `<small>${escapeHtml(item.detail)}</small>` : ''}</span>
        </li>`).join('');
      return wrap(block, index, ctx, `<ol class="flex-steps">${items}</ol>`);
    }
    case 'quote': {
      const attribution = [block.author, block.role].filter(Boolean).join(' · ');
      return wrap(block, index, ctx, `
        <div class="flex-quote-mark">${icon('quote')}</div>
        <blockquote class="flex-quote-text">${escapeHtml(block.text)}</blockquote>
        ${attribution ? `<div class="flex-quote-author">${escapeHtml(attribution)}</div>` : ''}
        ${block.source ? `<div class="flex-quote-source">${escapeHtml(block.source)}</div>` : ''}`, ' flex-card');
    }
    case 'compare': {
      const side = (data: typeof block.left, align: string) => `
        <div class="flex-compare-side flex-tone-${data.tone ?? (align === 'left' ? 'warn' : 'mint')}">
          <small>${escapeHtml(data.label)}</small>
          <strong>${escapeHtml(data.value)}</strong>
        </div>`;
      const winner = block.winner ? `<span class="flex-compare-winner">${block.winner === 'left' ? 'A' : 'B'}</span>` : '';
      return wrap(block, index, ctx, `<div class="flex-compare">${side(block.left, 'left')}<span class="flex-compare-vs">VS</span>${side(block.right, 'right')}${winner}</div>`, ' flex-card');
    }
    case 'callout':
      return wrap(block, index, ctx, `
        <div class="flex-callout-icon">${icon('warn')}</div>
        <div><div class="flex-callout-tag">${escapeHtml(block.tag ?? 'ĐIỂM CẦN LƯU Ý')}</div><p class="flex-callout-text">${escapeHtml(block.text)}</p></div>`, ' flex-card');
    case 'media':
      return wrap(block, index, ctx, mediaMarkup(ctx.media, block.caption, block.fit, block.alt ?? 'Tư liệu nguồn'), ' flex-media-block');
    case 'tags':
      return wrap(block, index, ctx, `<div class="flex-tags">${block.items.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>`);
    case 'source':
      return wrap(block, index, ctx, `<span class="flex-source-icon">${icon('source')}</span><span class="flex-source-label">${escapeHtml(block.label)}</span><strong class="flex-source-value">${escapeHtml(block.value)}</strong>`);
    default: {
      const never: never = block;
      throw new Error(`Unknown flex block: ${String(never)}`);
    }
  }
}

export function countKind(blocks: FlexBlockType[], kind: FlexBlockKind): number {
  return blocks.filter(block => block.kind === kind).length;
}

export function firstKind<K extends FlexBlockKind>(blocks: FlexBlockType[], kind: K): Extract<FlexBlockType, {kind: K}> | undefined {
  return blocks.find((block): block is Extract<FlexBlockType, {kind: K}> => block.kind === kind);
}
