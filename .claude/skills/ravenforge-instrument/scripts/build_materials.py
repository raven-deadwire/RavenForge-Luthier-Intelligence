"""Pilot stage 7: replace the flat placeholder colours with look-dev materials.

    python build_materials.py --config ../drawings/gramr.json --blend gramr_stage6.blend \
        --out gramr_stage7.blend --report gramr_stage7.json [--preview-dir DIR]

Colours are the configurator's own display colours (see colour_sources in the
config), which the site itself labels illustrative. Grain is procedural and
runs along X. Stained woods take the stain colour scaled by how light the wood
is, so the laminate stays readable under the red. Every material is tagged
rf_status = illustrative with its colour source. No image textures are used.
"""
import argparse, json, math
from pathlib import Path
import bpy

MM = 0.001


def lin(hex_):
    """sRGB hex -> linear RGB tuple."""
    out = []
    for i in (1, 3, 5):
        c = int(hex_[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return tuple(out)


lum = lambda c: 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def sock(sockets, ident):
    for s in sockets:
        if s.identifier == ident:
            return s
    raise KeyError(ident)


def new_material(name, source, note):
    old = bpy.data.materials.get(name)
    if old:
        bpy.data.materials.remove(old)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat["rf_status"], mat["rf_colour_source"], mat["rf_note"] = "illustrative", source, note
    return mat, mat.node_tree, mat.node_tree.nodes["Principled BSDF"]


def plain(name, colour, metallic, roughness, source, note, coat=0.0):
    mat, nt, b = new_material(name, source, note)
    b.inputs["Base Color"].default_value = (*colour, 1)
    b.inputs["Metallic"].default_value, b.inputs["Roughness"].default_value = metallic, roughness
    b.inputs["Coat Weight"].default_value = coat
    mat.diffuse_color = (*colour, 1)
    return mat


def wood(name, light, dark, p, seed, source, note, coat_rough=None, base_rough=0.4, two_piece=False):
    """Procedural straight grain along X: ring lines plus fine streaks."""
    mat, nt, b = new_material(name, source, note)
    N, Lk = nt.nodes.new, nt.links.new
    tc = N("ShaderNodeTexCoord")
    vec = tc.outputs["Object"]
    if two_piece:                        # each half of a centre-jointed body is a different board
        sep = N("ShaderNodeSeparateXYZ"); Lk(vec, sep.inputs[0])
        gt = N("ShaderNodeMath"); gt.operation = "GREATER_THAN"; Lk(sep.outputs["Y"], gt.inputs[0]); gt.inputs[1].default_value = 0
        sc = N("ShaderNodeVectorMath"); sc.operation = "SCALE"
        sc.inputs[0].default_value = (0.37, 0.011, 0.045); Lk(gt.outputs[0], sc.inputs["Scale"])
        add = N("ShaderNodeVectorMath"); add.operation = "ADD"; Lk(vec, add.inputs[0]); Lk(sc.outputs[0], add.inputs[1])
        vec = add.outputs[0]
    mp = N("ShaderNodeMapping")
    mp.inputs["Location"].default_value = (0.13 * seed, 0.021 * seed, -0.14 - 0.013 * seed)
    mp.inputs["Rotation"].default_value = (0, math.radians(1.5), math.radians(2.0 + 0.4 * seed))
    mp.inputs["Scale"].default_value = (0.12, 1, 1)          # stretch the wobble along the grain
    Lk(vec, mp.inputs["Vector"])
    wave = N("ShaderNodeTexWave")
    wave.wave_type, wave.rings_direction = "RINGS", "X"
    wave.inputs["Scale"].default_value = p["ring_scale"]
    wave.inputs["Distortion"].default_value = p["distortion"]
    wave.inputs["Detail"].default_value, wave.inputs["Detail Scale"].default_value = 1.5, 0.5
    Lk(mp.outputs[0], wave.inputs["Vector"])
    ramp = N("ShaderNodeValToRGB")
    e = ramp.color_ramp.elements
    e[0].position, e[0].color = 0.0, (0, 0, 0, 1)
    e[1].position, e[1].color = max(p["line_width"], 0.02), (1, 1, 1, 1)
    Lk(wave.outputs["Fac"], ramp.inputs["Fac"])
    smp = N("ShaderNodeMapping"); smp.inputs["Scale"].default_value = (6, 700, 700)
    smp.inputs["Location"].default_value = (seed, seed * 3.1, seed * 1.7)
    Lk(vec, smp.inputs["Vector"])
    noise = N("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value, noise.inputs["Detail"].default_value = 1.0, 3.0
    Lk(smp.outputs[0], noise.inputs["Vector"])
    sramp = N("ShaderNodeValToRGB")
    se = sramp.color_ramp.elements
    se[0].position, se[0].color = 0.35, (1 - p["streak"],) * 3 + (1,)
    se[1].position, se[1].color = 0.65, (1, 1, 1, 1)
    Lk(noise.outputs["Fac"], sramp.inputs["Fac"])
    mul = N("ShaderNodeMath"); mul.operation = "MULTIPLY"
    Lk(ramp.outputs["Color"], mul.inputs[0]); Lk(sramp.outputs["Color"], mul.inputs[1])
    big = N("ShaderNodeTexNoise"); big.inputs["Scale"].default_value = 9.0     # slow board-wide variation
    Lk(mp.outputs[0], big.inputs["Vector"])
    ph = N("ShaderNodeMath"); ph.operation = "MULTIPLY"; ph.inputs[1].default_value = p.get("spacing_variation", 9.0)
    Lk(big.outputs["Fac"], ph.inputs[0]); Lk(ph.outputs[0], wave.inputs["Phase Offset"])   # uneven ring spacing
    var = N("ShaderNodeMapRange"); var.inputs["To Min"].default_value, var.inputs["To Max"].default_value = 0.88, 1.06
    Lk(big.outputs["Fac"], var.inputs["Value"])
    mix = N("ShaderNodeMix"); mix.data_type = "RGBA"
    sock(mix.inputs, "A_Color").default_value = (*dark, 1)
    sock(mix.inputs, "B_Color").default_value = (*light, 1)
    Lk(mul.outputs[0], sock(mix.inputs, "Factor_Float"))
    tint = N("ShaderNodeVectorMath"); tint.operation = "SCALE"
    Lk(sock(mix.outputs, "Result_Color"), tint.inputs[0]); Lk(var.outputs[0], tint.inputs["Scale"])
    Lk(tint.outputs[0], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = base_rough
    if coat_rough is not None:
        b.inputs["Coat Weight"].default_value = 1.0
        b.inputs["Coat Roughness"].default_value = coat_rough
        b.inputs["Coat IOR"].default_value = 1.5
    mat.diffuse_color = (*light, 1)
    return mat


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    for a in ("--config", "--blend", "--out"):
        ap.add_argument(a, required=True)
    ap.add_argument("--report"); ap.add_argument("--preview-dir")
    args = ap.parse_args(argv)
    cfg = json.loads(Path(args.config).read_text())
    par, model = cfg["materials_illustrative"], cfg["model"]
    src = par["colour_sources"]
    bpy.ops.wm.open_mainfile(filepath=str(Path(args.blend).resolve()))
    o = bpy.data.objects
    stain = lin(src["stain_inferno"]["hex"])
    stain_src = src["stain_inferno"]["source"]
    sheen = par["sheen"]
    rep = {"model": model, "stage": 7, "materials": {}}

    def make_wood(key, finish, ref_colour, seed, coat, two_piece=False, base_rough=0.4):
        p = par["wood"][key]
        base = lin(src[p["colour"]]["hex"])
        if p["stained"]:
            k = lum(base) / lum(lin(src[ref_colour]["hex"]))        # how light this wood is next to the lightest
            light = tuple(c * k for c in stain)
            source = f"{stain_src}; lightness from {src[p['colour']]['source']}"
        else:
            light, k, source = base, 1.0, src[p["colour"]]["source"]
        dark = tuple(c * p["dark_ratio"] for c in light)
        name = f"RF_MAT_{key}_{finish}"
        m = wood(name, light, dark, p, seed, source,
                 "Procedural grain, assumed. Colour is a display colour, not a colour proof or species certification.",
                 coat_rough=coat, base_rough=base_rough, two_piece=two_piece)
        rep["materials"][name] = {"colour_source": source, "lightness_vs_reference": round(k, 3)}
        return m

    body_m = make_wood("SwampAsh", "InfernoRedGrainFilledGloss", "ash", 1, sheen["body_coat_roughness"], two_piece=True)
    maple_m = make_wood("HardMaple", "InfernoRed", "maple", 2, sheen["neck_coat_roughness"])
    wenge_m = make_wood("Wenge", "InfernoRed", "maple", 3, sheen["neck_coat_roughness"])
    purple_m = make_wood("Purpleheart", "InfernoRed", "maple", 4, sheen["neck_coat_roughness"])
    rose_m = make_wood("IndianRosewood", "Natural", "rosewood", 5, None, base_rough=sheen["fretboard_roughness"])
    ac = par["assumed_colours"]
    def make_plain(name, colour, metallic, rough, source, note, coat=0.0):
        m = plain(name, colour, metallic, rough, source, note, coat)
        rep["materials"][name] = {"colour_source": source}
        return m
    gold_m = make_plain("RF_MAT_Gold", lin(src["gold"]["hex"]), 1.0, 0.22, src["gold"]["source"],
                        "Display colour used as metal base colour. Plating look assumed.")
    fret_m = make_plain("RF_MAT_NickelSilver", lin(ac["nickel_silver"]), 1.0, 0.18, "assumed", "Colour and polish assumed.")
    bone_m = make_plain("RF_MAT_Bone", lin(ac["bone"]), 0.0, 0.4, "assumed", "Colour assumed.")
    pg_m = make_plain("RF_MAT_BlackPlastic_Gloss", lin(ac["black_plastic"]), 0.0, 0.12, "assumed",
                      "Single black. The white middle ply of the 3-ply guard is not shown.", coat=0.5)
    matte_m = make_plain("RF_MAT_BlackPlastic_Matte", lin(ac["black_plastic"]), 0.0, 0.5, "assumed", "Colour assumed.")
    dark_m = make_plain("RF_MAT_Dark", (0.004, 0.004, 0.004), 0.0, 0.8, "none", "Stand-in for openings.")

    swap = {"RF_MAT_Placeholder_Maple": maple_m, "RF_MAT_Placeholder_Wenge": wenge_m,
            "RF_MAT_Placeholder_Purpleheart": purple_m, "RF_MAT_Placeholder_Rosewood": rose_m,
            "RF_MAT_Placeholder_NickelSilver": fret_m, "RF_MAT_Placeholder_Gold": gold_m,
            "RF_MAT_Placeholder_Bone": bone_m, "RF_MAT_Placeholder_Dark": dark_m}
    pick = {f"RF_{model}_Pickguard": pg_m}
    body = o[f"RF_{model}_Body"]
    body.data.materials.clear(); body.data.materials.append(body_m)
    assigned, unassigned = {}, []
    for ob in o:
        if ob.type != "MESH":
            continue
        if ob.name in pick:
            ob.data.materials.clear(); ob.data.materials.append(pick[ob.name])
        for i, m in enumerate(ob.data.materials):
            if m and m.name in swap:
                ob.data.materials[i] = swap[m.name]
            elif m and m.name == "RF_MAT_Placeholder_BlackPlastic":
                ob.data.materials[i] = matte_m
        names = [m.name if m else None for m in ob.data.materials]
        if not names or None in names:
            unassigned.append(ob.name)
        for n in names:
            assigned[n] = assigned.get(n, 0) + 1
    for m in list(bpy.data.materials):
        if m.name.startswith("RF_MAT_Placeholder_") and m.users == 0:
            bpy.data.materials.remove(m)
    rep["objects_per_material"] = assigned
    rep["objects_without_material"] = unassigned
    rep["placeholders_left"] = [m.name for m in bpy.data.materials if "Placeholder" in m.name]
    rep["image_textures_used"] = sum(1 for m in bpy.data.materials if m.node_tree
                                     for n in m.node_tree.nodes if n.type == "TEX_IMAGE")

    if args.preview_dir:
        out = Path(args.preview_dir); out.mkdir(parents=True, exist_ok=True)
        sc = bpy.context.scene
        world = bpy.data.worlds.new("preview"); sc.world = world; world.use_nodes = True
        world.node_tree.nodes["Background"].inputs[0].default_value = (0.5, 0.5, 0.5, 1)
        world.node_tree.nodes["Background"].inputs[1].default_value = 0.12
        tmp = []
        def add(ob):
            sc.collection.objects.link(ob); tmp.append(ob); return ob
        sc.render.engine = "CYCLES"; sc.cycles.samples = 128; sc.cycles.device = "CPU"
        try:                                   # keeps saturated colours closer to their base colour than AgX
            sc.view_settings.view_transform = "Khronos PBR Neutral"
        except TypeError:
            sc.view_settings.view_transform = "AgX"
        rep["preview_view_transform"] = sc.view_settings.view_transform
        shots = {  # name: (camera, target, lens / ortho scale, [(light loc, watts, size)], resolution)
            "front_ortho": ((0.3, 0, 2), (0.3, 0, 0), 1.0, [((0.3, -1.7, 0.9), 90, 1.0), ((0.3, 1.7, 0.9), 45, 1.0)], (1800, 700)),
            "body_ortho": ((0.56, 0, 2), (0.56, 0, 0), 0.5, [((0.56, -1.7, 0.9), 90, 1.0), ((0.56, 1.7, 0.9), 45, 1.0)], (1400, 1000)),
            "body_three_quarter": ((1.3, -0.8, 0.8), (0.58, 0.0, -0.01), 85,
                                   [((2.0, 0.6, 0.9), 70, 0.9), ((-0.3, -1.4, 0.5), 30, 0.8)], (1600, 1000)),
            "back_three_quarter": ((-0.55, -1.4, -1.1), (0.3, 0, -0.02), 85,
                                   [((1.6, -0.9, -0.5), 70, 0.9), ((-0.9, 0.9, -0.6), 30, 0.8)], (1600, 900)),
            "grain_closeup": ((0.78, -0.30, 0.22), (0.66, -0.08, -0.01), 105,
                              [((1.4, 0.3, 0.35), 40, 0.6)], (1400, 900))}
        for name, (loc, tgt, lens, lights, res) in shots.items():
            target = add(bpy.data.objects.new("t", None)); target.location = tgt
            cd = bpy.data.cameras.new(f"preview_{name}")
            if "ortho" in name:
                cd.type, cd.ortho_scale = "ORTHO", lens
            else:
                cd.lens = lens
            cam = add(bpy.data.objects.new(cd.name, cd)); cam.location = loc
            if "ortho" in name:
                cam.rotation_euler = (0, 0, 0)
            else:
                con = cam.constraints.new("TRACK_TO"); con.target = target
            lamps = []
            for lloc, watts, size in lights:
                ld = bpy.data.lights.new("l", "AREA"); ld.energy, ld.size = watts, size
                lamp = add(bpy.data.objects.new("l", ld)); lamp.location = lloc
                lc = lamp.constraints.new("TRACK_TO"); lc.target = target
                lamps.append(lamp)
            sc.camera = cam
            sc.render.resolution_x, sc.render.resolution_y = res
            sc.render.filepath = str(out / f"stage7_{name}.png")
            bpy.ops.render.render(write_still=True)
            for lamp in lamps:
                lamp.hide_render = True
        for ob in tmp:
            bpy.data.objects.remove(ob)
        bpy.data.worlds.remove(world)

    bpy.ops.wm.save_as_mainfile(filepath=str(Path(args.out).resolve()))
    rep["status"] = "built"
    text = json.dumps(rep, indent=2, ensure_ascii=False)
    if args.report:
        Path(args.report).write_text(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
