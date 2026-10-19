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
    for(const language of ['ko','en','de']) for(const view of ['full','body','neck','head']) {
      const svg=preview.renderSvg(state,view,language);
      assert.match(svg,new RegExp(`data-layer="strings" data-count="${count}"`));
      assert.doesNotMatch(svg,/NaN|undefined|<script|onerror=/);
      if(selections.fret_type==='fretless' && selections.fretline!=='line_yes') assert.doesNotMatch(svg,/data-layer="frets"/);
      else assert.match(svg,/data-layer="frets" data-count="24"/);
    }
    assert.equal(JSON.stringify(selections),before);
    combinations++;
  }
  const base=preview.scene(model,defaults,'');
  const opaque=preview.scene(model,defaults,'solid #112233');
  assert.notEqual(preview.renderSvg(base,'full','en'),preview.renderSvg(opaque,'full','en'));
  assert.equal(opaque.finish.colour,'#112233');
  const retained=preview.scene(model,{...defaults,pickups:'others'},'');
  assert.ok(retained.pending.includes('pickups'));
  assert.match(preview.renderSvg(retained,'full','en'),/data-appearance="reference-retained"/);
  assert.match(preview.renderSvg(base,'body','en'),/<image href="assets\/optimized\//);
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
console.log(`PASS: ${combinations} allowed option substitutions × 3 languages × 4 views; pricing/PDF source parity, safe fallbacks, Nova exception and model constraints`);
