"""Pilot stage 1: bring a RavenForge source drawing into Blender at true size.

Run with a Python that has bpy and pymupdf:
    python import_drawing.py --config ../drawings/gramr.json --pdf SOURCE.pdf \
        --scale-mm 648 --out gramr_stage1.blend --report gramr_stage1.json

What it does
  1. Refuses to continue unless the PDF's SHA-256 matches the config.
  2. Reads the vector paths named in the config (no raster tracing).
  3. Fits the fret lines to equal temperament to find the nut position and the
     drawing's points-per-scale-length. The plot factor comes from that fit and
     the scale length you pass in, so PDFs that are not plotted 1:1 are handled.
  4. Cross-checks the factor against the nut width and stops if they disagree
     by more than --tolerance-mm.
  5. Creates curves in collection RF_<MODEL>_Source in skill coordinates
     (origin at the nut on the centreline, +X to the bridge, +Y treble, metres),
     tagged rf_status=drawing with source name, path indices and hash.

The curves are display-grade outlines for visualisation. Nothing written here
is machining data.
"""
import argparse, hashlib, json, math, sys
from pathlib import Path

PT_MM = 25.4 / 72.0


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_segments(drawings, matrix, ids):
    """[[(kind, [points])...] per drawing], points in rotated page space (pt)."""
    groups = []
    for i in ids:
        segs = []
        for item in drawings[i]["items"]:
            kind = item[0]
            if kind not in ("l", "c"):
                raise ValueError(f"drawing {i}: unsupported item '{kind}'")
            segs.append((kind, [tuple(p * matrix) for p in item[1:]]))
        groups.append(segs)
    return groups


def order_contour(groups, start=None, max_gap_pt=0.2):
    """Chain drawings end to end. Returns (segments, largest join gap in pt)."""
    groups = list(groups)
    here = start if start is not None else groups[0][0][1][0]
    ordered, worst = [], 0.0
    while groups:
        cands = [(math.dist(here, g[0][1][0]), i, False) for i, g in enumerate(groups)]
        cands += [(math.dist(here, g[-1][1][-1]), i, True) for i, g in enumerate(groups)]
        gap, idx, rev = min(cands)
        g = groups.pop(idx)
        if rev:
            g = [(k, list(reversed(p))) for k, p in reversed(g)]
        if gap > max_gap_pt:
            raise ValueError(f"contour gap {gap:.3f} pt exceeds {max_gap_pt} pt")
        worst = max(worst, gap)
        ordered.extend(g)
        here = g[-1][1][-1]
    return ordered, worst


def fit_frets(xs):
    """Least-squares x_n = x0 + L * (1 - 2**(-n/12)) for n = 1..len(xs)."""
    k = [1 - 2 ** (-n / 12) for n in range(1, len(xs) + 1)]
    mk, mx = sum(k) / len(k), sum(xs) / len(xs)
    L = sum((a - mk) * (b - mx) for a, b in zip(k, xs)) / sum((a - mk) ** 2 for a in k)
    x0 = mx - L * mk
    return x0, L, [x - (x0 + L * a) for x, a in zip(xs, k)]


