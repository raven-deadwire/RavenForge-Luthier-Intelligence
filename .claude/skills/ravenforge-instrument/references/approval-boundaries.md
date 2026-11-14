# 상태값과 표기

## `rf_status` 정의

| 값 | 뜻 | 요구 사항 |
|---|---|---|
| `drawing` | 원본 도면의 벡터 경로에서 가져온 형상 | `rf_source`에 파일명과 경로 인덱스, `rf_source_sha256` 필수 |
| `spec` | 공개된 사양 수치나 제조사 공식 도면 치수로 만든 형상 | `rf_source`에 문서 경로 또는 URL |
| `illustrative` | 근거가 부족해 그럴듯하게 만든 형상 | `rf_note`에 무엇을 가정했는지 |
| `pending` | 미확정·미승인. 자리 표시만 | 디테일 금지. 단순 블록이거나 생략 |

한 오브젝트 안에 등급이 섞이면 낮은 쪽으로 기록한다. 예: 윤곽은 도면이지만 컨투어를 추정한 바디는 `illustrative`이고, `rf_note`에 "윤곽 drawing, 컨투어 추정"이라고 적는다.

## 레포에서 미승인으로 남아 있는 항목

2026-10-20 감사 기록 기준이다. 작업 전에 `docs/CONFIGURATOR_DRAWING_AUDIT.md`와 `docs/CONFIGURATOR_PARTS.md`의 최신 내용을 다시 확인한다.

- ASKR·EMBLA 후면: 넥 포켓 깊이, 공구 경로, 릴리프 단면
- GRAMR: 볼트 좌표, 딥 테넌, 최종 힐 형상
- ASKR 브리지: 커스텀 팬 브리지 형상
- ETS Custom: 폭과 현 간격 (시각적 추정뿐)
- Schaller 3D-5: 악기상의 위치, 높이, 반경, 드릴링
- 3 / 4 / 6 노브 배치와 추가 스위치: 설치 예시일 뿐
- "ironwood" 등 정확한 수종이 확정되지 않은 목재

## 산출물 표기 문구

렌더 이미지에는 캡션이나 메타데이터로, GLB에는 `asset.extras`로 넣는다.

| 산출물 | ko | en | de |
|---|---|---|---|
| 컨셉·제품 렌더 | 컨셉 시각화입니다. 제작 전 CAD 검증과 하드웨어 실측에 따라 세부 사양이 달라질 수 있습니다. | Concept visualization. Details remain subject to CAD validation and measured hardware clearances before construction. | Konzeptvisualisierung. Details können sich nach CAD-Prüfung und Hardwarevermessung vor dem Bau ändern. |
| 목재·마감 | 도해용 표면입니다. 실제 판재와 수종을 보증하지 않습니다. | Illustrative surface. Not a photograph of stock and not a species certification. | Illustrative Oberfläche. Kein Foto des Materials und kein Artnachweis. |
| 연구 도해 | 설명을 위한 도식이며 측정 결과가 아닙니다. | Explanatory diagram, not a measurement result. | Erläuternde Darstellung, kein Messergebnis. |

문구는 레포의 기존 표현을 따랐다. 사이트 문구가 바뀌면 여기를 맞춘다.

## 금지 표현

"최종", "확정 사양", "제작 도면", "승인됨", "실측"을 렌더·도해 설명에 쓰지 않는다. 실제로 승인된 항목이 생기면 사용자가 이 문서의 미승인 목록에서 지운 뒤에만 표현을 바꾼다.

## 제3자 자료

- 제조사 로고, 각인, 사진, PDF, 3D 파일을 `.blend`·렌더·GLB에 넣지 않는다.
- 하드웨어는 공식 도면의 외곽 치수로 만든 단순 형상이다. 특정 제품으로 식별될 만한 세부는 사양 표기 텍스트로 전달하고 형상으로 복제하지 않는다.
- 목재 텍스처에 공급사 사진의 픽셀을 쓰지 않는다.
