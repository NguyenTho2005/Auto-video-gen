import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {ScriptSchema} from './script-schema.js';
import {composeHtml} from './html-composer.js';
import {FLEX_CATALOG} from './layout-catalog.js';
import {LAYOUTS,layoutCatalog,validateFlexData} from './layouts/registry.js';
import {MOTION_PRESETS,MOTION_RECIPES,motionPreset} from './motion/presets.js';
import {packVariables} from './style-packs.js';
import {sceneBlocks,resolveBlockTiming,FLEX_TIMING_PROFILE} from './reference-design.js';
import type {CaptionCue} from '../captions/types.js';

const readJson=async(path:string)=>JSON.parse(await readFile(path,'utf8'));

async function composeFixture() {
  const script=ScriptSchema.parse(await readJson('tests/fixtures/flex-script.json'));
  const html=composeHtml({
    script,
    sceneAudio:script.scenes.map(scene=>({id:scene.id,durationSec:4})),
    gapSec:0,
    bgImageRelPath:null,
    audioRelPath:'voice.mp3',
  });
  return {script,html};
}

describe('flex layout registry',()=>{
  it('parses the flex fixture, validates every layout and generates the catalogue',async()=>{
    const script=ScriptSchema.parse(await readJson('tests/fixtures/flex-script.json'));
    const flexScenes=script.scenes.filter(scene=>scene.templateData.template==='flex');
    expect(script.schemaVersion).toBe(3);
    expect(flexScenes).toHaveLength(4);
    for(const scene of flexScenes){
      if(scene.templateData.template!=='flex')throw new Error('unreachable');
      const validated=validateFlexData(scene.templateData);
      expect(validated.layout.id).toBe(scene.templateData.layout);
      expect(validated.variant).toBe(scene.templateData.variant);
    }
    expect(LAYOUTS.map(layout=>layout.id)).toEqual(['metric-grid','quote-card','timeline','split-media']);
    expect(FLEX_CATALOG).toHaveLength(LAYOUTS.length);
    expect(FLEX_CATALOG.map(entry=>entry.id)).toContain('flex-quote-card');
    expect(layoutCatalog()[0]).toMatchObject({id:'metric-grid',mediaSlots:0});
  });

  it('rejects unknown variants, unsupported blocks and over-budget content',()=>{
    const base={template:'flex' as const,layout:'metric-grid',variant:'cards',blocks:[
      {kind:'heading' as const,text:'Số liệu'},
      {kind:'metric' as const,value:'1',label:'Một'},
      {kind:'metric' as const,value:'2',label:'Hai'},
    ]};
    expect(()=>validateFlexData({...base,variant:'missing'})).toThrow(/Biến thể/);
    expect(()=>validateFlexData({...base,blocks:[...base.blocks,{kind:'quote',text:'Không thuộc layout'}]})).toThrow(/không nhận block/);
    expect(()=>validateFlexData({...base,blocks:[
      ...base.blocks,
      {kind:'metric',value:'3',label:'Ba'},
      {kind:'metric',value:'4',label:'Bốn'},
      {kind:'metric',value:'5',label:'Năm'},
    ]})).toThrow(/tối đa/);
    expect(()=>validateFlexData({...base,blocks:[
      {...base.blocks[0],id:'same'},
      {...base.blocks[1],id:'same'},
      base.blocks[2],
    ]})).toThrow(/trùng/);
  });
});

