import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { configData, specialOptionsList, accessoriesList } from '../src/catalog.generated.js';
import { MODEL_IDS, catalogText, priceConfiguration, priceWithChanges } from '../src/pricing.js';
const require = createRequire(import.meta.url);
const html = fs.readFileSync(new URL('../../../configurator.html', import.meta.url), 'utf8');
const between = (a, b) => html.slice(html.indexOf(a), html.indexOf(b, html.indexOf(a)));
const context = vm.createContext({ RavenForgePlatforms: require('../../../assets/configurator-platforms.js'), useMemo: fn => fn(), language:'en', ui: {supplies:{},strapPins:'{colour}'}, finishColor:'', platform:{}, hasNovaBridge:false, categoryTitle:c=>c.title, optionLabel:o=>o.label, optionSpec:o=>o.spec||'', selectedOptionLabel:()=>'', getAutomaticPowerSupply:()=>({label:'',spec:''}) });
vm.runInContext(`${between('const specialOptionsList =', 'const App = () => {')}\n${between('const isCategoryVisible =', 'const getDefaultSelections =')}\n${between('const handleOptionChange =', 'const handleSpecialOptionToggle =')}\nthis.norm = normalizeSelections; this.click = handleOptionChange;`,context);
const summarySource = between('const summary = useMemo(', 'const activeCategories =');
// Extract the exact memo body, without any following UI declarations.
const summaryEnd = summarySource.indexOf('\n      const ', 1);
const summaryStatement = summaryEnd < 0 ? summarySource : summarySource.slice(0,summaryEnd);
function pageQuote(model, selections, extras=[], accessories=[]) {
  Object.assign(context,{selectedModel:model,selections:context.norm(model,selections), specialOptions:extras, accessories, currentSpecialOptions:model==='GRAMR'?specialOptionsList.filter(o=>['kill_switch','dual_tone'].includes(o.id)):specialOptionsList.filter(o=>o.id!=='locking_jack'),currentAccessories:model==='GRAMR'?accessoriesList.filter(o=>o.id==='leather_strap'):accessoriesList});
  context.isPassiveCircuit=['passive','guitar_passive'].includes(context.selections.electronics);
  return vm.runInContext(`(()=>{${summaryStatement}\nreturn summary;})()`,context);
}
function pageClick(model, selections, change) {
  Object.assign(context,{selectedModel:model,selections:context.norm(model,selections)});
  let next=context.selections;
  context.setSelections=fn=>{next=fn(next);};
  context.click(change.category,change.option);
  return JSON.parse(JSON.stringify(next));
}
test('all four models: every offered option matches the actual page click and summary total',()=>{
  let checked=0;
  for(const model of MODEL_IDS){
    const base=JSON.parse(JSON.stringify(context.norm(model)));
    for(const category of configData.categories){
      // Reach dependent groups using their parent, just as a visitor must.
      let start={...base};
      for(const [key,value] of Object.entries(category.dependsOn||{})) start=pageClick(model,start,{category:key,option:[].concat(value)[0]});
      for(const option of category.options){
        const change={category:category.id,option:option.id};
        const expected=pageClick(model,start,change);
        const actual=priceWithChanges({model,selections:start,specialOptions:[],accessories:[]},{changes:[change]});
        assert.deepEqual(actual.selections,expected,`${model}/${category.id}/${option.id}`);
        assert.equal(actual.total,pageQuote(model,expected).totalPrice,`${model}/${category.id}/${option.id} total`);
        checked++;
      }
    }
  }
  console.log(`Verified ${checked} model/option transitions against the page handler and summary.`);
});
test('every instrument option and accessory matches page summary, including passive gating',()=>{
  for(const model of MODEL_IDS) for(const electronics of [undefined, model==='GRAMR'?'guitar_passive':'passive']){
    const selections=context.norm(model,electronics?{electronics}:{});
    for(const opt of specialOptionsList){assert.equal(priceConfiguration({model,selections,specialOptions:[opt.id]}).total,pageQuote(model,selections,[opt.id]).totalPrice);}
    for(const opt of accessoriesList){assert.equal(priceConfiguration({model,selections,accessories:[opt.id]}).total,pageQuote(model,selections,[],[opt.id]).totalPrice);}
  }
});
test('Fishman departure and return update both pickup and EQ with exact page pricing',()=>{
  let state={model:'ASKR',selections:{},specialOptions:[],accessories:[]};
  for(const change of [{category:'pickups',option:'emg'},{category:'pickups',option:'fishman'},{category:'electronics',option:'darkglass'},{category:'electronics',option:'fishman'}]){
    const expected=pageClick('ASKR',state.selections,change);
    const result=priceWithChanges(state,{changes:[change]});
    assert.deepEqual(result.selections,expected);
    assert.equal(result.selections.pickups==='fishman',result.selections.electronics==='fishman');
    assert.equal(result.total,pageQuote('ASKR',expected).totalPrice);
    state={...state,selections:result.selections};
  }
});
test('bass models retain fretboard catalog and correct ebony price',()=>{
  const text=catalogText();
  for(const model of ['EDDA','EMBLA','ASKR']){
    const q=priceWithChanges({model,selections:{}},{changes:[{category:'fretboard',option:'ebony'}]});
    assert.equal(q.selections.fretboard,'ebony');
    assert.equal(q.lines.find(l=>l.category==='fretboard').price,50);
    assert.equal(q.total,configData.models.find(m=>m.id===model).basePrice+50);
    assert.match(text.split('fretboard —')[1].split('\n\n')[0],new RegExp(model));
  }
});
test('active-only exclusions are reported and malformed tool inputs do not throw',()=>{
  const q=priceWithChanges({model:'EMBLA',selections:{}},{instrumentOptions:['delano_buffer']});
  assert.ok(q.extras_not_available.includes('delano_buffer'));
  for(const changes of [null,{},[null],Array(51).fill({category:'fretboard',option:'ebony'})]) assert.ok(priceWithChanges({model:'EDDA'},{changes}).error);
});

test('fretless, nut overrides, premium gigbag and strap retain page pricing in combination',()=>{
  for(const model of MODEL_IDS){
    let selections=JSON.parse(JSON.stringify(context.norm(model)));
    for(const change of [
      {category:'fret_type',option:'fretless'},
      {category:'case',option:'case_premium'},
      {category:'nut_material',option:'nut_bone'},
      {category:'fret_type',option:'fret_24'},
      {category:'fret_type',option:'fretless'}
    ]){
      const expected=pageClick(model,selections,change);
      const result=priceWithChanges({model,selections,specialOptions:[],accessories:['leather_strap']},{changes:[change]});
      assert.deepEqual(result.selections,expected,`${model}/${change.category}/${change.option}`);
      assert.equal(result.total,pageQuote(model,expected,[],['leather_strap']).totalPrice);
      assert.equal(result.price_on_request,pageQuote(model,expected,[],['leather_strap']).requiresRequest);
      assert.equal(result.lines.find(l=>l.option==='leather_strap').price,300);
      selections=result.selections;
    }
    if(model==='GRAMR') assert.equal(selections.nut_material,'guitar_bone_nut');
    else assert.equal(selections.nut_material,'nut_verawood');
  }
});
