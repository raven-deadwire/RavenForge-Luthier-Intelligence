---
name: ravenforge-instrument
description: RavenForge 전기 기타·베이스(ASKR, EMBLA, EDDA, GRAMR, SKAÐI)를 Blender에서 모델링·룩뎁·렌더·GLB 내보내기 할 때 사용한다. 원본 도면 기반 형상 규칙, mm 단위와 좌표계, 프렛 계산, 출처·승인 상태 기록, 산출물 표기 규칙을 정한다. Use for any RavenForge instrument, guitar, bass, body, neck, fretboard, headstock, pickup, bridge, finish or wood-material task in Blender.
metadata:
  version: "0.1.0-draft"
  domain: blender
  role: specialist
  triggers: RavenForge, 레이븐포지, ASKR, EMBLA, EDDA, GRAMR, SKAÐI, guitar, bass, 기타, 베이스, luthier, fretboard, fanned fret, multiscale, 넥, 바디, 헤드스톡, 픽업, 마감
  related-skills: blender-director, hard-surface, prop-artist, geometry-nodes, materials, texture-workflow, uv-workflow, lookdev, lighting, camera-cinematography, rendering, asset-optimization, export-pipeline, qa-review
---

# RavenForge Instrument

RavenForge 악기를 Blender에서 **시각화**하기 위한 규칙이다. 이 스킬이 다른 blender-skills보다 우선한다. 충돌하면 여기 규칙을 따른다.

## 한 줄 원칙

형상은 도면에서 가져오고, 도면에 없는 것은 지어내지 않으며, 모든 오브젝트에 출처와 승인 상태를 남긴다.

## 이 스킬의 범위

| 한다 | 하지 않는다 |
|---|---|
| 컨셉·프로토타입 렌더, 마감 변형 미리보기 | 가공 데이터(CNC 경로, 드릴 좌표, 포켓 깊이) 생성 |
| 연구 로그용 3D 도해 | 하드웨어 장착 간섭·공차의 최종 판정 |
| 웹 뷰어용 GLB 내보내기 | 실제 목재 수종·재고의 증명 |

Blender는 CAD가 아니다. 여기서 나온 치수는 어떤 것도 제작 승인으로 쓰지 않는다.

## 작업 전 반드시 확인

1. **모델과 리비전** — 어떤 모델의 어떤 도면 리비전인가. 모르면 묻는다.
2. **원본 벡터** — 사용자 소유의 CAD PDF/DXF가 로컬에 있는가. 없으면 형상 작업을 시작하지 않는다. 절차는 `references/geometry-sources.md`.
3. **사양** — `references/model-specs.md`를 읽고, 거기 적힌 레포 파일에서 최신 값을 다시 확인한다. 이 스킬 안의 숫자보다 레포가 우선이다.
4. **산출물 종류** — 렌더 / 도해 / GLB 중 무엇인가. 표기 문구가 달라진다(`references/approval-boundaries.md`).

## 단위와 좌표계

- Blender 단위 1 = 1 m. 표시 단위만 mm로 바꾼다. 도면의 mm 값은 0.001을 곱해 입력한다.
  ```python
  s = bpy.context.scene.unit_settings
  s.system, s.scale_length, s.length_unit = 'METRIC', 1.0, 'MILLIMETERS'
  ```
  실제 크기를 유지해야 조명·피사계 심도·glTF(미터 기준)가 맞는다.
- 원점: 중심선과 너트 앞면(제로 프렛 모델은 제로 프렛)의 교점, 지판 윗면 높이.
- +X: 너트 → 브리지. +Y: 고음현 쪽. +Z: 지판 위쪽(연주면 바깥).
- 왼손 모델은 완성 후 최상위 Empty를 Y축 미러한다. 형상을 따로 만들지 않는다.

> 좌표계는 초안이다. 기존 CAD의 원점 규칙이 다르면 그쪽에 맞춰 이 절을 고친다.

