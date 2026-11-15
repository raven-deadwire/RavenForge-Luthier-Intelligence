"""Export the finished model as a GLB for web viewers, and check the file.

    python export_glb.py --config ../drawings/gramr.json --blend gramr_stage7.blend \
        --out gramr.glb --report gramr_glb.json

Works from the stage 7 or stage 8 .blend; the studio objects are not exported either way.

The source curves (the drawing itself), cameras and lights are left out. glTF
cannot carry Blender's procedural node materials, so the wood colour is baked to
image textures first; metals and plastics export as plain values. Object and
material custom properties (rf_status, rf_source, ...) go out as glTF extras, and
the concept-visualization notice is written to asset.extras.

Finish variants: a stained wood's colour is (stain colour) x (grain lightness), so the
grain is baked once as a neutral texture and each finish is only a different
baseColorFactor. The finishes listed under glb.finish_variants in the config are written
as KHR_materials_variants, with the spec finish as the default material. The input .blend
is not modified. After export the file is parsed and re-imported to check it.
"""
import argparse, json, struct, tempfile
from pathlib import Path
import bpy
from mathutils import Vector
from build_materials import lin, lum

MM = 0.001


def read_glb(path):
    data = Path(path).read_bytes()
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    assert magic == b"glTF" and version == 2 and length == len(data), "not a GLB 2.0 file"
    jlen, jtype = struct.unpack_from("<I4s", data, 12)
    assert jtype == b"JSON"
    return json.loads(data[20:20 + jlen]), data[20 + jlen:]


