/**
 * Motion tokens shared by the server (HTML contract) and the client timeline.
 *
 * These objects are serialisable on purpose: `composeHtml` embeds them as JSON
 * so `animations.js` and the server cannot drift apart.
 */

export const MOTION_PRESET_IDS = [
  'calm',
  'editorial',
  'dynamic',
  'kinetic',
  'cinematic',
  'tech',
  'playful',
] as const;

export type MotionPresetId = typeof MOTION_PRESET_IDS[number];

export const MOTION_RECIPE_IDS = [
  'fade-rise',
  'mask-wipe',
  'scale-pop',
  'blur-focus',
  'slide-split',
  'word-cascade',
  'card-stack',
  'line-draw',
  'pulse',
  'counter',
] as const;

export type MotionRecipeId = typeof MOTION_RECIPE_IDS[number];

export interface MotionPreset {
  /** Base entrance duration in seconds. */
  duration: number;
  /** Base travel distance in px. */
  distance: number;
  /** Stagger between sibling blocks. */
  stagger: number;
  /** GSAP-compatible easing string. */
  ease: string;
  /** Scale used by pop recipes. */
  scaleFrom: number;
  /** Rotation used by playful recipes, in degrees. */
  rotateFrom: number;
  /** Whether ambient background motion is enabled. */
  ambient: boolean;
  /** Exit duration as a fraction of scene duration, capped by exitMax. */
  exitRatio: number;
  exitMax: number;
}

export const MOTION_PRESETS: Record<MotionPresetId, MotionPreset> = {
  calm: {duration: .42, distance: 18, stagger: .11, ease: 'power2.out', scaleFrom: .97, rotateFrom: 0, ambient: false, exitRatio: .06, exitMax: .18},
  editorial: {duration: .3, distance: 16, stagger: .08, ease: 'power2.out', scaleFrom: .98, rotateFrom: 0, ambient: false, exitRatio: .05, exitMax: .16},
  dynamic: {duration: .34, distance: 34, stagger: .06, ease: 'back.out(1.2)', scaleFrom: .92, rotateFrom: 2, ambient: true, exitRatio: .07, exitMax: .22},
  kinetic: {duration: .22, distance: 48, stagger: .045, ease: 'power4.out', scaleFrom: .88, rotateFrom: 4, ambient: true, exitRatio: .05, exitMax: .16},
  cinematic: {duration: .58, distance: 26, stagger: .12, ease: 'power3.out', scaleFrom: .94, rotateFrom: 0, ambient: true, exitRatio: .1, exitMax: .32},
  tech: {duration: .28, distance: 22, stagger: .05, ease: 'power2.out', scaleFrom: .95, rotateFrom: 1, ambient: true, exitRatio: .05, exitMax: .18},
  playful: {duration: .4, distance: 30, stagger: .07, ease: 'back.out(1.7)', scaleFrom: .84, rotateFrom: 6, ambient: false, exitRatio: .06, exitMax: .2},
};

export interface MotionRecipe {
  id: MotionRecipeId;
  /** How the client should build the tween. */
  kind: 'rise' | 'wipe' | 'scale' | 'blur' | 'slide' | 'cascade' | 'draw' | 'pulse' | 'counter';
  /** Multiplier applied to the preset duration. */
  durationFactor: number;
  /** Extra delay in seconds, applied after the block's revealAt. */
  offset: number;
}

export const MOTION_RECIPES: Record<MotionRecipeId, MotionRecipe> = {
  'fade-rise': {id: 'fade-rise', kind: 'rise', durationFactor: 1, offset: 0},
  'mask-wipe': {id: 'mask-wipe', kind: 'wipe', durationFactor: 1.1, offset: 0},
  'scale-pop': {id: 'scale-pop', kind: 'scale', durationFactor: .95, offset: 0},
  'blur-focus': {id: 'blur-focus', kind: 'blur', durationFactor: 1.15, offset: 0},
  'slide-split': {id: 'slide-split', kind: 'slide', durationFactor: 1, offset: 0},
  'word-cascade': {id: 'word-cascade', kind: 'cascade', durationFactor: .9, offset: 0},
  'card-stack': {id: 'card-stack', kind: 'rise', durationFactor: 1.1, offset: .02},
  'line-draw': {id: 'line-draw', kind: 'draw', durationFactor: 1.4, offset: 0},
  'pulse': {id: 'pulse', kind: 'pulse', durationFactor: 1.2, offset: 0},
  'counter': {id: 'counter', kind: 'counter', durationFactor: 1.2, offset: 0},
};

export const DEFAULT_MOTION_PRESET: MotionPresetId = 'editorial';

export function motionPreset(id?: string | null): MotionPreset {
  return MOTION_PRESETS[(id && id in MOTION_PRESETS ? id : DEFAULT_MOTION_PRESET) as MotionPresetId];
}
