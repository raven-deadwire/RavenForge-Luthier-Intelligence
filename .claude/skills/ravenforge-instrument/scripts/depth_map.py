"""Plan-view depth maps of an object's top and back faces, for checking contours.

    python depth_map.py FILE.blend OBJECT_NAME OUT_PREFIX [--step-mm 1] [--full-scale-mm 20]

Writes OUT_PREFIX_top.png and OUT_PREFIX_back.png. Grey is the untouched flat
face, colour runs from yellow (shallow) to blue (full scale), black lines are
2 mm depth steps. +X (bridge end) is to the right, +Y (treble) is up.
"""
import argparse
import bpy, bmesh, pymupdf
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ap = argparse.ArgumentParser()
ap.add_argument("blend"); ap.add_argument("object"); ap.add_argument("out")
ap.add_argument("--step-mm", type=float, default=1.0)
ap.add_argument("--full-scale-mm", type=float, default=20.0)
a = ap.parse_args()
bpy.ops.wm.open_mainfile(filepath=a.blend)
ob = bpy.data.objects[a.object]
bm = bmesh.new(); bm.from_mesh(ob.data); bm.transform(ob.matrix_world)
bmesh.ops.triangulate(bm, faces=bm.faces)
tree = BVHTree.FromBMesh(bm)
xs, ys, zs = zip(*[tuple(v.co) for v in bm.verts])
st, m = a.step_mm / 1000, 0.01
x0, y1 = min(xs) - m, max(ys) + m
W, H = int((max(xs) - x0 + m) / st), int((y1 - min(ys) + m) / st)
for name, org, d, ref in (("top", max(zs) + 1, -1, max(zs)), ("back", min(zs) - 1, 1, min(zs))):
    buf = bytearray(b"\xff" * (W * H * 3))
    for j in range(H):
        for i in range(W):
            hit = tree.ray_cast(Vector((x0 + i * st, y1 - j * st, org)), Vector((0, 0, d)))[0]
            if hit is None:
                continue
            dep = abs(hit.z - ref) * 1000
            if dep < 0.05:
                c = (205, 205, 205)
            elif dep % 2 < 0.12:
                c = (0, 0, 0)
            else:
                t = min(dep / a.full_scale_mm, 1)
                c = (int(255 * (1 - t)), int(120 + 100 * (1 - t)), int(255 * t) if t < .5 else 255)
            k = (j * W + i) * 3
            buf[k:k + 3] = bytes(c)
    pymupdf.Pixmap(pymupdf.csRGB, W, H, bytes(buf), False).save(f"{a.out}_{name}.png")
print("wrote", W, "x", H, "px at", a.step_mm, "mm/px")
