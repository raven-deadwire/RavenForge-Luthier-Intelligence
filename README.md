# RavenForge Luthier Intelligence

Independent instrument-design, research and prototype portfolio by Raven Cho.

**Site:** https://raven-deadwire.github.io/RavenForge-Luthier-Intelligence/
(English · Deutsch · 한국어 — `?lang=de`, `?lang=ko`)

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Single-page homepage (About, Prototype, Concept Lab, Chimera, Analysis, Quest, Research, Configurator). Sections are switched by URL hash; all three languages live in its `translations` object. |
| `configurator.html` | Instrument configurator (embedded in the homepage, also usable on its own). |
| `research/<ID>/{en,de,ko}.html` | Research essays; `research/research-index.json` lists them. |
| `concepts/` | Concept Lab entries (`meta.json` per concept). |
| `assets/` | Scripts, styles and images. `assets/optimized/` holds the web copies of the root PNGs; `assets/vendor/` holds Chart.js. |
| `tools/` | Build, image and test scripts used by the workflows. |
| `docs/` | Configurator documentation. |

## Operations data

`ops/index.html` (unlisted, `noindex`) charts data collected by
`.github/workflows/ops-data.yml`:

- **Workshop-area outdoor climate**: KMA ASOS daily data via data.go.kr, with the
  wood equilibrium moisture content (EMC) for each day. Outdoor air only; it does
  not replace in-shop hygrometer readings. Secret `DATA_GO_KR_API_KEY` (the
  portal's Decoding key). Location: `ops/config/climate.json` (`station_id`).
- **Search interest**: Naver DataLab search trends for the keyword groups in
  `ops/config/search-trends.json`. Secrets `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`.

Register these as **repository Actions secrets**, not Variables or environment
secrets (the collection job does not select an environment). Do not put key
values in source files, workflow inputs, command arguments, or logs.

Each collector reports `SKIPPED_MISSING_SECRET`, `NO_DATA`, `SUCCESS`,
`API_ERROR`, or `COLLECTOR_ERROR` in the Actions job summary. Empty API results
leave existing files untouched; `SUCCESS` with `changed=false` means valid data
was fetched but was identical. Errors report only HTTP status and allowlisted
codes; response bodies, request URLs and arbitrary exception messages are not
logged. A missing data directory is a normal no-change result, not a git error.

With approved credentials and publication scope, run Actions → Operations data
→ Run workflow on **main** (optionally with a climate backfill date). Other
branches and pull requests run tests only. Afterwards climate is scheduled daily
at 11:23 KST and trends on Mondays at 10:41 KST; GitHub may delay scheduled runs.
If either selected collector fails, the run fails and no data is committed.

After a changed-data push succeeds, a separate job with `pages: write` requests
`POST /repos/{owner}/{repo}/pages/builds`. This is necessary because pushes using
`GITHUB_TOKEN` do not trigger branch-based Pages builds. It rebuilds the **whole
main/root site**, not only `ops/`. `PAGES_BUILD_REQUESTED` is a queued build request,
not proof of deployment: verify the subsequent Pages run and the public JSON's
latest date. No new PAT or Pages source-setting change is required.

**Public access:** the HTML, configuration, collected JSON and repository history
are publicly readable. `noindex, nofollow` requests search exclusion; it provides
no authentication. Keep customer details, costs, inventory and workshop sensor
records out of this public data path. An internal dashboard needs private data
storage and authentication covering both the page and its data endpoints.

Local regression tests (mock APIs and local git remotes only):
`node --test tools/test_ops_data.mjs tools/test_ops_workflow.mjs`.

## Configuration links and KakaoTalk sharing

The configurator's "copy configuration link" button creates a `?cfg=` link that
restores the model, options and finish colour. KakaoTalk sharing appears on Korean
pages once the Kakao app's JavaScript key is set in the `data-kakao-key` attribute
of the `configurator-share.js` script tag in `configurator.html` (register
`https://raven-deadwire.github.io` under the Kakao app's Web platform).

## Generated files

GitHub Actions keeps these up to date on `main`; a pull request fails when a
committed copy is stale.

- `assets/tailwind.css`, `assets/configurator-tailwind.css`, and the English
  fallback text of `[data-lang-key]` elements in `index.html` —
  `.github/workflows/homepage-tailwind.yml`
  (`node tools/prefill_lang_keys.cjs`, `bash tools/build_tailwind_css.sh`).
- Optimized images, research and Concept Lab metadata, the Quest section —
  `.github/workflows/build-research-index.yml`.

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000/
```

---

## 한국어 요약

RavenForge 악기 설계·연구·프로토타입 포트폴리오 사이트입니다. 운영 데이터(서울 외기·목재 평형함수율, 네이버 검색 트렌드)는 `ops/index.html`에서 보며, 지역과 검색어는 `ops/config/`에서 바꿉니다. Configurator의 "구성 링크 복사"와 카카오톡 공유(키 설정 시)로 사양 구성을 공유할 수 있습니다. 홈페이지는 `index.html` 한 파일로 된 단일 페이지이며, 영어/독일어/한국어를 지원합니다(`?lang=ko`로 한국어 링크 공유 가능). 연구 문서는 `research/`, 이미지와 스크립트는 `assets/`, 빌드·테스트 도구는 `tools/`에 있습니다. Tailwind CSS와 최적화 이미지 같은 생성 파일은 GitHub Actions가 `main`에서 자동으로 다시 만듭니다.
