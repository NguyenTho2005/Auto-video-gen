# Flex layouts: blocks, registry, tokens, motion recipes

Date: 2026-11-06 (Asia/Ho_Chi_Minh).

## Context
The reference renderer has 16 fixed templates. Each new visual idea used to
require touching the Zod union, `html-composer.ts`, CSS, `template-catalog.ts`
and tests at the same time. That made small layout changes expensive and made
the catalogue drift from the actual renderers. The goal is a content-first
layout system where new layouts are mostly data plus a render function, while
old `script.json` files keep rendering exactly as before.

## Decision
Introduce one optional `template: "flex"` scene shape and build five layers
around it.

### 1. Structured blocks
`src/render/flex-blocks.ts` defines 11 block kinds: `heading`, `body`,
`bullets`, `metric`, `steps`, `quote`, `compare`, `callout`, `media`, `tags`
and `source`. Every block has bounded text, an optional stable `id`, and an
optional `tone`. The Zod schema checks only this generic shape; it does not
know which layout will consume the block.

Block ids default to `block-<index>` and are the contract with
`scene.blockTiming`. Display text is escaped by the renderer; LLM output is
never treated as HTML.

### 2. Layout registry
`src/render/layouts/` contains a `LayoutDefinition` per layout:

- `metric-grid`: `cards`, `spotlight`, `compact`; 2–4 metrics.
- `quote-card`: `editorial`, `glass`, `split`; one quote, optional media.
- `timeline`: `vertical`, `horizontal`, `compact`; one steps block.
- `split-media`: `media-left`, `media-right`, `media-top`; copy plus media.

Each definition declares accepted block kinds, named slots with min/max,
a block/character/item budget, media slots, variants, default and allowed
motion presets, a per-kind motion recipe map, content affinity, and a sample.
`validateFlexData()` runs at render time, so adding a layout does not require
changing the schema. `FLEX_CATALOG` is generated from the registry and gives the
Studio `/templates` route ids such as `flex-metric-grid`.

### 3. Design tokens
`packVariables()` still emits the legacy `--pack-*` variables. It now also
emits `--tpl-bg`, `--tpl-fg`, `--tpl-accent`, `--tpl-second`, `--tpl-panel`,
`--tpl-muted`, plus derived border, soft-fill and shadow tokens. Border and
shadow colours are contrast-aware for dark and light packs.

`scene.design` is optional and can carry `variant`, `skin`, `motion` and
`density`. A skin reuses an existing style-pack id and applies the flex
`--tpl-*` tokens inline on that scene. Reference boards keep their fixed
reference palette, as before. Legacy scenes may carry `design.variant`; they
still render through their old renderer. Flex CSS is scoped to `.flex-scene`
and is only injected when a flex scene exists.

### 4. Motion recipes tied to narration
`src/render/motion/presets.ts` defines seven serialisable presets (`calm`,
`editorial`, `dynamic`, `kinetic`, `cinematic`, `tech`, `playful`) and ten
recipes (`fade-rise`, `mask-wipe`, `scale-pop`, `blur-focus`, `slide-split`,
`word-cascade`, `card-stack`, `line-draw`, `pulse`, `counter`). The composer
embeds both objects as JSON in `#motion-config`; `animations.js` reads the same
data instead of duplicating values.

Flex scenes use the existing narration block model. `sceneBlocks()` maps every
flex block to a stable id and text, and `decorateReferenceBlocks()` attaches
`data-block-id` / `data-reveal-at` using the narration cue timestamps (or an
explicit `scene.blockTiming` override, including `phrase` and `occurrence`).
`FLEX_TIMING_PROFILE` supplies the flex defaults. Every tween is finite and
seekable: block reveal, optional child stagger, metric counter, slow media
drift, ambient glows and one scene exit. No random values, wall-clock timers or
infinite repeats are used.

### 5. One schema addition
`template: "flex"` is one member of the existing `TemplateData` union.
`scene.design` is optional. `motionPreset` gained the new ids. Scripts emitted
with flex scenes may declare `schemaVersion: 3`; the pipeline preserves 3
instead of overwriting it with 2. No new schema is added per layout. New
layouts are data plus a renderer, registered in one place.

## Backward compatibility
- Old scripts and fixtures never contain `template: "flex"`, so they take the
  existing reference or legacy path. Flex CSS and `#motion-config` are omitted.
- Legacy body classes are unchanged: a calm reference script still emits only
  `tech-editorial reference-design`.
- `scene.design` is optional; omitting it keeps previous variant/theme/motion
  behaviour.
- All new fields are optional or have defaults. The old 16 catalogue entries
  remain in `TEMPLATE_CATALOG`; `/templates` additionally exposes
  `legacyTemplates` and `flexTemplates`.
- Schema version 1 and 2 documents still validate and render.

## Validation
- `tests/fixtures/flex-script.json` covers all four layouts, all block kinds,
  `scene.design`, manual block timing and a media scene.
- `src/render/flex-layouts.test.ts` checks registry validation, generated
  catalogue, escaping, timing attributes, motion config, token compatibility,
  deterministic presets and legacy fixtures staying flex-free.
- `npx tsc --noEmit` and `npm test` pass.
- A real pipeline render produced 1080×1920 H.264 + AAC, 60.70 s, with all
  four flex layouts visible in sampled frames.

## Alternatives rejected
- **One Zod schema per layout.** Repeats the old coupling and makes the LLM
  prompt and migration path grow with every layout.
- **Freeform x/y coordinates.** Fast for one design, but hard to validate,
  impossible to reflow and unsafe for LLM output.
- **A new Remotion/React renderer.** Would break the current HyperFrames,
  seekable GSAP timeline and the existing render/verify pipeline.
- **Server-side per-frame animation.** Would make the timeline unseekable and
  break preview scrubbing.

## Limits
Four layouts ship initially. A scene uses one layout, one optional media
record from `scene.media`, and at most 10 blocks (the block schema cap); each
layout has a smaller budget. Per-block media assets, arbitrary HTML, automatic
layout switching and freeform canvas placement are not supported.
`scene.design.skin` restyles flex scenes; reference boards keep their fixed
reference palette. Preview timing remains approximate; final reveal positions
depend on the measured voice track.
