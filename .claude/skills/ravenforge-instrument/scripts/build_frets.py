"""Pilot stage 5: frets.

    python build_frets.py --config ../drawings/gramr.json --blend gramr_stage4.blend \
        --stage1-report gramr_stage1.json --out gramr_stage5.blend \
        --report gramr_stage5.json [--preview-dir DIR]

Positions come from the drawing's fret lines (RF_<MODEL>_SRC_Fret_NN) and are
compared with equal temperament. Each fret follows the spec fingerboard radius
and runs edge to edge of the drawing's board plan. The wire section and the end
bevel come from "fret_illustrative" in the config, so the frets are tagged
rf_status = illustrative. Crowns only: no tangs, no fret slots.
"""
import argparse, json, math
from pathlib import Path
import bpy, bmesh
from mathutils import Vector
from build_neck import board_plan, loft, placeholder, MM
from fret_math import fret_distance


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    for a in ("--config", "--blend", "--stage1-report", "--out"):
        ap.add_argument(a, required=True)
    ap.add_argument("--report"); ap.add_argument("--preview-dir")
    args = ap.parse_args(argv)
    cfg = json.loads(Path(args.config).read_text())
    s1 = json.loads(Path(args.stage1_report).read_text())
    par, model, count = cfg["fret_illustrative"], cfg["model"], cfg["frets"]["count"]
    bpy.ops.wm.open_mainfile(filepath=str(Path(args.blend).resolve()))
    o = bpy.data.objects
    col = bpy.data.collections[f"RF_{model}_Neck"]
    L, hw0, hw1, hw = board_plan(cfg, s1)
    R = cfg["fingerboard_radius_mm"] * MM
    w, h = par["crown_width_mm"] * MM, par["crown_height_mm"] * MM
    bevel = h * math.tan(math.radians(par["end_bevel_deg"]))
    skirt = 0.2 * MM                                   # sunk into the board so no gap shows
    rc = (w * w / 4 + h * h) / (2 * h)                 # crown arc through the two feet and the top
    half = math.asin(min(1.0, (w / 2) / rc))
    K = 12
    crown = [(rc * math.sin(-half + 2 * half * i / K), rc * math.cos(-half + 2 * half * i / K) - (rc - h))
             for i in range(K + 1)]
    mat = placeholder("RF_MAT_Placeholder_NickelSilver", (0.78, 0.76, 0.70))
    b = mat.node_tree.nodes["Principled BSDF"]
    b.inputs["Metallic"].default_value, b.inputs["Roughness"].default_value = 1.0, 0.25

    rep = {"model": model, "stage": 5, "parameters": par, "count": count,
           "crown_arc_radius_mm": round(rc / MM, 3), "end_bevel_run_mm": round(bevel / MM, 3)}
    dev, len_diff, rows, made = [], [], [], []
    for n in range(1, count + 1):
        src = o[f"RF_{model}_SRC_Fret_{n:02d}"]
        pts = [src.matrix_world @ p.co for p in src.data.splines[0].bezier_points]
        x = sum(p.x for p in pts) / len(pts)
        drawn_len = (pts[0] - pts[-1]).length
        ideal = fret_distance(cfg["scale_mm"], n) * MM
        dev.append(abs(x - ideal)); len_diff.append(abs(drawn_len - 2 * hw(x)))
        hy = hw(x) - 0.03 * MM                       # a hair inside the board edge, so the end face is hidden
        ys_ = [-hy, -hy + bevel] + [(-hy + bevel) + (2 * hy - 2 * bevel) * j / 24 for j in range(1, 24)] + [hy - bevel, hy]
        secs = []
        for y in ys_:
            zb = -(R - math.sqrt(R * R - y * y))       # fingerboard surface under this point
            k = 0.03 if abs(abs(y) - hy) < 1e-9 else 1.0   # crown fades out at the bevelled ends
            ring = [Vector((x + cx, y, zb + cz * k)) for cx, cz in crown]
            ring += [Vector((x + w / 2, y, zb - skirt)), Vector((x - w / 2, y, zb - skirt))]
            secs.append(ring)
        bm = loft(secs)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        for fc in bm.faces:
            fc.smooth = True
        for e in bm.edges:
            if len(e.link_faces) == 2 and e.link_faces[0].normal.angle(e.link_faces[1].normal, 0) > math.radians(40):
                e.smooth = False
        ok = all(e.is_manifold for e in bm.edges)
        me = bpy.data.meshes.new(f"RF_{model}_Fret_{n:02d}"); bm.to_mesh(me); bm.free()
        me.materials.append(mat)
        ob = bpy.data.objects.new(me.name, me); col.objects.link(ob)
        ob["rf_status"] = "illustrative"
        ob["rf_source"] = src["rf_source"] + "; wire section assumed"
        ob["rf_source_sha256"] = src["rf_source_sha256"]
        ob["rf_note"] = ("Position from the drawing's fret line; follows the spec fingerboard radius; runs edge to "
                         "edge of the board plan. Crown section and end bevel assumed (fret_illustrative). "
                         "Crown only: no tang, no slot.")
        made.append((ob, ok))
        rows.append({"fret": n, "x_mm": round(x / MM, 3), "ideal_mm": round(ideal / MM, 3),
                     "length_mm": round(2 * hy / MM, 2)})
    rep["position_vs_equal_temperament_max_mm"] = round(max(dev) / MM, 4)
    rep["drawn_line_length_vs_board_width_max_mm"] = round(max(len_diff) / MM, 3)
    rep["all_manifold"] = all(ok for _, ok in made)
    rep["frets"] = rows
    top = max((made[11][0].matrix_world @ v.co).z for v in made[11][0].data.vertices)
    rep["crown_top_z_at_fret_12_mm"] = round(top / MM, 3)
    last = rows[-1]["x_mm"] * MM
    rep["board_overhang_past_last_fret_mm"] = round((L - last) / MM, 2)

    if args.preview_dir:
        out = Path(args.preview_dir); out.mkdir(parents=True, exist_ok=True)
        sc = bpy.context.scene
        body = o[f"RF_{model}_Body"]
        clay = placeholder("tmp_clay", (0.42, 0.40, 0.37)); body.data.materials.append(clay)
        world = bpy.data.worlds.new("preview"); sc.world = world; world.use_nodes = True
        world.node_tree.nodes["Background"].inputs[0].default_value = (1, 1, 1, 1)
        world.node_tree.nodes["Background"].inputs[1].default_value = 0.35
        tmp = []
        def add(ob):
            sc.collection.objects.link(ob); tmp.append(ob); return ob
        sc.render.engine = "CYCLES"; sc.cycles.samples = 96; sc.cycles.device = "CPU"
        sc.view_settings.view_transform = "AgX"
        x12, x22 = rows[11]["x_mm"] * MM, rows[21]["x_mm"] * MM
        shots = {  # name: (camera, target, lens / ortho scale, light, resolution)
            "front_ortho": ((0.3, 0, 2), (0.3, 0, 0), 1.0, (0.3, -0.8, 1.2), (1600, 620)),
            "neck_three_quarter": ((-0.25, -0.5, 0.42), (0.26, 0, 0), 85, (0.1, -0.7, 0.6), (1400, 800)),
            "fret_12_closeup": ((x12 - 0.13, -0.16, 0.10), (x12, 0.0, 0), 105, (x12, -0.4, 0.35), (1400, 800)),
            "fret_ends_closeup": ((x22 + 0.02, -0.14, 0.035), (x22 - 0.01, -0.028, 0), 105, (x22, -0.4, 0.3), (1400, 800))
            }
        for name, (loc, tgt, lens, light, res) in shots.items():
            target = add(bpy.data.objects.new("t", None)); target.location = tgt
            cd = bpy.data.cameras.new(f"preview_{name}")
            if "ortho" in name:
                cd.type, cd.ortho_scale = "ORTHO", lens
            else:
                cd.lens = lens
            cam = add(bpy.data.objects.new(cd.name, cd)); cam.location = loc
            if name == "front_ortho":
                cam.rotation_euler = (0, 0, 0)
            else:
                con = cam.constraints.new("TRACK_TO"); con.target = target
            ld = bpy.data.lights.new("l", "AREA"); ld.energy, ld.size = 22, 0.8
            lamp = add(bpy.data.objects.new("l", ld)); lamp.location = light
            lc = lamp.constraints.new("TRACK_TO"); lc.target = target
            sc.camera = cam
            sc.render.resolution_x, sc.render.resolution_y = res
            sc.render.filepath = str(out / f"stage5_{name}.png")
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
