"""Parametric hardware shapes for stage 6: tremolo, tuner, humbucker, knob, blade switch, jack, screws.

Each builder adds geometry to a bmesh in world coordinates (metres) and paints faces with one
of four material slots: GOLD, BLACK, DARK, STEEL. Shapes are generic functional forms sized by
the numbers passed in. No maker's logo, engraving or CAD file is used, and nothing here is a
substitute for a manufacturer's drawing.
"""
import math
import bmesh
from mathutils import Vector, Matrix

MM = 0.001
GOLD, BLACK, DARK, STEEL = 0, 1, 2, 3
Z = Vector((0, 0, 1))


class Paint:
    """with Paint(bm, slot): ...  -> every face created inside gets that material slot."""
    def __init__(self, bm, slot):
        self.bm, self.slot = bm, slot
    def __enter__(self):
        # Remember the faces themselves, not a count: bm.from_mesh() does not keep new faces at the end.
        self.before = set(self.bm.faces)
    def __exit__(self, *a):
        for f in self.bm.faces:
            if f not in self.before:
                f.material_index = self.slot


def frame(origin, ax, ay=None):
    """4x4 with local X = ax, local Z = world Z (ax must be horizontal)."""
    ax = Vector((ax[0], ax[1], 0)).normalized()
    ay = Z.cross(ax) if ay is None else Vector((ay[0], ay[1], 0)).normalized()
    return Matrix.Translation(origin) @ Matrix((ax, ay, Z)).transposed().to_4x4()


def cyl(bm, centre, r1, r2, z0, z1, seg=32, axis=None):
    if axis is None:
        m = Matrix.Translation(Vector(centre) + Vector((0, 0, (z0 + z1) / 2)))
    else:                                 # centre is the mid-point, z1 - z0 the length along `axis`
        m = Matrix.Translation(centre) @ Z.rotation_difference(Vector(axis).normalized()).to_matrix().to_4x4()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=z1 - z0, matrix=m)


def box(bm, m, sx, sy, sz, bevel=0.0):
    """Box of the given size centred on matrix m, optionally with all edges rounded."""
    tmp = bmesh.new()
    bmesh.ops.create_cube(tmp, size=1.0, matrix=Matrix.Diagonal((sx, sy, sz, 1)))
    if bevel > 0:
        bmesh.ops.bevel(tmp, geom=tmp.edges[:], offset=bevel, segments=3, profile=0.5, affect="EDGES")
    tmp.transform(m)
    me = __import__("bpy").data.meshes.new("tmp"); tmp.to_mesh(me); tmp.free()
    bm.from_mesh(me); __import__("bpy").data.meshes.remove(me)


def lathe(bm, m, profile, seg=48, knurl=None):
    """Revolve (radius, height) points about local Z. knurl=(z0, z1, depth) flutes that band."""
    rings = []
    for r, z in profile:
        ring = []
        for i in range(seg):
            rr = r
            if knurl and knurl[0] <= z <= knurl[1] and i % 2:
                rr = r - knurl[2]
            a = 2 * math.pi * i / seg
            ring.append(bm.verts.new(m @ Vector((rr * math.cos(a), rr * math.sin(a), z))))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            bm.faces.new((a[i], a[(i + 1) % seg], b[(i + 1) % seg], b[i]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])


def prism(bm, pts, z0, z1):
    """Extrude a convex-ish polygon (list of Vector xy, counter-clockwise) between two heights."""
    lo = [bm.verts.new((p.x, p.y, z0)) for p in pts]
    hi = [bm.verts.new((p.x, p.y, z1)) for p in pts]
    n = len(pts)
    for i in range(n):
        bm.faces.new((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]))
    bm.faces.new(list(reversed(lo))); bm.faces.new(hi)


def stadium(centre, length, width, along, seg=12):
    """Rounded-end slot outline, counter-clockwise, long axis `along` (xy)."""
    along = Vector((along[0], along[1])).normalized(); across = Vector((-along.y, along.x))
    c = Vector((centre[0], centre[1]))
    r, h = width / 2, length / 2 - width / 2
    pts = []
    for sign, a0 in ((1, -math.pi / 2), (-1, math.pi / 2)):
        for i in range(seg + 1):
            a = a0 + math.pi * i / seg
            pts.append(c + along * (sign * h + r * math.cos(a)) + across * (r * math.sin(a)))
    return pts


