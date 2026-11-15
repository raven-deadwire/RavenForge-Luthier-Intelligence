---
name: ravenforge-instrument
description: RavenForge 전기 기타·베이스(ASKR, EMBLA, EDDA, GRAMR, SKAÐI)를 Blender에서 모델링·룩뎁·렌더·GLB 내보내기 할 때 사용한다. 원본 도면 기반 형상 규칙, mm 단위와 좌표계, 8단계 빌드 스크립트, 출처·승인 상태 기록, 산출물 표기 규칙을 정한다. Use for any RavenForge instrument, guitar, bass, body, neck, fretboard, headstock, pickup, bridge, finish or wood-material task in Blender.
metadata:
  version: "0.2.0"
  domain: blender
  role: specialist
  triggers: RavenForge, 레이븐포지, ASKR, EMBLA, EDDA, GRAMR, SKAÐI, guitar, bass, 기타, 베이스, luthier, fretboard, fanned fret, multiscale, 넥, 바디, 헤드스톡, 픽업, 마감
  related-skills: blender-director, hard-surface, prop-artist, geometry-nodes, materials, texture-workflow, uv-workflow, lookdev, lighting, camera-cinematography, rendering, asset-optimization, export-pipeline, qa-review
---

# RavenForge Instrument

RavenForge 악기를 Blender에서 **시각화**하기 위한 규칙과 도구다. 이 스킬이 다른 blender-skills보다 우선한다. 충돌하면 여기 규칙을 따른다.

GRAMR 한 대를 도면에서 렌더까지 만들어 검증했다(`references/gramr-pilot-log.md`). 다른 모델은 아직 돌려 보지 않았다.

## 한 줄 원칙

형상은 도면에서 가져오고, 도면에 없는 것은 가정임을 밝히고 만들며, 모든 오브젝트에 출처와 승인 상태를 남긴다.

## 이 스킬의 범위

| 한다 | 하지 않는다 |
|---|---|
| 컨셉·프로토타입 렌더, 마감 변형 미리보기 | 가공 데이터(CNC 경로, 드릴 좌표, 포켓 깊이) 생성 |
| 연구 로그용 3D 도해 | 하드웨어 장착 간섭·공차의 최종 판정 |
| 웹 뷰어용 GLB 내보내기 | 실제 목재 수종·재고·색의 증명 |

Blender는 CAD가 아니다. 여기서 나온 치수는 어떤 것도 제작 승인으로 쓰지 않는다.

## 작업 전 반드시 확인

1. **모델과 리비전** — 어떤 모델의 어떤 도면 리비전인가. 모르면 묻는다.
2. **원본 PDF** — 소유자의 CAD PDF가 있는가. 없으면 형상 작업을 시작하지 않는다. 해시로 리비전을 확인한다(`references/geometry-sources.md`).
3. **사양** — `references/model-specs.md`를 읽고, 거기 적힌 레포 파일에서 최신 값을 다시 확인한다. 이 스킬 안의 숫자보다 레포가 우선이다.
4. **도면으로 정해지지 않는 값** — 스케일 길이처럼 검증으로 가려지지 않는 값, 헤드스톡이 평평한지처럼 평면도에 없는 값은 소유자에게 묻는다.
5. **산출물 종류** — 렌더 / 도해 / GLB 중 무엇인가. 표기 문구가 달라진다(`references/approval-boundaries.md`).

## 단위와 좌표계

- Blender 단위 1 = 1 m. 표시 단위만 mm로 바꾼다. 실제 크기를 유지해야 조명·피사계 심도·glTF(미터 기준)가 맞는다.
- 원점: 중심선과 너트 앞면(제로 프렛 모델은 제로 프렛)의 교점. **Z = 0은 지판 윗면 중앙**이다.
- +X: 너트 → 브리지. +Y: 고음현 쪽. +Z: 지판 위쪽.
- 오른손 악기를 정면에서 헤드가 왼쪽에 오게 보면 고음 쪽이 위, 저음 쪽이 아래다.
- 왼손 모델은 완성 후 최상위에서 Y축 미러한다. 형상을 따로 만들지 않는다.

