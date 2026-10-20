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
  ['{/* Web UI Header */}','                </div>\n              </div>\n']
]) assert.equal(section(html,a,b), section(original.replace(/\r\n/g,'\n'),a,b));
assert.doesNotMatch(original,/RavenForgePreview|configurator-preview\.js/);
const context=vm.createContext({RavenForgePlatforms:platforms});
vm.runInContext(section(html,'const configData = {','const App = () => {')+
  section(html,'const isCategoryVisible =','const getDefaultSelections =')+
  'this.data=configData;this.normalize=normalizeSelections;this.visible=isOptionVisible;',context);
const {data,normalize,visible}=context;
preview.configureTestOptions(data);
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
const attack=preview.renderSvg(preview.scene('EDDA',{...normalize('EDDA'),pickups:'others'},'',{pickups:'<script>"&'}),'full','en');
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
// v10: display-only pieces, source parts and additive controls; never mutate quote state.
const parts=require('../assets/configurator-parts-renderer.js');
for(const model of ['EDDA','EMBLA','ASKR','GRAMR']){
  const d=JSON.parse(JSON.stringify(normalize(model))),extras={specialOptions:['kill_switch','dual_tone'],pickguard:'ivory'},before=JSON.stringify([d,extras]);
  const front=preview.renderSvg(preview.scene(model,d,'transparent #9d282b',{},null,extras),'front','en');
  if(model==='GRAMR')assert.match(front,/data-layer="pickguard" data-option="ivory"/);
  else if(model==='EDDA')assert.doesNotMatch(front,/data-layer="pickguard"/,'EDDA guard uses catalog state, never display-only extras');
  else {
    assert.doesNotMatch(front,/data-layer="pickguard"/,'Never invent a contour for a model without a source guard');
    for(const id of ['black','ivory','wood']){
      const state=preview.scene(model,d,'',{},null,{pickguard:id});
      assert.equal(state.pickguard,'none');
      assert.equal(parts.guard({...state,pickguard:id},'test'),'','Direct calls must reject models without source contours');
    }
  }
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
    assert.match(svg,new RegExp('data-layer="pickups"[^>]*data-appearance="'+'manufacturer-reference'+'"'));
    assert.doesNotMatch(svg,/illustrative-family|part-underlay/);
    assert.doesNotMatch(svg,/data-layer="finger-ramp"/,'Finger ramp deferred even for stale input');
    const controls=parts.controlPlan(state);assert.equal(controls.filter(x=>x.type==='toggle').length,model==='EDDA'?0:2);
    assert.equal(new Set(controls.map(x=>x.xy.join(','))).size,controls.length,'Additional preview switches cannot replace a knob');
    for(const id of ['emg','fishman'])assert.equal(parts.controlPlan(preview.scene(model,{...picked,pickups:id},'',{},null,extras)).filter(x=>x.type==='toggle').length,0);
    assert.doesNotMatch(preview.renderSvg(preview.scene(model,{...picked,pickup_configuration:'pickup_3'},''),'front','en'),/data-layer="finger-ramp"/);
  }
}
for(const model of ['EMBLA','ASKR']){
  const d={...JSON.parse(JSON.stringify(normalize(model))),pickup_configuration:'pickup_3'};
  const svg=preview.renderSvg(preview.scene(model,d,''),'front','en');
  assert.match(svg,/data-layer="pickups"[^>]*data-count="2"[^>]*data-appearance="manufacturer-reference"/);
  assert.ok(preview.scene(model,d,'').pending.includes('pickup_configuration'));
  // Existing production restrictions remain: the preview does not unlock it.
  assert.equal(normalize(model,d).pickup_configuration,'pickup_2');
}
console.log('PASS: body joins, additive controls, source part retention, ramp exclusion and read-only extras');

assert.ok(preview.scene('EMBLA',{...normalize('EMBLA'),pickups:'häussel_bar'},'').pending.includes('pickups'),'Custom BassBar housing cannot be inferred from the product family name');

