#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname,'..');
const preview = require('../assets/configurator-preview.js');
const platforms = require('../assets/configurator-platforms.js');
const html = fs.readFileSync(path.join(root,'configurator-preview.html'),'utf8');
const original = fs.readFileSync(path.join(root,'configurator.html'),'utf8');
const section = (text,start,end) => {
  const a=text.indexOf(start), b=text.indexOf(end,a);
  assert.ok(a>=0 && b>a, 'Expected source boundaries'); return text.slice(a,b);
};
// The test page must not fork pricing, normalization, option handlers or PDF logic.
for (const [a,b] of [
  ['const configData = {','const App = () => {'],
  ['const isCategoryVisible =','      return (\n        <div className="min-h-screen'],
  ['{/* Web UI Header */}','    // Render React App to DOM']
]) assert.equal(section(html,a,b), section(original.replace(/\r\n/g,'\n'),a,b));
assert.doesNotMatch(original,/RavenForgePreview|configurator-preview\.js/);
const context=vm.createContext({RavenForgePlatforms:platforms});
vm.runInContext(section(html,'const configData = {','const App = () => {')+
  section(html,'const isCategoryVisible =','const getDefaultSelections =')+
  'this.data=configData;this.normalize=normalizeSelections;this.visible=isOptionVisible;',context);
