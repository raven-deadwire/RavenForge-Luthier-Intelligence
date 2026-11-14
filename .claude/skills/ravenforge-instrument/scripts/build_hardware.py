"""Pilot stage 6: pickguard, nut, pickups, bridge, jack plate, controls, screws, tuners.

    python build_hardware.py --config ../drawings/gramr.json --blend gramr_stage5.blend \
        --stage1-report gramr_stage1.json --out gramr_stage6.blend \
        --report gramr_stage6.json [--preview-dir DIR]

Positions and plan outlines come from the drawing (RF_<MODEL>_SRC_* objects).
The pickguard thickness and nut width come from the spec. Heights, sections and
small parts are block-outs sized by "hardware_illustrative" in the config. No
maker's geometry, logos or engraving. No cavities are cut: parts that sit in
the body simply overlap it. Strings, strap buttons and joint bolts are not made.
"""
import argparse, json, math
from pathlib import Path
import bpy, bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from build_body import sample
from build_neck import board_plan, loft, placeholder, MM


def outline_points(src):
    return [Vector((p.x, p.y)) for p in sample(src, 32)]


def inside(pt, poly):
    c = False
    for a, b in zip(poly, poly[1:] + poly[:1]):
        if (a.y > pt.y) != (b.y > pt.y) and pt.x < a.x + (pt.y - a.y) * (b.x - a.x) / (b.y - a.y):
            c = not c
    return c


def extrude_outline(ring, z0, z1):
    """bmesh of a filled outline between two heights."""
    cu = bpy.data.curves.new("tmp", "CURVE")
    cu.dimensions, cu.fill_mode, cu.extrude = "2D", "BOTH", (z1 - z0) / 2
    sp = cu.splines.new("POLY"); sp.points.add(len(ring) - 1)
    for pt, p in zip(sp.points, ring):
        pt.co = (p.x, p.y, 0, 1)
    sp.use_cyclic_u = True
    tmp = bpy.data.objects.new("tmp", cu); bpy.context.scene.collection.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get(); dg.update()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp); bpy.data.curves.remove(cu)
    bm = bmesh.new(); bm.from_mesh(me); bpy.data.meshes.remove(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, (z0 + z1) / 2))
    return bm


def cyl(bm, centre, r1, r2, z0, z1, seg=48, axis=None):
    m = Matrix.Translation(centre + Vector((0, 0, (z0 + z1) / 2)))
    if axis is not None:                                # lie the cylinder along a horizontal axis
        m = Matrix.Translation(centre) @ Vector((0, 0, 1)).rotation_difference(axis).to_matrix().to_4x4()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=z1 - z0, matrix=m)


