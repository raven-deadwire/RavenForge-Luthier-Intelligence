(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RavenForgePlatforms = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Bass defaults follow the existing configurator. ASKR's 37–34/Payson
  // platform is the user's selected revision; GRAMR follows its published concept.
  var activeData = null;
  var standardGigbagBudget = 100;
  var premiumGigbagBudget = 300;
  var premiumGigbagUpgrade = premiumGigbagBudget - standardGigbagBudget;
  var instrumentBasePrices = { EDDA: 2000, EMBLA: 2450, ASKR: 3100, GRAMR: 1900 };
  var bassDefaults = {
    orientation: 'right_hand', string_spacing: 'spacing_std', nut_size: 'nut_std',
    nut_material: 'nut_brass', radius: 'rad_std', fret_type: 'fret_24',
    fretboard_extense: 'extense_none', body_construction: '3pc_solid',
    hardware_bridge: 'ets_custom', hardware_machine_head: 'gotoh_707',
    pickup_configuration: 'pickup_2', control_layout: 'control_std',
    coil_switch: 'coil_1_ps', case: 'case_standard'
  };
  var modelDefaults = {
    EDDA: Object.assign({}, bassDefaults, {
      strings: '4_strings', scale: '34', neck: '1pc',
      pickups: 'nova_mm', electronics: 'passive', coil_switch: 'coil_none'
    }),
    EMBLA: Object.assign({}, bassDefaults, {
      strings: '5_strings', scale: '34', neck: '5pc',
      pickups: 'delano_sbc', electronics: 'zuta'
    }),
    ASKR: Object.assign({}, bassDefaults, {
      strings: '5_strings', scale: 'multi', neck: '5pc',
      hardware_bridge: 'payson', pickups: 'fishman', electronics: 'fishman',
      coil_switch: 'coil_none'
    }),
    GRAMR: {
      orientation: 'right_hand', strings: 'guitar_6', scale: 'guitar_25_5',
      string_spacing: 'spacing_std', nut_size: 'guitar_nut_43',
      nut_material: 'guitar_bone_nut', neck: 'guitar_neck_5pc',
      radius: 'guitar_radius_16', fret_type: 'guitar_fret_24',
      fretboard_extense: 'extense_none', body_construction: 'guitar_body_2pc',
      hardware_bridge: 'guitar_gotoh_510t', hardware_machine_head: 'guitar_gotoh_sg381',
      pickup_configuration: 'guitar_hh', pickups: 'guitar_lundgren_m6',
      electronics: 'guitar_zuta_core', control_layout: 'guitar_controls',
      coil_switch: 'guitar_blade_selection',
      color_top: 'top_oil', color_back_side: 'back_oil', case: 'case_standard'
    }
  };
  var geometryCategories = [
    'orientation', 'strings', 'scale', 'nut_size', 'string_spacing',
    'hardware_bridge', 'pickup_configuration', 'fretboard_extense'
  ];
  var cores = {};
  Object.keys(modelDefaults).forEach(function (modelId) {
    cores[modelId] = {};
    geometryCategories.forEach(function (id) {
      if (modelId !== 'GRAMR' && id === 'hardware_bridge') return;
      cores[modelId][id] = modelDefaults[modelId][id];
    });
    if (modelId === 'GRAMR') cores[modelId].fret_type = modelDefaults[modelId].fret_type;
  });
  var pickupOptions = {
    EDDA: ['nova_mm', 'nova_custom', 'others', 'häussel_triple'],
    EMBLA: ['delano_sbc', 'delano_ts', 'häussel_bar', 'nova_custom', 'others'],
    ASKR: ['fishman', 'emg', 'askr_delano_sbc5_e', 'nova_custom', 'others'],
    GRAMR: ['guitar_lundgren_m6', 'guitar_hh_passive_custom']
  };
  var summaries = {
    EDDA: {
      strings: '4 strings', scale: '34-inch single scale',
      frets: '24 frets + zero fret', bridge: 'ETS Custom',
      description: 'Four-string heritage bass with selectable materials, neck feel and electronics.'
    },
    EMBLA: {
      strings: '5 strings', scale: '34-inch single scale',
      frets: '24 frets + zero fret', bridge: 'ETS Custom',
      description: 'Five-string session bass with selectable materials, neck feel and electronics.'
    },
    ASKR: {
      strings: '5 strings', scale: '37–34-inch multiscale',
      frets: '24 frets + zero fret', bridge: 'Payson Multi-Scale Bass Bridge',
      description: 'Five-string multiscale bass with selectable materials, hardware and electronics.'
    },
    GRAMR: {
      strings: '6 guitar strings', scale: '25.5-inch single scale',
      frets: '24 frets; no zero fret', bridge: 'Gotoh 510T-FE1',
      joint: 'Extended bolt-on deep tenon; 5 bolts in a 2-2-1 layout; threaded inserts; no neck plate',
      description: 'Six-string 25.5-inch Superstrat with 24 frets and HH pickups. Materials and electronics are selectable; custom option pricing is confirmed separately.'
    }
  };

  function category(data, id) {
    return data.categories.find(function (entry) { return entry.id === id; });
  }
  function option(data, categoryId, optionId) {
    var group = category(data, categoryId);
    return group && group.options.find(function (entry) { return entry.id === optionId; });
  }
  function setStandard(data, categoryId, optionId, modelId) {
    var group = category(data, categoryId);
    if (!group) return;
    group.options.forEach(function (entry) {
      entry.isStandard = (entry.isStandard || []).filter(function (id) { return id !== modelId; });
      if (entry.id === optionId) entry.isStandard.push(modelId);
    });
  }
  function addGuitarOption(data, categoryId, id, label, spec, standard) {
    var group = category(data, categoryId);
    if (!group) return;
    var existing = option(data, categoryId, id);
    var entry = { id: id, label: label, spec: spec || '', prices: { GRAMR: standard !== false ? 0 : 'request' }, availableFor: ['GRAMR'] };
    if (existing) Object.assign(existing, entry);
    else group.options.push(entry);
    if (standard !== false) setStandard(data, categoryId, id, 'GRAMR');
  }
  function commonBassPrice(entry) {
    if (!entry || !entry.prices) return 'request';
    var values = ['EDDA', 'EMBLA', 'ASKR'].map(function (id) {
      return entry.prices[id];
    }).filter(function (value) { return value !== undefined && value !== null; });
    if (!values.length || values.some(function (value) {
      return value !== 'request' && (typeof value !== 'number' || !isFinite(value));
    })) return 'request';
    return values.every(function (value) { return value === values[0]; }) ? values[0] : 'request';
  }
  function shareGuitarOptions(data, categoryId, allowedIds, standardId) {
    var group = category(data, categoryId);
    if (!group) return;
    group.options.forEach(function (entry) {
      if (allowedIds && allowedIds.indexOf(entry.id) < 0) return;
      entry.prices = Object.assign({}, entry.prices, { GRAMR: commonBassPrice(entry) });
      if (entry.availableFor && entry.availableFor.indexOf('GRAMR') < 0) entry.availableFor.push('GRAMR');
    });
    if (standardId) setStandard(data, categoryId, standardId, 'GRAMR');
  }
  function extendDependency(data, categoryId, dependencyId, value) {
    var group = category(data, categoryId);
    if (!group || !group.dependsOn || !group.dependsOn[dependencyId]) return;
    var values = [].concat(group.dependsOn[dependencyId]);
    if (values.indexOf(value) < 0) values.push(value);
    group.dependsOn[dependencyId] = values;
  }

  function apply(data) {
    if (!data || !Array.isArray(data.models) || !Array.isArray(data.categories)) {
      throw new TypeError('Configurator models and categories are required.');
    }
    activeData = data;
    var scale = category(data, 'scale');
    if (scale) scale.options = scale.options.filter(function (entry) {
      return entry.id !== 'short' && !/short[- ]?scale/i.test(entry.label);
    });

    // ASKR includes Payson; Nova is priced as a replacement adjustment.
    var multi = option(data, 'scale', 'multi');
    if (multi) {
      multi.label = '37–34-inch multiscale';
      multi.spec = '37-inch low string / 34-inch high string';
      multi.prices.ASKR = 0;
    }
    var payson = option(data, 'hardware_bridge', 'payson');
    if (payson) payson.prices.ASKR = 0;
    var bridgeGroup = category(data, 'hardware_bridge');
    if (bridgeGroup) {
      var novaSpec = 'Dingwall Retrofit; 18 mm spacing; black anodized aluminium; final saddle travel, mounting angle and screw positions to be confirmed';
      var novaBridge = {
        id: 'nova_parts', label: 'Nova Parts multiscale bridge',
        spec: novaSpec, specByModel: { ASKR: novaSpec },
        prices: { ASKR: -70 }, availableFor: ['ASKR']
      };
      var currentNovaBridge = option(data, 'hardware_bridge', 'nova_parts');
      if (currentNovaBridge) Object.assign(currentNovaBridge, novaBridge);
      else bridgeGroup.options.push(novaBridge);
    }
    var standardSpacing = option(data, 'string_spacing', 'spacing_std');
    if (standardSpacing) standardSpacing.specByModel = Object.assign({}, standardSpacing.specByModel, {
      ASKR: '18 mm bridge string spacing'
    });
    var guide = option(data, 'nut_material', 'nut_brass');
    if (guide) {
      guide.label = 'brass zero-fret string guide';
      guide.spec = 'the zero fret defines the open-string contact point';
    }

    // Materials and internal functions remain selectable within each model's
    // existing outlines, routing and control positions.
    var standardControls = option(data, 'control_layout', 'control_std');
    if (standardControls) standardControls.spec = 'model-standard control positions; functions follow the selected electronics';
    var customControls = option(data, 'control_layout', 'control_custom');
    if (customControls) {
      customControls.label = 'Custom controls / wiring';
      customControls.spec = 'choose functions, pots and wiring within the existing control holes and cavity; describe preferences in notes';
    }
    var tuners = category(data, 'hardware_machine_head');
    var tunerNote = 'retain the model’s headstock layout; confirm shaft/bushing fit, fixing points and clearance';
    if (tuners) tuners.options.forEach(function (entry) {
      if ((entry.spec || '').indexOf(tunerNote) < 0) entry.spec = (entry.spec ? entry.spec + '; ' : '') + tunerNote;
    });
    var coilGroup = category(data, 'coil_switch');
    var coilNote = 'use existing switch/pot positions; confirm functions and component fit';
    if (coilGroup) coilGroup.options.forEach(function (entry) {
      if ((entry.spec || '').indexOf(coilNote) < 0) entry.spec = (entry.spec ? entry.spec + '; ' : '') + coilNote;
    });

    var customPickupSpecs = {
      EDDA: 'MM housing for the existing EDDA pickup routes; confirm outline, mounting ears and depth',
      EMBLA: 'custom housing for the existing SBC 100 × 36 mm routes; confirm depth and mounting',
      ASKR: 'custom housing for the existing 102 × 38 mm pickup routes; confirm depth and mounting'
    };
    ['nova_custom', 'others'].forEach(function (id) {
      var entry = option(data, 'pickups', id);
      if (entry) {
        entry.spec = 'specify a pickup made for the selected model’s existing routes';
        entry.specByModel = Object.assign({}, customPickupSpecs);
      }
    });
    [
      ['nova_mm', 'MM housing for the existing EDDA routes; confirm outline, mounting ears, depth and screws'],
      ['häussel_triple', 'MM housing version for the existing EDDA routes; confirm outline and mounting ears'],
      ['delano_sbc', 'SBC5 housing: 100 × 36 × 18.5 mm; confirm mounting and route depth'],
      ['delano_ts', 'SBC-format housing for the existing EMBLA routes; confirm dimensions and mounting'],
      ['häussel_bar', 'custom SBC 100 × 36 mm housing for EMBLA; confirm outline, depth and mounting'],
      ['fishman', '5-string bass set; housing 102.11 × 37.89 × 18 mm; confirm cavity and mounting'],
      ['emg', '40TWX housing for ASKR; confirm depth, mounting and wiring']
    ].forEach(function (details) {
      var entry = option(data, 'pickups', details[0]);
      if (entry) entry.spec = details[1];
    });
    var emg = option(data, 'pickups', 'emg');
    if (emg) emg.label = 'EMG 40TWX';
    var pickupGroup = category(data, 'pickups');
    if (pickupGroup) {
      var delanoE = {
        id: 'askr_delano_sbc5_e', label: 'Delano SBC5 HE/S-4 E',
        spec: '102 × 38 × 22 mm E housing; confirm route depth, screw positions and wiring',
        prices: { ASKR: 'request' }, availableFor: ['ASKR']
      };
      var existingDelanoE = option(data, 'pickups', delanoE.id);
      if (existingDelanoE) Object.assign(existingDelanoE, delanoE);
      else pickupGroup.options.push(delanoE);
    }

    // A prototype's individual colour is not a model-wide finish option.
    data.categories.forEach(function (group) {
      group.options = group.options.filter(function (entry) { return entry.id !== 'guitar_inferno_red'; });
    });

    var gramr = data.models.find(function (entry) { return entry.id === 'GRAMR'; });
    if (!gramr) { gramr = { id: 'GRAMR', name: 'GRAMR' }; data.models.push(gramr); }
    Object.assign(gramr, { desc: 'Superstrat 24F · 6-string / 25.5-inch', instrument: 'guitar' });

    [
      ['strings', 'guitar_6', '6 guitar strings', ''],
      ['scale', 'guitar_25_5', '25.5-inch single scale', ''],
      ['nut_size', 'guitar_nut_43', '43.0 mm', 'GRAMR nut width'],
      ['nut_material', 'guitar_bone_nut', 'buffalo bone nut', 'no zero fret'],
      ['neck', 'guitar_neck_5pc', '5-piece laminated guitar neck', 'Northern Hard Maple / Wenge / Purpleheart / Wenge / Northern Hard Maple'],
      ['neck_profile', 'guitar_profile_reference', 'GRAMR reference profile', 'profile and final dimensions to be confirmed'],
      ['radius', 'guitar_radius_16', '16-inch radius', ''],
      ['fret_type', 'guitar_fret_24', '24 frets; no zero fret', ''],
      ['body_construction', 'guitar_body_2pc', '2-piece solid body', 'center-jointed body; 45.0 mm concept thickness'],
      ['body_wood_single', 'guitar_swamp_ash', 'swamp ash', 'solid body within the existing outline'],
      ['fretboard', 'guitar_indian_rosewood', 'rosewood', ''],
      ['top_type', 'guitar_top_none', 'no separate top', 'visible body wood grain'],
      ['hardware_bridge', 'guitar_gotoh_510t', 'Gotoh 510T-FE1', 'right-handed; 42 mm block'],
      ['hardware_machine_head', 'guitar_gotoh_sg381', 'Gotoh SG381-07-MGT', '6-in-line; staggered'],
      ['pickup_configuration', 'guitar_hh', 'HH / 2 guitar humbuckers', ''],
      ['pickups', 'guitar_lundgren_m6', 'Lundgren M6 Neck + Bridge', 'black open-coil'],
      ['electronics', 'guitar_zuta_core', 'Zuta Core — planned', 'guitar electronics package; final wiring to be confirmed'],
      ['control_layout', 'guitar_controls', '1 Volume / 1 Tone / 5-way blade', 'CTS 500 kΩ D-curve pots; 0.022 µF tone capacitor'],
      ['coil_switch', 'guitar_blade_selection', '5-way blade selection', 'uses the existing GRAMR blade-switch opening'],
      ['factory_setup', 'guitar_setup_reference', 'standard guitar setup', 'tuning and string gauge to be confirmed']
    ].forEach(function (entry) { addGuitarOption.apply(null, [data].concat(entry)); });

    [
      ['neck', 'guitar_neck_1pc', '1-piece maple guitar neck', 'retains the existing neck outline, 43 mm nut width and heel'],
      ['neck', 'guitar_neck_3pc', '3-piece maple guitar neck', 'retains the existing neck outline, 43 mm nut width and heel'],
      ['neck', 'guitar_neck_custom', 'Custom laminated guitar neck', 'specify materials within the existing neck outline and heel'],
      ['neck_profile', 'guitar_profile_custom', 'Custom guitar neck profile', 'retain the 43 mm nut width and existing heel; describe the desired feel'],
      ['radius', 'guitar_radius_compound', 'Compound radius', 'specify preferred radii within the existing fretboard outline'],
      ['radius', 'guitar_radius_custom', 'Custom radius', 'specify the preferred fretboard radius'],
      ['body_construction', 'guitar_body_1pc', '1-piece solid body', 'retain the existing outline, cavities and final body thickness'],
      ['body_construction', 'guitar_body_3pc', '3-piece solid body', 'retain the existing outline, cavities and final body thickness'],
      ['body_construction', 'guitar_body_chambered', 'Chambered body', 'planned internal chamber layout'],
      ['body_wood_single', 'guitar_body_maple', 'Maple', 'solid body within the existing outline'],
      ['body_wood_single', 'guitar_body_alder', 'Alder', 'solid body within the existing outline'],
      ['body_wood_single', 'guitar_body_limba', 'Limba', 'solid body within the existing outline'],
      ['body_wood_single', 'guitar_body_custom', 'Other body wood', 'specify the wood; subject to availability and suitability'],
      ['hardware_machine_head', 'guitar_tuner_custom', 'Alternative guitar tuners', '6-in-line; specify the model and confirm shaft, bushing, fixing points and clearance within the existing headstock layout'],
      ['pickups', 'guitar_hh_passive_custom', 'Custom passive HH set', 'specify neck and bridge pickup models for the existing HH routes; confirm housings, mounting ears, depth and wiring'],
      ['electronics', 'guitar_passive', 'Passive guitar electronics', '1 Volume / 1 Tone / 5-way blade; no battery'],
      ['control_layout', 'guitar_custom_wiring', 'Custom guitar wiring', 'choose functions and pots within the existing two pot holes, blade opening and cavity']
    ].forEach(function (entry) { addGuitarOption(data, entry[0], entry[1], entry[2], entry[3], false); });

    shareGuitarOptions(data, 'orientation', ['right_hand'], 'right_hand');
    shareGuitarOptions(data, 'string_spacing', ['spacing_std'], 'spacing_std');
    shareGuitarOptions(data, 'fretboard_extense', ['extense_none'], 'extense_none');
    shareGuitarOptions(data, 'fret_material', ['mat_brass', 'mat_nickel', 'mat_stainless', 'mat_others'], 'mat_nickel');
    shareGuitarOptions(data, 'fret_size', null, 'size_xjumbo');
    shareGuitarOptions(data, 'inlay_type', null, 'inlay_none');
    shareGuitarOptions(data, 'inlay_oval_mat', null, null);
    shareGuitarOptions(data, 'inlay_dot_pos', null, null);
    shareGuitarOptions(data, 'inlay_dot_mat', null, null);
    shareGuitarOptions(data, 'inlay_custom_spec', null, null);
    shareGuitarOptions(data, 'side_dot', null, 'sdot_std');
    shareGuitarOptions(data, 'fret_side', null, 'side_no');
    shareGuitarOptions(data, 'knob', null, 'knob_metal');
    shareGuitarOptions(data, 'hardware_color', null, 'hw_chrome');
    shareGuitarOptions(data, 'color_headstock', ['head_match', 'head_plate'], 'head_match');
    shareGuitarOptions(data, 'color_top', ['top_oil', 'top_stain', 'top_tint', 'top_open', 'top_gloss'], 'top_oil');
    shareGuitarOptions(data, 'color_back_side', ['back_oil', 'back_stain', 'back_tint', 'back_open', 'back_gloss'], 'back_oil');
    shareGuitarOptions(data, 'extra_finish_burst', null, 'burst_none');
    shareGuitarOptions(data, 'extra_finish_flake', null, 'flake_none');
    shareGuitarOptions(data, 'top_type', ['veneer', 'cap'], 'guitar_top_none');

    // Separate guitar IDs retain the same veneer/cap prices as their source woods.
    var tops = category(data, 'top_wood_selection');
    if (tops) tops.options.slice().filter(function (entry) {
      return entry.availableFor && ['EDDA', 'EMBLA', 'ASKR'].every(function (id) { return entry.availableFor.indexOf(id) >= 0; });
    }).forEach(function (entry) {
      var id = 'guitar_top_' + entry.id;
      var copy = { id: id, label: entry.label, spec: entry.spec || '', prices: Object.assign({}, entry.prices), availableFor: ['GRAMR'], isStandard: [] };
      var present = tops.options.find(function (candidate) { return candidate.id === id; });
      if (present) Object.assign(present, copy); else tops.options.push(copy);
    });
    // Only explicitly equivalent materials and work share a price across IDs.
    [
      ['body_wood_single', 'guitar_body_maple', 'maple'],
      ['body_wood_single', 'guitar_body_alder', 'alder'],
      ['body_wood_single', 'guitar_body_limba', 'limba'],
      ['body_wood_single', 'guitar_body_custom', 'others'],
      ['body_construction', 'guitar_body_1pc', '1pc_solid'],
      ['radius', 'guitar_radius_compound', 'rad_compound'],
      ['radius', 'guitar_radius_custom', 'rad_custom'],
      ['neck_profile', 'guitar_profile_custom', 'profile_custom'],
      ['fretboard', 'guitar_indian_rosewood', 'rosewood']
    ].forEach(function (mapping) {
      var target = option(data, mapping[0], mapping[1]);
      if (target) target.prices.GRAMR = commonBassPrice(option(data, mapping[0], mapping[2]));
    });
    ['guitar_body_1pc', 'guitar_body_2pc', 'guitar_body_3pc', 'guitar_body_chambered'].forEach(function (id) {
      extendDependency(data, 'body_wood_single', 'body_construction', id);
    });
    extendDependency(data, 'fret_material', 'fret_type', 'guitar_fret_24');
    extendDependency(data, 'fret_size', 'fret_type', 'guitar_fret_24');

    // The standard gigbag is included once in each model's base price.
    // A premium bag replaces it; only the difference between the two is added.
    data.models.forEach(function (model) {
      if (!Object.prototype.hasOwnProperty.call(instrumentBasePrices, model.id)) return;
      model.basePrice = instrumentBasePrices[model.id] + standardGigbagBudget;
      model.startingPrice = model.basePrice;
    });
    var gigbagCategory = {
      id: 'case', title: 'Gigbag', options: [
        {
          id: 'case_standard', label: 'Standard gigbag',
          spec: '',
          prices: { EDDA: 0, EMBLA: 0, ASKR: 0, GRAMR: 0 },
          availableFor: ['EDDA', 'EMBLA', 'ASKR', 'GRAMR']
        },
        {
          id: 'case_premium', label: 'Premium gigbag',
          spec: '',
          prices: { EDDA: premiumGigbagUpgrade, EMBLA: premiumGigbagUpgrade, ASKR: premiumGigbagUpgrade, GRAMR: premiumGigbagUpgrade },
          availableFor: ['EDDA', 'EMBLA', 'ASKR', 'GRAMR']
        }
      ]
    };
    var existingGigbagCategory = category(data, 'case');
    if (existingGigbagCategory) Object.assign(existingGigbagCategory, gigbagCategory);
    else data.categories.push(gigbagCategory);

    Object.keys(modelDefaults).forEach(function (modelId) {
      Object.keys(modelDefaults[modelId]).forEach(function (categoryId) {
        setStandard(data, categoryId, modelDefaults[modelId][categoryId], modelId);
      });
    });
    return data;
  }

  function fixed(modelId) { return Object.assign({}, cores[modelId] || {}); }
  function defaults(modelId) { return Object.assign({}, modelDefaults[modelId] || {}); }
  function supported(modelId, group, entry) {
    if (!entry || !group) return false;
    if (modelId === 'EDDA' && group.id === 'coil_switch') return false;
    if (entry.availableFor && entry.availableFor.indexOf(modelId) < 0) return false;
    if (group.id === 'top_wood_selection') return !!entry.availableFor && entry.availableFor.indexOf(modelId) >= 0;
    return !!entry.prices && entry.prices[modelId] !== undefined && entry.prices[modelId] !== null;
  }
  function isInitialOption(modelId, categoryId, optionId) {
    if (!cores[modelId] || !activeData) return false;
    var group = category(activeData, categoryId);
    var entry = option(activeData, categoryId, optionId);
    if (!supported(modelId, group, entry)) return false;
    if (categoryId === 'scale' && optionId === 'short') return false;
    if (isDeferred(modelId, categoryId, optionId)) return false;
    var core = cores[modelId];
    if (Object.prototype.hasOwnProperty.call(core, categoryId)) return core[categoryId] === optionId;
    if (group.dependsOn) {
      var impossible = Object.keys(group.dependsOn).some(function (id) {
        return Object.prototype.hasOwnProperty.call(core, id) && [].concat(group.dependsOn[id]).indexOf(core[id]) < 0;
      });
      if (impossible) return false;
    }
    return true;
  }
  function isDeferred(modelId, categoryId, optionId) {
    if (categoryId === 'body_construction' && /chambered/.test(optionId)) return true;
    if (categoryId === 'pickups' && pickupOptions[modelId]) return pickupOptions[modelId].indexOf(optionId) < 0;
    if (modelId === 'ASKR' && categoryId === 'hardware_bridge') return ['payson', 'nova_parts'].indexOf(optionId) < 0;
    return false;
  }
  function upcoming(modelId, data) {
    data = data || activeData;
    if (!data || !cores[modelId]) return [];
    var core = cores[modelId];
    var groups = data.categories.map(function (group) {
      var locked = Object.prototype.hasOwnProperty.call(core, group.id);
      var options = group.options.filter(function (entry) {
        if (!supported(modelId, group, entry)) return false;
        if (group.id === 'scale' && (entry.id === 'short' || /short[- ]?scale/i.test(entry.label))) return false;
        return (locked && entry.id !== core[group.id]) || isDeferred(modelId, group.id, entry.id);
      }).map(function (entry) { return { id: entry.id, label: entry.label }; });
      return { categoryId: group.id, title: group.title, options: options };
    }).filter(function (group) { return group.options.length; });
    groups.push({
      categoryId: 'control_geometry', title: 'New control layouts',
      options: [
        { id: 'new_control_layout', label: 'New control positions or additional holes' },
        { id: 'new_electronics_cavity', label: 'Additional or reshaped electronics cavities' }
      ]
    });
    if (modelId === 'GRAMR') groups.push({
      categoryId: 'guitar_future_geometry', title: 'Additional guitar formats',
      options: [
        { id: 'guitar_future_strings', label: 'Additional guitar string counts' },
        { id: 'guitar_future_scales', label: 'Additional guitar scale lengths' },
        { id: 'guitar_future_routes', label: 'Alternative bridge and pickup layouts' }
      ]
    });
    return groups;
  }
  function summary(modelId) { return Object.assign({}, summaries[modelId] || {}); }

  return { apply: apply, fixed: fixed, defaults: defaults, isInitialOption: isInitialOption, upcoming: upcoming, summary: summary };
}));