// Regression: all existing knobs survive every additional switch combination.
for(const model of ['EDDA','EMBLA','ASKR','GRAMR']){
  const d=JSON.parse(JSON.stringify(normalize(model)));
  for(const coil of ['coil_none','coil_1_ps','coil_2_ps','coil_2_pcts'])for(const extras of [[],['kill_switch'],['dual_tone'],['kill_switch','dual_tone']]){
    const state=preview.scene(model,{...d,pickups:model==='EDDA'?'nova_mm':'askr_delano_sbc5_e',electronics:model==='GRAMR'?'guitar_passive':'passive',coil_switch:coil},'',{},null,{specialOptions:extras});
    const plan=parts.controlPlan(state),knobs=plan.filter(c=>c.type==='knob'),switches=plan.filter(c=>c.type!=='knob');
    assert.deepEqual(knobs.map(c=>c.xy),parts.electronicsPlan(state).knobs.map(c=>c.xy),'Switches preserve the selected electronics layout');
    assert.ok(knobs.every(c=>c.placement===(model==='GRAMR'?'source-retained':'electronics-preview')));
    assert.ok(switches.every(c=>c.placement==='preview-only-unconfirmed'));
    assert.equal(plan.filter(c=>c.type==='kill').length,extras.includes('kill_switch')?1:0);
    const clearance=model==='GRAMR'?25:21;
    for(const control of switches)for(const other of plan)if(other!==control)assert.ok(Math.hypot(control.xy[0]-other.xy[0],control.xy[1]-other.xy[1])>clearance,'Added controls must not overlap knobs or each other');
    const noExtras=preview.scene(model,{...state.selections},'');
    assert.deepEqual(noExtras.g.controls,state.g.controls);
    for(const side of ['front','back'])assert.doesNotMatch(preview.renderSvg(state,side,'en'),/illustrative-family|part-underlay/,'No unverified product-family geometry');
  }
  const state=preview.scene(model,d,'');
  for(const category of ['pickups','hardware_bridge','hardware_machine_head'])assert.equal(state.pending.includes(category),(!parts.profile(state,category)||parts.profile(state,category).scope==='catalog-reference'),'Coverage follows the selected product reference');
  const changed=preview.scene(model,{...d,hardware_machine_head:'hipshot_ul_38'},'');
  assert.notEqual(preview.renderSvg(state,'back','en'),preview.renderSvg(changed,'back','en'),'Verified tuner rear housing changes with selection');
}
console.log('PASS: retained knob coordinates, independent non-overlapping switch proposals, no invented manufacturer shapes');

// EDDA guard follows ordinary catalog state and existing dependency normalization.
{
  const d=JSON.parse(JSON.stringify(normalize('EDDA'))),before=JSON.stringify(d);
  assert.equal(d.pickguard,'pg_none');
  assert.equal(preview.scene('EDDA',d,'').pickguard,'none');
  assert.equal(data.categories.find(c=>c.id==='pickguard').options.find(o=>o.id==='pg_add').prices.EDDA,'request');
  const outputs=new Set();
  for(const material of ['pg_acrylic','pg_aluminium','pg_wood'])for(const colour of ['pg_black','pg_white','pg_ivory','pg_red','pg_match'])for(const finish of ['pg_matte','pg_gloss']){
    const selected=normalize('EDDA',{...d,pickguard:'pg_add',pickguard_material:material,pickguard_colour:colour,pickguard_finish:finish});
    assert.equal(selected.pickguard_material,material);assert.equal(selected.pickguard_finish,finish);
    assert.equal(selected.pickguard_colour,material==='pg_wood'?undefined:colour);
    const state=preview.scene('EDDA',selected,'transparent #9d282b');
    const front=preview.renderSvg(state,'front','en'),back=preview.renderSvg(state,'back','en');
    assert.match(front,/data-layer="pickguard"[^>]*data-appearance="sample-contour"/);
    assert.ok(front.includes(state.g.pickguard));assert.doesNotMatch(back,/data-layer="pickguard"/);
    outputs.add(parts.guard(state,'guard'));
    const removed=normalize('EDDA',{...selected,pickguard:'pg_none'});
    for(const id of ['pickguard_material','pickguard_colour','pickguard_finish'])assert.equal(removed[id],undefined,'Hidden details cannot remain in quote');
  }
  assert.equal(outputs.size,22,'Acrylic/aluminium × five colours × two surfaces, plus matching wood × two surfaces');
  for(const model of ['EMBLA','ASKR','GRAMR'])assert.equal(normalize(model,{pickguard:'pg_add'}).pickguard,undefined,'EDDA guard cannot leak into another model');
  assert.equal(JSON.stringify(d),before);
  const invalid=preview.renderSvg(preview.scene('EDDA',{...d,pickguard:'pg_add',pickguard_colour:'" onerror="x',pickguard_material:'" onerror="x'},''),'front','en');
  assert.doesNotMatch(invalid,/onerror=/);
}
console.log('PASS: EDDA guard catalog, materials/colours/surfaces, dependency cleanup, rear exclusion and request-only price');