def box(bm, centre, ax, ay, sx, sy, sz):
    rot = Matrix((ax, ay, Vector((0, 0, 1)))).transposed().to_4x4()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(centre) @ rot @ Matrix.Diagonal((sx, sy, sz, 1)))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    for a in ("--config", "--blend", "--stage1-report", "--out"):
        ap.add_argument(a, required=True)
    ap.add_argument("--report"); ap.add_argument("--preview-dir")
    args = ap.parse_args(argv)
    cfg = json.loads(Path(args.config).read_text())
    s1 = json.loads(Path(args.stage1_report).read_text())
    par, model = cfg["hardware_illustrative"], cfg["model"]
    bpy.ops.wm.open_mainfile(filepath=str(Path(args.blend).resolve()))
    o = bpy.data.objects
    root = bpy.data.collections[f"RF_{model}"]
    def collection(suffix):
        c = bpy.data.collections.get(f"RF_{model}_{suffix}") or bpy.data.collections.new(f"RF_{model}_{suffix}")
        if c.name not in root.children:
            root.children.link(c)
        return c
    c_body, c_neck = collection("Body"), collection("Neck")
    c_hw, c_el = collection("Hardware"), collection("Electronics")
    S = lambda name: o[f"RF_{model}_SRC_{name}"]
    rep = {"model": model, "stage": 6, "parameters": par, "objects": {}}

    gold = placeholder("RF_MAT_Placeholder_Gold", (0.83, 0.62, 0.22))
    gb = gold.node_tree.nodes["Principled BSDF"]
    gb.inputs["Metallic"].default_value, gb.inputs["Roughness"].default_value = 1.0, 0.3
    black = placeholder("RF_MAT_Placeholder_BlackPlastic", (0.02, 0.02, 0.02))
    bone = placeholder("RF_MAT_Placeholder_Bone", (0.86, 0.82, 0.70))
    dark = placeholder("RF_MAT_Placeholder_Dark", (0.01, 0.01, 0.01))

    def make(name, bm, col, mat, status, source, note, sharp=35):
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        for f in bm.faces:
            f.smooth = True
        for e in bm.edges:
            if len(e.link_faces) == 2 and e.link_faces[0].normal.angle(e.link_faces[1].normal, 0) > math.radians(sharp):
                e.smooth = False
        me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
        me.materials.append(mat)
        ob = bpy.data.objects.new(name, me); col.objects.link(ob)
        ob["rf_status"], ob["rf_source"], ob["rf_note"] = status, source, note
        ob["rf_source_sha256"] = s1["sha256"]
        bpy.context.view_layer.update()
        rep["objects"][name] = {"status": status, "size_mm": [round(v / MM, 2) for v in ob.dimensions]}
        return ob

    body = o[f"RF_{model}_Body"]
    body_top = max((body.matrix_world @ v.co).z for v in body.data.vertices)
    bmb = bmesh.new(); bmb.from_mesh(body.data); bmb.transform(body.matrix_world)
    bmesh.ops.triangulate(bmb, faces=bmb.faces)
    body_tree = BVHTree.FromBMesh(bmb)
    top_under = lambda p: body_tree.ray_cast(Vector((p.x, p.y, 1)), Vector((0, 0, -1)))[0].z
    L, hw0, hw1, hw = board_plan(cfg, s1)
    R = cfg["fingerboard_radius_mm"] * MM
    tb = cfg["neck_illustrative"]["fingerboard_thickness_centre_mm"] * MM

    # --- pickguard: drawing outline, spec thickness
    pg_ring = outline_points(S("Pickguard"))
    pg_t = cfg["pickguard_thickness_mm"] * MM
    pg_top = body_top + pg_t
    zs = [top_under(p) for p in pg_ring]
    rep["pickguard_sits_on_flat_top"] = {"body_top_under_outline_min_mm": round(min(zs) / MM, 3),
                                         "max_mm": round(max(zs) / MM, 3), "flat": max(zs) - min(zs) < 1e-6}
    make(f"RF_{model}_Pickguard", extrude_outline(pg_ring, body_top, pg_top), c_body, black, "spec",
         S("Pickguard")["rf_source"] + "; thickness from concept spec",
         "Outline from drawing; thickness from spec (approx. 2.3 mm). One solid colour: the three plies, the edge "
         "bevel and the pickup, control and screw holes are not modelled.")

    # --- nut: spec width, assumed height, on the shelf behind the fingerboard
    nw, shelf = cfg["nut_width_spec_mm"] * MM / 2, cfg["neck_illustrative"]["nut_shelf_mm"] * MM
    nt = par["nut"]["top_above_board_centre_mm"] * MM
    secs = []
    for x in (-shelf, 0.0):
        topc = [Vector((x, -nw + 2 * nw * j / 16, nt - (R - math.sqrt(R * R - (-nw + 2 * nw * j / 16) ** 2)))) for j in range(17)]
        secs.append(topc + [Vector((x, nw, -tb)), Vector((x, -nw, -tb))])
    make(f"RF_{model}_Nut", loft(secs), c_neck, bone, "illustrative", "concept spec (43.0 mm buffalo bone)",
         "Width from spec. Height, thickness along the neck and the plain top are assumed. No string slots.")

    # --- pickups: drawing outlines, assumed heights
    pu = par["pickup"]
    for part in ("PickupNeck", "PickupBridge"):
        ring = outline_points(S(part))
        make(f"RF_{model}_{part}", extrude_outline(ring, body_top - pu["depth_into_body_mm"] * MM,
                                                    pg_top + pu["top_above_pickguard_mm"] * MM),
             c_el, black, "illustrative", S(part)["rf_source"],
             "Plan outline from drawing. Height assumed. A plain block: no bobbins, pole pieces, mounting or "
             "cavity; it overlaps the body and pickguard.")
        rep["objects"][f"RF_{model}_{part}"]["centre_inside_pickguard"] = inside(sum(ring, Vector((0, 0))) / len(ring), pg_ring)

    # --- bridge: drawing outline as the base plate, assumed thickness and saddles
    br, sd = par["bridge"], par["bridge"]["saddle"]
    ring = outline_points(S("Bridge"))
    bx0, bx1 = min(p.x for p in ring), max(p.x for p in ring)
    z0 = body_top + br["plate_gap_above_body_mm"] * MM
    z1 = z0 + br["plate_thickness_mm"] * MM
    bm = extrude_outline(ring, z0, z1)
    scale = cfg["scale_mm"] * MM
    sx = scale + sd["centre_past_scale_mm"] * MM
    for i in range(sd["count"]):
        y = (i - (sd["count"] - 1) / 2) * sd["pitch_mm"] * MM
        box(bm, Vector((sx, y, z1 + sd["height_mm"] * MM / 2)), Vector((1, 0, 0)), Vector((0, 1, 0)),
            sd["length_mm"] * MM, sd["width_mm"] * MM, sd["height_mm"] * MM)
    make(f"RF_{model}_Bridge", bm, c_hw, gold, "illustrative", S("Bridge")["rf_source"],
         "Base plate plan from drawing. Plate thickness, height above the body and the six saddle blocks "
         "(size, pitch, position) are assumed. No studs, arm, springs or sustain block.")
    rep["bridge"] = {"outline_x_range_mm": [round(bx0 / MM, 2), round(bx1 / MM, 2)],
                     "scale_line_x_mm": round(scale / MM, 2),
                     "scale_line_inside_outline": bx0 < scale < bx1,
                     "saddle_top_z_mm": round((z1 + sd["height_mm"] * MM) / MM, 2)}

    # --- jack plate: drawing outline, assumed thickness
    ring = outline_points(S("Jack"))
    jc = sum(ring, Vector((0, 0))) / len(ring)
    jz = top_under(jc)
    bm = extrude_outline(ring, jz, jz + par["jack_plate_thickness_mm"] * MM)
    make(f"RF_{model}_JackPlate", bm, c_hw, gold, "illustrative", S("Jack")["rf_source"],
         "Plan outline from drawing. A flat plate of assumed thickness: the recess, the angled jack and its "
         "screws are not modelled.")
    bm = bmesh.new()
    cyl(bm, Vector((jc.x, jc.y, 0)), par["jack_hole_diameter_mm"] * MM / 2, par["jack_hole_diameter_mm"] * MM / 2,
        jz, jz + par["jack_plate_thickness_mm"] * MM + 0.1 * MM)
    make(f"RF_{model}_JackHole", bm, c_hw, dark, "illustrative", "none (assumed)",
         "Dark disc standing in for the jack opening at the outline's centre. Position and size assumed.")
    rep["objects"][f"RF_{model}_JackPlate"]["centre_inside_pickguard"] = inside(jc, pg_ring)

    # --- controls: drawing centres, assumed knob
    kn = par["knob"]
    for i in (1, 2):
        c = S(f"Control_{i:02d}").location
        bm = bmesh.new()
        cyl(bm, Vector((c.x, c.y, 0)), kn["base_diameter_mm"] * MM / 2, kn["top_diameter_mm"] * MM / 2,
            pg_top + 0.8 * MM, pg_top + 0.8 * MM + kn["height_mm"] * MM)
        make(f"RF_{model}_Knob_{i:02d}", bm, c_hw, gold, "illustrative", S(f"Control_{i:02d}")["rf_source"],
             "Centre from drawing. Knob shape, size and finish assumed.")
        rep["objects"][f"RF_{model}_Knob_{i:02d}"]["centre_inside_pickguard"] = inside(Vector((c.x, c.y)), pg_ring)

    # --- selector: drawing slot line, assumed slot and lever
    f, x0p, yc = s1["mm_per_pt"], s1["nut_x_pt"], s1["centreline_y_pt"]
    ysg = -1 if cfg["orientation"]["treble"] == "-y" else 1
    a, b = [Vector(((p[0] - x0p) * f * MM, ysg * (p[1] - yc) * f * MM, 0)) for p in cfg["selector_pt"]]
    sl = par["selector"]
    along = (b - a).normalized(); across = Vector((-along.y, along.x, 0))
    bm = bmesh.new()
    box(bm, (a + b) / 2 + Vector((0, 0, pg_top + 0.05 * MM)), along, across, (b - a).length, sl["slot_width_mm"] * MM, 0.1 * MM)
    slot = make(f"RF_{model}_SelectorSlot", bm, c_el, dark, "illustrative", "drawing config selector_pt",
                "Slot line from drawing, drawn as a dark strip on the pickguard. Width assumed.")
    bm = bmesh.new()
    lp = a + (b - a) * 0.5
    cyl(bm, Vector((lp.x, lp.y, 0)), sl["lever_diameter_mm"] * MM / 2, sl["lever_diameter_mm"] * MM / 2 * 0.8,
        pg_top, pg_top + sl["lever_height_mm"] * MM)
    make(f"RF_{model}_SelectorLever", bm, c_el, black, "illustrative", "drawing config selector_pt",
         "Lever tip at the middle of the drawn slot. Shape, size and position along the slot assumed.")
    rep["selector"] = {"slot_length_mm": round((b - a).length / MM, 2),
                       "slot_centre_inside_pickguard": inside(Vector((lp.x, lp.y)), pg_ring)}

    # --- pickguard screws: drawing centres, assumed heads
    sc_, n_in = par["screw"], 0
    bm = bmesh.new()
    k = 1
    while f"RF_{model}_SRC_PickguardScrew_{k:02d}" in o:
        c = S(f"PickguardScrew_{k:02d}").location
        n_in += inside(Vector((c.x, c.y)), pg_ring)
        cyl(bm, Vector((c.x, c.y, 0)), sc_["head_diameter_mm"] * MM / 2, sc_["head_diameter_mm"] * MM / 4,
            pg_top, pg_top + sc_["head_height_mm"] * MM, seg=24)
        k += 1
    make(f"RF_{model}_PickguardScrews", bm, c_hw, gold, "illustrative",
         f"{S('PickguardScrew_01')['rf_source']} (and the other {k - 2} centres)",
         "Centres from drawing. Head shape, size and finish assumed.")
    rep["pickguard_screws"] = {"count": k - 1, "centres_inside_pickguard": n_in}

    # --- tuners: drawing bore centres, assumed block-out
    tu = par["tuner"]
    neck = o[f"RF_{model}_Neck"]
    bmn = bmesh.new(); bmn.from_mesh(neck.data); bmn.transform(neck.matrix_world)
    bmesh.ops.triangulate(bmn, faces=bmn.faces)
    neck_tree = BVHTree.FromBMesh(bmn)
    na = cfg["neck_illustrative"]
    face = -na["headstock_face_below_board_top_mm"] * MM
    back = face - na["headstock_thickness_mm"] * MM
    cents = [S(f"Tuner_{i:02d}").location.copy() for i in range(1, 7)]
    order = sorted(range(6), key=lambda i: -cents[i].x)           # nearest the nut first
    row = (cents[order[0]] - cents[order[-1]]); row.z = 0; row.normalize()
    out = Vector((-row.y, row.x, 0))
    mid = sum(cents, Vector((0, 0, 0))) / 6
    probe = lambda d: neck_tree.ray_cast(Vector((mid.x, mid.y, (face + back) / 2)), d)[3] or 1e9
    if probe(-out) < probe(out):
        out = -out                                                # point at the nearer headstock edge
    edge = []
    for rank, i in enumerate(order):
        c = Vector((cents[i].x, cents[i].y, 0))
        d_edge = neck_tree.ray_cast(Vector((c.x, c.y, (face + back) / 2)), out)[3]
        edge.append(d_edge)
        ph = (tu["post_height_near_nut_mm"] if rank < 3 else tu["post_height_far_mm"]) * MM
        bm = bmesh.new()
        cyl(bm, c, tu["washer_diameter_mm"] * MM / 2, tu["washer_diameter_mm"] * MM / 2, face, face + 1 * MM)
        cyl(bm, c, tu["bushing_diameter_mm"] * MM / 2, tu["bushing_diameter_mm"] * MM / 2, face + 1 * MM, face + 3 * MM, seg=6)
        cyl(bm, c, tu["post_diameter_mm"] * MM / 2, tu["post_diameter_mm"] * MM / 2, face + 3 * MM, face + ph)
        hx, hy, hz = [v * MM for v in tu["housing_mm"]]
        zc = back - hz / 2
        box(bm, c + out * 2.5 * MM + Vector((0, 0, zc)), row, out, hx, hy, hz)
        reach = d_edge + tu["button_past_edge_mm"] * MM
        s0 = 2.5 * MM + hy / 2
        cyl(bm, c + out * (s0 + reach) / 2 + Vector((0, 0, zc)), tu["shaft_diameter_mm"] * MM / 2,
            tu["shaft_diameter_mm"] * MM / 2, 0, reach - s0, seg=24, axis=out)
        bx_, by_, bz_ = [v * MM for v in tu["button_mm"]]
        rot = Matrix((out, row, Vector((0, 0, 1)))).transposed().to_4x4()
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=0.5,
                                  matrix=Matrix.Translation(c + out * reach + Vector((0, 0, zc))) @ rot
                                  @ Matrix.Diagonal((bx_, by_, bz_, 1)))
        make(f"RF_{model}_Tuner_{rank + 1:02d}", bm, c_hw, gold, "illustrative", S(f"Tuner_{i + 1:02d}")["rf_source"],
             "Post bore centre from drawing. Washer, bushing, post height, housing, shaft and button are an assumed "
             "block-out. Numbered from the nut outward.")
    rep["tuners"] = {"count": 6, "row_direction": [round(row.x, 4), round(row.y, 4)],
                     "buttons_point_toward": "bass side" if out.y < 0 else "treble side",
                     "centre_to_headstock_edge_mm": [round(e / MM, 2) for e in edge],
                     "pitch_mm": [round((cents[order[j]] - cents[order[j + 1]]).length / MM, 2) for j in range(5)],
                     "post_top_z_mm": [round((face + (tu["post_height_near_nut_mm"] if r < 3 else tu["post_height_far_mm"]) * MM) / MM, 2) for r in range(6)]}
    rep["not_made"] = ["strings", "strap buttons", "neck joint bolts (pending)", "tremolo arm, studs, springs, block",
                       "cavities and holes"]
    rep["object_count"] = len(rep["objects"])

    if args.preview_dir:
        outd = Path(args.preview_dir); outd.mkdir(parents=True, exist_ok=True)
        sc = bpy.context.scene
        clay = placeholder("tmp_clay", (0.42, 0.40, 0.37)); body.data.materials.append(clay)
        world = bpy.data.worlds.new("preview"); sc.world = world; world.use_nodes = True
        world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
        world.node_tree.nodes["Background"].inputs[1].default_value = 0.5
        tmp = []
        def add(ob):
            sc.collection.objects.link(ob); tmp.append(ob); return ob
        sc.render.engine = "CYCLES"; sc.cycles.samples = 96; sc.cycles.device = "CPU"
        sc.view_settings.view_transform = "AgX"
        shots = {  # name: (camera, target, lens / ortho scale, light, resolution, camera roll up-axis flip)
            "front_ortho": ((0.3, 0, 2), (0.3, 0, 0), 1.0, (0.3, -0.8, 1.2), (1600, 620)),
            "body_ortho": ((0.56, 0, 2), (0.56, 0, 0), 0.5, (0.5, -0.8, 1.2), (1400, 1000)),
            "body_three_quarter": ((1.25, -0.75, 0.75), (0.58, 0.0, -0.01), 85, (0.9, -0.9, 0.7), (1400, 900)),
            "headstock_front": ((-0.42, -0.40, 0.34), (-0.08, 0, -0.012), 85, (-0.3, -0.7, 0.5), (1400, 900)),
            "headstock_back": ((-0.42, -0.40, -0.36), (-0.08, 0, -0.02), 85, (-0.3, -0.7, -0.5), (1400, 900))}
        for name, (loc, tgt, lens, light, res) in shots.items():
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
            ld = bpy.data.lights.new("l", "AREA"); ld.energy, ld.size = 22, 0.8
            lamp = add(bpy.data.objects.new("l", ld)); lamp.location = light
            lc = lamp.constraints.new("TRACK_TO"); lc.target = target
            sc.camera = cam
            sc.render.resolution_x, sc.render.resolution_y = res
            sc.render.filepath = str(outd / f"stage6_{name}.png")
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
