"""Pilot stage 3: edge radius, forearm bevel and tummy cut on the body slab.

    python build_contours.py --config ../drawings/gramr.json --blend gramr_stage2.blend \
        --stage2-report gramr_stage2.json --out gramr_stage3.blend \
        --report gramr_stage3.json [--preview-dir DIR]

Every number used here comes from "contours_illustrative" in the config. They are
generic values, not drawing or spec data, so the body is tagged rf_status =
illustrative afterwards. The outline in plan view is not changed.
"""
import argparse, json, math
from pathlib import Path
import bpy, bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

MM = 0.001


def seg_dist(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-18)))
    return (p - (a + ab * t)).length


def boolean_difference(body, cutter):
    mod = body.modifiers.new("cut", "BOOLEAN")
    mod.operation, mod.solver, mod.object = "DIFFERENCE", "EXACT", cutter
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    new = bpy.data.meshes.new_from_object(body.evaluated_get(dg))
    body.modifiers.remove(mod)
    old = body.data
    body.data = new
    new.name = old.name
    bpy.data.meshes.remove(old)
    bpy.data.objects.remove(cutter)


def volume(me):
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    v = bm.calc_volume(); ok = all(e.is_manifold for e in bm.edges)
    bm.free()
    return v * 1e6, ok


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    for a in ("--config", "--blend", "--stage2-report", "--out"):
        ap.add_argument(a, required=True)
    ap.add_argument("--report"); ap.add_argument("--preview-dir")
    args = ap.parse_args(argv)
    cfg = json.loads(Path(args.config).read_text())
    par, model = cfg["contours_illustrative"], cfg["model"]
    thick = cfg["body_thickness_mm"] * MM
    closure = json.loads(Path(args.stage2_report).read_text())["closure"]
    bpy.ops.wm.open_mainfile(filepath=str(Path(args.blend).resolve()))
    body = bpy.data.objects[f"RF_{model}_Body"]
    scene_col = bpy.context.scene.collection
    rep = {"model": model, "stage": 3, "parameters": par}
    rep["volume_before_cm3"], _ = volume(body.data)
    size0 = [round(v * 1000, 2) for v in body.dimensions]

    # --- edge radius on the rim, both faces, skipping the neck-pocket closure edges
    r = par["edge_radius_mm"] * MM
    bm = bmesh.new(); bm.from_mesh(body.data)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(0.5), verts=bm.verts, edges=bm.edges)
    segs = [(Vector(c["from_mm"]) * MM, Vector(c["to_mm"]) * MM) for c in closure]
    on_closure = lambda v: min(seg_dist(Vector((v.co.x, v.co.y)), a, b) for a, b in segs) < 0.03 * MM
    rim = []
    for e in bm.edges:
        if len(e.link_faces) != 2:
            continue
        nz = sorted(abs(f.normal.z) for f in e.link_faces)
        if nz[0] < 0.05 and nz[1] > 0.95 and not (on_closure(e.verts[0]) and on_closure(e.verts[1])):
            rim.append(e)
    rep["rim_edges_rounded"] = len(rim)
    bmesh.ops.bevel(bm, geom=rim, offset=r, offset_type="OFFSET", segments=6, profile=0.5,
                    affect="EDGES", clamp_overlap=False)
    bm.to_mesh(body.data); bm.free()
    rep["volume_after_radius_cm3"], _ = volume(body.data)
    verts = [v.co.copy() for v in body.data.vertices]

    # --- forearm bevel: cylindrical surface tangent to the top face along a hinge line
    fa = par["forearm"]
    th = math.radians(fa["hinge_angle_deg"])
    t = Vector((math.cos(th), math.sin(th), 0)); n = Vector((math.sin(th), -math.cos(th), 0))
    w, d = fa["width_mm"] * MM, fa["depth_at_rim_mm"] * MM
    h = max(v.dot(n) for v in verts)
    far = max(verts, key=lambda v: v.dot(n))
    R = (w * w + d * d) / (2 * d)
    U = min(R * 0.98, w + 0.04)
    prof = [(U * i / 64, -(R - math.sqrt(R * R - (U * i / 64) ** 2))) for i in range(65)]
    prof += [(U, 0.02), (0.0, 0.02)]
    P = n * (h - w) + t * far.dot(t)      # hinge point abreast of the farthest rim point
    bm = bmesh.new()
    ring = [bm.verts.new(P + t * -0.6 + n * u + Vector((0, 0, z))) for u, z in prof]
    face = bm.faces.new(ring)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    bmesh.ops.translate(bm, verts=[g for g in ext["geom"] if isinstance(g, bmesh.types.BMVert)], vec=t * 1.2)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("cutter_forearm"); bm.to_mesh(me); bm.free()
    cut = bpy.data.objects.new("cutter_forearm", me); scene_col.objects.link(cut)
    boolean_difference(body, cut)
    rep["forearm"] = {"cylinder_radius_mm": round(R / MM, 2),
                      "hinge_line_through_mm": [round(P.x / MM, 2), round(P.y / MM, 2)],
                      "farthest_rim_point_mm": [round(far.x / MM, 2), round(far.y / MM, 2)]}
    rep["volume_after_forearm_cm3"], _ = volume(body.data)

    # --- tummy cut: ellipsoidal cove on the back, centred on the bass-side rim
    tc = par["tummy"]
    def rim_y(x):  # bass-side rim (most negative Y) near this X
        return min(v.y for v in verts if abs(v.x - x) < 4 * MM and v.y < 0)
    xc = tc["centre_x_mm"] * MM
    C = Vector((xc, rim_y(xc), 0))
    tan = Vector((0.06, rim_y(xc + 0.03) - rim_y(xc - 0.03), 0)).normalized()
    inward = Vector((-tan.y, tan.x, 0))
    if inward.y < 0:
        inward = -inward
    Rc, win, dep = tc["section_radius_mm"] * MM, tc["inward_mm"] * MM, tc["depth_at_rim_mm"] * MM
    chord = math.hypot(win, dep)
    k = math.sqrt(Rc * Rc - chord * chord / 4)
    uc = win / 2 - k * dep / chord            # centre offset inward from the rim
    zc = dep / 2 - k * win / chord            # centre height above the back face (negative)
    half_len = tc["length_mm"] * MM / 2
    A = half_len / math.sqrt(1 - (zc / Rc) ** 2)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=128, v_segments=64, radius=1.0)
    me = bpy.data.meshes.new("cutter_tummy"); bm.to_mesh(me); bm.free()
    cut = bpy.data.objects.new("cutter_tummy", me); scene_col.objects.link(cut)
    rot = Matrix((tan, inward, Vector((0, 0, 1)))).transposed().to_4x4()
    centre = C + inward * uc + Vector((0, 0, -thick + zc))
    cut.matrix_world = Matrix.Translation(centre) @ rot @ Matrix.Diagonal((A, Rc, Rc, 1))
    boolean_difference(body, cut)
    rep["tummy"] = {"rim_point_mm": [round(C.x / MM, 2), round(C.y / MM, 2)],
                    "rim_tangent_deg": round(math.degrees(math.atan2(tan.y, tan.x)), 2),
                    "ellipsoid_semi_axes_mm": [round(A / MM, 1), round(Rc / MM, 1), round(Rc / MM, 1)],
                    "ellipsoid_centre_mm": [round(c / MM, 2) for c in centre]}

    # --- centre joint, shading, measurements
    bm = bmesh.new(); bm.from_mesh(body.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                           plane_co=(0, 0, 0), plane_no=(0, 1, 0), dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.link_faces[0].normal.angle(e.link_faces[1].normal, 0) > math.radians(35):
            e.smooth = False
    bm.to_mesh(body.data)
    # Keep the large flat faces flat under smooth shading.
    wn = body.modifiers.new("RF_WeightedNormal", "WEIGHTED_NORMAL")
    wn.mode, wn.weight, wn.keep_sharp = "FACE_AREA", 100, True
    bmesh.ops.triangulate(bm, faces=bm.faces)
    tree = BVHTree.FromBMesh(bm)
    def top_z(p):
        hit = tree.ray_cast(Vector((p.x, p.y, 1.0)), Vector((0, 0, -1)))[0]
        return hit.z if hit else None
    def back_z(p):
        hit = tree.ray_cast(Vector((p.x, p.y, -1.0)), Vector((0, 0, 1)))[0]
        return hit.z if hit else None
    inset = 0.008
    pf = far - n * inset
    uf = w - inset
    rep["forearm"]["check_8mm_inside_rim"] = {
        "top_surface_z_mm": round(top_z(pf) / MM, 3),
        "expected_z_mm": round(-(R - math.sqrt(R * R - uf * uf)) / MM, 3)}
    pt = C + inward * inset
    rep["tummy"]["check_8mm_inside_rim"] = {
        "back_surface_height_above_back_mm": round((back_z(pt) + thick) / MM, 3),
        "expected_mm": round((zc + math.sqrt(Rc * Rc - (inset - uc) ** 2)) / MM, 3)}
    ctr = Vector((0.6, 0.02, 0))
    rep["untouched_centre_thickness_mm"] = round((top_z(ctr) - back_z(ctr)) / MM, 3)
    bm.free()
    rep["volume_after_cm3"], rep["manifold"] = volume(body.data)
    for key in ("volume_before_cm3", "volume_after_radius_cm3", "volume_after_forearm_cm3", "volume_after_cm3"):
        rep[key] = round(rep[key], 1)
    bpy.context.view_layer.update()
    rep["size_before_mm"], rep["size_after_mm"] = size0, [round(v * 1000, 2) for v in body.dimensions]
    rep["verts"], rep["faces"] = len(body.data.vertices), len(body.data.polygons)

    body["rf_status"] = "illustrative"
    body["rf_note"] = (
        "Outline from drawing; thickness from spec. Edge radius, forearm bevel and tummy cut use "
        "generic values (contours_illustrative in the drawing config), not drawing or spec data. "
        "Neck-pocket closure edges are left square. Contour edges where the cuts meet the rim are "
        "left sharp. No cavities, neck pocket or sculpted heel. Split at Y=0 for the centre joint. "
        "Z placement provisional: top face at Z=0.")

    if args.preview_dir:
        out = Path(args.preview_dir); out.mkdir(parents=True, exist_ok=True)
        sc = bpy.context.scene
        mat = bpy.data.materials.new("RF_MAT_Preview_Clay"); mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (0.42, 0.40, 0.37, 1)
        bsdf.inputs["Roughness"].default_value = 0.55
        body.data.materials.append(mat)
        world = bpy.data.worlds.new("preview"); sc.world = world; world.use_nodes = True
        world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
        world.node_tree.nodes["Background"].inputs[1].default_value = 0.18
        tmp = []
        def add(ob):
            sc.collection.objects.link(ob); tmp.append(ob); return ob
        target = add(bpy.data.objects.new("preview_target", None))
        target.location = (0.55, 0.0, -thick / 2)
        sc.render.engine = "CYCLES"; sc.cycles.samples = 64; sc.cycles.device = "CPU"
        sc.render.resolution_x, sc.render.resolution_y = 1200, 800
        sc.view_settings.view_transform = "AgX"
        shots = {"front_bass_side": ((1.25, -0.95, 0.75), (0.9, -1.2, 0.5)),
                 "back_bass_side": ((1.05, -1.05, -0.8), (0.2, -1.3, -0.55)),
                 "front_low_raking": ((1.45, -0.55, 0.28), (0.3, -1.4, 0.35))}
        for name, (loc, light) in shots.items():
            cd = bpy.data.cameras.new(f"preview_{name}"); cd.lens = 85
            cam = add(bpy.data.objects.new(cd.name, cd)); cam.location = loc
            con = cam.constraints.new("TRACK_TO"); con.target = target
            if loc[2] < 0:
                con.up_axis = "UP_Y"
            ld = bpy.data.lights.new(f"preview_light_{name}", "AREA"); ld.energy, ld.size = 22, 0.5
            lamp = add(bpy.data.objects.new(ld.name, ld)); lamp.location = light
            lc = lamp.constraints.new("TRACK_TO"); lc.target = target
            sc.camera = cam
            sc.render.filepath = str(out / f"stage3_{name}.png")
            bpy.ops.render.render(write_still=True)
            lamp.hide_render = True
        for ob in tmp:
            bpy.data.objects.remove(ob)
        body.data.materials.clear(); bpy.data.materials.remove(mat)

    bpy.ops.wm.save_as_mainfile(filepath=str(Path(args.out).resolve()))
    rep["status"] = "built"
    text = json.dumps(rep, indent=2, ensure_ascii=False)
    if args.report:
        Path(args.report).write_text(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