// Species textures, read-only accent selection and stale-ramp exclusion.
const options=require('../assets/configurator-option-renderer.js');
for(const model of ['EDDA','EMBLA','ASKR','GRAMR']){
 const d=JSON.parse(JSON.stringify(normalize(model)));
 const necks=model==='GRAMR'?['guitar_neck_1pc','guitar_neck_3pc','guitar_neck_5pc']:['1pc','3pc','5pc','7pc','9pc','13pc'];
 for(const neck of necks)for(const accent of ['walnut','bloodwood']){
  const s=preview.scene(model,{...d,neck},'',{},null,{neckAccent:accent});
  const expected=options.laminatePlan(s),svg=preview.renderSvg(s,'back','en');
  assert.match(svg,/data-appearance="species-textures"/);
  assert.equal([...svg.matchAll(/data-laminate-piece=/g)].length,expected.length);
  for(const wood of expected)assert.ok(svg.includes('data-material="'+wood+'"'));
  if(['9pc','13pc'].includes(neck))assert.ok(expected.includes(accent));
  if(neck==='13pc')assert.ok(expected.includes('bubinga'));
  assert.doesNotMatch(svg,/NaN|undefined/);
 }
 assert.doesNotMatch(preview.renderSvg(preview.scene(model,{...d,finger_ramp:'ramp_wood'},''),'front','en'),/data-layer="finger-ramp"/);
}
assert.doesNotMatch(section(html,'const App = () => {','const isCategoryVisible ='),/hardware_color', 'finger_ramp/);
for(const [model,category,ids] of [['EMBLA','pickups',['delano_sbc','delano_ts']],['ASKR','pickups',['fishman','emg','askr_delano_sbc5_e']],['EMBLA','hardware_bridge',['gotoh_404BO','hipshot_a','hipshot_b']],['EDDA','hardware_machine_head',['gotoh_707','gotoh_528','hipshot_ul_38']]]){
 const renders=ids.map(id=>{const state=preview.scene(model,{...normalize(model),[category]:id},'');assert.ok(!state.pending.includes(category));const svg=preview.renderSvg(state,'front','en');assert.match(svg,/data-appearance="manufacturer-reference"/);return svg;});
 assert.equal(new Set(renders).size,ids.length);
}
console.log('PASS: referenced product variants, textured laminate species, walnut/bloodwood and deferred finger ramps');

// v12: electronics topology changes; separate options never consume a knob.
const eqCases=[['EDDA','passive',0,3,0],['EDDA','nfp','filter',4,0],['EDDA','eq01','filter',4,4],['EMBLA','zuta',3,5,0],['EMBLA','noll',4,6,0],['EMBLA','john_east',3,5,2],['EMBLA','underhill','filter',5,3],['ASKR','fishman',2,4,0],['ASKR','glockenklang',3,5,0],['ASKR','darkglass',3,5,0],['ASKR','lhz',3,5,0],['GRAMR','guitar_passive',0,2,0],['GRAMR','guitar_zuta_core','planned',2,0]];
for(const [model,electronics,bands,count,stacks] of eqCases){
  const s={...normalize(model),electronics};
  const state=preview.scene(model,s,'transparent #9d282b',{},null,{specialOptions:['kill_switch'],pickguard:'black'});
  const plan=parts.electronicsPlan(state);assert.equal(plan.bands,bands);assert.equal(plan.knobs.length,count);assert.equal(plan.knobs.filter(k=>k.stacked).length,stacks);
  const all=parts.controlPlan(state);
  for(const [i,a] of all.entries())for(const b of all.slice(i+1))assert.ok(Math.hypot(a.xy[0]-b.xy[0],a.xy[1]-b.xy[1])>21,`${model}/${electronics}: controls overlap`);
  const plain=preview.scene(model,s,'transparent #9d282b');assert.equal(parts.knobs(plain,'test',8),parts.knobs(state,'test',8));
  assert.equal(s.electronics,electronics);
}
assert.deepEqual(parts.electronicsProfiles.darkglass.knobs.at(-1),['high_mid']);
assert.equal(parts.electronicsPlan(preview.scene('EDDA',{...normalize('EDDA'),electronics:'dual_filter'},'')),null);
assert.equal(parts.electronicsPlan(preview.scene('EMBLA',{...normalize('EMBLA'),control_layout:'control_custom'},'')),null);
const kill=parts.controlPlan(preview.scene('GRAMR',normalize('GRAMR'),'',{},null,{specialOptions:['kill_switch']})).find(x=>x.type==='kill');assert.deepEqual(kill.xy,[796,210]);
for(const model of ['EDDA','EMBLA','ASKR','GRAMR']){
  const base={...normalize(model),extra_finish_burst:'burst_add',neck_finish:'neck_body',color_headstock:'head_natural'};
  for(const side of ['front','back']){
    const svg=preview.renderSvg(preview.scene(model,base,'transparent #9d282b'),side,'ko','portrait');
    assert.equal((svg.match(/data-effect="burst"/g)||[]).length,1,'Only the body gets a contour burst');
    assert.match(svg,new RegExp(`data-effect="burst" data-placement="body-contour" data-side="${side}"`));
    assert.doesNotMatch(svg,/<radialGradient[^>]*burst/);
    const plain=preview.renderSvg(preview.scene(model,{...base,extra_finish_burst:'burst_none'},''),side,'en');assert.doesNotMatch(plain,/data-effect="burst"/);
    if(side==='back'){
      assert.match(svg,/data-layer="neck-finish" data-mode="body" data-colour="#9d282b" data-opaque="false"/);
      assert.match(svg,/data-layer="neck-laminates"/);
      assert.match(svg,/data-layer="rear-head-finish" data-mode="body" data-colour="#9d282b"/);
      const opaque=preview.renderSvg(preview.scene(model,base,'solid #9d282b'),'back','en');
      assert.match(opaque,/data-layer="neck-finish" data-mode="body" data-colour="#9d282b" data-opaque="true"/);
      assert.doesNotMatch(opaque,/data-layer="neck-laminates"/);
      const natural=preview.renderSvg(preview.scene(model,{...base,neck_finish:'neck_natural'},'solid #9d282b'),'back','en');assert.match(natural,/data-layer="neck-laminates"/);
    }
  }
  assert.ok(data.categories.find(c=>c.id==='color_headstock').options.some(o=>o.id==='head_natural'));
  assert.ok(!data.categories.find(c=>c.id==='color_headstock').options.some(o=>o.id==='head_plate'));
}
const catalogBefore=JSON.stringify(data);preview.configureTestOptions(data);assert.equal(JSON.stringify(data),catalogBefore,'Test catalog setup is idempotent');
console.log('PASS: EQ topology/stacked pots, independent switches, GRAMR kill position, contour burst both sides, neck/head matching and catalog idempotency');

