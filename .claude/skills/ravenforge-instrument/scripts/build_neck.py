"""Pilot stage 4: fingerboard, neck shaft and headstock.

    python build_neck.py --config ../drawings/gramr.json --blend gramr_stage3.blend \
        --stage1-report gramr_stage1.json --out gramr_stage4.blend \
        --report gramr_stage4.json [--preview-dir DIR]

From the drawing: fingerboard plan, headstock outline. From the spec: fingerboard
radius, laminate order. Everything about heights, thicknesses, the back profile,
the headstock step and the laminate widths comes from "neck_illustrative" in the
config: generic values, so the neck is tagged rf_status = illustrative.

The body is moved down so the fingerboard top (Z = 0) sits the assumed height
above the body top. No neck pocket is cut: the heel is a plain block that
overlaps the body volume, and the joint stays pending.
"""
import argparse, json, math
from pathlib import Path
import bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from build_body import sample

MM = 0.001


def mesh_object(name, bm, collection):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); collection.objects.link(ob)
    return ob


def loft(sections):
    """Closed solid through a list of equal-length closed section rings."""
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in sec] for sec in sections]
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bm.faces.new(rings[0]); bm.faces.new(list(reversed(rings[-1])))
    return bm


def boolean(target, other, op):
    mod = target.modifiers.new("b", "BOOLEAN")
    mod.operation, mod.solver, mod.object = op, "EXACT", other
    dg = bpy.context.evaluated_depsgraph_get(); dg.update()
    new = bpy.data.meshes.new_from_object(target.evaluated_get(dg))
    target.modifiers.remove(mod)
    old = target.data; target.data = new; new.name = old.name
    bpy.data.meshes.remove(old); bpy.data.objects.remove(other)


def finish_shading(ob, sharp_deg=35):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.link_faces[0].normal.angle(e.link_faces[1].normal, 0) > math.radians(sharp_deg):
            e.smooth = False
    vol, ok = bm.calc_volume(), all(e.is_manifold for e in bm.edges)
    bm.to_mesh(ob.data); bm.free()
    wn = ob.modifiers.new("RF_WeightedNormal", "WEIGHTED_NORMAL")
    wn.mode, wn.weight, wn.keep_sharp = "FACE_AREA", 100, True
    return round(vol * 1e6, 1), ok


