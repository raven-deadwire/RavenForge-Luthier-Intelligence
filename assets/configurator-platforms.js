(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RavenForgePlatforms = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Bass defaults follow the existing configurator. ASKR's 37–34/Payson
  // platform is the user's selected revision; GRAM follows its published concept.
  var activeData = null;
  var bassCore = {
    orientation: 'right_hand', string_spacing: 'spacing_std', nut_size: 'nut_std',
    nut_material: 'nut_brass', radius: 'rad_std', fret_type: 'fret_24',
    fretboard_extense: 'extense_none', body_construction: '3pc_solid',
    hardware_bridge: 'ets_custom', hardware_machine_head: 'gotoh_707',
    pickup_configuration: 'pickup_2', control_layout: 'control_std',
    coil_switch: 'coil_1_ps'
  };
  var cores = {
    EDDA: Object.assign({}, bassCore, {
      strings: '4_strings', scale: '34', neck: '1pc',
      pickups: 'nova_mm', electronics: 'passive'
    }),
    EMBLA: Object.assign({}, bassCore, {
      strings: '5_strings', scale: '34', neck: '5pc',
      pickups: 'delano_sbc', electronics: 'zuta'
    }),
    ASKR: Object.assign({}, bassCore, {
      strings: '5_strings', scale: 'multi', neck: '5pc',
      hardware_bridge: 'payson', pickups: 'fishman', electronics: 'fishman',
      coil_switch: 'coil_none'
    }),
    GRAM: {
      orientation: 'right_hand', strings: 'guitar_6', scale: 'guitar_25_5',
      string_spacing: 'spacing_std', nut_size: 'guitar_nut_43',
      nut_material: 'guitar_bone_nut', neck: 'guitar_neck_5pc',
      radius: 'guitar_radius_16', fret_type: 'guitar_fret_24',
      fretboard_extense: 'extense_none', body_construction: 'guitar_body_2pc',
      hardware_bridge: 'guitar_gotoh_510t', hardware_machine_head: 'guitar_gotoh_sg381',
      pickup_configuration: 'guitar_hh', pickups: 'guitar_lundgren_m6',
      electronics: 'guitar_zuta_core', control_layout: 'guitar_controls',
      coil_switch: 'guitar_blade_selection'
    }
  };
  var summaries = {
    EDDA: {
      strings: '4 strings', scale: '34-inch single scale',
      frets: '24 frets + zero fret', bridge: 'ETS Custom',
      description: 'Heritage bass with a 1-piece maple neck and a solid 3-piece body.'
    },
    EMBLA: {
      strings: '5 strings', scale: '34-inch single scale',
      frets: '24 frets + zero fret', bridge: 'ETS Custom',
      description: 'Modern bass with a 5-piece laminated neck and a solid 3-piece body.'
    },
    ASKR: {
      strings: '5 strings', scale: '37–34-inch multiscale',
      frets: '24 frets + zero fret', bridge: 'Payson Multi-Scale Bass Bridge',
      description: 'Multiscale bass with a 5-piece laminated neck and a solid 3-piece body.'
    },
    GRAM: {
      strings: '6 guitar strings', scale: '25.5-inch single scale',
      frets: '24 frets; no zero fret', bridge: 'Gotoh 510T-FE1',
      joint: 'Extended bolt-on deep tenon; 5 bolts in a 2-2-1 layout; threaded inserts; no neck plate',
      description: 'Superstrat with a 2-piece swamp ash body, 5-piece laminated neck and Lundgren M6 HH package. Zuta Core is planned.'
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
    var entry = { id: id, label: label, spec: spec || '', prices: { GRAM: 'request' }, availableFor: ['GRAM'] };
    if (existing) Object.assign(existing, entry);
    else group.options.push(entry);
    if (standard !== false) setStandard(data, categoryId, id, 'GRAM');
  }
  function shareGuitarOptions(data, categoryId, allowedIds, standardId) {
    var group = category(data, categoryId);
    if (!group) return;
    group.options.forEach(function (entry) {
      if (allowedIds && allowedIds.indexOf(entry.id) < 0) return;
      entry.prices = Object.assign({}, entry.prices, { GRAM: 'request' });
      if (entry.availableFor && entry.availableFor.indexOf('GRAM') < 0) entry.availableFor.push('GRAM');
    });
    if (standardId) setStandard(data, categoryId, standardId, 'GRAM');
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

    // Preserve the former 2650 + 300 multiscale + 150 Payson total.
    var askr = data.models.find(function (entry) { return entry.id === 'ASKR'; });
    if (askr) askr.basePrice = 3100;
    var multi = option(data, 'scale', 'multi');
    if (multi) {
      multi.label = '37–34-inch multiscale';
      multi.spec = '37-inch low string / 34-inch high string';
      multi.prices.ASKR = 0;
    }
    var payson = option(data, 'hardware_bridge', 'payson');
    if (payson) payson.prices.ASKR = 0;
    var guide = option(data, 'nut_material', 'nut_brass');
    if (guide) {
      guide.label = 'brass zero-fret string guide';
      guide.spec = 'the zero fret defines the open-string contact point';
    }

    var gram = data.models.find(function (entry) { return entry.id === 'GRAM'; });
    if (!gram) { gram = { id: 'GRAM', name: 'GRAM' }; data.models.push(gram); }
    Object.assign(gram, { basePrice: null, desc: 'Superstrat 24F · specification and pricing by request', instrument: 'guitar' });

    [
      ['strings', 'guitar_6', '6 guitar strings', ''],
      ['scale', 'guitar_25_5', '25.5-inch single scale', ''],
      ['nut_size', 'guitar_nut_43', '43.0 mm', 'GRAM nut width'],
      ['nut_material', 'guitar_bone_nut', 'buffalo bone nut', 'no zero fret'],
      ['neck', 'guitar_neck_5pc', '5-piece laminated guitar neck', 'Northern Hard Maple / Wenge / Purpleheart / Wenge / Northern Hard Maple'],
      ['neck_profile', 'guitar_profile_reference', 'GRAM reference profile', 'profile and final dimensions to be confirmed'],
      ['radius', 'guitar_radius_16', '16-inch radius', ''],
      ['fret_type', 'guitar_fret_24', '24 frets; no zero fret', ''],
      ['body_construction', 'guitar_body_2pc', '2-piece solid body', 'center-jointed swamp ash; 45.0 mm concept thickness'],
      ['body_wood_single', 'guitar_swamp_ash', 'swamp ash', '2-piece center-jointed body'],
      ['fretboard', 'guitar_indian_rosewood', 'AAA Indian rosewood', ''],
      ['top_type', 'guitar_top_none', 'no separate top', 'visible swamp ash grain'],
      ['color_top', 'guitar_inferno_red', 'Transparent Inferno Red', 'grain-filled high gloss'],
      ['color_back_side', 'guitar_inferno_red', 'Transparent Inferno Red', 'grain-filled high gloss'],
      ['hardware_bridge', 'guitar_gotoh_510t', 'Gotoh 510T-FE1', 'right-handed; 42 mm block'],
      ['hardware_machine_head', 'guitar_gotoh_sg381', 'Gotoh SG381-07-MGT', '6-in-line; staggered'],
      ['pickup_configuration', 'guitar_hh', 'HH / 2 guitar humbuckers', ''],
      ['pickups', 'guitar_lundgren_m6', 'Lundgren M6 Neck + Bridge', 'black open-coil'],
      ['electronics', 'guitar_zuta_core', 'Zuta Core — planned', 'guitar electronics package; final wiring to be confirmed'],
      ['control_layout', 'guitar_controls', '1 Volume / 1 Tone / 5-way blade', 'CTS 500 kΩ D-curve pots; 0.022 µF tone capacitor'],
      ['coil_switch', 'guitar_blade_selection', '5-way blade selection', 'part of the fixed GRAM control package'],
      ['factory_setup', 'guitar_setup_reference', 'standard guitar setup', 'tuning and string gauge to be confirmed']
    ].forEach(function (entry) { addGuitarOption.apply(null, [data].concat(entry)); });

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
    shareGuitarOptions(data, 'hardware_color', null, 'hw_gold');
    shareGuitarOptions(data, 'color_headstock', ['head_match', 'head_plate'], 'head_match');
    shareGuitarOptions(data, 'color_top', ['top_oil', 'top_stain', 'top_tint', 'top_open', 'top_gloss'], 'guitar_inferno_red');
    shareGuitarOptions(data, 'color_back_side', ['back_oil', 'back_stain', 'back_tint', 'back_open', 'back_gloss'], 'guitar_inferno_red');
    shareGuitarOptions(data, 'extra_finish_burst', null, 'burst_none');
    shareGuitarOptions(data, 'extra_finish_flake', null, 'flake_none');
    shareGuitarOptions(data, 'top_type', ['veneer', 'cap'], 'guitar_top_none');

    // Top prices use veneer/cap keys in the legacy app. Separate IDs keep
    // GRAM's unquoted amounts from inheriting the bass option prices.
    var tops = category(data, 'top_wood_selection');
    if (tops) tops.options.slice().filter(function (entry) {
      return entry.availableFor && ['EDDA', 'EMBLA', 'ASKR'].every(function (id) { return entry.availableFor.indexOf(id) >= 0; });
    }).forEach(function (entry) {
      var id = 'guitar_top_' + entry.id;
      var copy = { id: id, label: entry.label, spec: entry.spec || '', prices: { veneer: 'request', cap: 'request' }, availableFor: ['GRAM'], isStandard: [] };
      var present = tops.options.find(function (candidate) { return candidate.id === id; });
      if (present) Object.assign(present, copy); else tops.options.push(copy);
    });
    extendDependency(data, 'body_wood_single', 'body_construction', 'guitar_body_2pc');
    extendDependency(data, 'fret_material', 'fret_type', 'guitar_fret_24');
    extendDependency(data, 'fret_size', 'fret_type', 'guitar_fret_24');

    Object.keys(cores).forEach(function (modelId) {
      Object.keys(cores[modelId]).forEach(function (categoryId) {
        setStandard(data, categoryId, cores[modelId][categoryId], modelId);
      });
    });
    return data;
  }

  function fixed(modelId) { return Object.assign({}, cores[modelId] || {}); }
  function supported(modelId, group, entry) {
    if (!entry || !group) return false;
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
    if (categoryId === 'neck_profile' && optionId === 'profile_custom') return false;
    if (categoryId === 'neck' && optionId === 'extra') return false;
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
  function upcoming(modelId, data) {
    data = data || activeData;
    if (!data || !cores[modelId]) return [];
    var core = cores[modelId];
    var groups = data.categories.map(function (group) {
      var locked = Object.prototype.hasOwnProperty.call(core, group.id);
      var options = group.options.filter(function (entry) {
        if (!supported(modelId, group, entry)) return false;
        if (group.id === 'scale' && (entry.id === 'short' || /short[- ]?scale/i.test(entry.label))) return false;
        return (locked && entry.id !== core[group.id]) || (group.id === 'neck_profile' && entry.id === 'profile_custom');
      }).map(function (entry) { return { id: entry.id, label: entry.label }; });
      return { categoryId: group.id, title: group.title, options: options };
    }).filter(function (group) { return group.options.length; });
    if (modelId === 'GRAM') groups.push({
      categoryId: 'guitar_future_packages', title: 'Additional packages',
      options: [
        { id: 'guitar_future_hardware', label: 'Additional hardware packages' },
        { id: 'guitar_future_pickups', label: 'Additional pickup packages' },
        { id: 'guitar_future_electronics', label: 'Additional electronics packages' }
      ]
    });
    return groups;
  }
  function summary(modelId) { return Object.assign({}, summaries[modelId] || {}); }

  return { apply: apply, fixed: fixed, isInitialOption: isInitialOption, upcoming: upcoming, summary: summary };
}));
