import type {SceneType, Script} from '../script-schema.js';
import type {FlexBlockKind, FlexBlockType, FlexSceneDataType} from '../flex-blocks.js';
import type {MediaAssetRecord} from '../../media/media-manager.js';
import type {TiktokConfig} from '../../config.js';
import type {MotionPresetId, MotionRecipeId} from '../motion/presets.js';

export type LayoutGroup = 'opening' | 'explain' | 'data' | 'media' | 'closing';

export interface LayoutSlot {
  /** Accepted block kinds for this slot. */
  accepts: readonly FlexBlockKind[];
  min?: number;
  max?: number;
}

export interface LayoutBudget {
  maxBlocks: number;
  maxChars: number;
  maxItems: number;
}

export interface LayoutRenderContext {
  scene: SceneType;
  script: Script;
  layout: string;
  variant: string;
  blocks: FlexBlockType[];
  media?: MediaAssetRecord;
  start: number;
  duration: number;
  channelLogoPath?: string;
  tiktok: TiktokConfig;
  density: 'airy' | 'balanced' | 'dense';
  motion: MotionPresetId;
  /** Default motion recipe per block kind. */
  motionByKind: Partial<Record<FlexBlockKind, MotionRecipeId>>;
}

export interface LayoutDefinition {
  id: string;
  label: string;
  group: LayoutGroup;
  variants: readonly string[];
  defaultVariant: string;
  accepts: readonly FlexBlockKind[];
  slots: Record<string, LayoutSlot>;
  budget: LayoutBudget;
  mediaSlots: number;
  defaultMotion: MotionPresetId;
  motionOptions: readonly MotionPresetId[];
  motionByKind: Partial<Record<FlexBlockKind, MotionRecipeId>>;
  affinity: readonly ('news' | 'review' | 'tutorial' | 'repo')[];
  sample: FlexSceneDataType;
  render(ctx: LayoutRenderContext): string;
}
