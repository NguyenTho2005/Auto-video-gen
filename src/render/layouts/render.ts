import type {Script, SceneType} from '../script-schema.js';
import type {MediaAssetRecord} from '../../media/media-manager.js';
import type {TiktokConfig} from '../../config.js';
import {packVariables} from '../style-packs.js';
import {escapeAttr} from './primitives.js';
import {validateFlexData} from './registry.js';
import type {LayoutRenderContext} from './types.js';

export interface RenderFlexSceneArgs {
  scene: SceneType;
  script: Script;
  start: number;
  duration: number;
  media?: MediaAssetRecord;
  channelLogoPath?: string;
  tiktok: TiktokConfig;
}

/**
 * Renders a content-first flex scene. The layout registry owns structure;
 * this function only owns the scene wrapper and shared attributes.
 */
export function renderFlexScene(args: RenderFlexSceneArgs): string {
  const {scene, script, start, duration, media, channelLogoPath, tiktok} = args;
  if (scene.templateData.template !== 'flex') {
    throw new Error(`renderFlexScene chỉ nhận template "flex", nhận "${scene.templateData.template}".`);
  }
  // `scene.design.variant` is the per-scene override; `templateData.variant`
  // remains the portable default so old editors and fixtures keep working.
  const data = scene.design?.variant
    ? {...scene.templateData, variant: scene.design.variant}
    : scene.templateData;
  const {layout, variant, blocks} = validateFlexData(data);
  const density = scene.design?.density ?? 'balanced';
  const motion = scene.design?.motion ?? script.motionPreset ?? layout.defaultMotion;
  const skin = scene.design?.skin;
  const skinStyle = skin ? ` style="${escapeAttr(packVariables(skin))}"` : '';
  const skinAttr = skin ? ` data-skin="${escapeAttr(skin)}"` : '';
  const ctx: LayoutRenderContext = {
    scene,
    script,
    layout: layout.id,
    variant,
    blocks,
    media,
    start,
    duration,
    channelLogoPath,
    tiktok,
    density,
    motion,
    motionByKind: layout.motionByKind,
  };
  const inner = layout.render(ctx);
  const transType = scene.transition?.type ?? 'cut';
  const transDur = scene.transition?.duration ?? 0.3;
  return `<div class="scene clip flex-scene" id="scene-${escapeAttr(scene.id)}"
     data-start="${start.toFixed(2)}" data-duration="${duration.toFixed(2)}" data-active="0"
     data-layout="flex" data-flex-layout="${escapeAttr(layout.id)}" data-variant="${escapeAttr(variant)}"
     data-density="${escapeAttr(density)}" data-motion="${escapeAttr(motion)}" data-media="none"${skinAttr}${skinStyle}
     data-transition="${escapeAttr(transType)}" data-transition-duration="${transDur.toFixed(2)}"
     data-flex="1">
  <div class="flex-board flex-layout-${escapeAttr(layout.id)} flex-variant-${escapeAttr(variant)}" data-slot="stage">
    <div class="flex-glow" aria-hidden="true"></div>
    <div class="flex-glow flex-glow-b" aria-hidden="true"></div>
    ${inner}
  </div>
</div>`.trim();
}
