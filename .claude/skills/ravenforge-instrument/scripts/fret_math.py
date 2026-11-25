"""RavenForge fret geometry helpers. Pure Python, no bpy; all lengths in mm.

Coordinates follow SKILL.md: +X runs nut -> bridge along the centreline,
+Y runs toward the treble side, origin at the nut (or zero fret) on the centreline.
These are ideal equal-temperament positions. Compensation, nut/saddle offsets and
fret-slot machining data are NOT produced here.
"""

INCH = 25.4


def fret_distance(scale_mm, n):
    """Distance from the nut (or zero fret) to fret n on a string of this scale."""
    return scale_mm * (1.0 - 2.0 ** (-n / 12.0))


def straight_frets(scale_mm, count):
    """[(n, x_mm)] for frets 1..count on a single-scale instrument."""
    return [(n, fret_distance(scale_mm, n)) for n in range(1, count + 1)]


def multiscale_frets(bass_scale_mm, treble_scale_mm, count,
                     nut_half_width_mm, bridge_half_width_mm, perpendicular_fret):
    """Fret end points along the two OUTER STRINGS of a fanned-fret instrument.

    nut_half_width_mm / bridge_half_width_mm: half the outer-string spread at the
    nut and at the bridge. perpendicular_fret: the fret that is square to the
    centreline. Take all four from the source drawing; never guess them.

    Returns [(n, (x_bass, y_bass), (x_treble, y_treble))] for n = 0..count,
    where n = 0 is the nut line. Extend each line to the fingerboard edges in
    Blender; the string path, not the board edge, carries the scale length.
    """
    def string_points(scale, y_nut, y_bridge, x_offset):
        # The string is a straight line of length `scale` from nut to bridge.
        dy = y_bridge - y_nut
        dx = (scale ** 2 - dy ** 2) ** 0.5
        pts = []
        for n in range(0, count + 1):
            t = fret_distance(scale, n) / scale
            pts.append((x_offset + dx * t, y_nut + dy * t))
        return pts

    bass = string_points(bass_scale_mm, -nut_half_width_mm, -bridge_half_width_mm, 0.0)
    treble = string_points(treble_scale_mm, nut_half_width_mm, bridge_half_width_mm, 0.0)
    # Slide the treble string along X so the chosen fret is perpendicular.
    shift = bass[perpendicular_fret][0] - treble[perpendicular_fret][0]
    treble = [(x + shift, y) for x, y in treble]
    return [(n, bass[n], treble[n]) for n in range(0, count + 1)]


if __name__ == "__main__":
    for n, x in straight_frets(648.0, 24):
        if n in (1, 12, 24):
            print(f"GRAMR 648 mm  fret {n:2d}: {x:8.3f} mm")
    demo = multiscale_frets(37 * INCH, 34 * INCH, 24, 18.0, 36.0, 7)
    for n, b, t in demo:
        if n in (0, 7, 12, 24):
            print(f"demo 37-34 in fret {n:2d}: bass x={b[0]:8.3f}  treble x={t[0]:8.3f}")
    print("demo spreads and perpendicular fret are placeholders, not ASKR data")