기존 CAD의 원점 규칙은 확인하지 못했다. 다르다는 것을 알게 되면 이 절과 `import_drawing.py`의 변환을 함께 고친다.

## 오브젝트·컬렉션 규칙

```
RF_<MODEL>                     최상위 컬렉션 (예: RF_GRAMR)
├─ RF_<MODEL>_Source           도면에서 온 커브와 중심점 (RF_<MODEL>_SRC_*). 렌더 제외, 수정 금지
├─ RF_<MODEL>_Body             Body, Pickguard
├─ RF_<MODEL>_Neck             Neck, Fretboard, Fret_NN, Nut
├─ RF_<MODEL>_Hardware         Bridge, Tuner_NN, Knob_NN, JackPlate, PickguardScrews
├─ RF_<MODEL>_Electronics      PickupNeck, PickupBridge, Selector*
└─ RF_<MODEL>_Studio           RF_CAM_*, RF_LIGHT_*, RF_STUDIO_*
```

- 오브젝트: `RF_<MODEL>_<Part>[_<NN>]`. 재질: `RF_MAT_<Material>[_<Finish>]`.
- 튜너와 프렛은 너트에서 가까운 것부터 번호를 매긴다.

모든 메시 오브젝트에 커스텀 속성을 넣는다. 재질에는 `rf_status`, `rf_colour_source`, `rf_note`를 넣는다.

| 속성 | 값 |
|---|---|
| `rf_status` | `drawing` / `spec` / `illustrative` / `pending` |
| `rf_source` | 파일명 또는 URL, 도면이면 경로 인덱스까지 |
| `rf_source_sha256` | 원본 도면 파일 해시 |
| `rf_note` | 무엇이 도면에서 왔고 무엇을 가정했는지, 만들지 않은 것 |

한 오브젝트에 등급이 섞이면 낮은 쪽으로 적는다. 평면도에는 높이 정보가 없어서 대부분의 부품이 `illustrative`가 된다. 이는 정상이며, 숨기지 않는다. 상태의 뜻은 `references/approval-boundaries.md`에 있다.

## 워크플로

8단계 스크립트로 만든다. 각 단계가 무엇을 도면에서 가져오고 무엇을 가정하는지는 `references/pipeline.md`에 있다.

```
1 임포트 → 2 바디 → 3 컨투어 → 4 넥·지판 → 5 프렛 → 6 하드웨어 → 7 머티리얼 → 8 렌더
```

```bash
python scripts/run_pipeline.py --config drawings/gramr.json --pdf SOURCE.pdf --workdir out
```

단계마다 지킬 것:

1. 보고서 수치를 읽는다.
2. **렌더나 깊이 지도를 직접 열어 본다.** 수치가 통과해도 그림이 틀린 경우가 있었다(`references/pitfalls.md`).
3. 가정한 값을 도면·사양에서 온 값과 나눠 사용자에게 보여 준다.
4. 가정값은 스크립트가 아니라 `drawings/<model>.json`의 `*_illustrative`에 둔다.

다루는 원칙:

- **프렛**: 도면의 프렛선 위치를 쓰고 `scripts/fret_math.py` 계산값과 비교한다. 눈대중 배치 금지. 팬프렛(ASKR)은 수직 프렛 번호와 현 간격을 도면에서 읽는다. 모르면 만들지 말고 묻는다.
- **하드웨어**: 단순 블록아웃만 만든다. 제조사 형상·로고·각인·3D 파일은 쓰지 않는다.
- **조인트·내부**: 넥 포켓, 볼트 좌표, 테넌, 캐비티처럼 감사 문서에 "미승인"으로 남은 것은 모델링하지 않고 보고서의 미제작 목록에 적는다.
- **닫는 변**: 도면에 없는 선으로 윤곽을 닫았으면 그 변을 보고서와 `rf_note`에 적는다.

