(function (root, factory) {
  const geometry = typeof module === 'object' && module.exports ? require('./configurator-geometry.js') : root.RavenForgeGeometry;
  const api = factory(geometry);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RavenForgePreview = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (geometry) {
  'use strict';
  const copy = {
    en: {
      title: 'Your instrument', live: 'Live 2D preview', full: 'Full', body: 'Body', neck: 'Fretboard', head: 'Headstock',
      note: 'Concept outline · colour study. Not a production image.',
      scope: 'What is shown', tone: 'Approximate colour only; actual wood grain is not shown.',
      symbols: 'Pickups and bridge are symbols in the reference positions, not manufacturer models. Tuners, control functions and rear details are not rendered.',
      pending: 'Not visualized', covered: 'Covered by the top / opaque finish', reference: 'Original concept',
      colour: 'Preview colour', natural: 'Natural', transparent: 'Transparent', solid: 'Opaque',
      colourHelp: 'One colour applies to the front and matching headstock. Use a swatch, #RRGGBB, or a simple colour name. Multi-part finish instructions remain in the quote only.',
      textOnly: 'This colour description is in the quote only. No colour has been inferred.',
      oil: 'A colour is specified with natural oil. Confirm the finish method before production.',
      headPending: 'Headstock plate artwork is not available.',
      geometry: 'Final geometry / exact parts require approved drawings.',
      updated: 'Preview updated', material: 'Material colour', schematic: 'Symbol only', hidden: 'Not visible from the front',
      noShape: 'No verified outline is available for this model.', colourNames: ['Natural', 'Red', 'Blue', 'Black', 'White', 'Green']
    },
    ko: {
      title: '선택한 악기', live: '실시간 2D 미리보기', full: '전체', body: '바디', neck: '지판', head: '헤드스톡',
      note: '컨셉 외곽 · 색조 참고용입니다. 제작 완성 이미지가 아닙니다.',
      scope: '시각화 범위', tone: '목재는 대략적인 색조만 표시하며 실제 나뭇결은 표현하지 않습니다.',
      symbols: '픽업·브리지는 원본 위치의 기호이며 제조사 제품 형상이 아닙니다. 튜너·컨트롤 기능·후면 세부는 표현하지 않습니다.',
      pending: '미표현', covered: '탑 또는 불투명 마감에 가려짐', reference: '원본 컨셉 보기',
      colour: '미리보기 색상', natural: '내추럴', transparent: '투명', solid: '불투명',
      colourHelp: '한 가지 색상을 전면과 매칭 헤드스톡에 적용합니다. 색상표·#RRGGBB·단일 색상명을 사용할 수 있습니다. 부위별 복합 마감 요청은 견적에만 기록됩니다.',
      textOnly: '이 색상 설명은 견적에만 기록됩니다. 색상을 임의로 해석하지 않았습니다.',
      oil: '내추럴 오일과 색상이 함께 지정되었습니다. 제작 전 마감 방식을 확인해야 합니다.',
      headPending: '헤드스톡 플레이트 도안이 없어 표현하지 않습니다.',
      geometry: '최종 형상·부품 세부는 승인 도면 확인이 필요합니다.',
      updated: '미리보기 갱신', material: '소재 색조', schematic: '기호 표시', hidden: '정면에서 보이지 않음',
      noShape: '이 모델은 확인된 외곽 자료가 없습니다.', colourNames: ['내추럴', '레드', '블루', '블랙', '화이트', '그린']
    },
    de: {
      title: 'Ihr Instrument', live: 'Live-Vorschau in 2D', full: 'Gesamt', body: 'Korpus', neck: 'Griffbrett', head: 'Kopfplatte',
      note: 'Konzeptkontur · Farbstudie. Kein Produktionsbild.',
      scope: 'Umfang der Vorschau', tone: 'Nur ungefähre Holzfarben; die tatsächliche Maserung wird nicht dargestellt.',
      symbols: 'Tonabnehmer und Brücke sind Symbole an den Referenzpositionen, keine Herstellermodelle. Mechaniken, Reglerfunktionen und Rückseitendetails werden nicht dargestellt.',
      pending: 'Nicht dargestellt', covered: 'Von Decke / deckendem Finish verdeckt', reference: 'Originalkonzept',
      colour: 'Vorschaufarbe', natural: 'Natur', transparent: 'Transparent', solid: 'Deckend',
      colourHelp: 'Eine Farbe gilt für Vorderseite und passende Kopfplatte. Farbfeld, #RRGGBB oder einfachen Farbnamen verwenden. Mehrteilige Finish-Wünsche stehen nur im Angebot.',
      textOnly: 'Diese Farbbeschreibung steht nur im Angebot. Es wurde keine Farbe abgeleitet.',
      oil: 'Farbe und Naturöl sind zusammen gewählt. Finish vor der Fertigung abstimmen.',
      headPending: 'Für die Kopfplattenplakette liegt keine Vorlage vor.',
      geometry: 'Endgültige Geometrie / genaue Teile benötigen freigegebene Zeichnungen.',
      updated: 'Vorschau aktualisiert', material: 'Materialfarbe', schematic: 'Nur Symbol', hidden: 'Von vorn nicht sichtbar',
      noShape: 'Für dieses Modell liegt keine geprüfte Kontur vor.', colourNames: ['Natur', 'Rot', 'Blau', 'Schwarz', 'Weiß', 'Grün']
    }
  };
  const woods = {
    ash:'#c5a779', swampash:'#d7bd8b', swamp_ash:'#d7bd8b', alder:'#bd8d61', zelkova:'#b68954', elm:'#bca070',
    maple:'#e2c695', limba:'#bba768', red_toon:'#b27257', rosewood:'#573c30', indian_rosewood:'#573c30',
    ebony:'#242321', wenge:'#493e32', walnut:'#765644', flame_maple:'#e2c695', quilted_maple:'#e2c695',
    figured_ash:'#c5a779', figured_elm:'#bca070', maple_burl:'#d6b586'
  };
  const metals = { hw_chrome:'#b8c3cc', hw_black:'#33383d', hw_gold:'#c9a75c', hw_vintage_copper:'#b77a55' };
  const colourWords = {
    red:'#9d282b', 레드:'#9d282b', 빨강:'#9d282b', rot:'#9d282b', blue:'#275f89', 블루:'#275f89', 파랑:'#275f89', blau:'#275f89',
    black:'#24262a', 블랙:'#24262a', 검정:'#24262a', schwarz:'#24262a', white:'#eee8dc', 화이트:'#eee8dc', 흰색:'#eee8dc', weiß:'#eee8dc', weiss:'#eee8dc',
    green:'#35624b', 그린:'#35624b', 초록:'#35624b', grün:'#35624b', purple:'#64476f', 퍼플:'#64476f', violett:'#64476f'
  };
  function parseColour(input) {
    let value = String(input || '').trim().toLowerCase();
    if (!value || /^(natural|natur|내추럴|내츄럴)$/.test(value)) return {status:'natural', colour:null, opaque:false};
    const opaque = /^(solid|opaque|deckend|불투명|솔리드)\s+/.test(value);
    value = value.replace(/^(transparent|translucent|solid|opaque|deckend|투명|불투명|솔리드)\s+/, '');
    const colour = /^#[0-9a-f]{6}$/.test(value) ? value : colourWords[value];
    return {status:colour ? 'colour' : 'unmapped', colour:colour || null, opaque};
  }
  function wood(id) {
    const key = String(id || '').replace(/^guitar_(top_|body_)?/, '').replace(/^(core_|wing_)/, '');
    return woods[key] || null;
  }
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const point = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
  const pts = points => points.map(p=>p.join(',')).join(' ');
  function scene(model, selections, finishColour, labels) {
    const s = Object.assign({}, selections); // Read-only boundary; pricing owns normalization.
    const g = geometry[model];
    const finish = parseColour(finishColour);
    const hasTop = ['cap','veneer'].includes(s.top_type);
    const bodyId = s.body_wood_single || s.body_core_wood;
    const topId = hasTop ? s.top_wood_selection : bodyId;
    const pending = [];
    ['fretboard', ...(hasTop ? ['top_wood_selection'] : ['body_wood_single','body_core_wood'])].forEach(id=>{
      if (s[id] && !wood(s[id])) pending.push(id);
    });
    if (s.color_headstock === 'head_plate') pending.push('color_headstock');
    if (['others','nova_custom','guitar_hh_passive_custom','häussel_bar'].includes(s.pickups)) pending.push('pickups');
    if (s.inlay_type === 'inlay_custom' || s.inlay_dot_pos === 'pos_custom') pending.push('inlay_type');
    if (s.extra_finish_burst === 'burst_add') pending.push('extra_finish_burst');
    if (s.extra_finish_flake === 'flake_add') pending.push('extra_finish_flake');
    if (s.finger_ramp === 'ramp_wood') pending.push('finger_ramp');
    if (s.nut_material === 'nut_others') pending.push('nut_material');
    return {model, g, selections:s, labels:labels || {}, finish, hasTop, bodyId, topId, pending,
      bodyColour:wood(topId), boardColour:wood(s.fretboard), metal:metals[s.hardware_color] || metals.hw_chrome,
      bridgeColour:s.hardware_bridge === 'nova_parts' ? metals.hw_black : (metals[s.hardware_color] || metals.hw_chrome)};
  }
  function renderSvg(state, view, language) {
    const g = state.g;
    if (!g) return '';
    const s = state.selections, t = copy[language] || copy.en;
    const prefix = 'rf-preview-' + state.model.toLowerCase();
    const unknown = `url(#${prefix}-unknown)`;
    const fill = state.bodyColour || unknown;
    const finish = state.finish;
    const polygon = (points, attrs='') => `<polygon points="${pts(points)}" ${attrs}/>`;
    const path = (d, attrs='') => `<path d="${d}" ${attrs}/>`;
    const line = (a,b,attrs='') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" ${attrs}/>`;
    const label = id => esc(state.labels[id] || s[id] || '');
    const rect = (r,attrs='') => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="3" ${r.angle ? `transform="rotate(${r.angle} ${r.x+r.w/2} ${r.y+r.h/2})"` : ''} ${attrs}/>`;
    const bodyPaint = finish.opaque && finish.colour ? finish.colour : fill;
    let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${g.views[view] || g.views.full}" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-preview-svg="${state.model}">
      <title id="${prefix}-title">${esc(state.model+' · '+t.live)}</title><desc id="${prefix}-desc">${esc(t.note+' '+t.tone+' '+t.symbols)}</desc>
      <defs><pattern id="${prefix}-unknown" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#5e6670"/><path d="M0 12L12 0" stroke="#b4bdc7" stroke-width="2"/></pattern>
      <clipPath id="${prefix}-body">${path(g.body)}</clipPath><clipPath id="${prefix}-head">${path(g.head)}</clipPath></defs>
      <g transform="${g.transform}">`;
    out += `<g data-layer="body" data-option="${esc(state.topId || '')}" data-material="${esc(state.bodyId || '')}">${path(g.body,`fill="${bodyPaint}" stroke="#2a2520" stroke-width="3"`)}<title>${label(state.hasTop?'top_wood_selection':s.body_wood_single?'body_wood_single':'body_core_wood')}</title></g>`;
    if (finish.colour && !finish.opaque) out += `<g data-layer="finish" clip-path="url(#${prefix}-body)">${path(g.body,`fill="${finish.colour}" opacity=".68"`)}</g>`;
    if (g.pickguard) out += `<g data-layer="reference-pickguard">${path(g.pickguard,'fill="#202427" stroke="#b9b8ab" stroke-width="1.5"')}</g>`;
    // No invented figured wood textures, contour reflections, cap thickness or rear cavities.
    out += `<g data-layer="headstock" data-option="${esc(s.color_headstock || '')}">${path(g.head,`fill="${s.color_headstock === 'head_plate' ? unknown : bodyPaint}" stroke="#2a2520" stroke-width="3"`)}`;
    if (finish.colour && !finish.opaque && s.color_headstock !== 'head_plate') out += path(g.head,`fill="${finish.colour}" opacity=".68"`);
    out += '</g>';
    out += `<g data-layer="fretboard" data-option="${esc(s.fretboard || '')}">${polygon(g.board,`fill="${state.boardColour || unknown}" stroke="#d1be99" stroke-width="2"`)}<title>${label('fretboard')}</title></g>`;
    const fretless = s.fret_type === 'fretless';
    const frets = [];
    for (let n=1;n<=24;n++) {
      const fraction = (1-Math.pow(2,-n/12))/.75;
      frets.push([point(g.board[0],g.board[3],fraction),point(g.board[1],g.board[2],fraction)]);
    }
    if (!fretless || s.fretline === 'line_yes') {
      const colour = fretless ? '#aa9c86' : s.fret_material === 'mat_brass' ? '#d6b872' : '#c2c9cc';
      out += `<g data-layer="frets" data-count="24" stroke="${colour}" stroke-width="${fretless?1:2}">${frets.map(pair=>line(...pair)).join('')}</g>`;
    }
    const nutColours = {guitar_bone_nut:'#e8dfcc',nut_bone:'#e8dfcc',nut_horn:'#262420',nut_guayacan:'#79663e',nut_brass:'#d6b872',nut_guide:'#b8c3cc'};
    out += `<g data-layer="nut" data-option="${esc(s.nut_material || '')}" data-zero-fret="${state.model !== 'GRAMR' && !fretless}">${line(g.board[0],g.board[1],`stroke="${nutColours[s.nut_material]||'#77808b'}" stroke-width="4"`)}`;
    if (state.model !== 'GRAMR' && !fretless) out += line(point(g.board[0],g.board[3],.008),point(g.board[1],g.board[2],.008),'stroke="#c2c9cc" stroke-width="2"');
    out += '</g>';
    if (['inlay_dot','inlay_oval'].includes(s.inlay_type) && s.inlay_dot_pos !== 'pos_custom') {
      out += '<g data-layer="inlays" fill="#ddd9c8">';
      [3,5,7,9,12,15,17,19,21,24].forEach(n=>{
        const p = point(frets[n-1][0],frets[n-1][1],s.inlay_dot_pos==='pos_left'?.2:s.inlay_dot_pos==='pos_right'?.8:.5);
        out += `<ellipse cx="${p[0]-(g.horizontal?5:0)}" cy="${p[1]-(g.horizontal?0:5)}" rx="${s.inlay_type==='inlay_oval'?6:3}" ry="3"/>`;
      });
      out += '</g>';
    }
    out += `<g data-layer="pickups" data-option="${esc(s.pickups || '')}" fill="${state.pending.includes('pickups')?unknown:'#25282b'}" stroke="#a1a9b2" stroke-width="1.5" stroke-dasharray="5 3"><title>${label('pickups')} · ${esc(t.schematic)}</title>`;
    g.pickups.forEach(r=>{out+=rect(r);});
    out += '</g>';
    out += `<g data-layer="bridge" data-option="${esc(s.hardware_bridge || '')}" data-colour="${state.bridgeColour}" stroke="${state.bridgeColour}" stroke-width="10" stroke-linecap="square" stroke-dasharray="4 4"><title>${label('hardware_bridge')} · ${esc(t.schematic)}</title>${line(g.bridge[0],g.bridge[1])}</g>`;
    out += `<g data-layer="strings" data-count="${g.strings}" stroke="#e0e0da" opacity=".75">`;
    for (let i=0;i<g.strings;i++) {
      const fraction = .08 + .84*i/(g.strings-1);
      out += line(point(g.board[0],g.board[1],fraction),point(g.bridge[0],g.bridge[1],fraction),`stroke-width="${1.7-i*.18}"`);
    }
    out += '</g>';
    out += `<g data-layer="hardware" data-option="${esc(s.hardware_color || '')}" fill="${s.knob==='knob_wood'?fill:state.metal}" stroke="#656668" stroke-width="2"><title>${label('hardware_color')}</title>`;
    g.controls.forEach(p=>{out+=`<circle cx="${p[0]}" cy="${p[1]}" r="9"/>`;});
    return out + '</g></g></svg>';
  }
  function Component(props) {
    const React = window.React, h = React.createElement;
    const [view,setView] = React.useState('full');
    const t = copy[props.language] || copy.en;
    const state = scene(props.model,props.selections,props.finishColor,props.labels);
    const s = state.selections;
    const rows = ['body_wood_single','body_core_wood','body_wing_wood','top_type','top_wood_selection','fretboard','color_top','color_back_side','color_headstock','pickups','hardware_bridge','hardware_machine_head','hardware_color'].filter(id=>s[id]);
    return h('section',{className:'rf-preview',id:'instrument-preview','aria-labelledby':'preview-title','data-preview-model':props.model},
      h('div',{className:'rf-preview-heading'},h('div',null,h('p',null,t.live),h('h2',{id:'preview-title'},props.model)),h('span',{className:'rf-preview-mark','aria-hidden':true},'RF / 01')),
      h('div',{className:'rf-preview-stage',dangerouslySetInnerHTML:{__html:renderSvg(state,view,props.language)}}),
      !state.g && h('p',{role:'status'},t.noShape),
      h('div',{className:'rf-preview-views','aria-label':t.title},['full','body','neck','head'].map(id=>h('button',{type:'button',key:id,'data-preview-view':id,'aria-pressed':view===id,onClick:()=>setView(id)},t[id]))),
      h('p',{className:'rf-preview-parts','data-preview-parts':true},t.schematic+' · '+props.labels.pickups+' · '+props.labels.hardware_bridge),
      h('p',{className:'rf-preview-note'},t.note),
      state.finish.status==='unmapped' && h('p',{className:'rf-preview-warning',role:'status'},t.textOnly),
      state.finish.colour && s.color_top==='top_oil' && h('p',{className:'rf-preview-warning'},t.oil),
      h('details',{className:'rf-preview-scope'},h('summary',null,t.scope),
        h('p',null,t.tone),h('p',null,t.symbols),h('p',null,t.geometry),
        state.g && h('a',{href:state.g.source,target:'_blank',rel:'noopener noreferrer'},t.reference),
        h('dl',null,rows.map(id=>{
          const status=state.pending.includes(id)?t.pending:['hardware_machine_head','color_back_side','body_wing_wood'].includes(id)?t.hidden:['pickups','hardware_bridge','hardware_color'].includes(id)?t.schematic:id.startsWith('body_')&&(state.hasTop||state.finish.opaque)?t.covered:t.material;
          return h('div',{key:id,'data-preview-category':id,'data-option':s[id]},h('dt',null,props.categoryTitles[id]||id),h('dd',null,props.labels[id],h('small',null,status)));
        })),
        state.pending.length>0 && h('p',{'data-preview-pending':true},t.pending+': '+state.pending.map(id=>props.categoryTitles[id]||id).join(', '))),
      h('span',{className:'rf-preview-sr','aria-live':'polite','aria-atomic':'true'},t.updated+' · '+props.model+' · '+Object.values(props.labels).join(', '))
    );
  }
  function ColourControls(props) {
    const h = window.React.createElement, t = copy[props.language] || copy.en, finish = parseColour(props.value);
    const colours = ['', '#9d282b','#275f89','#24262a','#eee8dc','#35624b'];
    const change = colour => props.onChange(colour ? (finish.opaque?'solid ':'transparent ')+colour : '');
    return h('div',{className:'rf-colour-controls'},
      h('p',null,t.colourHelp),
      h('div',{className:'rf-colour-swatches'},colours.map((colour,i)=>h('button',{
        type:'button',key:i,title:t.colourNames[i],'aria-label':t.colourNames[i],'aria-pressed':(finish.colour||'')===colour&&finish.status!=='unmapped',
        style:{background:colour||'#c5a779'},onClick:()=>change(colour),'data-preview-swatch':colour||'natural'
      },i===0?'N':'')),h('label',null,t.colour,h('input',{type:'color',value:finish.colour||'#9d282b',onChange:event=>change(event.target.value),'aria-label':t.colour}))),
      h('div',{className:'rf-colour-modes'},[false,true].map(opaque=>h('button',{type:'button',key:String(opaque),disabled:!finish.colour,'aria-pressed':finish.opaque===opaque,onClick:()=>props.onChange((opaque?'solid ':'transparent ')+finish.colour)},opaque?t.solid:t.transparent)))
    );
  }
  return {scene, renderSvg, parseColour, wood, copy, Component, ColourControls};
}));
