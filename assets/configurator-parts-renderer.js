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
    return metal('part-metal',state.metal)+`<linearGradient id="${p}-part-plastic" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="#414747"/><stop offset=".11" stop-color="#292d2e"/><stop offset=".52" stop-color="#15181a"/><stop offset="1" stop-color="#080b0c"/></linearGradient><linearGradient id="${p}-part-sheen"><stop stop-color="#fff6de" stop-opacity=".22"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>`;
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
    GRAMR:{kill:[915,218],coils:[]}
  };
  function controlPlan(state){
    const s=state.selections,extras=state.specialOptions||[],positions=state.g.controls||[];
    const plan=positions.map((xy,i)=>({xy:[...xy],type:'knob',index:i,functions:[],placement:'source-retained'}));
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
    for(const {xy:[x,y],type,functions,index,placement} of plan){if(type==='knob'&&!functions.length)continue;
      out+=`<g data-control-index="${index}" data-control-type="${type}" data-placement="${placement}" data-functions="${functions.join(' ')}" transform="translate(${x} ${y})">`;
      if(type!=='knob')out+=circle(0,0,radius+3,'none','stroke="#cdb98f" stroke-width=".9" stroke-dasharray="2 2" opacity=".85"');
      if(type==='kill')out+=circle(0,1,radius+1,'#121617')+circle(0,0,radius,metal,'stroke="#151b1c" stroke-width=".9"')+circle(0,0,radius*.67,'#24292a','stroke="#bbc1be" stroke-width=".65"')+circle(-radius*.18,-radius*.22,radius*.27,'#717b7a','opacity=".6"');
      if(type==='toggle')out+=circle(0,0,radius*.78,metal,'stroke="#1b2021" stroke-width=".9"')+circle(0,0,radius*.3,'#121717')+path(`M0,0L${radius*.26},${-radius*.92}`,'none',`stroke="#161b1c" stroke-width="${radius*.48}" stroke-linecap="round"`)+path(`M0,0L${radius*.26},${-radius*.92}`,'none',`stroke="${state.metal}" stroke-width="${radius*.29}" stroke-linecap="round"`);
      if(type==='knob')out+=circle(0,0,radius+1,'none','stroke="#c9bc99" stroke-width="1.1"')+path(`M${-radius*.45},${-radius-4}l${radius*.45},-3 ${radius*.45},3`,'none','stroke="#eee4c8" stroke-width="1.1"');
      out+='</g>';
    }return out+'</g>';
  }

  // Only explicit product identities belong here. Never guess an unspecified
  // custom cover/button, or map every product to one generic family symbol.
  const references={
    pickups:{
      emg:{w:102,h:38,style:'40twx',url:'https://stage.emgpickups.com/40twx.html'},
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
    return pickupPlan(state).map(r=>{const scale=r.w/(state.model==='ASKR'?102:100),w=ref.w*scale,h=ref.h*scale;
      return {...r,x:r.x+(r.w-w)/2,y:r.y+(r.h-h)/2,w,h};});
  }
  const box=(x,y,w,h,rx,fill,attrs='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${attrs}/>`;
  function pickups(state,p){
    const ref=profile(state,'pickups');if(!ref)return '';
    const id=state.selections.pickups,plastic=`url(#${p}-part-plastic)`;
    let out=`<g data-layer="pickups" data-option="${id}" data-count="${state.g.pickups.length}" data-appearance="manufacturer-reference" data-placement="sample-fit" data-profile="${ref.style}">`;
    selectedPickupPlan(state).forEach((r,index)=>{
      const scale=r.w/ref.w,w=ref.w,h=ref.h;
      out+=`<g data-pickup-index="${index}" transform="translate(${r.x+r.w/2} ${r.y+r.h/2}) rotate(${r.angle||0}) scale(${scale}) translate(${-w/2} ${-h/2})">`;
      out+=box(-.8,1.4,w+1.6,h+1.2,3.5,'#030505','opacity=".8"')+box(0,0,w,h,3.1,plastic,'stroke="#090c0d" stroke-width="1.2"')+box(1,1,w-2,h-2,2.6,'none','stroke="#7f8380" stroke-opacity=".5" stroke-width=".55"');
      if(ref.style==='sbc'||ref.style==='times-square'){
        const holes=ref.style==='sbc'?[[4,5],[4,h-5],[w-4,h/2]]:[[4,5],[4,h-5],[w-4,h/2]];
        for(const [x,y] of holes)out+=circle(x,y,2.1,'#090b0c','stroke="#676b69" stroke-width=".6"')+circle(x,y,.75,'#141818');
      }else for(const x of [2,w-2])out+=circle(x,h/2,3.2,'#080b0c','stroke="#707674" stroke-width=".7"')+screw(x,h/2,1.25);
      if(ref.style==='times-square')for(let row=0;row<2;row++)for(let i=0;i<5;i++){
        const x=14+i*17.8,y=row?h-7:5;
        out+=box(x-.7,y-.7,13.4,2.5,.3,'#080b0c')+box(x,y,12,1.2,.15,'#aeb3b2')+box(x,y+.8,12,.4,0,'#e7e7dc');
      }
      if(ref.style==='fluence')out+=path(`M4 ${h*.72} H${w*.43} C${w*.49} ${h*.72} ${w*.47} ${h*.28} ${w*.54} ${h*.28} H${w-4}`,'none','stroke="#070a0b" stroke-width="1.1"')+path(`M4 ${h*.72+.8} H${w*.43} C${w*.49} ${h*.72+.8} ${w*.47} ${h*.28+.8} ${w*.54} ${h*.28+.8} H${w-4}`,'none','stroke="#666c6b" stroke-width=".45"');
      out+='</g>';
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
  return {definitions,pickupPlan,guard,ramps,controlPlan,controls,references,profile,selectedPickupPlan,pickups,bridge,tuners};
});