// v13: preamps change the whole arrangement, without changing the surface below.
for(const model of ['EDDA','EMBLA','ASKR']){
  let previous=null,body=null;
  for(const electronics of ['passive','nfp','zuta','noll']){
    const state=preview.scene(model,{...normalize(model),electronics},'transparent #9d282b',{},null,{specialOptions:['kill_switch']});
    const positions=parts.electronicsPlan(state).knobs.map(k=>k.xy);
    if(previous)assert.notDeepEqual(positions.slice(0,previous.length),previous,'Whole layout changes, not just an added end knob');
    previous=positions;
    const all=parts.controlPlan(state);
    for(let i=0;i<all.length;i++)for(const b of all.slice(i+1))assert.ok(Math.hypot(all[i].xy[0]-b.xy[0],all[i].xy[1]-b.xy[1])>21,`${model}/${electronics} control clearance`);
    const svg=preview.renderSvg(state,'front','en','portrait');
    const surface=svg.split('<g data-surface="continuous-body"')[1].split('</g>')[0];
    assert.ok(surface);assert.doesNotMatch(surface,/<image |source-parts-mask/,'Source knobs cannot leak into the continuous material surface');
    if(body)assert.equal(surface,body,'Changing preamp cannot change the colour at old knob positions');
    body=surface;
  }
}
for(const [model,pickup] of [['EDDA','nova_mm'],['EMBLA','delano_sbc'],['ASKR','fishman']]){
  const state=preview.scene(model,{...normalize(model),pickups:pickup},'');
  const fitted=parts.selectedPickupPlan(state);
  fitted.forEach((r,i)=>{
    const source=state.g.pickups[i],ref=parts.profile(state,'pickups'),native=state.g.pickupReferenceMM;
    assert.ok(Math.abs(r.w-source.w*(native?ref.w/native[0]:1))<1e-8);
    assert.ok(Math.abs(r.h-source.h*(native?ref.h/native[1]:1))<1e-8);
    assert.ok(Math.abs((r.x+r.w/2)-(source.x+source.w/2))<1e-8,'Replacement keeps source centre, without inheriting prototype pickup dimensions');
  });
  assert.match(parts.pickups(state,'fit'),/data-projection="source-envelope"/);
}
console.log('PASS: complete preamp layouts, unchanged continuous body surface, pickup projection into source envelopes');

