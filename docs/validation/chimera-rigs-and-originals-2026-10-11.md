# Chimera Rigs and original-amp product presentation — 2026-10-11

The owner reported that AMP/RIGS images and explanation had disappeared from the homepage, requested matching Niflheimr/Náströnd descriptions, and asked to remove redundant cabinet and IR implementation details.

## Cause and repair

The post-release commit `7cfdc9761ba87c134bc6c1ec367f10698e21f574` replaced the former Matrix hero with a CAB image because the old screenshot showed commercial-reference names. The three short mode cards survived, but the page no longer showed AMP/RIGS itself.

A dedicated `#chimera-rigs` section now sits directly below the hero. It contains actual Classic, Dual Crossover and Matrix interface captures and explains modes, independent amp/channel controls, LOW DI/AMP+CAB blending and the 48 presets in English, Korean and German.

Niflheimr and Náströnd now share an introduction, head artwork, five channel descriptions, controls, five signature presets and a manual link. Channel character and instrument roles remain distinct. Niflheimr's signature presets are correctly described as Classic configurations.

The public CAB/IR copy omits driver-count tautologies, the imported 8×10/modelled 6×10 distinction, image-provenance explanations, zero-level horn regression detail and view-switch implementation behavior. The descriptions focus on cabinet, speaker, tweeter, microphone and IR choices.

## Screenshot provenance

`assets/chimera/rigs-screens-beta13-provenance.json` records all three image hashes, presets, capture settings, the reproduction harness and production-object equivalence to release source `7f692693f942a0f1dd1973062dc4d5d47b9be4ac`.

These are unedited Linux offscreen JUCE component captures of the actual 1.3 editor. Source, Assets and CMakeLists Git objects match the released product. They are not Windows desktop screenshots, and the incidental CPU display is not performance evidence. Captures contain the released controls and SpectralForge Original amp labels.

## Verification scope

The content inventory requires the Rigs section, mode explanations and all three screenshots, plus complete matching original-amp sections in all three languages. A negative regression test removes required sections/elements in 24 cases. Existing release-source, download, language, count and image checks remain in force.

Local visual inspection covered the three actual interface captures. Browser visual QA was unavailable in this session; DOM structure, translations, source image dimensions and responsive CSS are checked separately.