## 오브젝트·컬렉션 규칙

```
RF_<MODEL>                     최상위 컬렉션 (예: RF_GRAMR)
├─ RF_<MODEL>_Source           임포트한 원본 커브. 렌더 제외, 수정 금지
├─ RF_<MODEL>_Body             Body, Top, Pickguard, CavityCovers
├─ RF_<MODEL>_Neck             Neck, Fretboard, Frets, Nut, Headstock
├─ RF_<MODEL>_Hardware         Bridge, Tuners, Knobs, Jack, StrapButtons
├─ RF_<MODEL>_Electronics      Pickups, Switches
└─ RF_<MODEL>_Strings
```

오브젝트 이름은 `RF_<MODEL>_<Part>[_<Index>]` (예: `RF_GRAMR_Tuner_03`).

모든 메시 오브젝트에 커스텀 속성을 넣는다.

| 속성 | 값 |
|---|---|
| `rf_status` | `drawing` / `spec` / `illustrative` / `pending` |
| `rf_source` | 파일명 또는 URL, 도면이면 경로 인덱스까지 |
| `rf_source_sha256` | 원본 파일 해시 (`drawing`일 때 필수) |
| `rf_note` | 추정한 부분, 남은 의문 |

상태의 뜻과 허용 범위는 `references/approval-boundaries.md`에 있다. 속성이 비어 있는 오브젝트가 있으면 작업은 끝난 것이 아니다.

## 워크플로

```
원본 확인 → 벡터 임포트·스케일 검증 → 윤곽 커브 고정
  → 두께 돌출 → 컨투어·카브 → 넥·지판·프렛
  → 하드웨어 블록아웃 → 머티리얼 → 조명·카메라 → 렌더
  → 원본 겹침 검증 → 상태 보고
```

1. **임포트·스케일 검증**: 원본 벡터를 `RF_<MODEL>_Source`에 넣고, 알려진 치수(스케일 길이, 너트 폭)로 배율을 확인하고 어긋나면 맞춘다. 검증 전에는 다음 단계로 가지 않는다.
2. **바디**: 윤곽 커브를 메시로 변환해 사양의 두께만큼 돌출한다. 포어암 베벨·터미 컷 같은 컨투어는 도면에 단면이 없으면 `illustrative`로 만들고 `rf_note`에 적는다.
3. **넥·지판**: 지판 반경은 사양 값을 쓴다. 넥 뒷면 프로파일은 도면 단면이 없으면 `illustrative`.
4. **프렛**: `scripts/fret_math.py`로 계산한 값을 쓴다. 눈대중 배치 금지. 원본 도면의 프렛선과 겹쳐 0.2 mm 이내인지 확인한다.
   - 단일 스케일: `straight_frets(scale_mm, count)`
   - 팬프렛(ASKR): `multiscale_frets(...)`. 수직 프렛 번호, 너트·브리지의 현 간격은 **도면에서 읽는다**. 모르면 프렛을 만들지 말고 묻는다.
5. **하드웨어**: 제조사 공식 도면의 외곽 치수로 단순 형상만 만든다. 로고·각인·제조사 3D 파일은 쓰지 않는다. 치수 출처가 카탈로그 사진뿐이면 `illustrative`.
6. **조인트·내부**: 넥 포켓 깊이, 볼트 좌표, 테넌 형상처럼 감사 문서에 "미승인"으로 남은 부분은 `pending`으로 두고 디테일을 넣지 않는다.

## 머티리얼