def screw_head(bm, centre, z, r=3.0 * MM, h=1.0 * MM, slot="cross"):
    """Low domed screw head with a dark cross or single slot."""
    m = Matrix.Translation(Vector((centre.x, centre.y, z)))
    with Paint(bm, GOLD):
        lathe(bm, m, [(r, 0), (r * 0.94, h * 0.45), (r * 0.72, h * 0.82), (r * 0.35, h)], seg=20)
    with Paint(bm, DARK):
        top = Matrix.Translation(Vector((centre.x, centre.y, z + h + 0.02 * MM)))
        box(bm, top, r * 1.15, r * 0.2, 0.06 * MM)
        if slot == "cross":
            box(bm, top, r * 0.2, r * 1.15, 0.06 * MM)


def knob(bm, centre, z, d):
    """Knurled metal control knob."""
    r, h = d["diameter_mm"] * MM / 2, d["height_mm"] * MM
    m = Matrix.Translation(Vector((centre.x, centre.y, z)))
    with Paint(bm, GOLD):
        lathe(bm, m, [(r * 1.0, 0), (r * 1.0, h * 0.10), (r * 0.955, h * 0.14), (r * 0.955, h * 0.80),
                      (r * 0.93, h * 0.86), (r * 0.80, h * 0.955), (r * 0.55, h)], seg=72,
              knurl=(h * 0.13, h * 0.81, d["knurl_depth_mm"] * MM))
    with Paint(bm, DARK):                                # position mark on the top
        box(bm, Matrix.Translation(Vector((centre.x + r * 0.3, centre.y, z + h + 0.03 * MM))), r * 0.42, 0.8 * MM, 0.06 * MM)


def tuner(bm, c, row, out, face_z, back_z, d_edge, d):
    """Sealed-gear tuner: hex bushing and post on the face, cast housing, shaft and button behind."""
    c = Vector((c.x, c.y, 0)); row = Vector(row).normalized(); out = Vector(out).normalized()
    hole_z = back_z + d["string_hole_above_base_mm"] * MM
    with Paint(bm, GOLD):
        cyl(bm, c, d["washer_diameter_mm"] * MM / 2, d["washer_diameter_mm"] * MM / 2, face_z, face_z + 0.8 * MM, seg=40)
        cyl(bm, c, d["bushing_across_flats_mm"] * MM / 1.732, d["bushing_across_flats_mm"] * MM / 1.732,
            face_z + 0.8 * MM, face_z + 3.4 * MM, seg=6)
        pr = d["post_diameter_mm"] * MM / 2
        lathe(bm, Matrix.Translation(c + Z * (face_z + 3.4 * MM)),
              [(pr * 1.15, 0), (pr * 1.15, 0.6 * MM), (pr, 1.0 * MM), (pr, hole_z - face_z - 3.4 * MM + 2.2 * MM),
               (pr * 0.8, hole_z - face_z - 3.4 * MM + 2.9 * MM)], seg=28)
    with Paint(bm, DARK):                                # string hole through the post
        cyl(bm, c + Z * hole_z, 0.95 * MM, 0.95 * MM, 0, d["post_diameter_mm"] * MM + 0.2 * MM, seg=12, axis=row)
    hx, hy, hz = [v * MM for v in d["housing_mm"]]
    hc = c + out * d["housing_offset_mm"] * MM + Z * (back_z - hz / 2)
    with Paint(bm, GOLD):
        box(bm, frame(hc, row, out), hx, hy, hz, bevel=1.6 * MM)
        ear = c - out * (hy / 2 - d["housing_offset_mm"] * MM + 1.0 * MM) - row * (hx / 2 - 1.5 * MM)
        cyl(bm, ear, 3.3 * MM, 3.3 * MM, back_z - 1.8 * MM, back_z, seg=20)
        reach = d_edge + d["button_centre_past_edge_mm"] * MM
        s0 = d["housing_offset_mm"] * MM + hy / 2
        bz = back_z - hz / 2
        cyl(bm, c + out * (s0 + reach) / 2 + Z * bz, d["shaft_diameter_mm"] * MM / 2, d["shaft_diameter_mm"] * MM / 2,
            0, reach - s0, seg=20, axis=out)
        bl, bw, bt = [v * MM for v in d["button_mm"]]
        cyl(bm, c + out * (reach - bl / 2 - 0.6 * MM) + Z * bz, 3.4 * MM, 2.6 * MM, 0, 2.4 * MM, seg=20, axis=out)
        rot = Matrix((out, row, Z)).transposed().to_4x4()
        bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=14, radius=0.5,
                                  matrix=Matrix.Translation(c + out * reach + Z * bz) @ rot @ Matrix.Diagonal((bl, bw, bt, 1)))
    with Paint(bm, DARK):                                # head of the housing's mounting screw
        cyl(bm, ear, 1.5 * MM, 1.2 * MM, back_z - 2.4 * MM, back_z - 1.8 * MM, seg=12)