def analyse(cfg, drawings, matrix, scale_mm):
    """Scale and placement facts from the drawing. Pure maths, no bpy."""
    xs_sign = 1 if cfg["orientation"]["nut_to_bridge"] == "+x" else -1
    f0, n = cfg["frets"]["first"], cfg["frets"]["count"]
    mids = []
    for i in range(f0, f0 + n):
        a, b = [tuple(p * matrix) for p in drawings[i]["items"][0][1:3]]
        mids.append(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, abs(a[0] - b[0])))
    x0, L, res = fit_frets([m[0] * xs_sign for m in mids])
    x0 *= xs_sign
    yc = sum(m[1] for m in mids) / n
    out = {
        "nut_x_pt": x0, "centreline_y_pt": yc, "scale_length_pt": abs(L),
        "paper_scale_length_mm": abs(L) * PT_MM,
        "centreline_drift_pt": max(m[1] for m in mids) - min(m[1] for m in mids),
        "fret_skew_max_pt": max(m[2] for m in mids),
        "fret_fit_residual_max_pt": max(abs(r) for r in res),
    }
    nut_w_pt = None
    if cfg.get("nut_edge_pt"):
        a, b = cfg["nut_edge_pt"]
        nut_w_pt = math.dist(a, b)
        out["nut_edge_x_offset_pt"] = (a[0] + b[0]) / 2 - x0
    if scale_mm:
        f = scale_mm / abs(L)  # mm per pt
        out.update(scale_mm=scale_mm, mm_per_pt=f, plot_factor=PT_MM / f,
                   fret_fit_residual_max_mm=out["fret_fit_residual_max_pt"] * f)
        if nut_w_pt:
            out["nut_width_measured_mm"] = nut_w_pt * f
            out["nut_width_error_mm"] = nut_w_pt * f - cfg["nut_width_mm"]
    elif nut_w_pt:
        f = cfg["nut_width_mm"] / nut_w_pt
        out["scale_mm_implied_by_nut_width"] = abs(L) * f
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--config", required=True)
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--scale-mm", type=float, help="overrides scale_mm in the config")
    ap.add_argument("--tolerance-mm", type=float, default=0.2)
    ap.add_argument("--out", help=".blend to write; omit to only measure")
    ap.add_argument("--report", help="JSON report path")
    args = ap.parse_args(argv)

    cfg = json.loads(Path(args.config).read_text())
    digest = sha256(args.pdf)
    if digest != cfg["sha256"]:
        sys.exit(f"STOP: {Path(args.pdf).name} has SHA-256 {digest}\n"
                 f"      expected {cfg['sha256']}\n"
                 "      This is a different revision; review the path indices first.")

    import pymupdf
    page = pymupdf.open(args.pdf)[cfg.get("page", 0)]
    drawings, matrix = page.get_drawings(), page.rotation_matrix
    scale_mm = args.scale_mm or cfg.get("scale_mm")
    rep = {"model": cfg["model"], "source": Path(args.pdf).name, "sha256": digest,
           "page_rotation": page.rotation, "drawing_count": len(drawings)}
    rep.update(analyse(cfg, drawings, matrix, scale_mm))

    def finish(code=0):
        text = json.dumps(rep, indent=2, ensure_ascii=False)
        if args.report:
            Path(args.report).write_text(text + "\n")
        print(text)
        sys.exit(code)

    if not scale_mm:
        rep["status"] = "measured only: pass --scale-mm to import"
        finish()
    err = rep.get("nut_width_error_mm")
    if err is not None and abs(err) > args.tolerance_mm:
        rep["status"] = f"STOP: nut width disagrees by {err:+.3f} mm (> {args.tolerance_mm})"
        finish(2)
    if not args.out:
        rep["status"] = "scale verified; no --out given"
        finish()

    import bpy
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    u = scene.unit_settings
    u.system, u.scale_length, u.length_unit = "METRIC", 1.0, "MILLIMETERS"
    model, f = cfg["model"], rep["mm_per_pt"]
    xs = 1 if cfg["orientation"]["nut_to_bridge"] == "+x" else -1
    ys = -1 if cfg["orientation"]["treble"] == "-y" else 1
    x0, yc = rep["nut_x_pt"], rep["centreline_y_pt"]

    def T(p):
        return (xs * (p[0] - x0) * f / 1000.0, ys * (p[1] - yc) * f / 1000.0, 0.0)

    # The rear projection sits elsewhere on the sheet and is mirrored about the
    # centreline. Map it into the same front-view coordinates.
    rear = cfg.get("rear")
    rear_yc = None
    if rear:
        def ybox(ids):
            ys_ = [v for i in ids for r in [drawings[i]["rect"] * matrix] for v in (r.y0, r.y1)]
            return min(ys_) + max(ys_)
        front_ids = cfg["contours"][rear["match_front_contour"]]["ids"]
        rear_yc = (ybox(rear["body_ids"]) + ybox(front_ids) - 2 * yc) / 2
        rep["rear_centreline_y_pt"] = rear_yc

    def TR(p):
        return (xs * (p[0] - x0) * f / 1000.0, -ys * (p[1] - rear_yc) * f / 1000.0, 0.0)

    root = bpy.data.collections.new(f"RF_{model}")
    src = bpy.data.collections.new(f"RF_{model}_Source")
    scene.collection.children.link(root)
    root.children.link(src)
    src.hide_render = True

    def tag(ob, ids, note=""):
        ob["rf_status"] = "drawing"
        ob["rf_source"] = f"{cfg['source_name']} paths {ids}"
        ob["rf_source_sha256"] = digest
        ob["rf_note"] = note
        ob.hide_render = True
        src.objects.link(ob)

    def curve_object(name, segs, cyclic, T=T):
        cu = bpy.data.curves.new(name, "CURVE")
        cu.dimensions = "2D"
        cu.fill_mode = "NONE"
        sp = cu.splines.new("BEZIER")
        pts = [segs[0][1][0]] + [s[1][-1] for s in segs]
        if cyclic and math.dist(pts[0], pts[-1]) < 0.2:
            pts = pts[:-1]
        else:
            cyclic = False
        sp.bezier_points.add(len(pts) - 1)
        m = len(pts)
        for i, p in enumerate(pts):
            bp = sp.bezier_points[i]
            bp.co = T(p)
            bp.handle_left_type = bp.handle_right_type = "FREE"
            bp.handle_left = bp.handle_right = bp.co
        for i, (kind, p) in enumerate(segs):
            a, b = sp.bezier_points[i], sp.bezier_points[(i + 1) % m]
            if i + 1 >= m and not cyclic:
                break
            if kind == "c":
                a.handle_right, b.handle_left = T(p[1]), T(p[2])
            else:
                p0, p1 = p[0], p[-1]
                a.handle_right = T((p0[0] + (p1[0] - p0[0]) / 3, p0[1] + (p1[1] - p0[1]) / 3))
                b.handle_left = T((p0[0] + (p1[0] - p0[0]) * 2 / 3, p0[1] + (p1[1] - p0[1]) * 2 / 3))
        sp.use_cyclic_u = cyclic
        return bpy.data.objects.new(name, cu)

    sizes, gaps = {}, {}
    for part, spec in cfg["contours"].items():
        groups = load_segments(drawings, matrix, spec["ids"])
        segs, gap = order_contour(groups, tuple(spec["start"]) if spec.get("start") else None)
        ob = curve_object(f"RF_{model}_SRC_{part}", segs, cyclic=True)
        tag(ob, spec["ids"])
        gaps[part] = round(gap, 4)
        bpy.context.view_layer.update()
        sizes[part] = [round(ob.dimensions.x * 1000, 2), round(ob.dimensions.y * 1000, 2)]

    if rear:
        note = "rear projection, mirrored into front-view coordinates"
        segs, gap = order_contour(load_segments(drawings, matrix, rear["body_ids"]),
                                  tuple(rear["body_start"]) if rear.get("body_start") else None)
        ob = curve_object(f"RF_{model}_SRC_RearBody", segs, cyclic=True, T=TR)
        tag(ob, rear["body_ids"], note)
        gaps["RearBody"] = round(gap, 4)
        bpy.context.view_layer.update()
        sizes["RearBody"] = [round(ob.dimensions.x * 1000, 2), round(ob.dimensions.y * 1000, 2)]
        for part, i in rear.get("lines", {}).items():
            item = drawings[i]["items"][0]
            ob = curve_object(f"RF_{model}_SRC_{part}",
                              [("l", [tuple(p * matrix) for p in item[1:3]])], cyclic=False, T=TR)
            tag(ob, [i], note + ". " + rear.get("line_notes", {}).get(part, ""))

    f0, n = cfg["frets"]["first"], cfg["frets"]["count"]
    for k in range(n):
        item = drawings[f0 + k]["items"][0]
        ob = curve_object(f"RF_{model}_SRC_Fret_{k + 1:02d}",
                          [("l", [tuple(p * matrix) for p in item[1:3]])], cyclic=False)
        tag(ob, [f0 + k])
    for part, ids in cfg.get("centres", {}).items():
        for j, i in enumerate(ids, 1):
            r = drawings[i]["rect"] * matrix
            ob = bpy.data.objects.new(f"RF_{model}_SRC_{part}_{j:02d}", None)
            ob.empty_display_type, ob.empty_display_size = "PLAIN_AXES", 0.005
            ob.location = T(((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2))
            tag(ob, [i], "centre of the path's bounding box")

    rep["contour_size_mm"] = sizes
    rep["contour_join_gap_max_pt"] = gaps
    rep["objects_created"] = len(src.objects)
    rep["status"] = "imported"
    bpy.ops.wm.save_as_mainfile(filepath=str(Path(args.out).resolve()))
    rep["blend"] = str(Path(args.out).resolve())
    finish()


if __name__ == "__main__":
    main()
