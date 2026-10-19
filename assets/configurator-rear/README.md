# Rear preview sources

Updated 2026-10-20 KST. Test-page assets only. All RavenForge instruments are bolt-on, as explicitly corrected by the user. Earlier neck-through-looking generated EMBLA/ASKR candidates are rejected and are not included.

## ASKR and EMBLA

Rear body/head contours, heel strokes, five bolt centres, tuner housing/key outlines, control-cover outline and battery-box outline are extracted from the newly supplied PDFs. Only these display elements are included; full private PDFs, dimensions, text, ghosted front pickups/strings/bridges and prototype-specific electronics are not redistributed or applied to the active quote.

- ASKR: RavenForge_ASKR_MS5001_john0-Model(1).pdf; SHA-256 94962ee6ea46a1d87c35910537aea98d13adfd9a2ea47c372ae1cbc9b89b6fc5.
- EMBLA: RavenForge_EMBLA_002_LYW_34_5ST-Model.pdf; SHA-256 b5953882c1c5018d5eede0fa73f8e16dfd113e772de44f0629dd7614e82aaef5.
- Rebuild: python tools/extract_bass_rear_geometry.py /path/to/supplied-pdfs.
- Exact indices, offsets and join gaps: assets/configurator-bass-rear-geometry.js.
- Material texture, lighting, laminate widths and metal surfaces are illustrative. Neck strips are clipped to the neck and stop at the heel. No neck-through core is depicted.
- Front views remain the existing sample-render composites. Rear views use the supplied prototype drawing revisions, so the earlier front sample is not promoted to an approved matching orthographic drawing.

## EDDA

edda-rear-concept.webp is a 1024 × 1536 AI concept made with built-in image_gen and the existing Edda Prototype Design.png as reference. The revised image shows a separate bolt-on heel. Five ferrules and cover/heel placement are a display proposal, not verified EDDA machining coordinates. The UI explicitly labels this distinction. The renderer uses independent display masks; WebP encoding preserves the full source dimensions. Exact part/neck-option appearances remain pending.

Prompt set:

```text
Use case: product-mockup. Asset type: rear-view concept image for RavenForge's isolated instrument configurator.
Input image 1: existing EDDA front-view sample, a reference for the identity, proportions, silhouette and luthier-render style.
Create ONE separate full-length REAR view of this same EDDA four-string bass, upright, straight-on with minimal perspective. This is a new concept, not a manufacturing illustration. The long horn is on the viewer's RIGHT in the rear view; the short horn on the left. Preserve the softly rounded asymmetrical body, narrow waist, rounded lower bout, long neck, angular compact headstock, overall width/length proportions. Do not replace it with a generic Fender or guitar.
Natural warm pale alder rear body with understated fine wood grain, smooth sculpted bevels and subtle satin highlights; one-piece pale maple rear neck. Show FOUR closed-gear tuning machines on the rear headstock, in line on viewer's right. No front pickups, bridge, control knobs, strings across body or fingerboard/inlay on the back. Use a discreet flush matching-wood electronics cover on rear lower left; provisional heel, no bolt plate, no screws or asserted joint pattern. No fretboard visible.
High quality realistic luthier product render, crisp wood texture and clean edges, gentle studio illumination. Entire instrument from head tip to bottom strap button must fit, with 5% vertical margin, centered, no close-up. Portrait canvas 1024x1536 or larger. True TRANSPARENT background, no floor, no wall, no stand, no text, no logo or watermark, no cast shadow outside the object. Only one instrument. Rear concept needs neutral light wood to support later digital finish tinting.

REVISION — used in the application:
Use case: precise-object-edit. Edit target: the existing EDDA rear concept. Correct ONLY the neck attachment and background.
This instrument is BOLT-ON, never neck-through and never set-neck. Show a clear detachable neck ending at the upper body heel with a narrow physical seam, a distinct sculpted body heel, and five small recessed metal bolt ferrules in the body heel (illustrative placement, not a manufacturing template). The light maple neck MUST STOP at that seam. The body below is uninterrupted alder wood, with no neck strips or maple core running through the body.
Keep the exact existing EDDA outer silhouette, headstock, FOUR tuning machines, body proportions, full-length upright framing and existing electronics cover. Keep crisp natural grain and dimensional lighting.
Remove ALL the brown glow/halo/background: alpha must be fully transparent everywhere outside the instrument, with a clean sharp cutout. No visible background, no vignette, no floor shadow. No text or logo. Portrait 1024x1536.
```