def placeholder(name, rgb):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    b = mat.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = 0.55
    mat.diffuse_color = (*rgb, 1)
    mat["rf_status"] = "illustrative"; mat["rf_note"] = "flat placeholder colour until the materials stage"
    return mat


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    for a in ("--config", "--blend", "--stage1-report", "--out"):
        ap.add_argument(a, required=True)
    ap.add_argument("--report"); ap.add_argument("--preview-dir")
    args = ap.parse_args(argv)
    cfg = json.loads(Path(args.config).read_text())
    s1 = json.loads(Path(args.stage1_report).read_text())
    par, model = cfg["neck_illustrative"], cfg["model"]
    bpy.ops.wm.open_mainfile(filepath=str(Path(args.blend).resolve()))
    o = bpy.data.objects
    root = bpy.data.collections[f"RF_{model}"]
    col = bpy.data.collections.get(f"RF_{model}_Neck") or bpy.data.collections.new(f"RF_{model}_Neck")
    if col.name not in root.children:
        root.children.link(col)
    scratch = bpy.context.scene.collection
    rep = {"model": model, "stage": 4, "parameters": par}

    # --- drawing data in skill coordinates (metres)
    f, x0, yc = s1["mm_per_pt"], s1["nut_x_pt"], s1["centreline_y_pt"]
    ys = -1 if cfg["orientation"]["treble"] == "-y" else 1
    board = [Vector(((p[0] - x0) * f * MM, ys * (p[1] - yc) * f * MM)) for p in cfg["board_pt"]]
    nut_pts = sorted([p for p in board if abs(p.x) < 1e-3], key=lambda p: p.y)
    end_pts = sorted([p for p in board if abs(p.x) > 1e-3], key=lambda p: p.y)
    L = (end_pts[0].x + end_pts[1].x) / 2
    hw0, hw1 = (nut_pts[1].y - nut_pts[0].y) / 2, (end_pts[1].y - end_pts[0].y) / 2
    hw = lambda x: hw0 + (hw1 - hw0) * x / L
    rep["fingerboard_plan_mm"] = {"length": round(L / MM, 2), "width_at_nut": round(2 * hw0 / MM, 2),
                                  "width_at_end": round(2 * hw1 / MM, 2)}

    # --- move the body down to the assumed height below the fingerboard top
    body = o[f"RF_{model}_Body"]
    drop = par["fingerboard_top_above_body_top_mm"] * MM
    top_now = max((body.matrix_world @ v.co).z for v in body.data.vertices)
    body.location.z -= top_now + drop
    body["rf_note"] = body["rf_note"].replace(
        "Z placement provisional: top face at Z=0.",
        f"Body top placed {par['fingerboard_top_above_body_top_mm']} mm below the fingerboard top (assumed).")

    # --- fingerboard: drawing plan, spec radius, assumed thickness
    R, tb = cfg["fingerboard_radius_mm"] * MM, par["fingerboard_thickness_centre_mm"] * MM
    N = 32
    secs = []
    for i in range(13):
        x = L * i / 12
        h = hw(x)
        top = [Vector((x, -h + 2 * h * j / N, -(R - math.sqrt(R * R - (-h + 2 * h * j / N) ** 2)))) for j in range(N + 1)]
        secs.append(top + [Vector((x, h, -tb)), Vector((x, -h, -tb))])
    fb = mesh_object(f"RF_{model}_Fretboard", loft(secs), col)
    rep["fingerboard_edge_drop_mm"] = {"at_nut": round((R - math.sqrt(R * R - hw0 ** 2)) / MM, 3),
                                       "at_end": round((R - math.sqrt(R * R - hw1 ** 2)) / MM, 3)}

    # --- neck shaft: lofted sections under the fingerboard, nut to board end
    t_nut, t_12 = par["thickness_at_nut_mm"] * MM, par["thickness_at_12th_fret_mm"] * MM
    t_heel, xh0 = par["heel_thickness_mm"] * MM, par["heel_blend_start_mm"] * MM
    x12 = cfg["scale_mm"] * MM / 2
    xh1 = max(v.x for v in [o[f"RF_{model}_SRC_HeelBoundary"].matrix_world @ p.co
                            for p in o[f"RF_{model}_SRC_HeelBoundary"].data.splines[0].bezier_points])
    hs_t, hs_face = par["headstock_thickness_mm"] * MM, par["headstock_face_below_board_top_mm"] * MM
    hs_back = -(hs_face + hs_t)
    p_c, blend = par["back_profile_exponent"], par["nut_blend_length_mm"] * MM
    smooth = lambda u: (lambda c: c * c * (3 - 2 * c))(max(0.0, min(1.0, u)))

    def section(x):
        total = t_nut + (t_12 - t_nut) * max(x, 0) / x12       # carved thickness incl. fingerboard
        depth, p = total - tb, p_c
        k = smooth((x - xh0) / (xh1 - xh0))                    # towards the heel block
        depth, p = depth + (t_heel - tb - depth) * k, p + (10 - p) * k
        k = 1 - smooth(x / blend)                              # towards the headstock block
        depth, p = depth + (-hs_back - tb - depth) * k, p + (10 - p) * k
        h = hw(max(x, 0))
        M = 40
        ring = []
        for j in range(M + 1):
            a = math.pi * j / M                                 # treble edge -> back -> bass edge
            c, s = math.cos(a), math.sin(a)
            ring.append(Vector((x, h * math.copysign(abs(c) ** (2 / p), c), -tb - depth * s ** (2 / p))))
        return ring
    xs = sorted(set([-0.002] + [L * i / 60 for i in range(61)] + [blend * i / 10 for i in range(11)]
                    + [xh0 + (xh1 - xh0) * i / 12 for i in range(13)]))
    neck = mesh_object(f"RF_{model}_Neck", loft([section(x) for x in xs]), col)

    # --- headstock: drawing outline closed along the nut line, assumed thickness and step
    hs_src = o[f"RF_{model}_SRC_Headstock"]
    ring = [Vector((p.x, p.y)) for p in sample(hs_src, 32)]
    rep["headstock_closing_edge_mm"] = {"length": round((ring[0] - ring[-1]).length / MM, 2),
                                        "x_at_ends": [round(ring[0].x / MM, 3), round(ring[-1].x / MM, 3)],
                                        "origin": "the nut line; the neck continues across it"}
    cu = bpy.data.curves.new("tmp", "CURVE")
    cu.dimensions, cu.fill_mode, cu.extrude = "2D", "BOTH", (-tb - hs_back) / 2
    sp = cu.splines.new("POLY"); sp.points.add(len(ring) - 1)
    for pt, p in zip(sp.points, ring):
        pt.co = (p.x, p.y, 0, 1)
    sp.use_cyclic_u = True
    tmp = bpy.data.objects.new("tmp", cu); scratch.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get(); dg.update()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp); bpy.data.curves.remove(cu)
    me.transform(__import__("mathutils").Matrix.Translation((0, 0, (-tb + hs_back) / 2)))
    head = bpy.data.objects.new("tmp_head", me); scratch.objects.link(head)
    # cut the face down, leaving a concave ramp behind the nut shelf
    shelf, rr = par["nut_shelf_mm"] * MM, par["headstock_ramp_radius_mm"] * MM
    step = hs_face - tb
    run = math.sqrt(max(2 * rr * step - step * step, 0))
    prof = []
    for i in range(25):
        a = math.asin(run / rr) * (1 - i / 24)                 # from the shelf down to the face
        prof.append((-shelf - run + rr * math.sin(a), -hs_face + rr - rr * math.cos(a)))
    prof += [(-0.4, -hs_face), (-0.4, 0.01), (-shelf, 0.01)]
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new((x, -0.15, z)) for x, z in prof])
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    bmesh.ops.translate(bm, verts=[g for g in ext["geom"] if isinstance(g, bmesh.types.BMVert)], vec=(0, 0.3, 0))
    cutter = mesh_object("tmp_ramp", bm, scratch)
    boolean(head, cutter, "DIFFERENCE")
    boolean(neck, head, "UNION")
    rep["headstock_ramp_run_mm"] = round(run / MM, 2)

    # --- laminate: split along X and give each strip a placeholder material
    lam = par["laminate"]
    c, s = lam["core_width_mm"] * MM / 2, lam["stripe_width_mm"] * MM
    mats = [placeholder("RF_MAT_Placeholder_Maple", (0.80, 0.66, 0.44)),
            placeholder("RF_MAT_Placeholder_Wenge", (0.16, 0.10, 0.07)),
            placeholder("RF_MAT_Placeholder_Purpleheart", (0.33, 0.10, 0.24))]
    neck.data.materials.clear()          # the boolean result can carry an empty slot
    for m in mats:
        neck.data.materials.append(m)
    bm = bmesh.new(); bm.from_mesh(neck.data)
    for y in (-c - s, -c, c, c + s):
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                               plane_co=(0, y, 0), plane_no=(0, 1, 0), dist=1e-7)
    for fc in bm.faces:
        y = abs(fc.calc_center_median().y)
        fc.material_index = 2 if y < c else 1 if y < c + s else 0
    bm.to_mesh(neck.data); bm.free()
    fb.data.materials.append(placeholder("RF_MAT_Placeholder_Rosewood", (0.20, 0.11, 0.08)))

    rep["neck_material_slots"] = [m.name if m else None for m in neck.data.materials]
    rep["neck_volume_cm3"], rep["neck_manifold"] = finish_shading(neck)
    rep["fingerboard_volume_cm3"], rep["fingerboard_manifold"] = finish_shading(fb)

    src_tag = lambda name: o[name]["rf_source"]
    for ob, note in (
        (fb, "Plan from drawing (board polygon); radius from spec; thickness assumed. Square end, no fret slots, "
             "no binding, no edge rollover."),
        (neck, "Width follows the drawing's fingerboard plan and headstock outline. Thickness, back profile, heel "
               "block, headstock thickness/step/ramp and laminate strip widths are assumed (neck_illustrative). "
               "Heel is a plain block overlapping the body volume: no pocket, bolts or tenon (pending). No tuner "
               "holes, truss rod access or nut yet. Headstock back edges are square.")):
        ob["rf_status"] = "illustrative"
        ob["rf_source"] = f"{src_tag(f'RF_{model}_SRC_Headstock')}; board polygon from drawing config; concept spec"
        ob["rf_source_sha256"] = s1["sha256"]
        ob["rf_note"] = note

    # --- measurements
    dg = bpy.context.evaluated_depsgraph_get(); dg.update()
    bm = bmesh.new()
    for ob in (neck, fb):
        tmpm = bpy.data.meshes.new_from_object(ob); bm.from_mesh(tmpm); bpy.data.meshes.remove(tmpm)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    tree = BVHTree.FromBMesh(bm)
    def thick(x, y=0.0):
        up = tree.ray_cast(Vector((x, y, 1)), Vector((0, 0, -1)))[0]
        dn = tree.ray_cast(Vector((x, y, -1)), Vector((0, 0, 1)))[0]
        return round((up.z - dn.z) / MM, 3), round(up.z / MM, 3), round(dn.z / MM, 3)
    x1 = cfg["scale_mm"] * MM * (1 - 2 ** (-1 / 12))
    rep["thickness_centre_mm"] = {
        "at_1st_fret": thick(x1)[0], "at_12th_fret": thick(x12)[0], "at_heel": thick(xh1 + 0.03)[0],
        "headstock": thick(-0.09, 0.02)[0]}
    rep["headstock_face_z_mm"] = thick(-0.09, 0.02)[1]
    rep["top_z_at_centre_mm"] = thick(x12)[1]
    bm.free()
    bpy.context.view_layer.update()
    rep["body_z_range_mm"] = [round(min((body.matrix_world @ v.co).z for v in body.data.vertices) / MM, 2),
                              round(max((body.matrix_world @ v.co).z for v in body.data.vertices) / MM, 2)]
    rep["heel_boundary_x_mm"] = round(xh1 / MM, 2)
    all_x = [(neck.matrix_world @ v.co).x for v in neck.data.vertices]
    rep["overall_length_mm"] = round((max(max(all_x), max((body.matrix_world @ v.co).x for v in body.data.vertices))
                                      - min(all_x)) / MM, 2)

    if args.preview_dir:
        out = Path(args.preview_dir); out.mkdir(parents=True, exist_ok=True)
        sc = bpy.context.scene
        clay = placeholder("tmp_clay", (0.42, 0.40, 0.37))
        body.data.materials.append(clay)
        world = bpy.data.worlds.new("preview"); sc.world = world; world.use_nodes = True
        world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
        world.node_tree.nodes["Background"].inputs[1].default_value = 0.18
        tmp = []
        def add(ob):
            sc.collection.objects.link(ob); tmp.append(ob); return ob
        sc.render.engine = "CYCLES"; sc.cycles.samples = 64; sc.cycles.device = "CPU"
        sc.view_settings.view_transform = "AgX"
        mid = (min(all_x) + 0.78) / 2
        shots = {  # name: (camera loc, target, lens or ortho scale, light loc, resolution)
            "front_three_quarter": ((mid + 0.9, -1.5, 1.3), (mid, 0, 0), 85, (0.9, -1.4, 0.9), (1400, 800)),
            "back_three_quarter": ((mid - 0.9, -1.5, -1.3), (mid, 0, 0), 85, (0.0, -1.4, -0.9), (1400, 800)),
            "headstock": ((-0.45, -0.42, 0.34), (-0.07, 0, -0.01), 85, (-0.3, -0.7, 0.5), (1200, 800)),
            "front_ortho": ((mid, 0, 2), (mid, 0, 0), 1.0, (0.3, -0.8, 1.2), (1600, 620)),
            "side_ortho": ((mid, -2, -0.02), (mid, 0, -0.02), 1.0, (0.3, -1.5, 0.6), (1600, 300))}
        for name, (loc, tgt, lens, light, res) in shots.items():
            target = add(bpy.data.objects.new("t", None)); target.location = tgt
            cd = bpy.data.cameras.new(f"preview_{name}")
            if "ortho" in name:
                cd.type, cd.ortho_scale = "ORTHO", lens
            else:
                cd.lens = lens
            cam = add(bpy.data.objects.new(cd.name, cd)); cam.location = loc
            con = cam.constraints.new("TRACK_TO"); con.target = target
            if name == "front_ortho":
                cam.constraints.remove(con); cam.rotation_euler = (0, 0, 0)
            ld = bpy.data.lights.new("l", "AREA"); ld.energy, ld.size = 22, 0.8
            lamp = add(bpy.data.objects.new("l", ld)); lamp.location = light
            lc = lamp.constraints.new("TRACK_TO"); lc.target = target
            sc.camera = cam
            sc.render.resolution_x, sc.render.resolution_y = res
            sc.render.filepath = str(out / f"stage4_{name}.png")
            bpy.ops.render.render(write_still=True)
            lamp.hide_render = True
        for ob in tmp:
            bpy.data.objects.remove(ob)
        body.data.materials.clear(); bpy.data.materials.remove(clay)

    bpy.ops.wm.save_as_mainfile(filepath=str(Path(args.out).resolve()))
    rep["status"] = "built"
    text = json.dumps(rep, indent=2, ensure_ascii=False)
    if args.report:
        Path(args.report).write_text(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