const {data,normalize,visible}=context;
let combinations=0;
for (const [model,count,price] of [['EDDA',4,2100],['EMBLA',5,2550],['ASKR',5,3200],['GRAMR',6,2000]]) {
  assert.equal(data.models.find(m=>m.id===model).basePrice,price);
  const defaults=JSON.parse(JSON.stringify(normalize(model)));
  for (const group of data.categories) for (const option of group.options) {
    if (!visible(group.id,option.id,model,defaults)) continue;
    const selections=JSON.parse(JSON.stringify(normalize(model,{...defaults,[group.id]:option.id})));
    const before=JSON.stringify(selections);
    const state=preview.scene(model,selections,'transparent #275f89');
    for(const language of ['ko','en','de']) for(const view of ['front','back']) {
      const svg=preview.renderSvg(state,view,language);
      if(view==='back') {
        assert.match(svg,/data-side="back"/); assert.match(svg,/data-layer="rear-body"/); assert.doesNotMatch(svg,/data-layer="(?:strings|pickups|frets)"/);
        assert.doesNotMatch(svg,/NaN|undefined|<script|onerror=/);
        const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
        assert.equal(new Set(ids).size,ids.length,'SVG filter and clip IDs must never collide');
        assert.match(svg,/data-neck-joint="bolt-on"/);
        if(model!=='EDDA')assert.match(svg,/data-layer="rear-joint-seam"/);
        if(model==='GRAMR'){assert.match(svg,/data-pattern="2-2-1"/);assert.match(svg,/data-placement="spec-schematic"/);assert.doesNotMatch(svg,/data-layer="rear-joint-pending"/);}
        if(['ASKR','EMBLA'].includes(model))assert.match(svg,/data-placement="pdf-centres"/);
        if(model==='EDDA')assert.match(svg,/data-placement="concept-only"/);
        continue;
      }
      assert.match(svg,new RegExp(`data-layer="strings" data-count="${count}"`));
      assert.doesNotMatch(svg,/NaN|undefined|<script|onerror=/);
      if(selections.fret_type==='fretless' && selections.fretline!=='line_yes') assert.doesNotMatch(svg,/data-layer="frets"/);
      else assert.match(svg,/data-layer="frets" data-count="24"/);
    }
    assert.equal(JSON.stringify(selections),before);
    combinations++;
  }
  const base=preview.scene(model,defaults,'');
  for(const oldView of ['body','neck','head']) assert.equal(preview.renderSvg(base,oldView,'en','portrait'),preview.renderSvg(base,'front','en','portrait'),'Legacy zoom requests cannot enlarge the image');
  const oval=preview.scene(model,{...defaults,inlay_type:'inlay_oval',inlay_oval_mat:'oval_wood',inlay_dot_pos:'pos_custom'},'');
  assert.match(preview.renderSvg(oval,'front','en'),/data-inlay-design="ravenforge-oval"/,'Oval ignores stale dot-only position state');
  {
    if(model==='GRAMR')assert.ok(base.g.back.provenance.maxJoinGapPDFPoints<.05);
    if(['EMBLA','ASKR'].includes(model)){
      assert.equal(base.g.back.bolts.length,5);
      const rearSvg=preview.renderSvg(base,'back','en');
      const neck=rearSvg.split('data-layer="rear-neck"')[1].split('data-layer="rear-headstock"')[0];
      assert.match(neck,/data-part="detachable-neck"/);
      assert.match(neck,/-neck-grain/);
      assert.doesNotMatch(neck,/fill="url\(#[^"]+(?<!neck)-grain\)"/);
      assert.match(neck,/clip-path="url\(#[^"]+-neck-clip\)"/);
      assert.ok(base.g.back.provenance.maxBodyJoinGap<.5);
      assert.ok(base.g.back.provenance.maxCavityJoinGap<.1);
    }
    const cap=preview.scene(model,{...defaults,top_type:'cap',top_wood_selection:model==='GRAMR'?'guitar_top_walnut':'walnut'},'');
    assert.equal(preview.renderSvg(cap,'back','en'),preview.renderSvg(base,'back','en'),'Front top does not recolour the rear');
  }
  const opaque=preview.scene(model,defaults,'solid #112233');
  assert.notEqual(preview.renderSvg(base,'full','en'),preview.renderSvg(opaque,'full','en'));
  assert.equal(opaque.finish.colour,'#112233');
  const opaqueSvg=preview.renderSvg(opaque,'body','en');
  // Material pixels may never be spatially blurred in opaque mode. Relief uses
  // SourceAlpha only, which changes lighting without averaging source RGB.
  for(const match of opaqueSvg.matchAll(/<feGaussianBlur[^>]*>/g)) assert.match(match[0],/in="SourceAlpha"/);
  if(model==='GRAMR'){
    assert.equal(base.g.kind,'drawing');assert.equal(base.g.frets.length,24);assert.equal(base.g.tuners.length,6);
    assert.ok(base.g.provenance.maxBodyJoinGapPDFPoints<.05);
    assert.ok(base.g.provenance.maxHeadJoinGapPDFPoints<.05);
    assert.match(opaqueSvg,/data-contour="pdf-vector"/);
    const body=opaqueSvg.split('data-layer="body"')[1].split('data-layer="finish"')[0];
    assert.doesNotMatch(body,/<image /,'Opaque drawing body fully covers the wood texture');
    assert.doesNotMatch(opaqueSvg,/gramr-superstrat-24f\.png/,'Old concept cannot determine the drawing silhouette');
  }
  const retained=preview.scene(model,{...defaults,pickups:'others'},'');
  assert.ok(retained.pending.includes('pickups'));
  assert.match(preview.renderSvg(retained,'full','en'),/data-appearance="(?:reference-retained|drawing-envelope)"/);
  assert.match(preview.renderSvg(base,'body','en'),/<image href="[^"]+\.(?:png|webp)"/);
  assert.match(preview.renderSvg(base,'full','en','portrait'),/data-layout="portrait"/);
  assert.match(preview.renderSvg(base,'full','en'),/data-layout="landscape"/);
  const exotic=preview.scene(model,{...defaults,top_type:'cap',top_wood_selection:'unverified_custom'},'');
  assert.equal(exotic.bodyColour,null);
  assert.ok(exotic.pending.includes('top_wood_selection'));
}
const nova=preview.scene('ASKR',normalize('ASKR',{hardware_bridge:'nova_parts',hardware_color:'hw_gold'}),'');
assert.equal(nova.bridgeColour,'#33383d');assert.equal(nova.metal,'#c9a75c');
assert.equal(preview.scene('GRAMR',normalize('GRAMR'),'').g.strings,6);
assert.equal(normalize('GRAMR',{hardware_bridge:'payson',nut_material:'nut_brass'}).hardware_bridge,'guitar_gotoh_510t');
assert.equal(normalize('GRAMR',{nut_material:'nut_brass'}).nut_material,'guitar_bone_nut');
for(const value of ['transparent blue','투명 블루','transparent blau']) assert.equal(preview.parseColour(value).colour,'#275f89');
for(const value of ['solid black','불투명 블랙','deckend schwarz']) assert.equal(preview.parseColour(value).opaque,true);
for(const value of ['blue top, red back','top blue','<script>alert(1)</script>','url(https://example.com)','red and green']) assert.equal(preview.parseColour(value).status,'unmapped');
const attack=preview.renderSvg(preview.scene('EDDA',normalize('EDDA'),'',{pickups:'<script>"&'}),'full','en');
assert.doesNotMatch(attack,/<script>/); assert.match(attack,/&lt;script&gt;/);
for(const language of ['ko','en','de']) assert.deepEqual(Object.keys(preview.copy[language]).sort(),Object.keys(preview.copy.en).sort());
console.log(`PASS: ${combinations} allowed option substitutions × 3 languages × front/back; pricing/PDF source parity, safe fallbacks, Nova exception and model constraints`);

