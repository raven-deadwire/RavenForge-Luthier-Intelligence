# PR #84 — My Works / Instrument Repairs review

Review date: 2026-11-05 (KST). Prepared without GitHub writes. The user subsequently approved committing and pushing this proposal to PR #84; merging and deployment are outside that approval.

## Baseline and already completed work

PR: https://github.com/raven-deadwire/RavenForge-Luthier-Intelligence/pull/84

The PR was open and mergeable at the final metadata check. The initial inspected commit was `2b4e089bf912eff8c7e1afae47ae86d3e1ac80ff`; the branch then advanced to `09a2ea2cddf6c8f2b08986f246fc6bb4275d20ca`. The initial proposal was set aside and overlapping fixes were removed. Before publishing the approved proposal, the branch advanced to `2639984704b229a28100a460e5cfe631f8511fbe`, which renames the build to GRAMR and relocates its image paths. The approved changes were reconciled onto **2639984**, preserving that upstream change.

The latest baseline already provides:

- Separate About tabs for My Works and Instrument Repairs, with deep links preserving `about=works` or `about=repairs`.
- Four projects: GRAMR build in progress (seven process photos), workshop design, ASKR R8 modeling, and TYPE 4 / TYPE 6 coursework.
- All 15 original repair photos with descriptions of visible scenes, rather than numbered generic alt text.
- Defensive checks for missing image and popup elements, primary language subtag normalization, localized static portfolio accessibility labels, native photo buttons, Escape dismissal, focus restoration, and Tab containment in the image popup.

All eight original review threads were Outdated but still Unresolved when read. A thread's resolution status is not used as proof of whether the current code is fixed. No resolution was submitted.

## Additional proposal

1. Preserve every existing image, caption and project. Wrap each repair photo in a stable `repair-record-NN` entry with a native disclosure and separate instrument/model, repair work, process and result fields.
2. Leave all four fields as **Not documented / Nicht dokumentiert / 기록 미확인**. State explicitly that 15 photo records do not establish 15 different repair cases. Do not infer model names, ownership, dates, diagnoses, before/after relationships or successful outcomes from photographs.
3. Allow long German compounds and unspaced equipment lists to wrap, and allow flex/grid children to shrink. Remove the Research card excerpt's three-line clamp so the supplied text remains readable.
4. Localize the image dialog and Close control in static German/Korean pages and at runtime. Ignore unknown image label keys and empty image URLs rather than generating `undefined` labels or opening an empty source.
5. Add a reproducible Chromium regression and layout test. Do not repeat the baseline's missing-image/popup, regional-language or keyboard fixes.

## JavaScript reproduction

On the original `2b4e089`, removing an image element from a portfolio button reproduced `Cannot set properties of null (setting 'alt')`; initialization stopped before showing the toolbar.

The second review's proposed `undefined === undefined` path did **not** reproduce, including a missing popup together with an empty `data-works-image` attribute. The selector requires the attribute to exist, whose empty value is `''`, not `undefined`. The latest baseline nevertheless already checks `popupImage && matchingButton`.

The latest unmodified `09a2ea2` passed 11 malformed-DOM/regional-language scenarios without JavaScript exceptions. The candidate additionally tests unknown-label output and empty-URL activation behavior.

## Validation scope and execution

Command with a normal Playwright Chromium installation:

```sh
node tools/test_works_portfolio.cjs
node tools/build_language_pages.cjs --check
node tools/prefill_lang_keys.cjs --check
node --check assets/works-portfolio.js
node --check tools/test_works_portfolio.cjs
git -c core.whitespace=cr-at-eol diff --check
```

The optional `WORKS_SOURCE_ROOT` selects an unmodified baseline checkout. `--defensive-only` runs only malformed-DOM/regional-tag cases; `--scenario=missing-img` selects one. `WORKS_QA_DIR` controls the local report/screenshot directory. `WORKS_CHROMIUM_PATH` supports a supplied Chromium executable.

The executed environment used Chromium 153.0.8010.0 from the `@sparticuz/chromium` 153.0.0 registry package because the standard Playwright browser download returned an invalid archive. Noto Sans KR and Roboto fonts (300/400/500/700) were installed from their Fontsource registry packages for representative text rendering. No font or browser dependency files are part of this proposal.

The connected browser could read the deployed website, but could not reach the local candidate server. Candidate evidence therefore comes from the executable repository regression suite, not the deployed page. The deployed My Works was older than the PR; its behavior is not presented as evidence for the candidate.

Coverage:

- English, Korean and German at widths 320, 390, 768 and 1440 CSS pixels, height 900.
- All four project filters: project counts, pressed state and separation from repairs.
- Separate repair tab, deep-link query state, record disclosure, 15 preserved photos, four unknown fields per record, and translated text matching the translation dictionary.
- Image source and alt mapping, keyboard Enter/Space activation, Tab/Shift+Tab containment, Escape closing and focus return.
- Thumbnail image decoding and linked original images, floor plan and actual PDF bytes.
- Nine homepage sections and all About/Prototype subtabs, including visible banner/footer text. The layout audit visits 312 view/viewport/language combinations.
- German/Korean static accessibility labels without JavaScript.
- Eleven missing-element, unknown-label, empty-source and regional-tag scenarios.

Intentional horizontal Prototype rails are not treated as document overflow. Quest's decorative source connectors and process arrows deliberately extend outside their list items; their actual link/strong text is checked separately. These exceptions are documented in the test instead of hiding all overflow globally.

This is a Chromium layout and functional check, not proof for every browser or screen reader. Embedded Configurator iframe internals, every research article, every Analysis detail dialog, every accordion expansion and every possible data/translation state are outside the tested matrix. German/Korean copy was checked for completeness and visible rendering, not certified by a native-language editor.

## Executed results

- Candidate: **25 cases passed**, **312 layout views**, **0 unexpected overflow/clipping views**, **0 JavaScript errors**.
- The 25 cases comprise 12 language/viewport cases, two static-label cases and 11 malformed-DOM/regional-tag cases. Each viewport case contains multiple functional assertions.
- Syntax, English fallback synchronization, generated-page freshness and whitespace checks passed.
- No existing image bytes were changed by this patch.
- GitHub Actions for upstream HEAD `09a2ea2` showed six queued runs when queried. The local results above are not represented as GitHub CI successes.

## Approval boundary

The user approved applying the patch to the existing PR branch `feat/my-works-portfolio-20261105`, after checking that its HEAD still matches the reviewed baseline. No merge or deployment is included in this approval request. If the remote HEAD changes, compare and reconcile before applying the approved patch.
