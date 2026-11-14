"""Pilot stage 2: turn the imported body outline into a slab of the spec thickness.

    python build_body.py --config ../drawings/gramr.json --blend gramr_stage1.blend \
        --out gramr_stage2.blend --report gramr_stage2.json [--preview-dir DIR]

Reads only the stage 1 .blend. The outline comes from RF_<MODEL>_SRC_Body. It is
open at the neck pocket, so it is closed along RF_<MODEL>_SRC_HeelBoundary (the
transverse neck/body line of the rear projection) and one straight edge joining
that line to the outline. The result is a square-edged slab: no edge radius, no
contours, no cavities, no neck pocket. Visualisation only, not machining data.
"""
import argparse, json, math, sys
from pathlib import Path
import bpy, bmesh
from mathutils import Vector


def sample(ob, resolution):
    """World-space polyline of a curve object's single spline, in metres."""
    ob.data.resolution_u = resolution
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    ev = ob.evaluated_get(dg)
    me = ev.to_mesh()
    pts = [ob.matrix_world @ v.co for v in me.vertices]
    ev.to_mesh_clear()
    return pts


def poly_distance(points, poly, closed):
    """Largest distance from any of `points` to the polyline `poly` (2D)."""
    segs = list(zip(poly, poly[1:] + (poly[:1] if closed else [])))
    if not closed:
        segs = segs[:-1] if len(segs) == len(poly) else segs
    worst = 0.0
    for p in points:
        best = 1e9
        for a, b in segs:
            ab = b - a
            t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-18)))
            best = min(best, (p - (a + ab * t)).length)
        worst = max(worst, best)
    return worst


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--config", required=True)
    ap.add_argument("--blend", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--report")
    ap.add_argument("--preview-dir")
    ap.add_argument("--resolution", type=int, default=32)
    args = ap.parse_args(argv)
    cfg = json.loads(Path(args.config).read_text())
    model, thick = cfg["model"], cfg["body_thickness_mm"] / 1000.0

    bpy.ops.wm.open_mainfile(filepath=str(Path(args.blend).resolve()))
    o = bpy.data.objects
    src, heel_ob = o[f"RF_{model}_SRC_Body"], o[f"RF_{model}_SRC_HeelBoundary"]
    rep = {"model": model, "stage": 2, "thickness_mm": cfg["body_thickness_mm"]}

    outline = [Vector((p.x, p.y)) for p in sample(src, args.resolution)]
    fine = [Vector((p.x, p.y)) for p in sample(src, args.resolution * 8)]
    rep["chord_error_max_mm"] = poly_distance(fine, outline, closed=False) * 1000
    heel = [Vector((p.x, p.y)) for p in sample(heel_ob, 1)]
    heel = [heel[0], heel[-1]]
    start, end = outline[0], outline[-1]
    # Walk on from the outline's end: nearer heel point first, then the other, then back to start.
    if (end - heel[0]).length > (end - heel[1]).length:
        heel.reverse()
    closing = [(end, heel[0]), (heel[0], heel[1]), (heel[1], start)]
    rep["closure"] = [{"from_mm": [round(a.x * 1000, 2), round(a.y * 1000, 2)],
                       "to_mm": [round(b.x * 1000, 2), round(b.y * 1000, 2)],
                       "length_mm": round((b - a).length * 1000, 2)} for a, b in closing]
    rep["closure"][0]["origin"] = "straight edge added here; not a line in the drawing"
    rep["closure"][1]["origin"] = "heel boundary line of the rear projection"
    rep["closure"][2]["origin"] = "gap between that line's end and the outline's start"
    ring = outline + [p for p in heel if min((p - q).length for q in (start, end)) > 1e-6]

    rear = o.get(f"RF_{model}_SRC_RearBody")
    if rear:
        rpts = [Vector((p.x, p.y)) for p in sample(rear, args.resolution)]
        rep["front_vs_rear_outline_max_mm"] = poly_distance(rpts, ring, closed=True) * 1000

    cu = bpy.data.curves.new("tmp_body_outline", "CURVE")
    cu.dimensions, cu.fill_mode, cu.extrude = "2D", "BOTH", thick / 2
    sp = cu.splines.new("POLY")
    sp.points.add(len(ring) - 1)
    for pt, p in zip(sp.points, ring):
        pt.co = (p.x, p.y, 0.0, 1.0)
    sp.use_cyclic_u = True
    tmp = bpy.data.objects.new("tmp_body_outline", cu)
    bpy.context.scene.collection.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    me.name = f"RF_{model}_Body"

    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    # Centre joint of the two-piece body: split the mesh along Y = 0.
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                           plane_co=(0, 0, 0), plane_no=(0, 1, 0), dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for v in bm.verts:           # slab spans Z = -thickness .. 0 (top face at Z = 0)
        v.co.z -= thick / 2
    rep["volume_cm3"] = round(bm.calc_volume() * 1e6, 1)
    rep["top_area_cm2"] = round(sum(f.calc_area() for f in bm.faces if f.normal.z > 0.99) * 1e4, 1)
    rep["manifold"] = all(e.is_manifold for e in bm.edges)
    rep["verts"], rep["faces"] = len(bm.verts), len(bm.faces)
    bm.to_mesh(me)
    bm.free()

    body = bpy.data.objects.new(f"RF_{model}_Body", me)
    col = bpy.data.collections.get(f"RF_{model}_Body") or bpy.data.collections.new(f"RF_{model}_Body")
    if col.name not in bpy.data.collections[f"RF_{model}"].children:
        bpy.data.collections[f"RF_{model}"].children.link(col)
    col.objects.link(body)
    body["rf_status"] = "spec"
    body["rf_source"] = f"{src['rf_source']}; {heel_ob['rf_source']}; thickness from concept spec"
    body["rf_source_sha256"] = src["rf_source_sha256"]
    body["rf_note"] = (
        "Outline from drawing; thickness from spec. Closed at the neck pocket along the rear "
        "heel boundary line plus one added straight edge (see stage 2 report). Square edges: "
        "no edge radius, contours, cavities or neck pocket. Split at Y=0 for the centre joint. "
        "Z placement provisional: top face at Z=0 until the fingerboard height over the body is known.")
    bpy.context.view_layer.update()
    d = body.dimensions
    rep["size_mm"] = [round(d.x * 1000, 2), round(d.y * 1000, 2), round(d.z * 1000, 3)]
    rep["z_range_mm"] = [round(min(v.co.z for v in me.vertices) * 1000, 3),
                         round(max(v.co.z for v in me.vertices) * 1000, 3)]

    if args.preview_dir:
        out = Path(args.preview_dir); out.mkdir(parents=True, exist_ok=True)
        sc = bpy.context.scene
        mat = bpy.data.materials.new("RF_MAT_Preview_Clay")
        mat.use_nodes = True
        mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.42, 0.40, 0.37, 1)
        mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.7
        me.materials.append(mat)
        world = bpy.data.worlds.new("preview"); sc.world = world
        world.use_nodes = True
        world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
        world.node_tree.nodes["Background"].inputs[1].default_value = 0.35
        sun = bpy.data.objects.new("preview_sun", bpy.data.lights.new("preview_sun", "SUN"))
        sun.data.energy, sun.data.angle = 2.2, math.radians(20)
        sun.rotation_euler = (math.radians(50), 0, math.radians(30))
        sc.collection.objects.link(sun)
        cx, cy = (min(p.x for p in ring) + max(p.x for p in ring)) / 2, 0.0
        cams = {"front_ortho": ((cx, cy, 1.0), (0, 0, 0), "ORTHO"),
                "three_quarter": ((cx - 0.75, cy - 0.95, 0.85), None, "PERSP")}
        target = bpy.data.objects.new("preview_target", None); target.location = (cx, cy, -thick / 2)
        sc.collection.objects.link(target)
        sc.render.engine = "CYCLES"; sc.cycles.samples = 48; sc.cycles.device = "CPU"
        sc.render.resolution_x, sc.render.resolution_y = 1200, 800
        sc.view_settings.view_transform = "Standard"
        for name, (loc, rot, kind) in cams.items():
            cd = bpy.data.cameras.new(f"RF_CAM_preview_{name}")
            cam = bpy.data.objects.new(cd.name, cd); sc.collection.objects.link(cam)
            cam.location = loc
            if kind == "ORTHO":
                cd.type, cd.ortho_scale = "ORTHO", 0.56
                cam.rotation_euler = rot
            else:
                cd.lens = 85
                c = cam.constraints.new("TRACK_TO"); c.target = target
            sc.camera = cam
            sc.render.filepath = str(out / f"stage2_{name}.png")
            bpy.ops.render.render(write_still=True)
            bpy.data.objects.remove(cam)
        for x in (sun, target):
            bpy.data.objects.remove(x)
        me.materials.clear(); bpy.data.materials.remove(mat)

    bpy.ops.wm.save_as_mainfile(filepath=str(Path(args.out).resolve()))
    rep["status"] = "built"
    text = json.dumps(rep, indent=2, ensure_ascii=False)
    if args.report:
        Path(args.report).write_text(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