// All EMBLA topologies stay in a compact control bank with a separate lower switch row.
for(const electronics of ['passive','fishman','nfp','zuta','noll','john_east','underhill','eq01']){
 const state=preview.scene('EMBLA',{...normalize('EMBLA'),electronics,coil_switch:'coil_2_ps'},'',{},null,{specialOptions:['kill_switch']});
 const all=parts.controlPlan(state);
 for(const c of all){assert.ok(c.xy[0]>=210&&c.xy[0]<=285);assert.ok(c.xy[1]>=755&&c.xy[1]<=885);}
 for(let i=0;i<all.length;i++)for(const b of all.slice(i+1))assert.ok(Math.hypot(all[i].xy[0]-b.xy[0],all[i].xy[1]-b.xy[1])>21,'EMBLA knobs and extra switches must stay separate');
}
const novaPickup=preview.scene('EDDA',normalize('EDDA'),'');
assert.match(parts.pickups(novaPickup,'nova'),/data-profile="nova-omnia-mm"/);
assert.equal(novaPickup.pending.includes('pickups'),false);
assert.equal(preview.scene('EDDA',{...normalize('EDDA'),pickups:'häussel_triple'},'').pending.includes('pickups'),false,'Official catalog page 15 verifies the MM Triplebucker exterior');
console.log('PASS: compact EMBLA control bank and verified Nova MM coverage');

// ASKR switches belong below every selectable knob topology, not beside pickups.
for(const electronics of ['passive','nfp','zuta','noll','john_east','underhill','eq01']){
 const state=preview.scene('ASKR',{...normalize('ASKR'),electronics,pickups:'askr_delano_sbc5_e',coil_switch:'coil_2_ps'},'',{},null,{specialOptions:['kill_switch']});
 const plan=parts.controlPlan(state),knobs=plan.filter(c=>c.type==='knob'),switches=plan.filter(c=>c.type!=='knob');
 assert.equal(switches.length,3);
 for(const a of switches){assert.ok(a.xy[1]<=1070,'Switches must stay away from the bottom rim');assert.ok(a.xy[0]>=215&&a.xy[0]<=273,'Switch row stays beside the bridge');assert.ok(a.xy[1]>Math.max(...knobs.map(c=>c.xy[1]))+10);for(const b of plan)if(a!==b)assert.ok(Math.hypot(a.xy[0]-b.xy[0],a.xy[1]-b.xy[1])>21);}
}
console.log('PASS: ASKR coil/kill switches below controls with separate clearance');

// Source-vector provenance and opaque surfaces: these gates prevent regression,
// while the side-by-side images remain the visual acceptance evidence.
const frontGeometry=require('../assets/configurator-bass-front-geometry.js');
for(const model of ['ASKR','EMBLA']){
 const g=frontGeometry[model];
 assert.equal(g.kind,'bass-drawing');assert.equal(g.frets.length,24);
 assert.equal(g.tuners.length,5);assert.equal(g.stringLines.length,5);
 assert.ok(g.provenance.maxBodyJoinGapPDFPoints<.05);
 assert.ok(g.provenance.maxHeadJoinGapPDFPoints<.05);
 assert.deepEqual(g.controlLayouts[5],g.controls);
 assert.ok(g.stringLines.every(line=>line[0][1]<line[1][1]),'String endpoints must run towards the bridge');
 assert.ok(g.bridge.every(p=>p[1]>Math.max(...g.pickups.map(r=>r.y+r.h))),'Bridge anchors must be below pickups, never in the headstock');
 if(model==='EMBLA')for(const xy of g.controlProposals.coils)for(const pickup of g.pickups){
   const dx=Math.max(pickup.x-xy[0],0,xy[0]-(pickup.x+pickup.w));
   const dy=Math.max(pickup.y-xy[1],0,xy[1]-(pickup.y+pickup.h));
   assert.ok(Math.hypot(dx,dy)>12,'Added switches must clear the prototype pickup covers');
 }
 const state=preview.scene(model,{...normalize(model),color_back_side:'back_stain'},'solid #275f89');
 const rear=preview.renderSvg(state,'back','en');
 assert.match(rear,/data-surface="opaque-paint"[^>]*fill="#275f89"/);
 const natural=preview.renderSvg(preview.scene(model,{...state.selections,color_back_side:'back_oil'},'solid #275f89'),'back','en');
 assert.match(natural,/data-surface="opaque-paint"[^>]*fill="#275f89"/,'Preview colour covers both sides even when quote finish is oil');
}
const gramrGeometry=require('../assets/configurator-gramr-geometry.js');
assert.equal(gramrGeometry.back.neck[2][0],gramrGeometry.back.neck[3][0],'Original PDF interface must not follow the diagonal cutaway tangent');
const gramrRear=preview.renderSvg(preview.scene('GRAMR',normalize('GRAMR'),''),'back','en');
assert.match(gramrRear,/data-coordinate-status="unverified"/);
assert.match(gramrRear,/data-placement="pdf-boundary-5613"/);
const nativeManifest=JSON.parse(fs.readFileSync(path.join(root,'assets/configurator-materials/native-v15.json')));
for(const entry of nativeManifest){
 const actual=materials.get(entry.id);assert.equal(actual.source,entry.source);
 assert.equal(entry.resized,false);assert.equal(actual.sourceWidth,entry.nativeWidth);assert.equal(actual.sourceHeight,entry.nativeHeight);
 assert.equal(require('crypto').createHash('sha256').update(fs.readFileSync(path.join(root,entry.source))).digest('hex'),entry.sha256);
}
console.log('PASS: source contour continuity, 24 native fret lines, opaque rear paint, GRAMR boundary/unverified joint and native texture provenance');

