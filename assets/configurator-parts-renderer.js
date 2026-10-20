/* Test-only parts: original SVGs informed by manufacturer drawings/photos.
 * Product identity and placement are separate: fit/positions are illustrative,
 * never routing data. Unsupported custom products retain the source explicitly. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.RavenForgeParts=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
  const screw=(x,y,r=1.5)=>circle(x,y,r,'#9a9d9b','stroke="#101314" stroke-width=".6"')+path(`M${x-r*.5},${y}h${r}`,'none','stroke="#171a1b" stroke-width=".6"');
  function definitions(p,state){
    const metal=(id,colour)=>`<linearGradient id="${p}-${id}" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#171b1d"/><stop offset=".17" stop-color="${colour}"/><stop offset=".28" stop-color="#faf6e9"/><stop offset=".39" stop-color="${colour}"/><stop offset=".79" stop-color="${colour}"/><stop offset="1" stop-color="#202528"/></linearGradient>`;
    return metal('part-metal',state.metal)+pickupDefinitions(p)+`<linearGradient id="${p}-part-plastic" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="#414747"/><stop offset=".11" stop-color="#292d2e"/><stop offset=".52" stop-color="#15181a"/><stop offset="1" stop-color="#080b0c"/></linearGradient><linearGradient id="${p}-part-sheen"><stop stop-color="#fff6de" stop-opacity=".22"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>`;
  }
  // Keep the supplied pickup envelopes. Deferred third-pickup layouts must not
  // invent another housing or change existing parts without a placement drawing.
  const pickupPlan=state=>(state.g.pickups||[]).map(r=>({...r}));
  function guard(state,p){
    const id=state.pickguard;if(id==='none')return '';
    const d=state.g.pickguard;if(!d)return '';
    const material=state.pickguardMaterial||(id==='wood'?'pg_wood':'pg_aluminium'),gloss=state.pickguardFinish==='pg_gloss';
    const colours={black:'#181b1e',white:'#efeee7',ivory:'#d9ceb2',red:'#5d1c2a',match:state.finish.colour||state.bodyColour||'#7b5c3a'};
    const fill=id==='wood'?`url(#${p}-material)`:(colours[id]||colours.black);
    let out=`<g data-layer="pickguard" data-option="${id}" data-material="${material}" data-colour="${id==='wood'?state.topId:fill}" data-finish="${gloss?'gloss':'matte'}" data-appearance="${state.g.pickguardProvenance?.kind||'drawing-contour'}">`;
    out+=path(d,'#080a0b','stroke="#080a0b" stroke-width="4"');
    if(material==='pg_acrylic')out+=path(d,'none','data-surface="acrylic-edge" stroke="#aab7bd" stroke-opacity=".65" stroke-width="2.1"');
    if(material==='pg_aluminium')out+=`<defs><linearGradient id="${p}-guard-metal" x1="0" y1="0" x2="1" y2=".7"><stop stop-color="${fill}"/><stop offset=".28" stop-color="#e7e9e8"/><stop offset=".4" stop-color="${fill}"/><stop offset=".7" stop-color="#a8afb1"/><stop offset="1" stop-color="${fill}"/></linearGradient><pattern id="${p}-guard-brush" width="4" height="3" patternUnits="userSpaceOnUse"><path d="M0 .5H4" stroke="#fff" stroke-opacity=".16" stroke-width=".35"/><path d="M0 2H4" stroke="#000" stroke-opacity=".12" stroke-width=".35"/></pattern></defs>`;
    out+=path(d,material==='pg_aluminium'?`url(#${p}-guard-metal)`:fill,`stroke="${material==='pg_wood'?'#715236':'#343637'}" stroke-width=".8" ${id==='wood'&&state.finish.colour?`filter="url(#${p}-surface-dye)"`:''}`);
    if(material==='pg_aluminium')out+=path(d,`url(#${p}-guard-brush)`,'data-surface="brushed-aluminium"');
    out+=path(d,`url(#${p}-part-sheen)`,`opacity="${gloss?1:.24}"`);
    if(gloss)out+=path(d,'none','stroke="#f3f0e2" stroke-opacity=".28" stroke-width=".65"');
    if(state.model==='GRAMR')for(const [x,y] of state.g.pickguardScrews)out+=screw(x,y,1.8);
    return out+'</g>';
  }
  function ramps(state,p){
    if(state.model==='GRAMR')return '';
    const s=state.selections,plan=pickupPlan(state),r=plan[0],last=plan[plan.length-1],a=state.g.board[3],b=state.g.board[2];let out='';
    const raised=(name,id,points,fill)=>`<g data-layer="${name}" data-option="${id}" data-appearance="proposed-placement"><polygon points="${points.map(v=>v.join(',')).join(' ')}" fill="${fill}" ${id!=='extense_fretless'&&state.finish.colour?`filter="url(#${p}-surface-dye)"`:''} stroke="#2c231b" stroke-width="2.2"/><polygon points="${points.map(v=>v.join(',')).join(' ')}" fill="url(#${p}-part-sheen)" stroke="#cfb994" stroke-opacity=".5" stroke-width=".6"/></g>`;
    if(s.fretboard_extense==='extense_slap'||s.fretboard_extense==='extense_fretless'){
      const top=Math.max(a[1],b[1])+5,bottom=r.y-13;
      if(bottom>top+4)out+=raised('fretboard-extension',s.fretboard_extense,[[a[0],a[1]+4],[b[0],b[1]+4],[b[0]+1,bottom-((r.angle||0)?13:0)],[a[0]-1,bottom]],`url(#${p}-${s.fretboard_extense==='extense_fretless'?'board-material':'material'})`);
    }
    // Finger ramps are deferred at the owner's request (2026-10-20).
return out;
  }
  // Preview coordinates only, deliberately separate from every source knob.
  // They are NOT drilling positions and never enter order/PDF state.
  const controlProposals={
    EDDA:{kill:[601,1026],coils:[]},
    EMBLA:{kill:[224,880],coils:[[250,880],[276,880]]},
    ASKR:{kill:[218,1068],coils:[[244,1068],[270,1068]]},
    // Upright front: right of the pickguard centre, slightly above it.
    GRAMR:{kill:[796,210],coils:[]}
  };
  // Functions are from manufacturer documents; installation coordinates and
  // unspecified pot variants are display proposals, never order/drilling data.
  const electronicsProfiles={
    passive:{bands:0,knobs:[['volume'],['blend'],['tone']]},
    fishman:{bands:2,knobs:[['volume'],['blend'],['bass'],['treble']]},
    zuta:{bands:3,knobs:[['volume'],['blend'],['bass'],['mid'],['treble']]},
    glockenklang:{bands:3,knobs:[['volume'],['blend'],['bass'],['mid'],['treble']]},
    darkglass:{bands:3,knobs:[['volume'],['blend'],['bass'],['mid'],['high_mid']]},
    lhz:{bands:3,knobs:[['volume'],['blend'],['bass'],['mid'],['treble']]},
    noll:{bands:4,knobs:[['volume'],['blend'],['bass'],['low_mid'],['high_mid'],['treble']]},
    john_east:{bands:3,knobs:[['volume'],['blend'],['bass','treble'],['mid','mid_frequency'],['tone']]},
    nfp:{bands:'filter',knobs:[['volume'],['blend'],['neck_filter'],['bridge_filter']]},
    underhill:{bands:'filter',knobs:[['volume'],['blend'],['neck_filter','neck_resonance'],['bridge_filter','bridge_resonance'],['bass','bass_frequency']]},
    eq01:{bands:'filter',knobs:[['volume','blend'],['neck_filter','neck_resonance'],['bridge_filter','bridge_resonance'],['treble_filter','treble_level']]},
    guitar_passive:{bands:0,knobs:[['volume'],['tone']]},
    guitar_zuta_core:{bands:'planned',knobs:[['volume'],['tone']]}
  };
  // ASKR/EMBLA coordinates use the current PDF-vector front geometry.
  // Whole layouts, not a prefix of the old holes. Upper controls handle level /
  // balance; tone and filter controls form a separate lower arc. Coordinates are
  // display fits inside each model's control area, never drilling dimensions.
  const controlLayouts={
    EDDA:{
      3:[[640,899],[654,940],[642,983]],
      4:[[637,892],[654,925],[657,959],[642,993]],
      5:[[635,892],[658,922],[625,937],[660,966],[638,997]],
      6:[[635,892],[660,920],[626,932],[660,954],[628,973],[652,998]]
    },
    EMBLA:{
      3:[[237,774],[262,808],[249,845]],
      4:[[235,771],[266,794],[231,823],[267,847]],
      5:[[234,768],[263,791],[230,814],[275,822],[250,849]],
      6:[[232,766],[260,786],[230,804],[274,818],[229,841],[268,848]]
    },
    ASKR:{
      3:[[241,943],[269,987],[248,1036]],
      4:[[238,941],[267,969],[237,1008],[273,1034]],
      5:[[237,936],[263,962],[232,993],[277,1002],[254,1035]],
      6:[[235,935],[265,960],[231,990],[278,998],[230,1031],[275,1032]]
    }
  };
  // ASKR Fishman: volume / blend / bass / treble in an even outer arc.
  const askrFishmanArc=[[244,942],[263,972],[273,1006],[273,1041]];
  function electronicsPlan(state){
    const s=state.selections,ref=electronicsProfiles[s.electronics];
    if(!ref||['control_custom','guitar_custom_wiring'].includes(s.control_layout))return null;
    const guitar=state.model==='GRAMR',fishmanArc=state.model==='ASKR'&&s.electronics==='fishman',positions=fishmanArc?askrFishmanArc:guitar?state.g.controls:(controlLayouts[state.model]||state.g.controlLayouts)?.[ref.knobs.length];
    if(!positions)return null;
    return {...ref,layout:fishmanArc?'fishman-four-control-arc':guitar?'guitar-two-pot':ref.knobs.length===3?'three-control-arc':ref.knobs.length===4?'two-plus-two':ref.knobs.length===5?'two-plus-three':'two-plus-four',knobs:ref.knobs.map((functions,index)=>({xy:[...positions[index]],type:'knob',index,functions:[...functions],stacked:functions.length>1,placement:guitar?'source-retained':'electronics-preview'}))};
  }
  function controlPlan(state){
    const s=state.selections,extras=state.specialOptions||[],positions=state.g.controls||[];
    const plan=electronicsPlan(state)?.knobs||positions.map((xy,i)=>({xy:[...xy],type:'knob',index:i,functions:[],placement:'source-retained'}));
    const proposal=controlProposals[state.model]||state.g.controlProposals;
    if(!proposal)return plan;
    const add=(xy,type,fn)=>plan.push({xy:[...xy],type,index:plan.length,functions:[fn],placement:'preview-only-unconfirmed'});
    // Stable locations: toggling one option must not move another control.
    if(extras.includes('kill_switch'))add(proposal.kill,'kill','kill_switch');
    const count=['EDDA','GRAMR'].includes(state.model)||['emg','fishman'].includes(s.pickups)||s.electronics==='fishman'?0:Number((s.coil_switch||'').match(/^coil_([12])_/)?.[1]||0);
    proposal.coils.slice(0,count).forEach(xy=>add(xy,'toggle',s.coil_switch));
    if(extras.includes('dual_tone')&&plan.length&&['passive','guitar_passive'].includes(s.electronics))plan[0].functions.push('dual_tone');
    return plan;
  }
  function controls(state,p,radius){
    const plan=controlPlan(state),metal=`url(#${p}-part-metal)`;let out='<g data-layer="control-options" data-placement="additive-preview-proposal">';
    for(const {xy:[x,y],type,functions,index,placement} of plan){if(type==='knob'&&!functions.includes('dual_tone'))continue;
      out+=`<g data-control-index="${index}" data-control-type="${type}" data-placement="${placement}" data-functions="${functions.join(' ')}" transform="translate(${x} ${y})">`;
      if(type==='kill')out+=circle(0,1,radius+1,'#121617')+circle(0,0,radius,metal,'stroke="#151b1c" stroke-width=".9"')+circle(0,0,radius*.67,'#24292a','stroke="#bbc1be" stroke-width=".65"')+circle(-radius*.18,-radius*.22,radius*.27,'#717b7a','opacity=".6"');
      if(type==='toggle'){
        out+=circle(1.5,2,radius*.78,'#040707','opacity=".7"')+circle(0,0,radius*.72,metal,'stroke="#151a1c" stroke-width=".6"');
        out+=`<polygon points="${Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3)*radius*.52,Math.sin(i*Math.PI/3)*radius*.52].map(n=>n.toFixed(2)).join(',')).join(' ')}" fill="${metal}" stroke="#404748" stroke-width=".6"/>`+circle(0,0,radius*.25,'#101415');
        out+=path(`M0 0L${radius*.32} ${-radius*1.15}`,'none',`stroke="#101718" stroke-width="${radius*.44}" stroke-linecap="round"`)+path(`M0 -.4L${radius*.32} ${-radius*1.15}`,'none',`stroke="${state.metal}" stroke-width="${radius*.27}" stroke-linecap="round"`)+path(`M.1 -.8L${radius*.28} ${-radius*1.09}`,'none','stroke="#edf0e8" stroke-width=".65" stroke-linecap="round"');
      }
      if(type==='knob')out+=circle(0,0,radius+1,'none','stroke="#c9bc99" stroke-width="1.1"')+path(`M${-radius*.45},${-radius-4}l${radius*.45},-3 ${radius*.45},3`,'none','stroke="#eee4c8" stroke-width="1.1"');
      out+='</g>';
    }return out+'</g>';
  }
  function knobs(state,p,radius){
    const eq=electronicsPlan(state);if(!eq)return '';
    const wood=state.selections.knob==='knob_wood',metal=`url(#${p}-part-metal)`;
    return `<g data-layer="knobs" data-count="${eq.knobs.length}" data-bands="${eq.bands}" data-electronics="${state.selections.electronics}" data-layout="${eq.layout}" data-placement="${state.model==='GRAMR'?'source-retained':'electronics-preview'}">`+eq.knobs.map(({xy:[x,y],functions,stacked,index})=>{
      const r=radius*(stacked?1.18:1),fill=wood?`url(#${p}-knob-material)`:metal;
      let out=`<g data-knob-index="${index}" data-knob-functions="${functions.join(' ')}" data-stacked="${stacked}" transform="translate(${x} ${y})"><title>${functions.join(' / ')}</title>`;
      out+=circle(.5,2,r+1.4,'#030506','opacity=".8"')+circle(0,0,r,fill,`stroke="#141819" stroke-width="1" ${wood&&state.finish.colour?`filter="url(#${p}-surface-dye)"`:''}`)+circle(0,0,r,`url(#${p}-knob-shade)`);
      for(let i=0;i<24;i++){const a=i*Math.PI/12;out+=path(`M${Math.cos(a)*r*.88} ${Math.sin(a)*r*.88}L${Math.cos(a)*r*.98} ${Math.sin(a)*r*.98}`,'none','stroke="#111516" stroke-opacity=".55" stroke-width=".5"');}
      if(stacked)out+=circle(0,-1.1,r*.65,'#080b0c','stroke="#101415" stroke-width="1.4"')+circle(0,-1.8,r*.60,fill)+circle(0,-1.8,r*.60,`url(#${p}-knob-shade)`)+path(`M${r*.8} 0h${-r*.2}`,'none','stroke="#dedacf" stroke-width=".8"');
      out+=path(`M0 ${-r*(stacked?.72:.75)}v${r*.24}`,'none','stroke="#eee9dc" stroke-width=".85"');
      return out+'</g>';
    }).join('')+'</g>';
  }

  // Only explicit product identities belong here. Never guess an unspecified
  // custom cover/button, or map every product to one generic family symbol.
  const references={
    pickups:{
      nova_mm:{w:89,h:48.8,style:'nova-omnia-mm',url:'https://www.nova-pickups.com/products/omnia-b4-mm'},
      häussel_triple:{w:89,h:48,style:'haeussel-mm-triple',url:'https://www.haeussel.com/fileadmin/pdf/Katalog2014_en.pdf#page=15'},
      häussel_bar:{w:101,h:36,style:'haeussel-bassbar',scope:'catalog-reference',note:'bassbar-custom',url:'https://www.haeussel.com/fileadmin/pdf/Katalog2014_en.pdf#page=18'},
      emg:{w:102,h:38,style:'40twx',url:'https://www.emgpickups.com/40twx.html'},
      guitar_lundgren_m6:{w:70,h:38,style:'m6-open-slugs',url:'https://shop.lundgrenpickups.com/products/m6'},
      delano_sbc:{w:100,h:36,style:'sbc',url:'https://www.delano.de/sbc_5_he_s_4/sbc_5_he_s_4_details.html'},
      delano_ts:{w:108,h:32,style:'times-square',url:'https://www.delano.de/downloads/sbc5_tf.pdf'},
      askr_delano_sbc5_e:{w:102,h:38,style:'sbc-e',url:'https://www.delano.de/sbc_5_he_s_4_e/sbc_5_he_s_4_e_details.html'},
      fishman:{w:102.11,h:37.89,style:'fluence',url:'https://fishman.com/dp/fluence-bass-soapbar-5-string-pickups/'}
    },
    hardware_bridge:{
      nova_parts:{style:'nova-dingwall-retrofit-5',scope:'manufacturer-drawing',url:'https://www.ebay.com/itm/188031829511',drawing:'https://i.ebayimg.com/images/g/pBMAAeSwjOZpLylJ/s-l1600.webp',width:102,spacing:18,perpendicularDepth:43.7,angle:55,channelWidth:12,fit:'unconfirmed'},
      ets_custom:{style:'ets-tuning-fork',scope:'catalog-reference',url:'https://www.ets-hardware.com/index.php/en/produkte-2'},
      schaller_3d:{style:'schaller-3d',scope:'manufacturer-drawing',url:'https://schaller.info/en/3d-5/1214'},
      payson:{style:'payson-fanned-v4',url:'https://www.paysonbass.com/store/p152/Payson-Fanned-Fret-Bass-Bridge.html'},
      babicz_top:{style:'fch-top',url:'https://www.fullcontacthardware.com/fch-5-string-bass-bridge'},
      hipshot_kick:{style:'masskicker',url:'https://hipshotproducts.com/products/5-string-masskicker-bass-bridge'},
      gotoh_404BO:{style:'404bo',url:'https://g-gotoh.com/images/pdf/404BO-4-Dim.pdf'},
      hipshot_a:{style:'a-style',url:'https://docs.hipshotproducts.com/5A500-708_5_STG_A_STYLE_BASS_BRIDGE_708_SPACING_DIMENSIONS.pdf'},
      hipshot_b:{style:'b-style',url:'https://docs.hipshotproducts.com/5B500-708_5_STG_B_STYLE_BASS_BRIDGE_708_SPACING_DIMENSIONS.pdf'},
      guitar_gotoh_510t:{style:'510t-fe1',url:'https://g-gotoh.com/images/pdf/510T-FE1-Dim.pdf'}
    },
    hardware_machine_head:{
      graphtech:{key:'ratio-y',washer:18,post:13.9,keyOffset:-8,scope:'photo-reference',url:'https://graphtech.com/products/bass-ratio-5-string-3-2-y-style-button-please-select-finish-prb-5320'},
      schaller_bm:{key:'bm-schaller',washer:22,post:14,keyOffset:-12,url:'https://schaller.info/media/ed/c7/69/1764676097/1025.pdf'},
      schaller_m4_locking:{key:'m4-90',washer:18,post:11,keyOffset:-9,locking:true,url:'https://schaller.info/en/m4-90/10540401.22.70'},
      schaller_bm_lt:{key:'bm-light',washer:16.8,keyOffset:-13.25,url:'https://schaller.info/media/pdf/65/6a/31/TZ_1027.pdf'},
      gotoh_707:{key:'gotoh-butterfly',washer:18,keyOffset:-9,url:'https://g-gotoh.com/images/pdf/GB707-Dim.pdf'},
      gotoh_350:{key:'gotoh-butterfly',washer:20,keyOffset:-9,url:'https://g-gotoh.com/images/pdf/GB350-Dim.pdf'},
      gotoh_528:{key:'gb528-clover',washer:22,keyOffset:-13.5,url:'https://g-gotoh.com/images/pdf/GB528-Dim.pdf'},
      hipshot_ul_38:{key:'ultralite-y',washer:17,url:'https://docs.hipshotproducts.com/20650_ULTRALITE_3-8_Y_KEY.pdf'},
      guitar_gotoh_sg381:{key:'gotoh-07',washer:14,post:6,keyOffset:-7.8,url:'https://g-gotoh.com/images/pdf/SG381-Dim.pdf'}
    }
  };
  const profile=(state,category)=>category==='pickups'&&state.model==='EDDA'&&state.selections.pickups==='nova_custom'
    ? {...references.pickups.nova_mm,scope:'catalog-reference',note:'nova-custom'}
    :category==='hardware_bridge'&&((state.model==='ASKR'&&state.selections.hardware_bridge==='ets_custom')||(state.model!=='ASKR'&&state.selections.hardware_bridge==='nova_parts'))?undefined:references[category]?.[state.selections[category]];
  function selectedPickupPlan(state){
    const ref=profile(state,'pickups');if(!ref)return pickupPlan(state);
    const base=state.model==='EDDA'?references.pickups.nova_mm:state.model==='ASKR'?references.pickups.fishman:references.pickups.delano_sbc;
    return pickupPlan(state).map(r=>{
      const w=r.w*ref.w/(state.g.pickupReferenceMM?.[0]||base.w),h=r.h*ref.h/(state.g.pickupReferenceMM?.[1]||base.h);
      return {...r,x:r.x+(r.w-w)/2,y:r.y+(r.h-h)/2,w,h};
    });
  }
  const box=(x,y,w,h,rx,fill,attrs='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${attrs}/>`;
  function pickupDefinitions(p){
    return `<linearGradient id="${p}-pickup-face" x1=".18" y1="0" x2=".55" y2="1"><stop stop-color="#323335"/><stop offset=".3" stop-color="#222326"/><stop offset=".8" stop-color="#18191c"/><stop offset="1" stop-color="#101114"/></linearGradient><linearGradient id="${p}-pickup-bevel" x1=".15" y1="0" x2=".65" y2="1"><stop stop-color="#55575a"/><stop offset=".07" stop-color="#35373a"/><stop offset=".4" stop-color="#171a19"/><stop offset=".85" stop-color="#070909"/><stop offset="1" stop-color="#333734"/></linearGradient><radialGradient id="${p}-pickup-crown" cx=".28" cy=".18" r=".95"><stop stop-color="#fff" stop-opacity=".08"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient><radialGradient id="${p}-pole" cx=".32" cy=".25"><stop stop-color="#ddd9cb"/><stop offset=".4" stop-color="#a5a59c"/><stop offset=".83" stop-color="#727975"/><stop offset="1" stop-color="#c6c8bf"/></radialGradient><pattern id="${p}-pickup-grain" width="7" height="7" patternUnits="userSpaceOnUse">${Array.from({length:45},(_,i)=>circle((i*2.371)%7,(i*i*.913)%7,.045+(i%3)*.025,i%3?'#b8bbc0':'#020305',`opacity="${i%3?.09:.20}"`)).join('')}</pattern>`;
  }
  function pickupUnit(ref,p,topView=false){
    const w=ref.w,h=ref.h,face=`url(#${p}-pickup-face)`,bevel=`url(#${p}-pickup-bevel)`,grain=`url(#${p}-pickup-grain)`;
    let out=topView?'':box(-.8,1.6,w+1.6,h+1.7,3.8,'#000202','opacity=".6"');
    if(ref.style==='haeussel-mm-triple'){
      for(const [x,y] of [[-2.5,h*.5],[w+2.5,h*.23],[w+2.5,h*.77]])out+=circle(x,y,5.8,bevel,'stroke="#141719" stroke-width=".6"')+circle(x,y,1.6,'#060809');
      out+=box(0,1.8,w,h,2.6,'#080b0d','stroke="#080b0d" stroke-width=".8"')+box(0,0,w,h-1,2.6,bevel)+box(1,.8,w-2,h-2.8,2,'#33373a')+box(1,.8,w-2,h-2.8,2,grain)+box(1,.8,w-2,h-2.8,2,`url(#${p}-pickup-crown)`);
      for(let i=0;i<4;i++){
        const x=w/2+(i-1.5)*18.5;
        for(const y of [11.4,35.6])out+=circle(x,y,4.95,'#070a0b')+circle(x,y,4.55,`url(#${p}-pole)`,'data-pole="large" stroke="#c6cbc4" stroke-width=".2"');
        for(const dx of [-3.1,3.1])out+=circle(x+dx,h/2,1.95,'#080c0c')+circle(x+dx,h/2,1.65,`url(#${p}-pole)`,'data-pole="small"');
      }
      return out;
    }
    if(ref.style==='nova-omnia-mm'){
      // B4 MM: 89 x 48.8 mm housing, 101 mm including three mounting ears.
      // Four split rails, two on each row; no manufacturer logo is reproduced.
      for(const [x,y] of [[-2.5,h*.25],[-2.5,h*.75],[w+2.5,h*.5]])out+=circle(x,y,6,bevel,'stroke="#121416" stroke-width=".65"')+circle(x,y,1.5,'#070809');
      out+=box(0,1.8,w,h,3.1,'#08090b','stroke="#090b0d" stroke-width="1"')+box(0,0,w,h-1,3,bevel)+box(1.1,.8,w-2.2,h-3,2.3,'#535358')+box(1.1,.8,w-2.2,h-3,2.3,`url(#${p}-pickup-crown)`)+box(1.1,.8,w-2.2,h-3,2.3,grain);
      for(const y of [h*.32,h*.66])for(const x of [5,w/2+1.4]){
        const rw=w/2-6.4;
        out+=box(x-.5,y-.5,rw+1,2.8,.5,'#161a1c')+box(x,y,rw,1.9,.25,'#aeb6b7')+path(`M${x+.3} ${y+.2}h${rw-.6}`,'none','stroke="#eff1e9" stroke-width=".6"')+path(`M${x+.2} ${y+1.7}h${rw-.4}`,'none','stroke="#505b5d" stroke-width=".45"');
      }
      return out;
    }
    if(ref.style==='m6-open-slugs'){
      out+=box(-4,h/2-4,w+8,8,1.3,'#8b8a78','stroke="#302e25" stroke-width=".65"')+screw(-2,h/2,1.3)+screw(w+2,h/2,1.3);
      out+=box(-.6,0,w+1.2,h+1,7,'#151619','stroke="#323338" stroke-width="1"');
      for(let x=4;x<w-3;x+=.65)out+=path(`M${x} ${h-1}v2.5`,'none','stroke="#51535a" stroke-width=".18" stroke-opacity=".4"');
      for(let row=0;row<2;row++){
        const y=row*h/2;
        out+=box(.5,y+.5,w-1,h/2-1,8.5,bevel)+box(1.3,y+1.3,w-2.6,h/2-2.8,7.6,face)+box(1.3,y+1.3,w-2.6,h/2-2.8,7.6,grain);
        const cy=y+h/4;
        for(let i=0;i<6;i++){const x=9+i*10.4;out+=circle(x,cy,2.8,'#080b0a')+circle(x,cy,2.43,`url(#${p}-pole)`,'stroke="#bfc0b5" stroke-width=".2"');for(const r of [.6,1,1.5,2])out+=circle(x,cy,r,'none','stroke="#545b57" stroke-opacity=".22" stroke-width=".12"');}
        for(const x of [4.2,14.1,55.8])out+=circle(x,cy,.95,'#050808');
      }
      return out;
    }
    const recess=['sbc-e','40twx','fluence'].includes(ref.style),r=ref.style==='40twx'?3.17:ref.style==='times-square'?4.5:3.2;
    // Open side mounting recesses belong to the cover silhouette, not a dot
    // painted over a solid rectangle. Delano SBC instead has three round holes.
    const cover=`M${r} 0H${w-r}Q${w} 0 ${w} ${r}V${h/2-3.15}${recess?`H${w-1.1}a3.15 3.15 0 0 0 0 6.3H${w}`:`V${h/2+3.15}`}V${h-r}Q${w} ${h} ${w-r} ${h}H${r}Q0 ${h} 0 ${h-r}V${h/2+3.15}${recess?'H1.1a3.15 3.15 0 0 0 0 -6.3H0':`V${h/2-3.15}`}V${r}Q0 0 ${r} 0Z`;
    // ASKR's source spacing is a top projection: extrusion must not enlarge
    // the dimensioned housing or conceal the narrow gap between pickups.
    out+=(topView?'':path(cover,'#07080b','transform="translate(.35 2.2)" stroke="#08090c" stroke-width="1.8"'))+path(cover,bevel,topView?'':'stroke="#0b0c0e" stroke-width=".55"');
    out+=`<g transform="translate(1.25 1.1) scale(${(w-2.5)/w} ${(h-2.9)/h})">${path(cover,face)}${path(cover,`url(#${p}-pickup-crown)`)}${path(cover,grain)}</g>`;
    out+=path(`M${r+1} 1Q1 1 1 ${r+1}V${h/2-4} M${r+1} 1H${w-r-1}`,'none','stroke="#c0c3b8" stroke-opacity=".2" stroke-width=".4"');
    const mounting=ref.style==='haeussel-bassbar'?[[4,h/2],[w-4,4],[w-4,h-4]]:[[4,5],[4,h-5],[w-4,h/2]];
    if(!recess)for(const [x,y] of mounting)out+=circle(x,y,2.55,bevel)+circle(x,y,1.85,'#050608')+circle(x+.3,y+.55,.85,'#25262a')+path(`M${x-1} ${y+.5}h2`,'none','stroke="#101114" stroke-width=".45"');
    else for(const x of [1.3,w-1.3])out+=circle(x,h/2,1.45,'#080b0a')+screw(x,h/2,1.05);
    if(ref.style==='times-square')for(let row=0;row<2;row++)for(let i=0;i<5;i++){
      const x=14+i*17.8,y=row?h-7:5;
      out+=box(x-.6,y-.6,13.2,2.9,.35,'#080b09')+box(x,y,12,1.7,.15,'#868e89')+path(`M${x+.2} ${y+.3}h11.6`,'none','stroke="#e2e2d6" stroke-width=".45"')+path(`M${x+.2} ${y+1.4}h11.6`,'none','stroke="#454d48" stroke-width=".4"');
    }
    if(ref.style==='fluence'){
      const groove=`M3 ${h*.75}H${w*.41}C${w*.49} ${h*.75} ${w*.46} ${h*.25} ${w*.55} ${h*.25}H${w-3}`;
      out+=path(groove,'none','stroke="#070a09" stroke-width="1.4"')+path(groove,'none','transform="translate(0 .7)" stroke="#92988f" stroke-opacity=".65" stroke-width=".42"');
    }
    return out;
  }
  function pickups(state,p){
    const ref=profile(state,'pickups');if(!ref)return '';
    const guitar=state.model==='GRAMR';
    let out=`<g data-layer="pickups" data-option="${state.selections.pickups}" data-count="${state.g.pickups.length}" data-appearance="${ref.scope||'manufacturer-reference'}" data-placement="sample-fit" data-profile="${ref.style}" data-surface="photo-reference-abs" data-projection="source-envelope">`;
    (guitar?pickupPlan(state):selectedPickupPlan(state)).forEach((r,index)=>{
      const scaleX=guitar?r.h/ref.w:r.w/ref.w,scaleY=guitar?r.w/ref.h:r.h/ref.h;
      out+=`<g data-pickup-index="${index}" transform="translate(${r.x+r.w/2} ${r.y+r.h/2}) rotate(${guitar?-90:r.angle||0}) scale(${scaleX} ${scaleY}) translate(${-ref.w/2} ${-ref.h/2})">${pickupUnit(ref,p,state.model==='ASKR')}</g>`;
    });return out+'</g>';
  }
  function pickupThumbnail(model,option,p){
    const ref=profile({model,selections:{pickups:option}},'pickups');if(!ref)return '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -7 ${ref.w+24} ${ref.h+18}" aria-hidden="true" data-pickup-profile="${ref.style}" data-pickup-scope="${ref.scope||'manufacturer-reference'}"><defs>${pickupDefinitions(p)}</defs>${pickupUnit(ref,p)}</svg>`;
  }
  function bridge(state,p){
    const ref=profile(state,'hardware_bridge');if(!ref)return '';
    if(['ets-tuning-fork','schaller-3d'].includes(ref.style))return referencedBridge(state,p,ref);
    if(ref.style==='payson-fanned-v4')return paysonBridge(state,p);
    if(ref.style==='nova-dingwall-retrofit-5')return novaBridge(state,p);
    const n=state.g.strings,guitar=state.model==='GRAMR',id=state.selections.hardware_bridge;
    const [a,b]=state.g.bridge,cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;
    const w=guitar?83.5:ref.style==='404bo'?(n===4?86:100):(n===4?82:101.6),h=guitar?40:ref.style==='404bo'?58:ref.style==='fch-top'?66.8:ref.style==='masskicker'?60:50.8;
    const scale=guitar?Math.hypot(a[0]-b[0],a[1]-b[1])/54:(state.g.unitsPerMm||(state.model==='EDDA'?1.07:1.42));
    const metal=`url(#${p}-bridge-metal)`,f=state.bridgeColour;
    let out=`<g data-layer="bridge" data-option="${id}" data-colour="${f}" data-finish-fixed="${!!state.bridgeFinishFixed}" data-appearance="manufacturer-reference" data-placement="sample-fit" data-profile="${ref.style}"><defs><linearGradient id="${p}-bridge-metal" x1="0" y1="0" x2=".15" y2="1"><stop stop-color="${f}"/><stop offset=".18" stop-color="#e2e4df"/><stop offset=".25" stop-color="${f}"/><stop offset=".8" stop-color="${f}"/><stop offset="1" stop-color="#252a2c"/></linearGradient></defs><g transform="translate(${cx} ${cy}) rotate(${guitar?-90:0}) scale(${scale}) translate(${-w/2} -${h*.45})">`;
    out+=box(-.6,1.8,w+1.2,h,3,'#030505','opacity=".8"');
    if(guitar){
      out+=path('M0 4 Q0 0 4 0 H5 Q5 6 9 6 Q13 6 13 0 H61 Q61 6 65 6 Q69 6 69 0 H73.5 V16.5 H83.5 V40 H0 Z',metal,'stroke="#262b2c" stroke-width=".6"');
      out+=circle(75.5,28,4.7,metal,'stroke="#202426" stroke-width="1"')+path('M75.5 28 L79 6 L90 -18','none',`stroke="${f}" stroke-width="2.3" stroke-linecap="round"`);
    }else out+=box(0,0,w,h,ref.style==='404bo'?2:ref.style==='b-style'?6.4:3.2,metal,'stroke="#252b2d" stroke-width=".7"');
    if(!guitar&&ref.style!=='404bo')out+=box(4,5,w-8,h-10,ref.style==='b-style'?4:2,'#24292b','stroke="#727978" stroke-width=".6"');
    const spacing=guitar?10.8:18,offset=guitar?9.75:(w-(n-1)*spacing)/2;
    for(let i=0;i<n;i++){
      const x=offset+i*spacing,y=h*.34+(i%3)*1.8;
      if(ref.style==='fch-top'){
        out+=box(x-7.2,5,14.4,h-10,3,metal,'stroke="#4c5253" stroke-width=".7"')+box(x-6.3,y-4,12.6,26,3.5,metal,'stroke="#1c2426" stroke-width="1"')+path(`M${x-5} ${y+1}H${x+5} M${x-5} ${y+15}H${x+5}`,'none','stroke="#e1e3dc" stroke-width=".7"')+path(`M${x} ${y-4}v26`,'none','stroke="#101718" stroke-width="1"')+screw(x,y+28,2.3)+circle(x,y-9,1.7,'#232b2d');
      }else if(ref.style==='404bo'){
        out+=box(x-1,4,2,18,1,'#24292b','stroke="#d3d5ce" stroke-width=".5"')+box(x-7,y+8,14,20,2,metal,'stroke="#343a3b" stroke-width=".65"')+path(`M${x} ${y+11}v14`,'none','stroke="#252a2c" stroke-width="1.1"');
        out+=screw(x-4,y+10,1)+screw(x+4,y+10,1)+circle(x,h-5,1.7,'#171d1e');
      }else{
        if(ref.style==='masskicker')out+=box(x-7,2,14,h-4,0,metal,'stroke="#404849" stroke-width=".7"');
        if(ref.style==='a-style')out+=box(x-7,3,14,h-6,6,metal,'stroke="#555d5d" stroke-width=".65"');
        out+=path(`M${x} ${y+8}V${h-4}`,'none','stroke="#15191a" stroke-width="1.1"');
        for(let k=0;k<7;k++)out+=path(`M${x-2} ${h-7-k*1.3}h4`,'none',`stroke="${f}" stroke-width=".75"`);
        out+=box(x-(guitar?5.1:6.4),y,guitar?10.2:12.8,guitar?20:13,guitar?.8:1.6,metal,'stroke="#343a3b" stroke-width=".6"');
        if(guitar)out+=box(x-1.2,y+5,2.4,9,1.2,'#303637','stroke="#d0d4cd" stroke-width=".4"');
        else out+=path(`M${x} ${y+2}v9`,'none','stroke="#1b2122" stroke-width=".8"');
        if(ref.style==='masskicker')out+=box(x-2.1,y+1,4.2,11,.6,'#b39250','stroke="#514127" stroke-width=".65"')+path(`M${x} ${y+2}v8`,'none','stroke="#5b4931" stroke-width=".7"');
        out+=screw(x-(guitar?3.3:4.5),y+2,1)+screw(x+(guitar?3.3:4.5),y+2,1);
      }
    }
    if(!guitar){out+=path(`M2 ${h-3}H${w-2}`,'none','stroke="#d8dcd4" stroke-opacity=".6" stroke-width=".6"');for(const x of [5,w-5])out+=screw(x,5,1.8);}
    return out+'</g></g>';
  }
  // Primary drawing dimensions for Schaller; ETS Custom has no ordered SKU.
  // ETS proportions follow the headed Tuning Fork catalog, NOT the headless MK-III.
  function bridgeAnchors(state){
    const ref=profile(state,'hardware_bridge');
    if(state.model==='ASKR'&&state.selections.hardware_bridge==='nova_parts')return novaBridgePlan(state).anchors;
    if(state.model==='ASKR'&&state.g.bridgeSaddlePoints)return state.g.bridgeSaddlePoints.map(p=>p.slice());
    if(!ref||!['ets-tuning-fork','schaller-3d'].includes(ref.style))return null;
    const n=state.g.strings,schaller=ref.style==='schaller-3d',spacing=schaller?(n===4?19:16.6):18.5,scale=state.g.unitsPerMm||1.07,[a,b]=state.g.bridge,cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;
    return Array.from({length:n},(_,i)=>[cx+(i-(n-1)/2)*spacing*scale,cy+(1.5+(schaller?(n-1-i)*1.3:0))*scale]);
  }
  function referencedBridge(state,p,ref){
    const n=state.g.strings,schaller=ref.style==='schaller-3d';
    const w=schaller?(n===4?79.7:86.3):(n===4?82:101),h=schaller?(n===4?57.4:57):52;
    const spacing=schaller?(n===4?19:16.6):18.5;
    const scale=state.g.unitsPerMm||1.07,[a,b]=state.g.bridge;
    const cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2,top=cy-13*scale;
    const metal=`url(#${p}-part-metal)`,f=state.bridgeColour;
    let out=`<g data-layer="bridge" data-option="${state.selections.hardware_bridge}" data-profile="${ref.style}" data-appearance="${schaller?'manufacturer-drawing':'catalog-reference'}" data-placement="visual-fit-unconfirmed" data-colour="${f}" data-finish-fixed="${!!state.bridgeFinishFixed}" data-width-mm="${schaller?w:'unconfirmed'}" data-depth-mm="${schaller?h:'unconfirmed'}" data-string-count="${n}"><g transform="translate(${cx-w*scale/2} ${top}) scale(${scale})">`;
    out+=box(0,1.4,w,h,2,'#111618')+box(0,0,w,h,2,metal,'stroke="#252b2d" stroke-width=".7"');
    const offset=(w-(n-1)*spacing)/2;
    for(let i=0;i<n;i++){
      const x=offset+i*spacing,y=13+(schaller?(n-1-i)*1.3:0);
      out+=box(x-spacing/2+1,2,spacing-2,h-10,.8,'#252b2d','stroke="#9ba29e" stroke-width=".45"');
      if(schaller){
        // Narrow arms, transverse brass shaft/roller, paired height screws.
        out+=box(x-6.5,y-5,13,25,1,metal,'stroke="#14191b" stroke-width=".7"');
        out+=box(x-5.8,y,11.6,3,.4,'#8c713e')+box(x-3.2,y-2,6.4,7,1,'#bda66a','stroke="#594b2e" stroke-width=".5"');
        for(const dx of [-1.8,0,1.8])out+=path(`M${x+dx} ${y-1}v5`,'none','stroke="#5b4c30" stroke-width=".4"');
        out+=screw(x-5,y-2,1.5)+screw(x+5,y-2,1.5);
        out+=path(`M${x} 3v${y-8}`,'none','stroke="#d0d4d0" stroke-width="1.2"');
      }else{
        // Open tuning-fork channels and the distinctive teardrop relief wells.
        out+=path(`M${x-6} 3v${h-18}Q${x} ${h-5} ${x+6} ${h-18}V3`,'none','stroke="#b9bfbb" stroke-width="1.7"');
        out+=box(x-5.2,9,10.4,11,1,metal,'stroke="#111718" stroke-width=".7"')+path(`M${x} 11v7`,'none','stroke="#171d1e" stroke-width="1"')+screw(x-3.5,11,1)+screw(x+3.5,11,1);
        out+=path(`M${x-2} 24Q${x-8} 31 ${x-4} 36Q${x} 40 ${x+4} 36Q${x+8} 31 ${x+2} 24Z`,'#b6bdbb','stroke="#3d4545" stroke-width=".5"');
      }
    }
    out+=box(0,h-9,w,9,1,metal,'stroke="#343d3e" stroke-width=".7"');
    if(schaller){for(const x of (n===4?[14.4,39.9,65.4]:[6.8,39.8,72.8]))out+=screw(x,h-17.8,2.55);}
    return out+'</g></g>';
  }
  // Original exterior illustration from Payson's product photos. The continuous
  // aluminium plate is registered to source saddle witnesses, not ball-entry endpoints.
  // Product exterior and installation remain visual references, not a machining plan.
  function paysonBridge(state,p){
    const scale=state.g.unitsPerMm||1,ends=bridgeAnchors(state)||state.g.stringLines.map(l=>l[1]),a=ends[0],b=ends.at(-1),dx=9*scale,top=11*scale,bottom=32*scale;
    const d=`M${a[0]-dx} ${a[1]-top} Q${a[0]-dx} ${a[1]-top-3} ${a[0]-dx+3} ${a[1]-top-5} L${b[0]+dx-3} ${b[1]-top-5} Q${b[0]+dx} ${b[1]-top-3} ${b[0]+dx} ${b[1]-top} V${b[1]+bottom-4} Q${b[0]+dx} ${b[1]+bottom} ${b[0]+dx-4} ${b[1]+bottom+2} L${a[0]-dx+4} ${a[1]+bottom+2} Q${a[0]-dx} ${a[1]+bottom} ${a[0]-dx} ${a[1]+bottom-4} Z`;
    const metal=`url(#${p}-payson-anodized)`;
    let out=`<g data-layer="bridge" data-option="payson" data-profile="payson-fanned-v4" data-colour="${state.bridgeColour}" data-finish-fixed="true" data-appearance="manufacturer-reference" data-placement="source-saddle-registration-unconfirmed"><defs><linearGradient id="${p}-payson-anodized" x2=".2" y2="1"><stop stop-color="#a5afb3"/><stop offset=".32" stop-color="#677276"/><stop offset=".7" stop-color="#8d989c"/><stop offset="1" stop-color="#3a4347"/></linearGradient></defs>`;
    out+=path(d,'#080c0e','transform="translate(1 3)" stroke="#06090b" stroke-width="3"')+path(d,metal,'data-part="continuous-aluminium-plate" stroke="#c1c8c8" stroke-width=".75"');
    ends.forEach(([x,y],i)=>{
      out+=`<g data-saddle="${i}" data-string-anchor="${x},${y}" transform="translate(${x} ${y}) scale(${scale})">`;
      out+=box(-6.8,-7,13.6,34,6,'#131a1d','stroke="#4b5559" stroke-width=".7"')+path('M0 4V28','none','stroke="#080c0d" stroke-width="2.6"');
      for(let k=0;k<8;k++)out+=path(`M-2 ${8+k*1.5}h4`,'none','stroke="#b9bdb5" stroke-width=".8"');
      out+=box(-6.9,-6,13.8,13,1.5,'#13191b','stroke="#b4bcbd" stroke-width=".6"');
      out+=box(-6.1,-5.5,3.6,12,1,metal)+box(2.5,-5.5,3.6,12,1,metal)+box(-2.5,-1.4,5,2.8,1,'#c0c3b7','stroke="#4b5350" stroke-width=".5"');
      for(const xx of [-4.4,4.4])for(const yy of [-3.5,4])out+=circle(xx,yy,1,'#101618','stroke="#c4c9c3" stroke-width=".5"');
      out+=box(-2.2,24,4.4,8,1.4,'#171f22','stroke="#a6afb1" stroke-width=".55"')+circle(0,27,1.1,'#080d0f')+'</g>';
    });return out+'</g>';
  }
  // Nova / Andre Passini Dingwall Retrofit 5-string drawing: 102 mm overall,
  // 18 mm spacing, 55 degrees from the transverse axis's normal, 43.7 mm
  // perpendicular depth and 12 mm channels. The source saddle centroid only
  // registers the product illustration; it does not approve ASKR installation.
  function novaBridgePlan(state){
    const scale=state.g.unitsPerMm||1,source=state.g.bridgeSaddlePoints,cx=source.reduce((s,p)=>s+p[0],0)/5,cy=source.reduce((s,p)=>s+p[1],0)/5;
    const slope=-Math.tan(35*Math.PI/180),depth=43.7/Math.cos(35*Math.PI/180),front=32-depth,tail=32,lo=-51,hi=51,r=12;
    const top=x=>slope*x+front,bottom=x=>slope*x+tail,xy=(x,y)=>`${cx+x*scale} ${cy+y*scale}`;
    const outline=`M${xy(lo,top(lo)+r)}Q${xy(lo,top(lo))} ${xy(lo+r,top(lo+r))}L${xy(hi-r,top(hi-r))}Q${xy(hi,top(hi))} ${xy(hi,top(hi)+r)}V${cy+(bottom(hi)-r)*scale}Q${xy(hi,bottom(hi))} ${xy(hi-r,bottom(hi-r))}L${xy(lo+r,bottom(lo+r))}Q${xy(lo,bottom(lo))} ${xy(lo,bottom(lo)-r)}Z`;
    return {scale,cx,cy,slope,front,tail,outline,anchors:Array.from({length:5},(_,i)=>{const x=(i-2)*18;return [cx+x*scale,cy+slope*x*scale];})};
  }
  function novaBridge(state,p){
    const plan=novaBridgePlan(state),{scale,outline,front,tail}=plan;
    const metal=`url(#${p}-nova-anodized)`,mask=`${p}-nova-bore-mask`;
    let out=`<g data-layer="bridge" data-option="nova_parts" data-profile="nova-dingwall-retrofit-5" data-appearance="manufacturer-drawing" data-placement="source-centroid-fit-unconfirmed" data-colour="${state.bridgeColour}" data-finish-fixed="true" data-width-mm="102" data-perpendicular-depth-mm="43.7" data-spacing-mm="18" data-drawing-angle-deg="55" data-channel-width-mm="12" data-string-count="5"><title>Nova Guitar Parts Dingwall Retrofit 5-string / manufacturer exterior drawing; ASKR mounting and intonation fit unconfirmed</title><defs><linearGradient id="${p}-nova-anodized" x2=".3" y2="1"><stop stop-color="#383e43"/><stop offset=".12" stop-color="#20272c"/><stop offset=".7" stop-color="#11171b"/><stop offset="1" stop-color="#30383d"/></linearGradient><mask id="${mask}" maskUnits="userSpaceOnUse" x="0" y="950" width="325" height="200"><rect x="0" y="950" width="325" height="200" fill="white"/>`;
    // Five counterbores pass through the one-piece base. Their drawing-derived
    // appearance is separate from unapproved mounting-hole locations on ASKR.
    for(const [x,y] of plan.anchors)out+=circle(x,y+18*scale,3.1*scale,'black');
    out+=`</mask></defs>`;
    out+=path(outline,'#050809','transform="translate(.6 1.4)" stroke="#080c0f" stroke-width="1.2"')+`<g mask="url(#${mask})">`+path(outline,metal,'data-part="continuous-aluminium-plate" stroke="#485158" stroke-width=".65"');
    for(const [i,[x,y]] of plan.anchors.entries()){
      // The open string-entry notch is at the tail. The wide channel opens
      // towards the neck; paired silver height screws sit on the black saddle.
      out+=`<g data-saddle="${i}" data-channel-index="${i}" data-string-anchor="${x},${y}" transform="translate(${x} ${y}) scale(${scale})">`;
      const channel=`M-6 ${front+4.2}V17A6 6 0 0 0 6 17V${front-4.2}Z`;
      out+=path(channel,'#080d10','data-part="saddle-channel" stroke="#3c454c" stroke-width=".4"')+path(`M0 23V${tail}`,'none','data-part="tail-entry-notch" stroke="#080d10" stroke-width="3.2"');
      out+=circle(0,18,4.6,'#303940','stroke="#080d10" stroke-width=".6"')+circle(0,18,3.1,'#000');
      out+=box(-5.4,-4.3,10.8,11,.5,'#10181d','stroke="#4c565e" stroke-width=".45"')+path('M-4 -2L0 5L4 -2','none','stroke="#717b80" stroke-width=".55"');
      for(const dx of [-3,3])out+=circle(dx,0,2.65,'#666f74')+circle(dx,-.25,2.25,'#cbd0cc','stroke="#777f81" stroke-width=".35"')+path(`M${dx-.8} -.65l.8-.45 .8.45v.9l-.8.45-.8-.45Z`,'#626e72');
      out+=path(`M0 1V${tail-2}`,'none','data-part="tail-string" stroke="#b1b4aa" stroke-width=".7"')+circle(0,tail-1.4,2,'#9c8248','data-part="ball-entry" stroke="#453c24" stroke-width=".45"')+circle(0,tail-1.4,.8,'#131719');
      out+=circle(-2.8,-4.5,1.1,'#111a20','stroke="#7c898e" stroke-width=".35"')+path('M0 -7V1','none','stroke="#131a1f" stroke-width=".8"')+'</g>';
    }
    return out+'</g></g>';
  }
  function referenceBridge(state,p){
    const g=state.g;if(g.kind!=='bass-drawing')return '';
    // Keep the owned PDF outline and internal paths for unconfirmed custom parts.
    // Dark recesses / edge highlights restore relief without substituting a SKU.
    const fill=`url(#${p}-reference-bridge-metal)`;
    let out=`<g data-layer="bridge" data-option="${state.selections.hardware_bridge}" data-colour="${state.bridgeColour}" data-finish-fixed="${!!state.bridgeFinishFixed}" data-appearance="reference-retained" data-contour="pdf-vector">`;
    for(const d of g.bridgeOutlines)out+=path(d,'#080d0f','transform="translate(1 2)" stroke="#080d0f" stroke-width="1.6"')+path(d,fill,'stroke="#3d484b" stroke-width=".7"');
    out+=path(g.bridgeArtwork,'none','stroke="#12191b" stroke-width=".9" stroke-linejoin="round"')+path(g.bridgeArtwork,'none','transform="translate(-.25 -.35)" stroke="#e3e5dc" stroke-opacity=".45" stroke-width=".35"');
    return out+'</g>';
  }
  // Original button silhouettes follow the named drawings (mm) or catalog photos.
  // Do not make GB350 look different from GB707 merely to advertise a change:
  // their butterfly button outline is shared; the front washer differs (20/18).
  const keyPaths={
    'gotoh-butterfly':'M26.7 -3.5 C32 -5 36 -9 39 -14 Q41 -18 45 -15 C50 -12 52 -9 51 -6 Q49 0 51 6 C52 9 50 12 45 15 Q41 18 39 14 C36 9 32 5 26.7 3.5 Z',
    'ratio-y':'M25 -3.8 C31 -5 34 -8 37 -12 Q43 -16 45 -11 L44 11 Q43 16 37 12 C34 8 31 5 25 3.8 Z',
    'm4-90':'M25 -4.5 C34 -5 37 -8 39 -13 Q41 -17.2 46 -17.2 Q51.5 -17.2 51.5 -10 V10 Q51.5 17.2 46 17.2 Q41 17.2 39 13 C37 8 34 5 25 4.5 Z',
    'bm-schaller':'M25 -4 C31 -5 36 -10 40 -16 C44 -23 55 -22 56 -7 Q63 0 56 7 C55 22 44 23 40 16 C36 10 31 5 25 4 Z',
    'gb528-clover':'M29 -3 Q37 -4 42 -15 C47 -28 61 -19 59 -8 C67 -2 67 6 59 9 C60 23 46 28 42 15 Q37 4 29 3 Z',
    'ultralite-y':'M22 -3 C28 -8 30 -13 34 -16 Q39 -19 40 -13 L40 13 Q39 19 34 16 C30 13 28 8 22 3 Z',
    'bm-light':'M24 -4 C31 -5 31 -12 38 -16 Q48 -20 49 -12 L49 12 Q48 20 38 16 C31 12 31 5 24 4 Z',
    'gotoh-07':'M19 -4 L23 -7 Q29 -10 34 -5 V5 Q29 10 23 7 L19 4 Z'
  };
  // Each front projection is two physical planes. Rear gear/button geometry is
  // painted before the wood; only the bushing and string post sit above the face.
  function tunerUnit(state,p,ref,plane){
    const metal=`url(#${p}-part-metal)`,key=ref.key,offset=ref.keyOffset||0;
    if(plane==='front-post'){
      const r=(ref.post||(key==='gotoh-07'?6:11))/2;
      return `<g data-part="front-bushing-post">`+circle(0,1,ref.washer/2+.6,'#111719')+circle(0,0,ref.washer/2,metal,'stroke="#292f30" stroke-width=".6"')+circle(0,0,r+1.6,metal,'stroke="#60696a" stroke-width=".5"')+circle(0,0,r,metal,'stroke="#303638" stroke-width=".8"')+(ref.locking?circle(0,0,1.1,'#222729'):path(`M${-r*.75} 0H${r*.75}`,'none','stroke="#1b2223" stroke-width="1.4"'))+'</g>';
    }
    let out=`<g data-part="rear-key-shaft" transform="translate(0 ${offset})">`+path(`M0 -2.4H${key==='gotoh-07'?19:key==='gb528-clover'||key==='bm-schaller'?34:28}V2.4H0Z`,metal,'stroke="#242a2c" stroke-width=".5"')+path(keyPaths[key],metal,'stroke="#272e30" stroke-width=".65"')+path(keyPaths[key],`url(#${p}-part-sheen)`);
    if(key==='ratio-y')out+=circle(37,-2.5,.65,'#605e53')+circle(37,2.5,.65,'#605e53');
    if(key==='m4-90')out+=path('M26 0H50 M40 -14V14','none','stroke="#e5e6dc" stroke-opacity=".35" stroke-width=".55"');
    out+='</g>';
    if(plane==='rear-mount')return out;
    out+='<g data-part="rear-gear-housing">';
    if(key==='gotoh-07'){
      out+=path('M-8.3 -11.7H8.3V0Q8.3 7.9 0 8.3L-5 8L-7.1 10.7Q-9 12 -10.5 10L-11 8.2Q-12 6.5 -10 4.8L-8.3 2Z',metal,'data-housing="sg381-closed" stroke="#303739" stroke-width=".7"')+screw(-7.8,7.8,1.2);
    }else if(key==='bm-schaller'){
      out+=path('M-16.5 -16V-8L-12 15H12L16.5 -8V-16L12 -27.7H-12Z',metal,'stroke="#303739" stroke-width=".7"');
      for(const x of [-10.5,10.5])for(const y of [-23,11])out+=screw(x,y,1.4);
      out+=box(-9,-17,18,6,1.4,metal,'stroke="#343b3c" stroke-width=".6"');
    }else if(key==='gb528-clover'){
      out+=box(-14,-18,28,37,2,metal,'stroke="#303739" stroke-width=".7"');
      for(const x of [-10,10])for(const y of [-14,15])out+=screw(x,y,1.4);
      out+=box(-11,-15,23,6,1.4,metal,'stroke="#343b3c" stroke-width=".6"');
    }else if(key==='ratio-y')out+=path('M-9 -16H13L27 -11V-5H12Q11 8 0 10Q-9 10 -9 1Z',metal,'stroke="#303739" stroke-width=".7"')+screw(-7,13,1.5);
    else if(key==='m4-90')out+=path('M-8.45 -14.5H8.45V0Q8.45 7 2 13Q0 16 -2 13Q-8.45 7 -8.45 0Z',metal,'data-mount-lug="90-degrees" stroke="#303739" stroke-width=".7"')+screw(0,11.6,1.35);
    else out+=path('M-8.5 -14H9L25 -12V-6L9 -5Q5 15 0 14Q-8.5 10 -8.5 0Z',metal,'stroke="#303739" stroke-width=".7"')+screw(0,11.5,1.4);
    const open=['ultralite-y','gb528-clover','bm-light','bm-schaller'].includes(key);
    out+=circle(0,0,open?9:8,metal,'stroke="#464d4e" stroke-width=".7"');
    if(open)for(let i=0;i<20;i++){const a=i*Math.PI/10;out+=path(`M${Math.cos(a)*7.5} ${Math.sin(a)*7.5}L${Math.cos(a)*9.5} ${Math.sin(a)*9.5}`,'none','stroke="#424b4c" stroke-width=".8"');}
    if(ref.locking){
      out+=`<g data-part="locking-wheel">`+circle(0,0,8.2,metal,'stroke="#1a2022" stroke-width=".8"');
      for(let i=0;i<24;i++){const a=i*Math.PI/12;out+=path(`M${Math.cos(a)*7} ${Math.sin(a)*7}L${Math.cos(a)*8} ${Math.sin(a)*8}`,'none','stroke="#343b3c" stroke-width=".6"');}
      out+=circle(0,0,6.6,metal)+'</g>';
    }else if(open)out+=screw(0,0,2);
    else out+=circle(0,0,key==='gotoh-07'?6.3:6.7,`url(#${p}-part-sheen)`);
    return out+'</g>';
  }
  const frontTunerAnchors={
    EDDA:[[541,65,190],[531,99,190],[523,133,190],[519,167,190]],
    EMBLA:[[617,69,190],[607,94,190],[602,120,190],[648,84,-10],[659,113,-10]],
    ASKR:[[614,79,190],[610,113,190],[605,147,190],[644,104,-10],[651,143,-10]]
  };
  function tuners(state,p,back=false,plane='front-post'){
    const ref=profile(state,'hardware_machine_head');if(!ref)return '';
    let anchors,scale;
    if(state.model==='GRAMR'){anchors=[...(back?state.g.back:state.g).tuners].sort((a,b)=>a[0]-b[0]).map(([x,y])=>[x,y,back?-90:90]);scale=Math.hypot(state.g.board[0][0]-state.g.board[1][0],state.g.board[0][1]-state.g.board[1][1])/43;}
    else if(back&&state.model!=='EDDA'){
      // Front/rear PDFs share the nut endpoints. Transform the actual post
      // centres between projections; a gear housing's bounding centre is not a hole.
      const rearNut=state.g.back.neck.match(/-?\d+(?:\.\d+)?/g).slice(0,2).map(Number),frontNut=state.g.board[0];
      anchors=state.g.tunerAnchors.map(([x,y,a])=>[y+rearNut[0]-frontNut[1],x+rearNut[1]-frontNut[0],a===180?-90:90]);scale=state.g.unitsPerMm;
    }else if(back){anchors=[[516,84,-10],[528,139,-10],[541,194,-10],[551,249,-10]];scale=1.1;}
    else {anchors=state.g.tunerAnchors||frontTunerAnchors[state.model];scale=state.g.unitsPerMm||(state.model==='EDDA'?.72:.68);}
    return `<g data-layer="${back?'rear-selected-tuners':plane==='rear-mount'?'tuner-rear-mount':state.model==='GRAMR'?'selected-tuners':'hardware'}" data-option="${state.selections.hardware_color}" data-plane="${back?'rear-housing':plane}" data-machine-head="${state.selections.hardware_machine_head}" data-colour="${state.metal}" data-count="${anchors.length}" data-appearance="manufacturer-reference" data-placement="${back&&state.model!=='EDDA'?'drawing-fit':'sample-fit'}" data-profile="${ref.key}" data-units-per-mm="${scale}">`+anchors.map(([x,y,a],i)=>{const reflectY=['EDDA','GRAMR'].includes(state.model)?(!back&&plane==='rear-mount'):(back?a===90:plane==='rear-mount'&&a===180);return `<g data-tuner-index="${i}" data-y-reflection="${reflectY}" transform="translate(${x} ${y}) rotate(${a}) scale(${scale} ${reflectY?-scale:scale})">${tunerUnit(state,p,ref,back?'rear-housing':plane)}</g>`;}).join('')+'</g>';
  }
  return {definitions,pickupPlan,guard,bridgeAnchors,novaBridgePlan,ramps,electronicsProfiles,electronicsPlan,knobs,controlPlan,controls,references,profile,selectedPickupPlan,pickupThumbnail,pickups,bridge,referenceBridge,tuners};
});