## 머티리얼

- 색은 컨피규레이터의 표시색을 쓴다. 스테인은 `assets/configurator-preview.js`의 `stainColours`, 목재는 `assets/configurator-materials.js`의 `catalog`, 금속은 `assets/configurator-preview.js`의 `metals`다. 사이트 스스로 "색 견본이 아님"이라고 밝힌 값이므로 재질에도 같은 단서를 붙인다.
- 나뭇결은 절차적 무늬로 만든다. 레포의 `assets/configurator-materials/` 텍스처는 AI 생성 도해용이고 해상도가 낮아(개별 원본 724 × 2172) 3D에는 쓰지 않는다.
- 결 방향은 넥·바디 모두 X축을 따른다. 라미네이트 넥은 사양의 적층 순서대로 Y 방향으로 나눈다.
- 착색 목재는 스테인 색에 "그 목재가 가장 밝은 목재에 비해 얼마나 밝은가"를 곱한다. 그래야 짙은 마감 아래에서도 적층이 구분된다.
- 2피스 바디는 중심선에 접합선을 두고 양쪽을 다른 판재로 보이게 한다. 북매치는 사양에 명시된 경우에만 표현한다.
- "기타/커스텀 수종" 옵션은 무늬를 지어내지 않는다. 중립 회색 재질로 두고 `pending`이라 적는다.

## 카메라와 조명

모델 간 비교가 되도록 같은 세트를 쓴다. 값은 `drawings/<model>.json`의 `studio`에 두고 `scripts/build_render.py`가 만든다.

| 이름 | 내용 |
|---|---|
| `RF_CAM_Front_Ortho` | 정면 정사영. 헤드 왼쪽, 고음 쪽이 위. 원본 겹침 검증에도 사용 |
| `RF_CAM_Rear_Ortho` | 후면 정사영. 헤드 왼쪽, 저음 쪽이 위 |
| `RF_CAM_ThreeQuarter` | 3/4 뷰, 85 mm |
| `RF_CAM_Heel` | 넥 조인트 쪽 근접, 85 mm |
| `RF_CAM_Headstock` | 헤드스톡 근접, 85 mm |

조명은 넓고 약한 천장, 비스듬한 주광, 보조광, 가장자리 광 네 개다. 뒤에서 보는 카메라는 조명을 악기 뒤쪽으로 대칭 이동해 쓴다. 조인트가 `pending`인 동안 `Heel`과 `Rear_Ortho`는 내부 확인용으로만 쓴다.

## 검증

`build_render.py`의 보고서가 아래를 모은다. 끝내기 전에 전부 확인한다.

- [ ] 스케일 길이를 씬에서 재서 사양과 일치
- [ ] 원본 윤곽의 표본점이 모두 만든 실루엣의 0.1 mm 이내 (바디, 헤드스톡)
- [ ] 정면 정사영에 원본 선을 겹친 이미지를 눈으로 확인
- [ ] 프렛 위치가 계산값·도면과 일치
- [ ] 모든 메시에 `rf_status`, `rf_source` 존재
- [ ] 미승인 부위에 지어낸 디테일 없음
- [ ] 제조사 로고·각인 없음
- [ ] 산출물에 표기 문구 포함 (`_captioned` 사본)
- [ ] `run_pipeline.py --compare`로 기록과 일치하거나, 달라진 이유를 설명할 수 있음
- [ ] GLB를 내보냈다면: 검증기 오류 0, 재임포트 치수 일치, 원본 커브·카메라·조명 미포함, 브라우저 스크린샷 확인
- [ ] 마감 변형을 넣었다면: 분리 검증 통과, 두 뷰어가 같은 목록을 읽고 전환, 변형 모음 스크린샷 확인