def humbucker(bm, ring, pg_top, string_y, screw_coil_side, d):
    """Open-coil humbucker seen from above the pickguard: two bobbins, poles, two height screws."""
    xs, ys = [p.x for p in ring], [p.y for p in ring]
    cx, cy, w, l = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(xs) - min(xs), max(ys) - min(ys)
    top = pg_top + d["top_above_pickguard_mm"] * MM
    fl = d["flange_thickness_mm"] * MM
    gap = d["bobbin_gap_mm"] * MM
    bw = (w - gap) / 2
    for side in (-1, 1):
        bx = cx + side * (bw + gap) / 2
        with Paint(bm, BLACK):
            prism(bm, stadium((bx, cy), l, bw, (0, 1)), top - fl, top)
            prism(bm, stadium((bx, cy), l, bw, (0, 1)), pg_top - 3 * MM, pg_top - 3 * MM + fl)
        with Paint(bm, DARK):                            # the wound coil between the flanges
            prism(bm, stadium((bx, cy), l - 2.4 * MM, bw - 2.4 * MM, (0, 1)), pg_top - 3 * MM + fl, top - fl)
        for y in string_y:
            p = Vector((bx, y))
            if side == screw_coil_side:
                with Paint(bm, STEEL):
                    lathe(bm, Matrix.Translation((p.x, p.y, top)),
                          [(2.5 * MM, 0), (2.5 * MM, 0.35 * MM), (1.9 * MM, 0.7 * MM)], seg=20)
                with Paint(bm, DARK):
                    box(bm, Matrix.Translation((p.x, p.y, top + 0.72 * MM)), 0.6 * MM, 3.4 * MM, 0.06 * MM)
            else:
                with Paint(bm, STEEL):
                    cyl(bm, Vector((p.x, p.y, 0)), 2.4 * MM, 2.4 * MM, top, top + 0.25 * MM, seg=20)
    for s in (-1, 1):                                    # height-adjust screws through the pickguard
        screw_head(bm, Vector((cx, cy + s * d["mount_screw_spacing_mm"] * MM / 2)), pg_top, r=2.3 * MM, h=0.9 * MM)
    return {"centre_mm": [round(cx / MM, 2), round(cy / MM, 2)], "size_mm": [round(w / MM, 2), round(l / MM, 2)]}


def blade_switch(bm, a, b, pg_top, d):
    """Blade selector: slot, two mounting screws, lever with a tip."""
    a, b = Vector((a.x, a.y)), Vector((b.x, b.y))
    mid, along = (a + b) / 2, (b - a).normalized()
    with Paint(bm, DARK):
        prism(bm, stadium(mid, (b - a).length, d["slot_width_mm"] * MM, along, seg=6), pg_top - 0.2 * MM, pg_top + 0.05 * MM)
    for s in (-1, 1):
        screw_head(bm, mid + along * s * d["screw_spacing_mm"] * MM / 2, pg_top, r=2.6 * MM, h=0.9 * MM)
    pos = mid + along * d["lever_position"] * ((b - a).length / 2 - 2 * MM)
    h = d["lever_height_mm"] * MM
    with Paint(bm, STEEL):
        box(bm, frame(Vector((pos.x, pos.y, pg_top + h / 2)), along), 1.2 * MM, 4.2 * MM, h)
    with Paint(bm, BLACK):
        box(bm, frame(Vector((pos.x, pos.y, pg_top + h + 2.5 * MM)), along), 5.2 * MM, 7.2 * MM, 8.0 * MM, bevel=1.4 * MM)


