# Chimera 1.3 website publication review

## Decision at 2026-10-10 22:49 KST

Keep [website PR #19](https://github.com/raven-deadwire/RavenForge-Luthier-Intelligence/pull/19)
in Draft. Do not merge or deploy the 1.3 page yet.

- Both the anonymous release API and the tag API return **404** for `v1.3.0-beta.1`.
  There is no public 1.3 source SHA or published 1.3 asset inventory to approve.
- The audited [Chimera PR #39](https://github.com/raven-deadwire/SpectralForge-Chimera-Amp-Matrix/pull/39)
  candidate is `aaa1330dd5cf7d51faf1c45a7cef633b9b118458`. This is a candidate,
  not the published source. Its release policy still says `release_approved=false`.
- The live website serves 1.2. Its three installer links, release page,
  installation guide and third-party notices all returned HTTP 200 anonymously.
- Public tag `v1.2.0-beta.1` resolves to
  `d93560445c78552768a0ed592e5ec62c3c648fb6`. Website main remains
  `885a6ddac7b7a439b3e03bc5c239f57e9056b44e`.

Machine-readable observations are in `chimera-release-2026-10-10.json`.

## Prepared public routes

The following filenames are checked against the 1.3 publisher's five-package
contract and source documentation. They are **expected routes, not available
downloads** until the public contract passes.

Base: `https://github.com/raven-deadwire/SpectralForge-Chimera-Amp-Matrix/releases/download/v1.3.0-beta.1/`

| Purpose | Filename appended to base |
| --- | --- |
| Windows x64 installer | `SpectralForge-Chimera-1.3.0-beta.1-win64-Setup.exe` |
| Windows portable | `SpectralForge-Chimera-1.3.0-beta.1-win64.zip` |
| macOS Intel / Apple Silicon installer | `SpectralForge-Chimera-1.3.0-beta.1-macos-universal.pkg` |
| Linux x86_64 installer | `SpectralForge-Chimera-1.3.0-beta.1-linux-x86_64.deb` |
| Linux archive | `SpectralForge-Chimera-1.3.0-beta.1-linux-x86_64.tar.gz` |
| Release notes | `OPEN_BETA_RELEASE_NOTES.md` |
| Installation guide | `INSTALLATION.md` |
| Downloadable manual | `MANUAL.html` |
| Third-party licenses / attribution | `THIRD_PARTY_NOTICES.md` |
| Product copyright notice | `COPYRIGHT.txt` |
| Binary checksums | `SHA256SUMS.txt` |
| Build/source provenance | `candidate-source.json` |
| Platform update mapping | `update-beta.json` |

The release page must be
`https://github.com/raven-deadwire/SpectralForge-Chimera-Amp-Matrix/releases/tag/v1.3.0-beta.1`.
There are 11 customer-facing asset links plus two provenance documents.
Copyright and third-party notices are distinct; no separate product-license
asset has been invented.

## Content and image review

| Claim | Audited source |
| --- | --- |
| 25 selectable amps | `Source/AmpCatalog.h`: 26 stored identities, retired Ironball excluded |
| 48 presets | 34 Factory/Bass Signature + 4 Guitar Signature + 5 Náströnd + 5 Niflheimr |
| 39 PRE / 21 POST | All three rendered manuals contain 39 / 21 model cards |
| 14 speakers | `Source/CabExpansionModel.h`: 8 guitar / 6 bass |
| 20 microphones | Same catalog: 9 dynamic / 3 ribbon / 8 condenser |
| 9 cabinet layouts | `Source/CabLayoutModel.h`: guitar 112/212/412; bass 115/210/410/610/112/212 |
| Factory OUTPUT starts at 0 dB | `Source/FactoryPresetLevels.h`: 48 explicit unity values |
| View switching preserves sound | `Source/CabPanel.h::setView`; IR selection changes only the selected mic source |
| Generic IR illustrations are examples | `Source/CapturedCabArt.h`, `Source/CabPanel.h` |

The website and web manual now distinguish metadata illustrations from photos
or records of a recording session in EN/KO/DE. Illustrations do not establish
capture provenance or change IR audio. The two added artwork examples come
from `Assets/Artwork/Cab/cab-guitar-412.png` and `mic-chimera-strike.png` in the
audited candidate. They are labelled as illustrations, not screenshots.

Every remote image in the homepage/manual (87 unique files) is pinned to the
full audited SHA and listed by Git blob hash in `assets/chimera-release.json`.
The public check requires those same bytes in the actual release's source
tree, then checks the image URL and bytes. This prevents candidate artwork
from silently being represented as final 1.3 artwork if the final source changes.
Existing local Matrix/PRE/POST screenshots are explicitly labelled Open Beta 1.1.

The web manual corrects stale preset-specific OUTPUT wording in all three
languages and clarifies the CABINET/IR LOADER views. Tone EQ / Final EQ, FFT,
signal-path navigation and controls directly on amp-head artwork are explicitly
outside 1.3.0. The 43–46 ms Transpose limitation and unsigned beta status remain.

## Validation and publication sequence

Install the same content-test dependency used by CI:

```sh
npm install --no-save --no-package-lock --no-audit --no-fund jsdom@24
python -m unittest discover -s tools -p test_chimera_release.py -v
python tools/verify_chimera_release.py --offline
python tools/verify_chimera_release.py --report validation/chimera-public.json
```

- Fifteen tests pass, including synthetic complete/annotated-tag provenance,
  public 404, draft release, source mismatch, missing/duplicate packages,
  tampered documents/images, missing language and stale content checks.
- DOM execution verifies all three languages, model/preset counts and local
  references. This is a content test, not a visual browser or DAW test.
- The real public check returns `BLOCKED`, exit 1, for the missing release.
  `OFFLINE_PASS` always retains `public_verified=false`.
- CI has separate content and public-release jobs. Draft status does not skip
  the public check; no failure is converted to success. The workflow does not
  publish or merge anything and does not change repository branch-protection
  settings. Keep this PR in Draft until both checks pass for the final head.

Before merging, review the **actual final** tag/source again, update the source,
document and artwork locks after that review, and re-run the public check.
It resolves annotated tags; verifies public release state, approved source policy
and source/run identity; compares the exact URLs, sizes and GitHub SHA-256
digests with the checksum and update manifests; checks all documents and images.
Installer binaries receive a public HEAD/size check and digest-metadata comparison;
this website check does not re-download or execute complete installers.

Two upstream document issues must also be resolved before publication:

1. Candidate release notes still say release preparation. The public check
   rejects those as final notes.
2. The candidate's downloadable manual still uses `main` for artwork and has
   stale preset-output wording. Its final artwork base must use the release tag
   or source SHA; the public check rejects a mutable base. Apply the three
   preset-output corrections from this web manual when finalizing the packaged
   manual. Website changes do not edit the concurrent Chimera source PR.

After the public check passes, finish PR #19, merge the reviewed head, wait for
the existing website deployment, and check the live page plus all three installer
links again. A passing offline job or older successful product build is insufficient.