## 보고 형식

작업을 마치면 아래를 낸다.

```
모델 / 도면 리비전 / 원본 SHA-256
스케일 실측: ___ mm (사양 ___ mm)
윤곽 점검: 표본 ___점 중 ___점이 0.1 mm 이내
상태별 메시 오브젝트: drawing __ / spec __ / illustrative __ / pending __
가정한 값의 목록 (설정의 *_illustrative)
만들지 않은 것과 사유
```

## MUST / MUST NOT

**MUST**
- 형상 작업 전에 원본 PDF의 해시로 리비전을 확인한다
- 가정한 모든 값을 설정 파일, `rf_note`, 보고서에 적는다
- 사양 값이 문서끼리 다르거나 도면으로 정해지지 않으면 멈추고 묻는다
- 단계마다 렌더를 직접 열어 본다

**MUST NOT**
- 윤곽을 사진·컨셉 이미지에서 따라 그리거나 AI로 생성하지 않는다
- 컨피규레이터의 `configurator-*-geometry.js`를 3D 원본으로 쓰지 않는다 (표시 좌표이며 가공 데이터가 아님)
- 원본 PDF, `.blend`, 제조사 도면을 저장소에 넣지 않는다 (`.blend`의 원본 커브가 곧 도면이다)
- 렌더를 "최종 사양"이나 "제작 승인"으로, 색을 "색 견본"으로 표현하지 않는다

## Reference Guide

| 주제 | 파일 | 읽을 때 |
|---|---|---|
| 모델 사양과 확인 위치 | `references/model-specs.md` | 항상, 작업 시작 시 |
| 원본 도면, 임포트 절차, 새 모델 추가 | `references/geometry-sources.md` | 형상 작업 전 |
| 8단계의 근거·가정·실행법, 설정 파일 구조 | `references/pipeline.md` | 스크립트를 돌리거나 고칠 때 |
| 상태값과 표기 문구 | `references/approval-boundaries.md` | 속성 기록, 산출물 내보내기 전 |
| 실제로 겪은 문제와 대응 | `references/pitfalls.md` | 결과가 이상할 때, 새 단계를 만들 때 |
| GRAMR 실행 기록과 판정 | `references/gramr-pilot-log.md` | GRAMR을 다시 만들거나 수치를 비교할 때 |

| 스크립트 | 하는 일 |
|---|---|
| `scripts/run_pipeline.py` | 1~8단계를 순서대로 실행, 기록과 비교 |
| `scripts/import_drawing.py` | 1단계: 해시 확인, 축척 산출, 원본 커브 생성 |
| `scripts/build_body.py` | 2단계: 윤곽 닫기, 두께 돌출 |
| `scripts/build_contours.py` | 3단계: 모서리 라운드, 포어암 베벨, 터미 컷 |
| `scripts/build_neck.py` | 4단계: 지판, 넥, 헤드스톡, 적층 |
| `scripts/build_frets.py` | 5단계: 프렛 |
| `scripts/build_hardware.py` | 6단계: 하드웨어 블록아웃 |
| `scripts/build_materials.py` | 7단계: 절차적 재질 |
| `scripts/build_render.py` | 8단계: 조명, 카메라, 렌더, 캡션, 최종 점검 |
| `scripts/export_glb.py` | GLB 내보내기: 나뭇결 베이크, 마감 변형, 상태·출처를 extras로, 파일 점검과 재임포트 비교 |
| `scripts/web_check/check.cjs` | GLB를 Khronos 검증기와 브라우저(three.js, model-viewer)로 점검, 마감 전환, 스크린샷 |
| `scripts/depth_map.py` | 윗면·뒷면 깊이 지도 (컨투어 확인용) |
| `scripts/fret_math.py` | 평균율 프렛 위치 계산 |
| `scripts/test_import_drawing.py` | 합성 도면으로 임포터 점검 |
