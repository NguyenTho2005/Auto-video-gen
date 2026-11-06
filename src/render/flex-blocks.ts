import {z} from 'zod';

/**
 * Generic, content-first scene blocks.
 *
 * The legacy `TemplateData` union stays untouched. New layouts are composed
 * from these blocks once, then registered in `src/render/layouts/`.
 *
 * All user/LLM supplied text is rendered through the composer's escaping
 * helpers; blocks never contain raw HTML.
 */

export const FLEX_BLOCK_KINDS = [
  'heading',
  'body',
  'bullets',
  'metric',
  'steps',
  'quote',
  'compare',
  'callout',
  'media',
  'tags',
  'source',
] as const;

export type FlexBlockKind = typeof FLEX_BLOCK_KINDS[number];

export const FLEX_TONES = ['accent', 'mint', 'warn', 'violet', 'muted'] as const;
export type FlexTone = typeof FLEX_TONES[number];

const blockId = z.string().min(1).max(50).regex(/^[a-z][a-z0-9-]*$/, 'Block id chỉ gồm chữ thường, số và gạch ngang');

const base = {
  /** Stable id used by scene.blockTiming; omitted ids become block-<index>. */
  id: blockId.optional(),
  tone: z.enum(FLEX_TONES).optional(),
};

const HeadingBlock = z.object({
  ...base,
  kind: z.literal('heading'),
  text: z.string().min(1).max(80),
  eyebrow: z.string().max(30).optional(),
});

const BodyBlock = z.object({
  ...base,
  kind: z.literal('body'),
  text: z.string().min(1).max(240),
});

const BulletItem = z.object({
  text: z.string().min(1).max(60),
  tone: z.enum(FLEX_TONES).optional(),
});

const BulletsBlock = z.object({
  ...base,
  kind: z.literal('bullets'),
  items: z.array(BulletItem).min(1).max(6),
});

const MetricBlock = z.object({
  ...base,
  kind: z.literal('metric'),
  value: z.string().min(1).max(20),
  label: z.string().min(1).max(40),
  detail: z.string().max(60).optional(),
  delta: z.string().max(16).optional(),
});

const StepItem = z.object({
  label: z.string().min(1).max(28),
  detail: z.string().max(70).optional(),
  tone: z.enum(FLEX_TONES).optional(),
});

const StepsBlock = z.object({
  ...base,
  kind: z.literal('steps'),
  items: z.array(StepItem).min(2).max(5),
});

const QuoteBlock = z.object({
  ...base,
  kind: z.literal('quote'),
  text: z.string().min(1).max(180),
  author: z.string().max(40).optional(),
  role: z.string().max(50).optional(),
  source: z.string().max(60).optional(),
});

const CompareSide = z.object({
  label: z.string().min(1).max(30),
  value: z.string().min(1).max(40),
  tone: z.enum(FLEX_TONES).optional(),
});

const CompareBlock = z.object({
  ...base,
  kind: z.literal('compare'),
  left: CompareSide,
  right: CompareSide,
  winner: z.enum(['left', 'right']).optional(),
});

const CalloutBlock = z.object({
  ...base,
  kind: z.literal('callout'),
  text: z.string().min(1).max(120),
  tag: z.string().max(24).optional(),
});

const MediaBlock = z.object({
  ...base,
  kind: z.literal('media'),
  /** Uses the scene's resolved media record. A future version can target a block asset. */
  caption: z.string().max(60).optional(),
  fit: z.enum(['cover', 'contain']).default('contain'),
  alt: z.string().max(80).optional(),
});

const TagsBlock = z.object({
  ...base,
  kind: z.literal('tags'),
  items: z.array(z.string().min(1).max(24)).min(1).max(6),
});

const SourceBlock = z.object({
  ...base,
  kind: z.literal('source'),
  label: z.string().min(1).max(40),
  value: z.string().min(1).max(80),
});

export const FlexBlock = z.discriminatedUnion('kind', [
  HeadingBlock,
  BodyBlock,
  BulletsBlock,
  MetricBlock,
  StepsBlock,
  QuoteBlock,
  CompareBlock,
  CalloutBlock,
  MediaBlock,
  TagsBlock,
  SourceBlock,
]);

export type FlexBlockType = z.infer<typeof FlexBlock>;

export const FlexSceneData = z.object({
  template: z.literal('flex'),
  /** Validated against the layout registry at render time. */
  layout: z.string().min(1).max(40),
  variant: z.string().min(1).max(40).optional(),
  blocks: z.array(FlexBlock).min(1).max(10),
});

export type FlexSceneDataType = z.infer<typeof FlexSceneData>;

/** Stable block ids are the contract with scene.blockTiming. */
export function flexBlockId(block: FlexBlockType, index: number): string {
  return block.id ?? `block-${index}`;
}

/** Used for narration phrase matching and for UI labels. */
export function flexBlockText(block: FlexBlockType): string {
  switch (block.kind) {
    case 'heading': return block.text;
    case 'body': return block.text;
    case 'bullets': return block.items.map(item => item.text).join(' ');
    case 'metric': return [block.value, block.label, block.detail].filter(Boolean).join(' ');
    case 'steps': return block.items.map(item => [item.label, item.detail].filter(Boolean).join(' ')).join(' ');
    case 'quote': return [block.text, block.author, block.role].filter(Boolean).join(' ');
    case 'compare': return `${block.left.label} ${block.left.value} ${block.right.label} ${block.right.value}`;
    case 'callout': return block.text;
    case 'media': return block.caption ?? block.alt ?? 'Tư liệu minh họa';
    case 'tags': return block.items.join(' ');
    case 'source': return `${block.label} ${block.value}`;
    default: {
      const never: never = block;
      return String(never);
    }
  }
}

/** True when the block needs a resolved media record to be meaningful. */
export function isMediaBlock(block: FlexBlockType): block is Extract<FlexBlockType, {kind: 'media'}> {
  return block.kind === 'media';
}
