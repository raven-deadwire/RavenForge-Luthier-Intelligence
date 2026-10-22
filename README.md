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

RavenForge 악기 설계·연구·프로토타입 포트폴리오 사이트입니다. 홈페이지는 `index.html` 한 파일로 된 단일 페이지이며, 영어/독일어/한국어를 지원합니다(`?lang=ko`로 한국어 링크 공유 가능). 연구 문서는 `research/`, 이미지와 스크립트는 `assets/`, 빌드·테스트 도구는 `tools/`에 있습니다. Tailwind CSS와 최적화 이미지 같은 생성 파일은 GitHub Actions가 `main`에서 자동으로 다시 만듭니다.
