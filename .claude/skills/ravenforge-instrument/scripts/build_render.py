"""Pilot stage 8: studio lights, the standard camera set, renders, and the final check.

    python build_render.py --config ../drawings/gramr.json --blend gramr_stage7.blend \
        --out gramr_stage8.blend --report gramr_stage8.json --render-dir DIR [--draft]

Saves the lights (RF_LIGHT_*) under a rig empty and the cameras (RF_CAM_*) in
collection RF_<MODEL>_Studio, renders each camera, writes a captioned copy of
every render, draws the source outlines over the front orthographic render, and
checks the built silhouette against the source outline. --draft renders small
and noisy for tuning.
"""
import argparse, json, math
from pathlib import Path
import bpy, bmesh
from mathutils import Vector, Euler
from mathutils.bvhtree import BVHTree
from build_body import sample

MM = 0.001


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    for a in ("--config", "--blend", "--out", "--render-dir"):
        ap.add_argument(a, required=True)
    ap.add_argument("--report"); ap.add_argument("--draft", action="store_true")
    ap.add_argument("--only", help="comma-separated camera names to render")
    args = ap.parse_args(argv)
    cfg = json.loads(Path(args.config).read_text())
    st, model = cfg["studio"], cfg["model"]
    out = Path(args.render_dir); out.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=str(Path(args.blend).resolve()))
    o, sc = bpy.data.objects, bpy.context.scene
    root = bpy.data.collections[f"RF_{model}"]
    col = bpy.data.collections.get(f"RF_{model}_Studio") or bpy.data.collections.new(f"RF_{model}_Studio")
    if col.name not in root.children:
        root.children.link(col)
    rep = {"model": model, "stage": 8}

    # --- world, colour management, render settings
    world = bpy.data.worlds.new("RF_WORLD_Studio"); sc.world = world; world.use_nodes = True
    g = st["world_grey"]
    world.node_tree.nodes["Background"].inputs[0].default_value = (g, g, g, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
    sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"
    sc.cycles.samples = 24 if args.draft else st["samples"]
    try:
        sc.cycles.use_denoising = True
    except Exception:
        pass
    try:
        sc.view_settings.view_transform = st["view_transform"]
    except TypeError:
        sc.view_settings.view_transform = "AgX"
    rep["view_transform"], rep["samples"] = sc.view_settings.view_transform, sc.cycles.samples
    sc.render.image_settings.file_format = "PNG"

    # --- light rig
    rig = bpy.data.objects.new("RF_STUDIO_Rig", None); col.objects.link(rig)
    centre = Vector((0.30, 0.0, -0.02))
    target = bpy.data.objects.new("RF_STUDIO_Target", None); col.objects.link(target)
    target.location, target.parent = centre, rig
    for name, L in st["lights"].items():
        ld = bpy.data.lights.new(f"RF_LIGHT_{name}", "AREA")
        ld.shape, ld.size, ld.size_y, ld.energy = "RECTANGLE", L["size_m"][0], L["size_m"][1], L["watts"]
        ob = bpy.data.objects.new(ld.name, ld); col.objects.link(ob)
        ob.location, ob.parent = L["location_m"], rig
        con = ob.constraints.new("TRACK_TO"); con.target = target
        ob.visible_camera = L["camera_visible"]
        ob["rf_note"] = L["role"]

    # --- cameras
    cams = {}
    for name, C in st["cameras"].items():
        cd = bpy.data.cameras.new(f"RF_CAM_{name}")
        if C["type"] == "ORTHO":
            cd.type, cd.ortho_scale = "ORTHO", C["ortho_scale_m"]
        else:
            cd.lens = C["lens_mm"]
        cd.clip_end = 20
        cam = bpy.data.objects.new(cd.name, cd); col.objects.link(cam)
        cam.location = C["location_m"]
        if "rotation_deg" in C:
            cam.rotation_euler = Euler([math.radians(a) for a in C["rotation_deg"]])
        else:
            loc, tgt = Vector(C["location_m"]), Vector(C["target_m"])
            up = "Y"
            cam.rotation_euler = (tgt - loc).to_track_quat("-Z", up).to_euler()
        cam["rf_rig_flip"] = C["rig_flip"]
        cam["rf_resolution"] = C["resolution"]
        cams[name] = cam

    # --- silhouette check against the source outlines (plan view)
    bm = bmesh.new()
    for nm in (f"RF_{model}_Body", f"RF_{model}_Neck", f"RF_{model}_Fretboard"):
        me = bpy.data.meshes.new_from_object(o[nm]); me.transform(o[nm].matrix_world)
        bm.from_mesh(me); bpy.data.meshes.remove(me)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    tree = BVHTree.FromBMesh(bm)
    hit = lambda p: tree.ray_cast(Vector((p.x, p.y, 5.0)), Vector((0, 0, -1)))[0] is not None
    tol = 0.1 * MM
    sil = {}
    for part in ("Body", "Headstock"):
        pts = [Vector((p.x, p.y)) for p in sample(o[f"RF_{model}_SRC_{part}"], 16)]
        ok = n = 0
        for a, b_, c in zip(pts, pts[1:], pts[2:]):
            t = (c - a)
            if t.length < 1e-9:
                continue
            nrm = Vector((-t.y, t.x)).normalized()
            inside_, outside_ = hit(b_ + nrm * tol), hit(b_ - nrm * tol)
            n += 1
            ok += inside_ != outside_            # material on exactly one side => edge within the tolerance
        sil[part] = {"points_checked": n, "within_0.1mm": ok}
    bm.free()
    rep["silhouette_vs_source_outline"] = sil
    f12 = o[f"RF_{model}_Fret_12"]
    x12 = sum((f12.matrix_world @ v.co).x for v in f12.data.vertices) / len(f12.data.vertices)
    rep["scale_measured_mm"] = round(2 * x12 / MM, 3)
    rep["scale_spec_mm"] = cfg["scale_mm"]

    # --- status roll-up (the report format the skill asks for)
    counts, loose, missing = {}, [], []
    for ob in o:
        if ob.type != "MESH":
            continue
        s = ob.get("rf_status")
        if not s or not ob.get("rf_source"):
            missing.append(ob.name)
        counts[s] = counts.get(s, 0) + 1
        if s in ("illustrative", "pending"):
            loose.append(ob.name)
    rep["mesh_objects_by_status"] = counts
    rep["mesh_objects_missing_status_or_source"] = missing
    rep["illustrative_objects"] = len(loose)
    rep["pending_not_modelled"] = ["neck joint: pocket, bolt positions, deep tenon, sculpted heel",
                                   "strings, strap buttons, cavities, tremolo internals"]
    rep["source_sha256"] = o[f"RF_{model}_SRC_Body"]["rf_source_sha256"]

    # --- render
    only = set(args.only.split(",")) if args.only else None
    rep["renders"] = {}
    import pymupdf, time
    cap = st["captions"]
    for name, cam in cams.items():
        if only and name not in only:
            continue
        for lname, L in st["lights"].items():     # for views from behind, mirror the lights to the back side
            x, y, z = L["location_m"]
            o[f"RF_LIGHT_{lname}"].location = (x, y, 2 * centre.z - z) if cam["rf_rig_flip"] else (x, y, z)
        sc.camera = cam
        w, h = cam["rf_resolution"]
        k = 0.3 if args.draft else 1.0
        sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = int(w * k), int(h * k), 100
        path = out / f"{model.lower()}_{name.lower()}.png"
        sc.render.filepath = str(path)
        t0 = time.time(); bpy.ops.render.render(write_still=True)
        rep["renders"][name] = {"file": path.name, "seconds": round(time.time() - t0, 1),
                                "size": [sc.render.resolution_x, sc.render.resolution_y]}
        # captioned copy
        pix = pymupdf.Pixmap(str(path))
        W, H = pix.width, pix.height
        fs = max(9.0, W / 150)
        bar = fs * 5.2
        doc = pymupdf.open(); page = doc.new_page(width=W, height=H + bar)
        page.draw_rect(pymupdf.Rect(0, 0, W, H + bar), color=None, fill=(0.06, 0.06, 0.06))
        page.insert_image(pymupdf.Rect(0, 0, W, H), filename=str(path))
        y = H + fs * 1.5
        for lang, font in (("ko", "korea"), ("en", "helv"), ("de", "helv")):
            page.insert_text((fs, y), cap[lang], fontsize=fs, fontname=font, color=(0.82, 0.82, 0.82))
            y += fs * 1.45
        page.get_pixmap(alpha=False).save(str(out / f"{model.lower()}_{name.lower()}_captioned.png"))
        # source-outline overlay on the front orthographic render
        if name == "Front_Ortho":
            doc = pymupdf.open(); page = doc.new_page(width=W, height=H)
            page.insert_image(pymupdf.Rect(0, 0, W, H), filename=str(path))
            s_ = cam.data.ortho_scale
            px = lambda p: pymupdf.Point((p.x - cam.location.x) / s_ * W + W / 2, H / 2 - (p.y - cam.location.y) / s_ * W)
            sh = page.new_shape()
            for ob in o:
                if ob.name.startswith(f"RF_{model}_SRC_") and ob.type == "CURVE" and "RearBody" not in ob.name \
                        and "HeelBoundary" not in ob.name:
                    pts = [px(p) for p in sample(ob, 16)]
                    sh.draw_polyline(pts)
            sh.finish(color=(0.1, 0.95, 0.95), width=max(1.0, W / 1600), closePath=False); sh.commit()
            page.get_pixmap(alpha=False).save(str(out / f"{model.lower()}_front_ortho_overlay.png"))
    for lname, L in st["lights"].items():
        o[f"RF_LIGHT_{lname}"].location = L["location_m"]
    sc.camera = cams["ThreeQuarter"]

    if not args.draft:
        bpy.ops.wm.save_as_mainfile(filepath=str(Path(args.out).resolve()))
    rep["status"] = "draft" if args.draft else "rendered"
    text = json.dumps(rep, indent=2, ensure_ascii=False)
    if args.report:
        Path(args.report).write_text(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