- 이름: `RF_MAT_<Material>_<Finish>` (예: `RF_MAT_SwampAsh_InfernoRedGrainFilled`).
- 레포의 `assets/configurator-materials/` 텍스처는 AI 생성 도해용이며 해상도가 낮다(개별 원본 724 × 2172). 정면 미리보기에는 쓸 수 있으나 클로즈업에는 부족하다. 클로즈업은 절차적 나뭇결이나 실제 판재 사진으로 만든다.
- 결 방향은 넥·바디 모두 X축(현 방향)을 따른다. 라미네이트 넥은 사양의 적층 순서대로 Y 방향으로 나눈다.
- 2피스 바디는 중심선에 접합선을 둔다. 북매치 여부는 사양에 명시된 경우에만 표현한다.
- "기타/커스텀 수종" 옵션은 텍스처를 지어내지 않는다. 중립 회색 머티리얼과 `pending`으로 둔다.
- 투명 마감은 클리어코트 + 착색층으로, 불투명 마감은 단색 + 클리어코트로 만든다. 색 값의 출처(컨피규레이터 색상 코드 등)를 머티리얼 커스텀 속성에 남긴다.

## 카메라 세트

모델 간 비교가 되도록 같은 세트를 쓴다. 전부 정사영이 아니라고 명시된 것 외에는 동일 초점거리로 고정한다.

| 이름 | 내용 |
|---|---|
| `RF_CAM_Front_Ortho` | 정면 정사영. 원본 겹침 검증에도 사용 |
| `RF_CAM_Rear_Ortho` | 후면 정사영 |
| `RF_CAM_ThreeQuarter` | 3/4 뷰, 85 mm |
| `RF_CAM_Heel` | 넥 조인트 클로즈업 |
| `RF_CAM_Headstock` | 헤드스톡 클로즈업 |

## 검증

끝내기 전에 전부 확인한다.

- [ ] 스케일 길이를 씬에서 직접 재서 사양과 일치
- [ ] `RF_CAM_Front_Ortho` 렌더를 원본 벡터에 겹쳐 윤곽 일치 확인, 최대 편차를 mm로 기록
- [ ] 프렛 위치가 계산값·도면과 일치
- [ ] 모든 메시에 `rf_status`, `rf_source` 존재
- [ ] `pending` 부위에 지어낸 디테일 없음
- [ ] 제조사 로고·각인 없음
- [ ] 산출물에 표기 문구 포함

## 보고 형식

작업을 마치면 아래 표를 낸다.

```
모델 / 도면 리비전 / 원본 SHA-256
스케일 실측: ___ mm (사양 ___ mm)
윤곽 최대 편차: ___ mm
상태별 오브젝트 수: drawing __ / spec __ / illustrative __ / pending __
illustrative·pending 목록과 사유
```

## MUST / MUST NOT

**MUST**
- 형상 작업 전에 원본 벡터와 리비전을 확인한다
- 추정한 모든 부분을 `rf_note`와 보고서에 적는다
- 사양 값이 문서끼리 다르면 멈추고 묻는다

**MUST NOT**
- 윤곽을 사진·컨셉 이미지에서 따라 그리거나 AI로 생성하지 않는다
- 컨피규레이터의 `configurator-*-geometry.js`를 3D 원본으로 쓰지 않는다 (표시 좌표이며 가공 데이터가 아님)
- 원본 PDF·제조사 도면을 `.blend`나 저장소에 넣어 배포하지 않는다
- 렌더를 "최종 사양"이나 "제작 승인"으로 표현하지 않는다

## Reference Guide

| 주제 | 파일 | 읽을 때 |
|---|---|---|
| 모델 사양과 확인 위치 | `references/model-specs.md` | 항상, 작업 시작 시 |
| 원본 벡터 임포트 | `references/geometry-sources.md` | 형상 작업 전 |
| 상태값과 표기 문구 | `references/approval-boundaries.md` | 속성 기록, 산출물 내보내기 전 |
| 프렛 계산 | `scripts/fret_math.py` | 지판 작업 시 |
| 도면 임포트 (해시 확인, 축척 산출, 커브 생성) | `scripts/import_drawing.py` + `drawings/<model>.json` | 형상 작업 1단계 |
| 임포트 도구 자체 점검 | `scripts/test_import_drawing.py` | 임포트 스크립트를 고친 뒤 |