for(let i=1;i<=4;i++) {
 const example=fs.readFileSync(path.join(root,`assets/configurator-bindrune/c${i}.svg`),'utf8');
 assert.match(example,/original layout example/);assert.doesNotMatch(example,/<script|<image|http(?!:\/\/www.w3.org)/);
}
assert.doesNotMatch(fs.readFileSync(path.join(root,'assets/configurator-preview.js'),'utf8'),/data-preview-view/);

// Every named wood resolves to a texture; only unspecified/custom materials remain pending.
const materials=require('../assets/configurator-materials.js');
const unknownWoods=new Set(['others','wing_others','other_burl_exotic','guitar_body_custom','guitar_top_other_burl_exotic']);
for(const id of ['fretboard','body_wood_single','body_core_wood','body_wing_wood','top_wood_selection']){
  for(const opt of data.categories.find(c=>c.id===id).options){
    assert.equal(!!materials.get(opt.id),!unknownWoods.has(opt.id),'Wood mapping: '+opt.id);
    if(materials.get(opt.id))assert.ok(fs.existsSync(path.join(root,materials.get(opt.id).source)));
  }
}
assert.equal(materials.get('ironwood').id,'ironwood');
assert.notEqual(materials.get('ironwood').index,materials.get('bog_oak').index);
for(const model of ['EDDA','EMBLA','ASKR','GRAMR']){
  const base=JSON.parse(JSON.stringify(normalize(model)));
  const selected={...base,inlay_type:'inlay_custom',inlay_custom_spec:'custom_bindrune'};
  const images=['c1','c2','c3','c4'].map(id=>preview.renderSvg(preview.scene(model,selected,'',{},id),'front','en','portrait'));
  assert.equal(new Set(images).size,4);
  for(let i=0;i<4;i++)assert.match(images[i],new RegExp('data-example="c'+(i+1)+'"'));
  assert.doesNotMatch(preview.renderSvg(preview.scene(model,{...selected,inlay_type:'inlay_none'},'',{},'c4'),'front','en'),/data-layer="bindrune-inlay"/);
  assert.doesNotMatch(preview.renderSvg(preview.scene(model,selected,'',{},'c4'),'back','en'),/data-layer="bindrune-inlay"/);
  const a=preview.renderSvg(preview.scene(model,base,''),'front','en','portrait');
  const b=preview.renderSvg(preview.scene(model,{...base,orientation:'left_hand'},''),'front','en','portrait');
  assert.notEqual(a,b);assert.match(b,/scale\(-1 1\)/);
}
for(const bridge of ['payson','nova_parts']){
  const colours=['hw_chrome','hw_black','hw_gold','hw_vintage_copper'].map(colour=>preview.scene('ASKR',{...JSON.parse(JSON.stringify(normalize('ASKR'))),hardware_bridge:bridge,hardware_color:colour},'').bridgeColour);
  assert.equal(new Set(colours).size,1,'ASKR bridge finish must not follow hardware colour');
}
console.log('PASS: named wood coverage, C1–C4 inlays/reset/rear exclusion, handedness and both ASKR fixed bridge finishes');
// v9: display-only pieces, part substitution and extras; never mutate quote state.
const parts=require('../assets/configurator-parts-renderer.js');
for(const model of ['EDDA','EMBLA','ASKR','GRAMR']){
  const d=JSON.parse(JSON.stringify(normalize(model))),extras={specialOptions:['kill_switch','dual_tone'],pickguard:'ivory'},before=JSON.stringify([d,extras]);
  const front=preview.renderSvg(preview.scene(model,d,'transparent #9d282b',{},null,extras),'front','en');
  assert.match(front,/data-layer="pickguard" data-option="ivory"/);
  assert.match(front,/data-control-type="kill"/);
  const back=preview.renderSvg(preview.scene(model,d,'',{},null,extras),'back','en');
  assert.doesNotMatch(back,/data-layer="(?:pickguard|control-options|finger-ramp)"/);
  assert.equal(JSON.stringify([d,extras]),before,'Read-only selections and special options');
  for(const [id,count] of model==='GRAMR'?[['guitar_body_1pc',1],['guitar_body_2pc',2],['guitar_body_3pc',3]]:[['1pc_solid',1],['3pc_solid',3]]){
    const state=preview.scene(model,{...d,body_construction:id},'');
    assert.match(preview.renderSvg(state,'back','en'),new RegExp(`data-layer="body-pieces" data-option="${id}" data-count="${count}"`));
    assert.doesNotMatch(preview.renderSvg(preview.scene(model,{...d,body_construction:id,color_back_side:'back_gloss'},'solid #9d282b'),'back','en'),/data-layer="body-pieces"/,'Opaque conceals glue joins');
  }
  if(model!=='GRAMR'){
    const picked={...d,pickups:{EDDA:'häussel_triple',EMBLA:'delano_ts',ASKR:'askr_delano_sbc5_e'}[model],electronics:'glockenklang',coil_switch:'coil_2_ps',finger_ramp:'ramp_wood'};
    const state=preview.scene(model,picked,'',{},null,extras),svg=preview.renderSvg(state,'front','en');
    assert.match(svg,/data-family="(?:triple|square-poles|soapbar)"/);assert.match(svg,/data-layer="finger-ramp"/);
    const controls=parts.controlPlan(state);assert.equal(controls.filter(x=>x.type==='toggle').length,model==='EDDA'?0:2);
    assert.equal(new Set(controls.map(x=>x.xy.join(','))).size,controls.length,'Controls never share or add holes');
    for(const id of ['emg','fishman'])assert.equal(parts.controlPlan(preview.scene(model,{...picked,pickups:id},'',{},null,extras)).filter(x=>x.type==='toggle').length,0);
    assert.doesNotMatch(preview.renderSvg(preview.scene(model,{...picked,pickup_configuration:'pickup_3'},''),'front','en'),/data-layer="finger-ramp"/);
  }
}
for(const model of ['EMBLA','ASKR']){
  const d={...JSON.parse(JSON.stringify(normalize(model))),pickup_configuration:'pickup_3'};
  const svg=preview.renderSvg(preview.scene(model,d,''),'front','en');
  assert.match(svg,/data-count="3" data-appearance="illustrative-family" data-placement="proposed-three-pickup"/);
  // Existing production restrictions remain: the preview does not unlock it.
  assert.equal(normalize(model,d).pickup_configuration,'pickup_2');
}
console.log('PASS: body joins, existing-position controls, pickup families, ramp exclusion and read-only extras');

assert.ok(preview.scene('EMBLA',{...normalize('EMBLA'),pickups:'häussel_bar'},'').pending.includes('pickups'),'Custom BassBar housing cannot be inferred from the product family name');
