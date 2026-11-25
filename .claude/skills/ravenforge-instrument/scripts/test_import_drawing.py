"""End-to-end check of import_drawing.py against a synthetic drawing.

Builds a rotated PDF plotted at a non-1:1 factor with known geometry, runs the
importer, and compares what lands in Blender with what was drawn.
    python test_import_drawing.py WORKDIR
"""
import hashlib, json, subprocess, sys
from pathlib import Path
import pymupdf

work = Path(sys.argv[1]); work.mkdir(parents=True, exist_ok=True)
SCALE, FACTOR, NUT_W = 648.0, 0.7529, 43.0          # mm, plot factor, mm
PT = 72 / 25.4 * FACTOR                              # pt per real mm
X0, YC = 400.0, 500.0                                # nut and centreline, rotated pt

doc = pymupdf.open(); page = doc.new_page(width=1200, height=2000); page.set_rotation(270)
inv = page.derotation_matrix
P = lambda x_mm, y_mm: pymupdf.Point(X0 + x_mm * PT, YC - y_mm * PT) * inv   # +y = treble = up

def stroke(draw):
    sh = page.new_shape(); draw(sh); sh.finish(color=(0, 0, 0), width=0.2, closePath=False); sh.commit()

for n in range(1, 25):                               # drawings 0..23: frets
    x = SCALE * (1 - 2 ** (-n / 12))
    stroke(lambda sh: sh.draw_line(P(x, -25), P(x, 25)))
BX, BY, RX, RY, K = 600.0, 0.0, 230.0, 160.0, 0.5522847498   # body: ellipse, 460 x 320 mm
quads = [((BX + RX, BY), (BX + RX, BY + K * RY), (BX + K * RX, BY + RY), (BX, BY + RY)),
         ((BX, BY + RY), (BX - K * RX, BY + RY), (BX - RX, BY + K * RY), (BX - RX, BY)),
         ((BX - RX, BY), (BX - RX, BY - K * RY), (BX - K * RX, BY - RY), (BX, BY - RY)),
         ((BX, BY - RY), (BX + K * RX, BY - RY), (BX + RX, BY - K * RY), (BX + RX, BY))]
for q in (quads[2], quads[0], quads[3], quads[1]):   # drawings 24..27, deliberately out of order
    stroke(lambda sh: sh.draw_bezier(*[P(*p) for p in q]))
stroke(lambda sh: sh.draw_circle(P(-120.0, -30.0), 5 * PT))   # drawing 28: tuner at (-120, -30) mm
pdf = work / "synthetic.pdf"; doc.save(pdf)

cfg = {"model": "TEST", "source_name": pdf.name, "sha256": hashlib.sha256(pdf.read_bytes()).hexdigest(),
       "page": 0, "scale_mm": None, "nut_width_mm": NUT_W,
       "orientation": {"nut_to_bridge": "+x", "treble": "-y"},
       "frets": {"first": 0, "count": 24},
       "nut_edge_pt": [[X0, YC - NUT_W / 2 * PT], [X0, YC + NUT_W / 2 * PT]],
       "contours": {"Body": {"ids": [24, 25, 26, 27]}}, "centres": {"Tuner": [28]}}
(work / "test.json").write_text(json.dumps(cfg))
imp = str(Path(__file__).with_name("import_drawing.py"))
base = [sys.executable, imp, "--config", str(work / "test.json"), "--pdf", str(pdf)]

fails = []
def check(name, got, want, tol):
    ok = abs(got - want) <= tol
    print(f"{'ok  ' if ok else 'FAIL'} {name}: {got:.4f} (want {want} ± {tol})")
    if not ok: fails.append(name)

r = subprocess.run(base + ["--report", str(work / "m.json")], capture_output=True, text=True)
m = json.loads((work / "m.json").read_text())
check("measure-only: scale implied by nut width (mm)", m["scale_mm_implied_by_nut_width"], SCALE, 0.05)
check("measure-only: paper scale length (mm)", m["paper_scale_length_mm"], SCALE * FACTOR, 0.02)

r = subprocess.run(base + ["--scale-mm", "648", "--out", str(work / "t.blend"), "--report", str(work / "r.json")],
                   capture_output=True, text=True)
if r.returncode: print(r.stdout[-800:], r.stderr[-800:])
rep = json.loads((work / "r.json").read_text())
check("plot factor", rep["plot_factor"], FACTOR, 1e-4)
check("nut width (mm)", rep["nut_width_measured_mm"], NUT_W, 0.02)
check("fret residual (mm)", rep["fret_fit_residual_max_mm"], 0.0, 0.01)
check("body length (mm)", rep["contour_size_mm"]["Body"][0], 460.0, 0.05)
check("body width (mm)", rep["contour_size_mm"]["Body"][1], 320.0, 0.05)

import bpy
bpy.ops.wm.open_mainfile(filepath=str(work / "t.blend"))
o = bpy.data.objects
f12, tun, body = o["RF_TEST_SRC_Fret_12"], o["RF_TEST_SRC_Tuner_01"], o["RF_TEST_SRC_Body"]
check("fret 12 x in Blender (mm)", f12.data.splines[0].bezier_points[0].co.x * 1000, 324.0, 0.02)
check("tuner x (mm)", tun.location.x * 1000, -120.0, 0.05)
check("tuner y (mm), bass side negative", tun.location.y * 1000, -30.0, 0.05)
check("body spline closed", float(body.data.splines[0].use_cyclic_u), 1.0, 0)
check("body point count", float(len(body.data.splines[0].bezier_points)), 4.0, 0)
check("all tagged", float(all(x.get("rf_status") == "drawing" and x.get("rf_source_sha256") for x in o)), 1.0, 0)

r = subprocess.run(base + ["--scale-mm", "640", "--out", str(work / "bad.blend")], capture_output=True, text=True)
check("wrong scale is refused (exit code)", float(r.returncode), 2.0, 0)
pdf.write_bytes(pdf.read_bytes() + b"\n%x")
r = subprocess.run(base + ["--scale-mm", "648"], capture_output=True, text=True)
check("changed file is refused", float("STOP" in (r.stderr + r.stdout) and r.returncode != 0), 1.0, 0)
print("FAILED: " + ", ".join(fails) if fails else "all checks passed"); sys.exit(1 if fails else 0)
