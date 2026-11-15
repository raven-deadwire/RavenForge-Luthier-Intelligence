"""Run every stage in order, from the source PDF to renders.

    python run_pipeline.py --config ../drawings/gramr.json --pdf SOURCE.pdf --workdir OUT [--draft]
    python run_pipeline.py ... --compare ../drawings      # also diff the reports against recorded ones

Each stage is the same script you would run by hand; this only chains them and
stops at the first failure. Files land in OUT: <model>_stageN.blend,
<model>_stageN.json, previews/ and renders/. --draft makes stage 8 render small.
--compare checks that stages 1-7 reproduce the recorded reports exactly and
that stage 8's checks match (render timings are ignored).
"""
import argparse, json, subprocess, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    for a in ("--config", "--pdf", "--workdir"):
        ap.add_argument(a, required=True)
    ap.add_argument("--draft", action="store_true")
    ap.add_argument("--no-previews", action="store_true", help="skip the per-stage check renders")
    ap.add_argument("--compare", help="directory holding recorded <model>.stageN-report.json files")
    args = ap.parse_args(argv)
    cfg = json.loads(Path(args.config).read_text())
    m = cfg["model"].lower()
    w = Path(args.workdir); w.mkdir(parents=True, exist_ok=True)
    b = lambda n: str(w / f"{m}_stage{n}.blend")
    r = lambda n: str(w / f"{m}_stage{n}.json")
    pv = [] if args.no_previews else ["--preview-dir", str(w / "previews")]
    c = ["--config", args.config]
    stages = [
        ("import_drawing.py", c + ["--pdf", args.pdf, "--out", b(1), "--report", r(1)]),
        ("build_body.py", c + ["--blend", b(1), "--out", b(2), "--report", r(2)] + pv),
        ("build_contours.py", c + ["--blend", b(2), "--stage2-report", r(2), "--out", b(3), "--report", r(3)] + pv),
        ("build_neck.py", c + ["--blend", b(3), "--stage1-report", r(1), "--out", b(4), "--report", r(4)] + pv),
        ("build_frets.py", c + ["--blend", b(4), "--stage1-report", r(1), "--out", b(5), "--report", r(5)] + pv),
        ("build_hardware.py", c + ["--blend", b(5), "--stage1-report", r(1), "--out", b(6), "--report", r(6)] + pv),
        ("build_materials.py", c + ["--blend", b(6), "--out", b(7), "--report", r(7)] + pv),
        ("build_render.py", c + ["--blend", b(7), "--out", b(8), "--report", r(8), "--render-dir", str(w / "renders")]
         + (["--draft"] if args.draft else [])),
    ]
    for n, (script, a) in enumerate(stages, 1):
        t = time.time()
        p = subprocess.run([sys.executable, str(HERE / script)] + a, capture_output=True, text=True)
        (w / f"{m}_stage{n}.log").write_text(p.stdout + "\n--- stderr ---\n" + p.stderr)
        print(f"stage {n} {script:<20} {'ok' if p.returncode == 0 else 'FAILED'} {time.time() - t:6.1f}s", flush=True)
        if p.returncode:
            print(p.stderr[-1500:])
            sys.exit(n)

    if args.compare:
        def clean(d, n):
            d = dict(d)
            for k in ("blend", "source", "source_note", "open_contours", "status", "samples", "preview_view_transform"):
                d.pop(k, None)
            if n == 8:
                d["renders"] = sorted(d.get("renders", {}))
            return d
        bad = 0
        for n in range(1, 9):
            rec = Path(args.compare) / f"{m}.stage{n}-report.json"
            same = clean(json.loads(rec.read_text()), n) == clean(json.loads(Path(r(n)).read_text()), n)
            bad += not same
            print(f"stage {n} report {'matches the record' if same else 'DIFFERS from the record'}")
        sys.exit(20 if bad else 0)


if __name__ == "__main__":
    main()