// Product-card and instrument art share one geometry source; custom fit remains explicit.
const tripleThumb=parts.pickupThumbnail('EDDA','häussel_triple','triple');
assert.equal((tripleThumb.match(/data-pole="large"/g)||[]).length,8);
assert.equal((tripleThumb.match(/data-pole="small"/g)||[]).length,8);
for(const [model,id] of [['EMBLA','häussel_bar'],['EDDA','nova_custom']]){
 const state=preview.scene(model,{...normalize(model),pickups:id},'');
 assert.ok(state.pending.includes('pickups'),'Catalog exterior must not approve an unspecified custom fit');
 assert.match(parts.pickups(state,'catalog'),/data-appearance="catalog-reference"/);
 for(const lang of ['ko','en','de'])assert.match(preview.pickupStatus(model,id,lang),{ko:/미확정/,en:/unconfirmed/,de:/unbestätigt/}[lang]);
}
for(const model of ['EDDA','EMBLA','ASKR','GRAMR'])for(const option of data.categories.find(c=>c.id==='pickups').options){
 if(!visible('pickups',option.id,model,normalize(model)))continue;
 const state=preview.scene(model,{...normalize(model),pickups:option.id},''),ref=parts.profile(state,'pickups');
 const thumbnail=parts.pickupThumbnail(model,option.id,'card');
 if(ref){assert.ok(thumbnail.includes(`data-pickup-profile="${ref.style}"`));assert.ok(parts.pickups(state,'stage').includes(`data-profile="${ref.style}"`));}
 else{assert.equal(thumbnail,'');assert.ok(state.pending.includes('pickups'));}
}
for(const model of ['EMBLA','ASKR'])for(const electronics of ['passive','nfp','zuta','noll','john_east','underhill','eq01']){
 const state=preview.scene(model,{...normalize(model),electronics,pickups:model==='ASKR'?'askr_delano_sbc5_e':'delano_ts',coil_switch:'coil_2_ps'},'',{},null,{specialOptions:['kill_switch']});
 const plan=parts.controlPlan(state),knobs=plan.filter(c=>c.type==='knob'),switches=plan.filter(c=>c.type!=='knob');
 assert.equal(new Set(switches.map(c=>c.xy[1])).size,1,'Extras form one row');
 assert.ok(switches.every(c=>c.xy[1]>Math.max(...knobs.map(k=>k.xy[1]))+25),'Switch row is below the entire knob bank');
 assert.doesNotMatch(parts.controls(state,'control',8),/stroke-dasharray/,'No floating proposal halos');
}
console.log('PASS: verified Triplebucker pole array, scoped custom references, pickup-card coverage and lower switch rows');