describe('flex rendering',()=>{
  it('renders registry layouts with design tokens, timing attributes and motion recipes',async()=>{
    const {html}=await composeFixture();
    expect(html).toContain('has-flex');
    expect(html).toContain('flex-scene');
    expect(html).toContain('data-flex-layout="metric-grid"');
    expect(html).toContain('data-variant="spotlight"');
    expect(html).toContain('data-density="balanced"');
    expect(html).toContain('data-skin="hud"');
    expect(html).toContain('--tpl-accent:');
    expect(html).toContain('id="motion-config"');
    expect(html).toContain('data-motion="counter"');
    expect(html).toContain('data-block-kind="heading"');
    expect(html).toContain('data-reveal-at="1.800"');
    const flexChunk=html.slice(html.indexOf('id="scene-body-metrics"'),html.indexOf('id="scene-body-timeline"'));
    expect(flexChunk).toContain('data-reveal-duration="0.3"');
    expect(flexChunk).not.toContain('data-reveal-duration="0.42"');
    expect(html).toContain('data-block-id="steps"');
    expect(html).toContain('data-timing-basis="manual"');
    expect(html).toContain('flex-layout-quote-card');
    expect(html).toContain('flex-layout-split-media');
    expect(html).toContain('flex-layout-timeline');
  });

  it('lets scene.design override the flex variant and rejects unknown ones',async()=>{
    const script=ScriptSchema.parse(await readJson('tests/fixtures/flex-script.json'));
    const metrics=script.scenes.find(scene=>scene.templateData.template==='flex'&&scene.templateData.layout==='metric-grid');
    if(!metrics)throw new Error('missing metric scene');
    metrics.design={...metrics.design,variant:'compact'};
    const html=composeHtml({script,sceneAudio:script.scenes.map(scene=>({id:scene.id,durationSec:4})),gapSec:0,bgImageRelPath:null,audioRelPath:'voice.mp3'});
    expect(html).toContain('data-variant="compact"');
    expect(html).toContain('flex-variant-compact');
    metrics.design={...metrics.design,variant:'not-a-variant'};
    expect(()=>composeHtml({script,sceneAudio:script.scenes.map(scene=>({id:scene.id,durationSec:4})),gapSec:0,bgImageRelPath:null,audioRelPath:'voice.mp3'})).toThrow(/Biến thể/);
  });

  it('resolves one flex reveal per narration cue instead of dumping later blocks together',async()=>{
    const script=ScriptSchema.parse(await readJson('tests/fixtures/flex-script.json'));
    const scene=script.scenes.find(item=>item.templateData.template==='flex'&&item.templateData.layout==='metric-grid');
    if(!scene)throw new Error('missing metric scene');
    const cues:CaptionCue[]=[0,0.8,1.6,2.4,3.2].map((offset,index)=>({
      id:index+1,
      startMs:(10+offset)*1000,
      endMs:(10+offset+.7)*1000,
      startSec:10+offset,
      endSec:10+offset+.7,
      text:`cue ${index+1}`,
      words:[],
      accuracy:'high',
    }));
    const blocks=sceneBlocks(scene).filter(block=>block.selector==='flex-block');
    expect(blocks).toHaveLength(5);
    const times=blocks.map((block,index)=>resolveBlockTiming(scene,block,index,10,4,cues,FLEX_TIMING_PROFILE));
    expect(times.map(item=>Number(item.atSec.toFixed(2)))).toEqual([0.04,0.76,1.56,2.36,3.16]);
    expect(times.every(item=>item.basis==='estimated')).toBe(true);
  });

  it('escapes block text and never injects HTML from the LLM',async()=>{
    const script=ScriptSchema.parse(await readJson('tests/fixtures/flex-script.json'));
    const flex=script.scenes.find(scene=>scene.templateData.template==='flex');
    if(!flex||flex.templateData.template!=='flex')throw new Error('missing flex scene');
    flex.templateData.blocks[0]={kind:'heading',text:'<img src=x onerror=alert(1)>',eyebrow:'<b>NHÃN</b>'};
    const html=composeHtml({script,sceneAudio:script.scenes.map(scene=>({id:scene.id,durationSec:4})),gapSec:0,bgImageRelPath:null,audioRelPath:'voice.mp3'});
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;NHÃN&lt;/b&gt;');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
  });

  it('keeps legacy fixtures on the old renderer without flex CSS or motion config',async()=>{
    for(const fixture of ['tests/fixtures/sample-script-no-image.json','tests/fixtures/studio-explainer.json','tests/fixtures/studio-dynamic.json']){
      const script=ScriptSchema.parse(await readJson(fixture));
      const html=composeHtml({script,sceneAudio:script.scenes.map(scene=>({id:scene.id,durationSec:2})),gapSec:0,bgImageRelPath:null,audioRelPath:'voice.mp3'});
      expect(html,fixture).not.toContain('has-flex');
      expect(html,fixture).not.toContain('flex-scene');
      expect(html,fixture).not.toContain('id="motion-config"');
    }
  });
});

describe('flex design system',()=>{
  it('emits backward-compatible pack variables plus layout tokens',()=>{
    const vars=packVariables('hud');
    expect(vars).toContain('--pack-bg:');
    expect(vars).toContain('--pack-accent:');
    expect(vars).toContain('--tpl-bg:');
    expect(vars).toContain('--tpl-border:');
    expect(vars).toContain('--tpl-accent-soft:');
  });

  it('keeps motion presets and recipes serialisable and deterministic',()=>{
    expect(Object.keys(MOTION_PRESETS)).toHaveLength(7);
    expect(Object.keys(MOTION_RECIPES)).toHaveLength(10);
    expect(JSON.parse(JSON.stringify({MOTION_PRESETS,MOTION_RECIPES}))).toEqual({MOTION_PRESETS,MOTION_RECIPES});
    expect(motionPreset('not-a-preset')).toBe(MOTION_PRESETS.editorial);
    for(const preset of Object.values(MOTION_PRESETS)){
      expect(preset.duration).toBeGreaterThan(0);
      expect(preset.exitRatio).toBeGreaterThan(0);
      expect(Number.isFinite(preset.stagger)).toBe(true);
    }
  });
});
