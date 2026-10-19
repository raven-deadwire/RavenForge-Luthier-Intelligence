# Illustrative ash surface

`ash-illustrative.webp` is a material-only illustration generated on 2026-10-19 with the built-in image-generation tool, then encoded as WebP quality 92 at its original 1254 × 1254 dimensions. It is not an actual stock-board photograph and does not certify any selected wood species. No instrument geometry or third-party imagery was generated or copied. GRAMR's geometry comes exclusively from the supplied PDF vectors. Opaque paint hides this texture.

Prompt:

> Use case: product-mockup / material texture. Create a high resolution seamless-looking wood material tile for a guitar configurator (NOT a guitar image). The entire square is filled edge to edge by a close straight-on perpendicular photograph of high quality natural swamp ash wood, tightly filled grain, pale neutral beige/grey-brown with elegant long organic dark cathedral grain running vertically. Subtle grain detail, premium luthier timber, absolutely flat even diffuse illumination, no perspective, no borders, no vignette, no objects, no text, no hardware, no knots, no burl, no quilting, no coloured stain, no specular glare. This will be used only as illustrative material in code with an exact CAD outline; DO NOT depict any instrument, body shape or product. Large-scale sweeping cathedral grain and fine crisp fibers; realistic timber, not graphic lines.


## v8 illustrative wood textures — 2026-10-20

Generated with the built-in imagegen tool, as three texture-atlas image assets.
No supplier photo pixels were copied. Each original PNG is 1254 × 1254 pixels;
WebP encoding at quality 88 preserves dimensions. The renderer samples a 410 × 410
interior from each 418-pixel cell to prevent neighbouring material bleeding.
Full exact prompts are in [prompts-v8.json](prompts-v8.json).

| File | Row-major contents |
| --- | --- |
| wood-body-atlas-v8.webp | Ash, alder, zelkova; elm, maple, limba; red toon, jindai ash, jindai zelkova |
| wood-fretboard-atlas-v8.webp | Rosewood, ebony, wenge; ironwood, bog oak, snakewood; wamara, kingwood, African blackwood |
| wood-top-atlas-v8.webp | Flame maple, quilted maple, figured ash; figured elm, maple burl, buckeye burl; walnut, jindai elm, purpleheart |

The common prompt asks for an original orthographic, evenly lit, edge-to-edge 3×3
wood texture atlas without labels, borders, metal, perspective or copied photos.
Each prompt then describes the distinct grain and palette of its nine cells.

Reference descriptions consulted (not image redistribution licences):
- https://www.cookwoods.com/collections/desert-ironwood — warm honey/brown/black wood, not metal.
- https://www.cookwoods.com/collections/snakewood — reddish/brown/black mottled figure.
- https://www.cookwoods.com/collections/kingwood
- https://www.cookwoods.com/collections/buckeye-burl — gold/grey/dark swirling figure.
- https://greenbergwoods.com/bog-oak/ — dark oak retaining visible grain.
- https://www.wood-database.com/wamara/ — reddish/plum-brown with darker stripes.

The configurator only calls the option "ironwood". Its exact supplied species is
not established; the warm dense-wood image is an illustrative example, not a claim
that the final fretboard is Olneya tesota. Natural material variation, actual stock
selection and bookmatching require separate confirmation. Custom/other wood
options must remain pending rather than acquire invented final textures.