// v17: head continuity and separate physical tuner planes, including the omitted
// Graph Tech / Schaller products. Source outlines remain byte-identical.
for(const [model,ids] of [['EDDA',['schaller_bm','schaller_bm_lt','gotoh_707']],['EMBLA',['graphtech','schaller_m4_locking']],['ASKR',['graphtech','schaller_m4_locking']],['GRAMR',['guitar_gotoh_sg381']]]){
 const d=JSON.parse(JSON.stringify(normalize(model)));
 for(const id of ids){
  const state=preview.scene(model,{...d,hardware_machine_head:id},'solid #9d282b');
  assert.ok(!state.pending.includes('hardware_machine_head'));
  const mount=parts.tuners(state,'qa',false,'rear-mount'),front=parts.tuners(state,'qa'),back=parts.tuners(state,'qa',true);
  assert.match(mount,/data-part="rear-key-shaft"/);assert.doesNotMatch(mount,/front-bushing-post|rear-gear-housing/);
  assert.match(front,/data-part="front-bushing-post"/);assert.doesNotMatch(front,/rear-key-shaft|rear-gear-housing|locking-wheel/);
  assert.match(back,/rear-key-shaft/);assert.match(back,/rear-gear-housing/);
  assert.equal(back.includes('data-part="locking-wheel"'),id==='schaller_m4_locking');
  if(id==='schaller_m4_locking')assert.match(back,/data-mount-lug="90-degrees"/);
  if(!['EDDA','GRAMR'].includes(model))assert.match(back,/scale\([\d.]+ -[\d.]+\)/,'Drawing projection mirrors the transverse offset');
  for(const finish of ['', 'transparent #9d282b', 'solid #9d282b'])for(const head of ['head_match','head_natural']){
   const svg=preview.renderSvg(preview.scene(model,{...state.selections,color_headstock:head},finish),'front','en');
   const rearIndex=svg.indexOf('data-layer="tuner-rear-mount"'),woodIndex=svg.indexOf('data-layer="headstock"'),postIndex=svg.indexOf('data-part="front-bushing-post"');
   assert.ok(rearIndex>=0&&rearIndex<woodIndex&&woodIndex<postIndex,'Keys below wood; posts above wood');
   if(model==='ASKR'){
    assert.match(svg,/data-neck-transition="source-anchor-closure"/);
    assert.ok(svg.includes(state.g.head.replace(/Z\s*$/,`L${state.g.board[1]} Z`)),'Close from source head endpoint to source nut endpoint');
    assert.match(preview.renderSvg(state,'back','en'),/data-neck-transition="connected-source-surface"/);
   }
  }
  if(state.g.unitsPerMm)assert.match(front,new RegExp(`data-units-per-mm="${state.g.unitsPerMm}"`));
 }
}
assert.equal(parts.references.hardware_machine_head.schaller_bm.washer,22);
assert.equal(parts.references.hardware_machine_head.schaller_m4_locking.locking,true);
const paysonState=preview.scene('ASKR',normalize('ASKR'),'');
const paysonSvg=parts.bridge(paysonState,'qa-payson');
assert.match(paysonSvg,/data-part="continuous-aluminium-plate"/);
assert.equal((paysonSvg.match(/data-saddle=/g)||[]).length,5);
for(const anchor of paysonState.g.bridgeSaddlePoints)assert.ok(paysonSvg.includes(`data-string-anchor="${anchor}"`));
for(let i=0;i<5;i++)assert.ok(paysonState.g.stringLines[i][1][1]-parts.bridgeAnchors(paysonState)[i][1]>30,'CAD tail is not the saddle witness');
assert.doesNotMatch(parts.pickups(paysonState,'qa-pickup'),/translate\(\.35 2\.2\)/,'ASKR top-view housing excludes false depth');
assert.doesNotMatch(preview.renderSvg(paysonState,'front','en'),/data-layer="body-strings"/,'ASKR uses one continuous string path per string');
assert.equal(parts.bridge({...paysonState,metal:'#c9a75c'},'qa-payson'),paysonSvg,'Bridge anodizing cannot follow tuner colour');
console.log('PASS: connected ASKR nut transition, rear/front tuner planes, Graph Tech and Schaller variants, continuous fixed-finish Payson plate');

// v19: the owner requested the original guard and knob placement only.
{
 const g=require('../assets/configurator-geometry.js').EDDA;
 const crypto=require('node:crypto');
 assert.equal(crypto.createHash('sha256').update(g.pickguard).digest('hex'),'a29457f7900411f67aa0a53c3296bdd299f6be91bc3599da5c573af5664f7a94');
 assert.equal(g.controlPlate,undefined);
 for(const electronics of [...Object.keys(parts.electronicsProfiles).filter(id=>!id.startsWith('guitar')),'dual_filter']){
  const svg=preview.renderSvg(preview.scene('EDDA',{...normalize('EDDA'),electronics,pickguard:'pg_add'},''),'front','en');
  assert.doesNotMatch(svg,/data-layer="control-plate"/);
 }
}
console.log('PASS: original EDDA guard contour restored exactly; no control plate');

// One rear reference governs EDDA head proportions on both sides.
{
 const g=require('../assets/configurator-geometry.js').EDDA,source=g.back.head.match(/-?\d+(?:\.\d+)?/g).map(Number),front=g.head.match(/-?\d+(?:\.\d+)?/g).map(Number);
 assert.equal(source.length,front.length);
 for(let i=0;i<source.length;i++)assert.ok(Math.abs(front[i]-(i%2?198+(source[i]-290)*.62:539+(525-source[i])*.62))<.001,'EDDA head must preserve reference proportions');
 for(const material of ['pg_acrylic','pg_aluminium','pg_wood'])assert.ok(data.categories.find(c=>c.id==='pickguard_material').options.some(o=>o.id===material));
 assert.ok(!JSON.stringify(data.categories.find(c=>c.id==='pickguard_material')).includes('plastic'));
 console.log('PASS: rear-authoritative EDDA head registration and acrylic/aluminium/wood catalog');
}