def jack_plate(bm, ring, z_body, d):
    """Recessed oval jack plate: flat rim, dished bowl, angled jack nut. Returns the pocket outline."""
    # Long axis = the two outline points farthest apart; the point average is biased by uneven sampling.
    step = max(1, len(ring) // 180)
    pts = ring[::step]
    p0, p1 = max(((p, q) for i, p in enumerate(pts) for q in pts[i + 1:]), key=lambda pq: (pq[0] - pq[1]).length)
    c = (p0 + p1) / 2
    major = (p1 - p0).normalized(); a = (p1 - p0).length / 2
    zt = z_body + d["plate_thickness_mm"] * MM
    steps = [(1.0, z_body), (1.0, zt), (d["rim_inner_scale"], zt), (d["rim_inner_scale"] * 0.86, zt - d["bowl_depth_mm"] * MM * 0.55),
             (d["rim_inner_scale"] * 0.6, zt - d["bowl_depth_mm"] * MM * 0.92), (d["rim_inner_scale"] * 0.3, zt - d["bowl_depth_mm"] * MM)]
    with Paint(bm, GOLD):
        rings = [[bm.verts.new((c.x + (p.x - c.x) * s, c.y + (p.y - c.y) * s, z)) for p in ring] for s, z in steps]
        n = len(ring)
        for r0, r1 in zip(rings, rings[1:]):
            for i in range(n):
                bm.faces.new((r0[i], r0[(i + 1) % n], r1[(i + 1) % n], r1[i]))
        bm.faces.new(rings[-1])
        tilt = math.radians(d["jack_tilt_deg"])
        axis = (Z * math.cos(tilt) + Vector((major.x, major.y, 0)) * math.sin(tilt)).normalized()
        jc = Vector((c.x, c.y, 0)) - Vector((major.x, major.y, 0)) * a * 0.12 + Z * (zt - d["bowl_depth_mm"] * MM * 0.72)
        cyl(bm, jc, 6.6 * MM, 6.6 * MM, 0, 2.2 * MM, seg=6, axis=axis)
        cyl(bm, jc + axis * 1.6 * MM, 4.9 * MM, 4.9 * MM, 0, 2.0 * MM, seg=24, axis=axis)
    with Paint(bm, DARK):
        cyl(bm, jc + axis * 2.65 * MM, 3.2 * MM, 3.2 * MM, 0, 0.12 * MM, seg=20, axis=axis)
    for s in (-1, 1):
        screw_head(bm, c + major * s * a * d["screw_position"], zt, r=2.4 * MM, h=0.9 * MM)
    pocket = [Vector((c.x + (p.x - c.x) * d["rim_inner_scale"] * 0.98, c.y + (p.y - c.y) * d["rim_inner_scale"] * 0.98)) for p in ring]
    return pocket, {"long_axis_mm": round(2 * a / MM, 2), "centre_mm": [round(c.x / MM, 2), round(c.y / MM, 2)]}


def tremolo(bm, plate_bm, ring, z_body, scale_x, d):
    """Two-point tremolo top side: plate, rear wall, six block saddles with screws, studs, arm."""
    xs, ys = [p.x for p in ring], [p.y for p in ring]
    bx0, bx1, by0, by1 = min(xs), max(xs), min(ys), max(ys)
    z0 = z_body + d["plate_gap_above_body_mm"] * MM
    z1 = z0 + d["plate_thickness_mm"] * MM
    with Paint(bm, GOLD):
        me = __import__("bpy").data.meshes.new("tmp"); plate_bm.to_mesh(me); bm.from_mesh(me); __import__("bpy").data.meshes.remove(me)
    sd = d["saddle"]
    L, W, H = sd["length_mm"] * MM, sd["width_mm"] * MM, sd["height_mm"] * MM
    n, pitch = sd["count"], sd["pitch_mm"] * MM
    wall_x = bx1 - d["rear_wall_thickness_mm"] * MM / 2 - 0.6 * MM
    with Paint(bm, GOLD):
        box(bm, Matrix.Translation((wall_x, 0, z1 + d["rear_wall_height_mm"] * MM / 2)), d["rear_wall_thickness_mm"] * MM,
            n * pitch + 3 * MM, d["rear_wall_height_mm"] * MM, bevel=0.5 * MM)
    contacts = []
    for i in range(n):
        y = (i - (n - 1) / 2) * pitch
        x = scale_x + sd["compensation_mm"][i] * MM
        contacts.append([round(x / MM, 2), round(y / MM, 2)])
        with Paint(bm, GOLD):
            prof = [(-0.30, 0), (0.70, 0), (0.70, 0.72), (0.38, 0.80), (0.08, 0.97), (0.0, 1.0), (-0.10, 0.96), (-0.24, 0.72), (-0.30, 0.42)]
            lo = [bm.verts.new((x + px * L, y - W / 2, z1 + pz * H)) for px, pz in prof]
            hi = [bm.verts.new((x + px * L, y + W / 2, z1 + pz * H)) for px, pz in prof]
            k = len(prof)
            for j in range(k):
                bm.faces.new((lo[j], lo[(j + 1) % k], hi[(j + 1) % k], hi[j]))
            bm.faces.new(lo); bm.faces.new(list(reversed(hi)))
            xr = x + 0.70 * L
            cyl(bm, Vector(((xr + wall_x) / 2, y, z1 + H * 0.42)), 1.5 * MM, 1.5 * MM, 0, max(wall_x - xr, 1e-4), seg=12, axis=(1, 0, 0))
            cyl(bm, Vector(((xr + wall_x) / 2, y, z1 + H * 0.42)), 2.3 * MM, 2.3 * MM, 0, max(wall_x - xr, 1e-4) * 0.7, seg=12, axis=(1, 0, 0))
            cyl(bm, Vector((wall_x + d["rear_wall_thickness_mm"] * MM / 2 + 1.1 * MM, y, z1 + H * 0.42)), 2.6 * MM, 2.6 * MM, 0, 2.2 * MM,
                seg=14, axis=(1, 0, 0))
        with Paint(bm, DARK):                            # height screws and the string slot
            for s in (-1, 1):
                cyl(bm, Vector((x + 0.30 * L, y + s * W * 0.3, 0)), 1.3 * MM, 1.3 * MM, z1 + H * 0.82, z1 + H * 0.82 + 0.25 * MM, seg=6)
            box(bm, Matrix.Translation((x + 0.04 * L, y, z1 + H * 0.985)), L * 0.16, 1.1 * MM, 0.12 * MM)
    st = d["stud"]
    studs = []
    for s in (-1, 1):
        p = Vector((bx0 + st["centre_behind_front_edge_mm"] * MM, s * st["pitch_mm"] * MM / 2, 0))
        studs.append([round(p.x / MM, 2), round(p.y / MM, 2)])
        with Paint(bm, GOLD):
            lathe(bm, Matrix.Translation((p.x, p.y, z_body)),
                  [(st["diameter_mm"] * MM / 2 * 1.25, 0), (st["diameter_mm"] * MM / 2 * 1.25, 1.0 * MM), (st["diameter_mm"] * MM / 2 * 0.62, 1.6 * MM),
                   (st["diameter_mm"] * MM / 2 * 0.62, (z0 - z_body) + 2.2 * MM), (st["diameter_mm"] * MM / 2, (z0 - z_body) + 2.8 * MM),
                   (st["diameter_mm"] * MM / 2, st["height_mm"] * MM - 0.6 * MM), (st["diameter_mm"] * MM / 2 * 0.8, st["height_mm"] * MM)], seg=28)
        with Paint(bm, DARK):
            box(bm, Matrix.Translation((p.x, p.y, z_body + st["height_mm"] * MM + 0.03 * MM)), st["diameter_mm"] * MM * 0.3, st["diameter_mm"] * MM * 0.3, 0.06 * MM)
    arm = d["arm"]
    base = Vector(((bx0 + bx1) / 2 + arm["socket_offset_mm"][0] * MM, arm["socket_side"] * (n * pitch / 2 + arm["socket_offset_mm"][1] * MM), z1))
    direction = Vector((math.cos(math.radians(arm["heading_deg"])), math.sin(math.radians(arm["heading_deg"])), 0))
    pts = [base, base + Z * arm["rise_mm"] * MM, base + Z * (arm["rise_mm"] + 4) * MM + direction * 9 * MM,
           base + Z * (arm["rise_mm"] + 5) * MM + direction * arm["length_mm"] * MM]
    r = arm["diameter_mm"] * MM / 2
    with Paint(bm, GOLD):
        cyl(bm, Vector((base.x, base.y, 0)), r * 1.9, r * 1.7, z1, z1 + 4 * MM, seg=24)
        for p, q in zip(pts, pts[1:]):
            cyl(bm, (p + q) / 2, r, r, 0, (q - p).length, seg=16, axis=q - p)
            bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=r, matrix=Matrix.Translation(q))
    with Paint(bm, BLACK):
        tip = pts[-1]
        cyl(bm, tip - (pts[-1] - pts[-2]).normalized() * arm["tip_length_mm"] * MM / 2, r * 1.7, r * 1.7, 0, arm["tip_length_mm"] * MM, seg=20,
            axis=pts[-1] - pts[-2])
    return {"plate_x_range_mm": [round(bx0 / MM, 2), round(bx1 / MM, 2)], "plate_top_z_mm": round(z1 / MM, 2),
            "saddle_contact_mm": contacts, "saddle_top_z_mm": round((z1 + H) / MM, 2), "stud_centres_mm": studs,
            "saddles_inside_plate": all(bx0 / MM < c[0] - 0.3 * L / MM and c[0] + 0.7 * L / MM < bx1 / MM for c in contacts)}
