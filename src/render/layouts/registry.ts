import type {FlexBlockType, FlexSceneDataType} from '../flex-blocks.js';
import {flexBlockId, flexBlockText} from '../flex-blocks.js';
import {metricGridLayout} from './metric-grid.js';
import {quoteCardLayout} from './quote-card.js';
import {splitMediaLayout} from './split-media.js';
import {timelineLayout} from './timeline.js';
import type {LayoutDefinition} from './types.js';

export const LAYOUTS: readonly LayoutDefinition[] = [
  metricGridLayout,
  quoteCardLayout,
  timelineLayout,
  splitMediaLayout,
];

const LAYOUT_MAP = new Map(LAYOUTS.map(layout => [layout.id, layout]));

export function getLayout(id: string): LayoutDefinition | undefined {
  return LAYOUT_MAP.get(id);
}

export function requireLayout(id: string): LayoutDefinition {
  const layout = getLayout(id);
  if (!layout) throw new Error(`Bố cục flex không tồn tại: "${id}". Các bố cục hợp lệ: ${LAYOUTS.map(item => item.id).join(', ')}.`);
  return layout;
}

export function listLayouts(): readonly LayoutDefinition[] {
  return LAYOUTS;
}

/** Compact metadata for the editor, gallery and LLM prompt. */
export function layoutCatalog() {
  return LAYOUTS.map(layout => ({
    id: layout.id,
    label: layout.label,
    group: layout.group,
    variants: layout.variants,
    accepts: layout.accepts,
    budget: layout.budget,
    mediaSlots: layout.mediaSlots,
    defaultMotion: layout.defaultMotion,
    motionOptions: layout.motionOptions,
    affinity: layout.affinity,
    sample: layout.sample,
  }));
}

export function layoutMenu(): string {
  return LAYOUTS.map(layout => {
    const blocks = layout.accepts.join(', ');
    const variants = layout.variants.join(', ');
    return `- ${layout.id} (${layout.label}): blocks [${blocks}], variants [${variants}], tối đa ${layout.budget.maxBlocks} block`;
  }).join('\n');
}

export interface ValidatedFlexScene {
  layout: LayoutDefinition;
  variant: string;
  blocks: FlexBlockType[];
}

/**
 * Registry validation is intentionally separate from Zod: the schema accepts a
 * string layout id so new layouts can be added without changing the union.
 */
export function validateFlexData(data: FlexSceneDataType): ValidatedFlexScene {
  const layout = requireLayout(data.layout);
  const variant = data.variant ?? layout.defaultVariant;
  if (!layout.variants.includes(variant)) {
    throw new Error(`Biến thể "${variant}" không có trong bố cục "${layout.id}". Hợp lệ: ${layout.variants.join(', ')}.`);
  }
  if (data.blocks.length > layout.budget.maxBlocks) {
    throw new Error(`Bố cục "${layout.id}" nhận tối đa ${layout.budget.maxBlocks} block, nhận ${data.blocks.length}.`);
  }
  for (const block of data.blocks) {
    if (!layout.accepts.includes(block.kind)) {
      throw new Error(`Bố cục "${layout.id}" không nhận block "${block.kind}". Hợp lệ: ${layout.accepts.join(', ')}.`);
    }
  }
  for (const [slotName, slot] of Object.entries(layout.slots)) {
    const count = data.blocks.filter(block => (slot.accepts as readonly string[]).includes(block.kind)).length;
    if (slot.min !== undefined && count < slot.min) {
      throw new Error(`Bố cục "${layout.id}" cần ít nhất ${slot.min} block cho slot "${slotName}" (${slot.accepts.join(', ')}).`);
    }
    if (slot.max !== undefined && count > slot.max) {
      throw new Error(`Bố cục "${layout.id}" nhận tối đa ${slot.max} block cho slot "${slotName}", nhận ${count}.`);
    }
  }
  const totalChars = data.blocks.reduce((sum, block) => sum + flexBlockText(block).length, 0);
  if (totalChars > layout.budget.maxChars) {
    throw new Error(`Bố cục "${layout.id}" tối đa ${layout.budget.maxChars} ký tự nội dung, nhận ${totalChars}.`);
  }
  const ids = data.blocks.map((block, index) => flexBlockId(block, index));
  if (new Set(ids).size !== ids.length) throw new Error(`Bố cục "${layout.id}" có block id trùng nhau.`);
  return {layout, variant, blocks: data.blocks};
}