// EDDA reference has the worm shaft above its gear centre, not below it.
for(const id of data.categories.find(c=>c.id==='hardware_machine_head').options.filter(o=>o.prices?.EDDA!==undefined).map(o=>o.id)){
 const state=preview.scene('EDDA',{...normalize('EDDA'),hardware_machine_head:id},'');if(!parts.profile(state,'hardware_machine_head'))continue;
 const project=(svg,x,y)=>{const a=svg.match(/data-tuner-index="0"[^>]* transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) scale\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);const r=a[2]*Math.PI/180;return [Math.cos(r)*x*a[3]-Math.sin(r)*y*a[4],Math.sin(r)*x*a[3]+Math.cos(r)*y*a[4]];};
 const ref=parts.profile(state,'hardware_machine_head'),offset=ref.keyOffset||0;
 const rear=project(parts.tuners(state,'qa',true),20,offset),front=project(parts.tuners(state,'qa',false,'rear-mount'),20,offset);
 assert.ok(rear[0]>0&&rear[1]<0,'EDDA shaft must extend right and above the gear centre');
 assert.ok(front[0]<0&&front[1]<0,'Front key plane must mirror rear without turning the housing upside down');
 const a=Math.hypot(...rear),b=Math.hypot(...front);assert.ok(Math.abs(rear[0]/a+front[0]/b)<1e-8&&Math.abs(rear[1]/a-front[1]/b)<1e-8);
}
console.log('PASS: all EDDA machine-head choices preserve reference shaft direction and mirrored front keys');
// Inspect each emitted transform in the upright instrument coordinate system.
{
 const rotate=(q,a)=>{a*=Math.PI/180;return [Math.cos(a)*q[0]-Math.sin(a)*q[1],Math.sin(a)*q[0]+Math.cos(a)*q[1]];};
 const units=svg=>[...svg.matchAll(/data-tuner-index="(\d+)"[^>]*transform="translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) scale\(([-\d.]+) ([-\d.]+)\)"/g)].map(m=>m.slice(1).map(Number));
 let choices=0;
 for(const model of ['EDDA','EMBLA','ASKR','GRAMR'])for(const opt of data.categories.find(c=>c.id==='hardware_machine_head').options){
  const s=normalize(model,{...normalize(model),hardware_machine_head:opt.id});if(s.hardware_machine_head!==opt.id)continue;
  const state=preview.scene(model,s,''),ref=parts.profile(state,'hardware_machine_head');if(!ref)continue;
  const f=units(parts.tuners(state,'q',false,'rear-mount')),b=units(parts.tuners(state,'q',true));assert.equal(f.length,b.length);
  const delta=(u,xy,back)=>{let q=rotate([xy[0]*u[4],xy[1]*u[5]],u[3]);return rotate(q,model==='GRAMR'||(back&&model!=='EDDA')?90:0);};
  for(let i=0;i<f.length;i++){
   // The neck-side part of the housing must face the body in both projections.
   assert.ok(delta(f[i],[0,10],false)[1]>0,model+'/'+opt.id+' front housing inversion');
   assert.ok(delta(b[i],[0,10],true)[1]>0,model+'/'+opt.id+' rear housing inversion');
   const x=delta(f[i],[20,ref.keyOffset||0],false),y=delta(b[i],[20,ref.keyOffset||0],true),a=Math.hypot(...x),c=Math.hypot(...y);
   assert.ok(Math.abs(x[0]/a+y[0]/c)<1e-8&&Math.abs(x[1]/a-y[1]/c)<1e-8,model+'/'+opt.id+' shaft mirror mismatch');
  }
  choices++;
 }
 const g=require('../assets/configurator-geometry.js').GRAMR;
 for(let i=0;i<6;i++){const rear=[...g.back.tuners].sort((a,b)=>a[0]-b[0])[i],front=g.tuners[i];assert.ok(Math.abs(front[0]-rear[0])<.001);assert.ok(Math.abs(front[1]+rear[1]-572.51)<.02);}
 assert.deepEqual(g.back.provenance.tunerPostDrawingIndices,[2022,2027,2032,2037,2042,2047]);
 console.log('PASS: '+choices+' model/tuner choices, every bank upright, mirrored keys and six GRAMR bore correspondences');
}