def write_glb(path, gltf, rest):
    js = json.dumps(gltf, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    js += b" " * (-len(js) % 4)
    body = struct.pack("<I4s", len(js), b"JSON") + js + rest
    Path(path).write_bytes(struct.pack("<4sII", b"glTF", 2, 12 + len(body)) + body)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    for a in ("--config", "--blend", "--out"):
        ap.add_argument(a, required=True)
    ap.add_argument("--report")
    args = ap.parse_args(argv)
    cfg = json.loads(Path(args.config).read_text())
    g, model = cfg["glb"], cfg["model"]
    out = Path(args.out).resolve()
    bpy.ops.wm.open_mainfile(filepath=str(Path(args.blend).resolve()))
    sc, vl = bpy.context.scene, bpy.context.view_layer
    rep = {"model": model, "stage": "glb"}

    export = []
    for suffix in g["collections"]:
        export += [ob for ob in bpy.data.collections[f"RF_{model}_{suffix}"].objects if ob.type == "MESH"]
    originals = {}
    dg = bpy.context.evaluated_depsgraph_get()
    for ob in export:
        ev = ob.evaluated_get(dg)
        originals[ob.name] = {"size": [round(v / MM, 3) for v in ob.dimensions],
                              "verts": len(ev.data.vertices), "status": ob.get("rf_status")}

    # --- bake procedural wood colour to textures (in memory only)
    sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = 4
    sc.render.bake.margin = g["bake_margin_px"]
    tmp = Path(tempfile.mkdtemp(prefix="rf_bake_"))

    # Stained woods: colour = stain x k x grain, where grain = mix(dark_ratio, 1, pattern) x slow variation.
    # Bake only `grain` (scaled by 1/HEAD so the variation's >1 peaks survive) and carry stain x k x HEAD
    # as the material's baseColorFactor. Switching finish then changes the factor, not the texture.
    HEAD = 1.06
    mpar, src = cfg["materials_illustrative"], cfg["materials_illustrative"]["colour_sources"]
    fv = g["finish_variants"]
    stained = {}                       # material name -> key, lightness k, wood colour, dark ratio
    for m in bpy.data.materials:
        key = m.name.split("_")[2] if m.name.startswith("RF_MAT_") and m.name.count("_") >= 3 else None
        p = mpar["wood"].get(key)
        if not p or not p["stained"]:
            continue
        ref = "ash" if p["colour"] == "ash" else "maple"
        wood = lin(src[p["colour"]]["hex"])
        stained[m.name] = {"key": key, "k": lum(wood) / lum(lin(src[ref]["hex"])), "wood": wood,
                           "dark_ratio": p["dark_ratio"]}
    stain0 = lin(next(v["hex"] for v in fv["variants"] if v["name"] == fv["default"]))

    def bake_object(ob, size, name, linear=False):
        for o_ in bpy.data.objects:
            o_.select_set(False)
        ob.select_set(True); vl.objects.active = ob
        # A float image keeps linear values in .pixels; a byte image holds sRGB-encoded ones.
        img = bpy.data.images.new(name, size, size, alpha=False, float_buffer=linear)
        nodes = []
        for m in ob.data.materials:
            n = m.node_tree.nodes.new("ShaderNodeTexImage"); n.image = img
            m.node_tree.nodes.active = n; nodes.append((m, n))
        bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"})
        return img, nodes

    def set_neutral(m):
        mix = next(n for n in m.node_tree.nodes if n.type == "MIX")
        for ident, v in (("A_Color", stained[m.name]["dark_ratio"] / HEAD), ("B_Color", 1 / HEAD)):
            next(s_ for s_ in mix.inputs if s_.identifier == ident).default_value = (v, v, v, 1)
    baked = {}
    for part, size in g["bake"].items():
        ob = bpy.data.objects[f"RF_{model}_{part}"]
        for o_ in bpy.data.objects:
            o_.select_set(False)
        ob.select_set(True); vl.objects.active = ob
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.003)
        bpy.ops.object.mode_set(mode="OBJECT")
        if part == "Body":             # check the split is exact: colour bake vs neutral bake x factor
            sc.render.bake.margin = 0
            ci, cn = bake_object(ob, 512, "tmp_colour", linear=True)
            colour = list(ci.pixels)
            for m, n in cn:
                m.node_tree.nodes.remove(n)
            m0 = ob.data.materials[0]
            set_neutral(m0)
            ni, nn = bake_object(ob, 512, "tmp_neutral", linear=True)
            neutral = list(ni.pixels)
            for m, n in nn:
                m.node_tree.nodes.remove(n)
            fac = [c * stained[m0.name]["k"] * HEAD for c in stain0]
            diffs = []
            for i in range(0, len(colour), 4 * 7):
                if neutral[i] <= 0:    # outside the UV islands
                    continue
                diffs.append(max(abs(colour[i + j] - neutral[i + j] * fac[j]) for j in range(3)))
            diffs.sort()
            # The two bakes sample each texel at slightly different sub-pixel positions, so texels that
            # straddle a dark grain line differ. Away from those edges the two must agree.
            rep["split_check_body"] = {
                "texels_compared": len(diffs),
                "linear_colour_difference": {"median": round(diffs[len(diffs) // 2], 5),
                                             "mean": round(sum(diffs) / len(diffs), 5),
                                             "p90": round(diffs[int(len(diffs) * 0.9)], 5),
                                             "max": round(diffs[-1], 5)},
                "share_within_0.01": round(sum(d < 0.01 for d in diffs) / len(diffs), 4)}
            bpy.data.images.remove(ci); bpy.data.images.remove(ni)
            sc.render.bake.margin = g["bake_margin_px"]
        for m in ob.data.materials:
            if m.name in stained:
                set_neutral(m)
        kind = "Grain" if ob.data.materials[0].name in stained else "BaseColor"
        img, nodes = bake_object(ob, size, f"RF_TEX_{model}_{part}_{kind}")
        img.filepath_raw = str(tmp / f"{img.name}.png"); img.file_format = "PNG"; img.save()
        for m, n in nodes:                         # texture replaces the procedural colour for export
            bsdf = m.node_tree.nodes["Principled BSDF"]
            for l in list(bsdf.inputs["Base Color"].links):
                m.node_tree.links.remove(l)
            m.node_tree.links.new(n.outputs["Color"], bsdf.inputs["Base Color"])
            m["rf_note"] = (m.get("rf_note", "") + " Base colour baked from the procedural material for glTF.").strip()
        px = list(img.pixels[:size * size * 4:4 * 97])
        baked[part] = {"size_px": size, "materials": [m.name for m, _ in nodes],
                       "red_mean": round(sum(px) / len(px), 3)}
    rep["baked_textures"] = baked

    # --- notice and export
    cap = cfg["studio"]["captions"]
    notice = {"notice_en": cap["en"], "notice_ko": cap["ko"], "notice_de": cap["de"],
              "units": "metres", "model": model, "source_sha256": bpy.data.objects[f"RF_{model}_SRC_Body"]["rf_source_sha256"],
              "status_legend": "rf_status on each node: drawing / spec / illustrative / pending"}
    for o_ in bpy.data.objects:
        o_.select_set(False)
    for ob in export:
        ob.select_set(True)
    vl.objects.active = export[0]
    bpy.ops.export_scene.gltf(filepath=str(out), export_format="GLB", use_selection=True, export_apply=True,
                              export_extras=True, export_cameras=False, export_lights=False, export_yup=True,
                              export_image_format="JPEG", export_jpeg_quality=g["jpeg_quality"])
    gltf, rest = read_glb(out)
    gltf["asset"].setdefault("extras", {}).update(notice)

    # --- finish variants (KHR_materials_variants): same grain texture, different baseColorFactor
    mats = gltf["materials"]
    index = {m["name"]: i for i, m in enumerate(mats)}
    clip = lambda c: [round(min(max(v, 0.0), 1.0), 6) for v in c] + [1.0]
    slug = lambda s_: "".join(w.capitalize() for w in s_.replace("-", " ").split())
    table, variant_material = {}, {}   # variant_material: (default material index, variant index) -> material index
    for vi, v in enumerate(fv["variants"]):
        table[v["name"]] = {}
        for name, info in stained.items():
            if name not in index:
                continue
            if v["kind"] == "stain":
                factor = clip([c * info["k"] * HEAD for c in lin(v["hex"])])
                source = f"{fv['stain_source']} ('{v['name']}' {v['hex']}); lightness from the wood's catalog colour"
            else:
                factor = clip([c * HEAD for c in info["wood"]])
                source = "assets/configurator-materials.js catalog colour of the wood itself (no stain)"
            base = mats[index[name]]
            if v["name"] == fv["default"]:
                base["pbrMetallicRoughness"]["baseColorFactor"] = factor
                variant_material[(index[name], vi)] = index[name]
            else:
                new = json.loads(json.dumps(base))
                new["name"] = f"RF_MAT_{info['key']}_{slug(v['name'])}"
                new["pbrMetallicRoughness"]["baseColorFactor"] = factor
                ex = new.setdefault("extras", {})
                ex["rf_colour_source"] = source
                ex["rf_note"] = ("Configurator finish option, for comparison in a viewer. Not the concept spec finish. "
                                 "Display colour, not a colour proof.")
                mats.append(new)
                variant_material[(index[name], vi)] = len(mats) - 1
            table[v["name"]][info["key"]] = factor[:3]
    gltf.setdefault("extensions", {})["KHR_materials_variants"] = {
        "variants": [{"name": v["name"], "extras": {k: v[k] for k in ("kind", "hex") if k in v}} for v in fv["variants"]]}
    gltf.setdefault("extensionsUsed", [])
    if "KHR_materials_variants" not in gltf["extensionsUsed"]:
        gltf["extensionsUsed"].append("KHR_materials_variants")
    mapped = 0
    for mesh in gltf["meshes"]:
        for prim in mesh["primitives"]:
            mi = prim.get("material")
            if any(k[0] == mi for k in variant_material):
                prim.setdefault("extensions", {})["KHR_materials_variants"] = {"mappings": [
                    {"material": variant_material[(mi, vi)], "variants": [vi]} for vi in range(len(fv["variants"]))]}
                mapped += 1
    gltf["asset"]["extras"].update({"default_finish": fv["default"], "finish_note": fv["note"]})
    rep["finish_variants"] = {"count": len(fv["variants"]), "default": fv["default"],
                              "primitives_with_mappings": mapped, "materials_added": len(mats) - len(index),
                              "base_colour_factor_linear": table}
    write_glb(out, gltf, rest)

    # --- check 1: parse the file
    gltf, rest = read_glb(out)
    names = [n.get("name") for n in gltf["nodes"]]
    acc = gltf["accessors"]
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    tris = 0
    for n in gltf["nodes"]:
        if "mesh" not in n:
            continue
        t = Vector(n.get("translation", (0, 0, 0)))
        for p in gltf["meshes"][n["mesh"]]["primitives"]:
            a = acc[p["attributes"]["POSITION"]]
            lo = Vector(map(min, lo, Vector(a["min"]) + t)); hi = Vector(map(max, hi, Vector(a["max"]) + t))
            tris += acc[p["indices"]]["count"] // 3
    rep["file"] = {
        "bytes": out.stat().st_size, "nodes": len(gltf["nodes"]), "meshes": len(gltf["meshes"]),
        "materials": len(gltf["materials"]), "images": len(gltf.get("images", [])), "triangles": tris,
        "extensions_used": gltf.get("extensionsUsed", []),
        "cameras": len(gltf.get("cameras", [])),
        "source_curves_included": sum(1 for n in names if n and "_SRC_" in n),
        "studio_objects_included": sum(1 for n in names if n and ("RF_CAM" in n or "RF_LIGHT" in n or "RF_STUDIO" in n)),
        "nodes_with_rf_status": sum(1 for n in gltf["nodes"] if n.get("extras", {}).get("rf_status")),
        "materials_with_colour_source": sum(1 for m in gltf["materials"] if m.get("extras", {}).get("rf_colour_source")),
        "variant_names": [v["name"] for v in gltf.get("extensions", {}).get("KHR_materials_variants", {}).get("variants", [])],
        "asset_extras_keys": sorted(gltf["asset"].get("extras", {})),
        "bbox_gltf_axes_mm": {"x": round((hi.x - lo.x) / MM, 2), "y_up": round((hi.y - lo.y) / MM, 2),
                              "z": round((hi.z - lo.z) / MM, 2)},
        "materials_with_base_colour_texture": sorted(m["name"] for m in gltf["materials"]
                                                     if "baseColorTexture" in m.get("pbrMetallicRoughness", {})),
        "materials_with_clearcoat": sorted(m["name"] for m in gltf["materials"]
                                           if "KHR_materials_clearcoat" in m.get("extensions", {}))}

    # --- check 2: import the file back into an empty scene and compare each object
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(out))
    back = {o_.name: o_ for o_ in bpy.data.objects if o_.type == "MESH"}
    worst, missing, status_lost = 0.0, [], []
    for name, ref in originals.items():
        ob = back.get(name)
        if ob is None:
            missing.append(name); continue
        d = max(abs(a - b / MM) for a, b in zip(ref["size"], ob.dimensions))
        worst = max(worst, d)
        if ob.get("rf_status") != ref["status"]:
            status_lost.append(name)
    rep["round_trip"] = {"objects_exported": len(originals), "objects_found_after_import": len(originals) - len(missing),
                         "missing": missing, "largest_size_difference_mm": round(worst, 4),
                         "objects_whose_rf_status_changed": status_lost,
                         "extra_objects": sorted(set(back) - set(originals))}
    rep["status"] = "exported"
    text = json.dumps(rep, indent=2, ensure_ascii=False)
    if args.report:
        Path(args.report).write_text(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
