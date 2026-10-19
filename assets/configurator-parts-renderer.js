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
    const fill=id==='wood'?`url(#${p}-material)`:id==='ivory'?'#ddd8c9':`url(#${p}-part-plastic)`;
    let out=`<g data-layer="pickguard" data-option="${id}" data-appearance="${state.g.pickguardProvenance?.kind||'drawing-contour'}">`+path(d,'#080a0b','stroke="#080a0b" stroke-width="3.5"')+path(d,fill,`stroke="#a9aaa0" stroke-width=".9" ${id==='wood'&&state.finish.colour?`filter="url(#${p}-surface-dye)"`:''}`)+path(d,`url(#${p}-part-sheen)`);
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
    EDDA:{kill:[610,991],coils:[]},
    EMBLA:{kill:[744,1017],coils:[[716,914],[736,951]]},
    ASKR:{kill:[704,1069],coils:[[693,933],[718,947]]},
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
  // Whole layouts, not a prefix of the old holes. Upper controls handle level /
  // balance; tone and filter controls form a separate lower arc. Coordinates are
  // display fits inside each model's control area, never drilling dimensions.
  const controlLayouts={
    EDDA:{
      3:[[620,879],[646,929],[639,981]],
      4:[[614,867],[645,910],[654,951],[644,996]],
      5:[[614,866],[647,906],[610,934],[654,953],[643,999]],
      6:[[612,863],[643,902],[610,933],[655,940],[650,979],[608,1030]]
    },
    EMBLA:{
      3:[[742,894],[781,968],[759,1055]],
      4:[[742,890],[781,940],[715,1056],[774,1047]],
      5:[[742,890],[781,940],[701,1064],[747,1080],[791,1046]],
      6:[[735,885],[773,925],[705,992],[704,1040],[748,1077],[792,1038]]
    },
    ASKR:{
      3:[[721,986],[753,1029],[740,1080]],
      4:[[721,981],[751,1015],[716,1034],[750,1068]],
      5:[[712,977],[746,1001],[703,1019],[742,1042],[739,1083]],
      6:[[711,974],[747,997],[699,1011],[735,1031],[705,1045],[745,1070]]
    }
  };
  function electronicsPlan(state){
    const s=state.selections,ref=electronicsProfiles[s.electronics];
    if(!ref||['control_custom','guitar_custom_wiring'].includes(s.control_layout))return null;
    const guitar=state.model==='GRAMR',positions=guitar?state.g.controls:controlLayouts[state.model]?.[ref.knobs.length];
    if(!positions)return null;
    return {...ref,layout:guitar?'guitar-two-pot':ref.knobs.length===3?'three-control-arc':ref.knobs.length===4?'two-plus-two':ref.knobs.length===5?'two-plus-three':'two-plus-four',knobs:ref.knobs.map((functions,index)=>({xy:[...positions[index]],type:'knob',index,functions:[...functions],stacked:functions.length>1,placement:guitar?'source-retained':'electronics-preview'}))};
  }
  function controlPlan(state){
    const s=state.selections,extras=state.specialOptions||[],positions=state.g.controls||[];
    const plan=electronicsPlan(state)?.knobs||positions.map((xy,i)=>({xy:[...xy],type:'knob',index:i,functions:[],placement:'source-retained'}));
    const proposal=controlProposals[state.model];
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
      if(type!=='knob')out+=circle(0,0,radius+3,'none','stroke="#cdb98f" stroke-width=".9" stroke-dasharray="2 2" opacity=".85"');
      if(type==='kill')out+=circle(0,1,radius+1,'#121617')+circle(0,0,radius,metal,'stroke="#151b1c" stroke-width=".9"')+circle(0,0,radius*.67,'#24292a','stroke="#bbc1be" stroke-width=".65"')+circle(-radius*.18,-radius*.22,radius*.27,'#717b7a','opacity=".6"');
      if(type==='toggle')out+=circle(0,0,radius*.78,metal,'stroke="#1b2021" stroke-width=".9"')+circle(0,0,radius*.3,'#121717')+path(`M0,0L${radius*.26},${-radius*.92}`,'none',`stroke="#161b1c" stroke-width="${radius*.48}" stroke-linecap="round"`)+path(`M0,0L${radius*.26},${-radius*.92}`,'none',`stroke="${state.metal}" stroke-width="${radius*.29}" stroke-linecap="round"`);
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
      emg:{w:102,h:38,style:'40twx',url:'https://www.emgpickups.com/40twx.html'},
      guitar_lundgren_m6:{w:70,h:38,style:'m6-open-slugs',url:'https://shop.lundgrenpickups.com/products/m6'},
      delano_sbc:{w:100,h:36,style:'sbc',url:'https://www.delano.de/sbc_5_he_s_4/sbc_5_he_s_4_details.html'},
      delano_ts:{w:108,h:32,style:'times-square',url:'https://www.delano.de/downloads/sbc5_tf.pdf'},
      askr_delano_sbc5_e:{w:102,h:38,style:'sbc-e',url:'https://www.delano.de/sbc_5_he_s_4_e/sbc_5_he_s_4_e_details.html'},
      fishman:{w:102.11,h:37.89,style:'fluence',url:'https://fishman.com/dp/fluence-bass-soapbar-5-string-pickups/'}
    },
    hardware_bridge:{
      babicz_top:{style:'fch-top',url:'https://www.fullcontacthardware.com/fch-5-string-bass-bridge'},
      hipshot_kick:{style:'masskicker',url:'https://hipshotproducts.com/products/5-string-masskicker-bass-bridge'},
      gotoh_404BO:{style:'404bo',url:'https://g-gotoh.com/images/pdf/404BO-4-Dim.pdf'},
      hipshot_a:{style:'a-style',url:'https://docs.hipshotproducts.com/5A500-708_5_STG_A_STYLE_BASS_BRIDGE_708_SPACING_DIMENSIONS.pdf'},
      hipshot_b:{style:'b-style',url:'https://docs.hipshotproducts.com/5B500-708_5_STG_B_STYLE_BASS_BRIDGE_708_SPACING_DIMENSIONS.pdf'},
      guitar_gotoh_510t:{style:'510t-fe1',url:'https://g-gotoh.com/images/pdf/510T-FE1-Dim.pdf'}
    },
    hardware_machine_head:{
      schaller_bm_lt:{key:'bm-light',washer:16.8,url:'https://schaller.info/media/pdf/65/6a/31/TZ_1027.pdf'},
      gotoh_707:{key:'gotoh-butterfly',washer:18,url:'https://g-gotoh.com/images/pdf/GB707-Dim.pdf'},
      gotoh_350:{key:'gotoh-butterfly',washer:20,url:'https://g-gotoh.com/images/pdf/GB350-Dim.pdf'},
      gotoh_528:{key:'gb528-clover',washer:22,url:'https://g-gotoh.com/images/pdf/GB528-Dim.pdf'},
      hipshot_ul_38:{key:'ultralite-y',washer:17,url:'https://docs.hipshotproducts.com/20650_ULTRALITE_3-8_Y_KEY.pdf'},
      guitar_gotoh_sg381:{key:'gotoh-07',washer:14,url:'https://g-gotoh.com/images/pdf/SG381-Dim.pdf'}
    }
  };
  const profile=(state,category)=>references[category]?.[state.selections[category]];
  function selectedPickupPlan(state){
    const ref=profile(state,'pickups');if(!ref)return pickupPlan(state);
    const base=state.model==='ASKR'?references.pickups.fishman:references.pickups.delano_sbc;
    return pickupPlan(state).map(r=>{
      const w=r.w*ref.w/base.w,h=r.h*ref.h/base.h;
      return {...r,x:r.x+(r.w-w)/2,y:r.y+(r.h-h)/2,w,h};
    });
  }
  const box=(x,y,w,h,rx,fill,attrs='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${attrs}/>`;
  function pickupDefinitions(p){
    return `<linearGradient id="${p}-pickup-face" x1=".18" y1="0" x2=".55" y2="1"><stop stop-color="#323335"/><stop offset=".3" stop-color="#222326"/><stop offset=".8" stop-color="#18191c"/><stop offset="1" stop-color="#101114"/></linearGradient><linearGradient id="${p}-pickup-bevel" x1=".15" y1="0" x2=".65" y2="1"><stop stop-color="#55575a"/><stop offset=".07" stop-color="#35373a"/><stop offset=".4" stop-color="#171a19"/><stop offset=".85" stop-color="#070909"/><stop offset="1" stop-color="#333734"/></linearGradient><radialGradient id="${p}-pickup-crown" cx=".28" cy=".18" r=".95"><stop stop-color="#fff" stop-opacity=".08"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient><radialGradient id="${p}-pole" cx=".32" cy=".25"><stop stop-color="#ddd9cb"/><stop offset=".4" stop-color="#a5a59c"/><stop offset=".83" stop-color="#727975"/><stop offset="1" stop-color="#c6c8bf"/></radialGradient><pattern id="${p}-pickup-grain" width="7" height="7" patternUnits="userSpaceOnUse">${Array.from({length:45},(_,i)=>circle((i*2.371)%7,(i*i*.913)%7,.045+(i%3)*.025,i%3?'#b8bbc0':'#020305',`opacity="${i%3?.09:.20}"`)).join('')}</pattern>`;
  }
  function pickupUnit(ref,p){
    const w=ref.w,h=ref.h,face=`url(#${p}-pickup-face)`,bevel=`url(#${p}-pickup-bevel)`,grain=`url(#${p}-pickup-grain)`;
    let out=box(-.8,1.6,w+1.6,h+1.7,3.8,'#000202','opacity=".6"');
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
    out+=path(cover,'#07080b','transform="translate(.35 2.2)" stroke="#08090c" stroke-width="1.8"')+path(cover,bevel,'stroke="#0b0c0e" stroke-width=".55"');
    out+=`<g transform="translate(1.25 1.1) scale(${(w-2.5)/w} ${(h-2.9)/h})">${path(cover,face)}${path(cover,`url(#${p}-pickup-crown)`)}${path(cover,grain)}</g>`;
    out+=path(`M${r+1} 1Q1 1 1 ${r+1}V${h/2-4} M${r+1} 1H${w-r-1}`,'none','stroke="#c0c3b8" stroke-opacity=".2" stroke-width=".4"');
    if(!recess)for(const [x,y] of [[4,5],[4,h-5],[w-4,h/2]])out+=circle(x,y,2.55,bevel)+circle(x,y,1.85,'#050608')+circle(x+.3,y+.55,.85,'#25262a')+path(`M${x-1} ${y+.5}h2`,'none','stroke="#101114" stroke-width=".45"');
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
    let out=`<g data-layer="pickups" data-option="${state.selections.pickups}" data-count="${state.g.pickups.length}" data-appearance="manufacturer-reference" data-placement="sample-fit" data-profile="${ref.style}" data-surface="photo-reference-abs" data-projection="source-envelope">`;
    (guitar?pickupPlan(state):selectedPickupPlan(state)).forEach((r,index)=>{
      const scaleX=guitar?r.h/ref.w:r.w/ref.w,scaleY=guitar?r.w/ref.h:r.h/ref.h;
      out+=`<g data-pickup-index="${index}" transform="translate(${r.x+r.w/2} ${r.y+r.h/2}) rotate(${guitar?-90:r.angle||0}) scale(${scaleX} ${scaleY}) translate(${-ref.w/2} ${-ref.h/2})">${pickupUnit(ref,p)}</g>`;
    });return out+'</g>';
  }
  function bridge(state,p){
    const ref=profile(state,'hardware_bridge');if(!ref)return '';
    const n=state.g.strings,guitar=state.model==='GRAMR',id=state.selections.hardware_bridge;
    const [a,b]=state.g.bridge,cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;
    const w=guitar?83.5:ref.style==='404bo'?(n===4?86:100):(n===4?82:101.6),h=guitar?40:ref.style==='404bo'?58:ref.style==='fch-top'?66.8:ref.style==='masskicker'?60:50.8;
    const scale=guitar?Math.hypot(a[0]-b[0],a[1]-b[1])/54:(state.model==='EDDA'?1.07:1.42);
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
  // The button silhouette is traced from the named manufacturer's sheet in mm.
  // Do not make GB350 look different from GB707 merely to advertise a change:
  // their butterfly button outline is shared; the front washer differs (20/18).
  const keyPaths={
    'gotoh-butterfly':'M25 -4 C32 -7 35 -11 39 -16 Q43 -18 49 -10 Q51 -7 49 -2 Q48 0 49 4 Q51 11 43 16 Q40 18 37 14 Q31 6 25 4 Z',
    'gb528-clover':'M29 -3 Q37 -4 42 -15 C47 -28 61 -19 59 -8 C67 -2 67 6 59 9 C60 23 46 28 42 15 Q37 4 29 3 Z',
    'ultralite-y':'M22 -3 C28 -8 30 -13 34 -16 Q39 -19 40 -13 L40 13 Q39 19 34 16 C30 13 28 8 22 3 Z',
    'bm-light':'M24 -4 C31 -5 31 -12 38 -16 Q48 -20 49 -12 L49 12 Q48 20 38 16 C31 12 31 5 24 4 Z',
    'gotoh-07':'M19 -4 L23 -7 Q29 -10 34 -5 V5 Q29 10 23 7 L19 4 Z'
  };
  function tunerUnit(state,p,ref,back){
    const metal=`url(#${p}-part-metal)`,key=ref.key;
    let out=path(`M0 -2.4H${key==='gb528-clover'?42:32}V2.4H0Z`,metal,'stroke="#242a2c" stroke-width=".5"')+path(keyPaths[key],metal,'stroke="#272e30" stroke-width=".65"')+path(keyPaths[key],'url(#'+p+'-part-sheen)');
    if(back){
      out+=path(key==='gb528-clover'?'M-12 -15H12V18Q12 21 9 21H-9Q-12 21 -12 18Z':'M-10 -13H11L25 -4V4L9 6Q5 17 0 18Q-10 17 -10 3Z',metal,'stroke="#303739" stroke-width=".7"');
      out+=circle(0,0,key==='gb528-clover'?10:8,metal,'stroke="#464d4e" stroke-width=".7"')+screw(0,0,2);
      if(key==='bm-light'){out+=box(-12,-11,12,22,1,metal,'stroke="#252c2d" stroke-width=".5"')+screw(9,-9,1.4)+screw(9,9,1.4);}
      if(key==='ultralite-y'||key==='gb528-clover'||key==='bm-light')for(let i=0;i<18;i++){const a=i*Math.PI/9;out+=path(`M${Math.cos(a)*8} ${Math.sin(a)*8}L${Math.cos(a)*10} ${Math.sin(a)*10}`,'none','stroke="#606766" stroke-width=".7"');}
      else out+=screw(0,13,1.5);
    }else out+=circle(0,0,ref.washer/2,metal,'stroke="#292f30" stroke-width=".6"')+circle(0,0,key==='gotoh-07'?3:5.5,metal,'stroke="#303638" stroke-width=".8"')+path('M-2 0H2','none','stroke="#1b2223" stroke-width="1.2"');
    return out;
  }
  const frontTunerAnchors={
    EDDA:[[541,65,190],[531,99,190],[523,133,190],[519,167,190]],
    EMBLA:[[617,69,190],[607,94,190],[602,120,190],[648,84,-10],[659,113,-10]],
    ASKR:[[614,79,190],[610,113,190],[605,147,190],[644,104,-10],[651,143,-10]]
  };
  function tuners(state,p,back=false){
    const ref=profile(state,'hardware_machine_head');if(!ref)return '';
    let anchors,scale;
    if(state.model==='GRAMR'){anchors=(back?state.g.back:state.g).tuners.map(([x,y])=>[x,y,back?-90:90]);scale=.73;}
    else if(back&&state.model!=='EDDA'){
      // Bound centres from the PDF housing are display anchors, not hole data.
      anchors=state.g.back.tuners.map(t=>{const pairs=[...t.housing.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+)/g)].map(m=>[+m[1],+m[2]]),xs=pairs.map(v=>v[0]),ys=pairs.map(v=>v[1]),x=(Math.min(...xs)+Math.max(...xs))/2,y=(Math.min(...ys)+Math.max(...ys))/2;return [x,y,y<155?-90:90];});scale=1.05;
    }else if(back){anchors=[[520,65,0],[528,119,0],[541,177,0],[550,231,0]];scale=1.1;}
    else {anchors=frontTunerAnchors[state.model];scale=state.model==='EDDA'?.72:.68;}
    return `<g data-layer="${back?'rear-selected-tuners':state.model==='GRAMR'?'selected-tuners':'hardware'}" data-option="${state.selections.hardware_color}" data-machine-head="${state.selections.hardware_machine_head}" data-colour="${state.metal}" data-count="${anchors.length}" data-appearance="manufacturer-reference" data-placement="${back&&state.model!=='EDDA'?'drawing-fit':'sample-fit'}" data-profile="${ref.key}">`+anchors.map(([x,y,a],i)=>`<g data-tuner-index="${i}" transform="translate(${x} ${y}) rotate(${a}) scale(${scale})">${tunerUnit(state,p,ref,back)}</g>`).join('')+'</g>';
  }
  return {definitions,pickupPlan,guard,ramps,electronicsProfiles,electronicsPlan,knobs,controlPlan,controls,references,profile,selectedPickupPlan,pickups,bridge,tuners};
});
