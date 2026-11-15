# GRAMR 파일럿 실행 기록

2026-11-14 ~ 15에 Blender 5.3.0 헤드리스(`bpy` 파이썬 모듈, CPU 4코어, GPU 없음)로 GRAMR 한 대를 도면에서 렌더까지 만든 기록이다. 절차는 `pipeline.md`, 수치 원본은 `../drawings/gramr.stageN-report.json`에 있다. 원본 PDF, `.blend`, 렌더 이미지는 저장소에 없다.

## 판정

파일럿 계획에서 정한 세 기준으로 본 결과다.

| 기준 | 결과 |
|---|---|
| 윤곽 최대 편차 0.5 mm 이내 | 통과. 바디 1,935점, 헤드스톡 175점이 모두 0.1 mm 이내 |
| 추정 비중 | 메시 45개 중 44개가 `illustrative`, 1개(픽가드)가 `spec`. 평면 윤곽과 위치는 전부 도면에서 왔지만 도면에 높이 정보가 없어 모든 부품에 가정이 섞였다 |
| 가장 약한 부분 | 넥 조인트. 미승인이라 각진 블록으로 비워 두었고 힐·후면 뷰에서 그대로 드러난다 |

다음에 가장 효과가 큰 일은 측면·단면 도면 확보다. 그것이 있으면 바디 컨투어, 넥 두께와 프로파일, 헤드스톡 단차, 지판 높이가 `illustrative`에서 올라간다.

## 재현 확인

`scripts/run_pipeline.py --compare`로 PDF부터 8단계를 처음부터 다시 돌렸을 때 1~8단계 보고서가 모두 기록과 일치했다(렌더 시간과 미리보기 전용 항목 제외). 미리보기 없이 약 50초가 걸렸다.

## GLB 내보내기 확인

2026-11-15. `scripts/export_glb.py`로 내보내고 `scripts/web_check/check.cjs`로 점검했다. 수치 원본은 `../drawings/gramr.glb-report.json`과 `../drawings/gramr.glb-web-check.json`. GLB 파일 자체는 저장소에 없다.

| 항목 | 값 |
|---|---|
| 파일 크기 | 1,973,816바이트 (압축 없음) |
| 노드 / 메시 / 재질 / 이미지 | 45 / 45 / 11 / 3 |
| 삼각형 | 67,226 |
| 전체 크기 (glTF 축) | 961.16 × 64.10 × 319.48 mm |
| 원본 커브, 카메라, 조명 포함 여부 | 0 / 0 / 0 |
| `rf_status`가 든 노드, 색 출처가 든 재질 | 45 / 45, 11 / 11 |
| 재임포트 후 오브젝트 | 45 / 45, 치수 차이 최대 0.0005 mm, 상태값 변화 없음 |
| Khronos 검증기 2.0.0-dev.3.10 | 오류 0, 경고 0, 정보 5 (`UNUSED_OBJECT`) |
| 브라우저 (헤드리스 Chromium, three.js 0.170) | 로드 성공, 콘솔 오류 0, 크기와 표기 문구 일치 |

처음 내보낸 파일은 4.4 MB에 삼각형 130,556개였고 웹 뷰어에서 픽가드에 잡티가 보였다. `build_hardware.py`가 평판을 만들 때 가는 삼각형을 합치도록 고친 뒤 위 수치가 됐다. 그 수정 후에도 1~8단계 보고서는 기록과 일치했다.

확인하지 않은 것: 실제 사이트의 컨피규레이터에 붙였을 때의 동작, 휴대폰 등 저사양 기기에서의 성능, 압축.

## 마감 변형 전환 확인

2026-11-15. 컨피규레이터의 스테인 10종(`stainNames` / `stainColours`)과 무착색(Natural)을 `KHR_materials_variants`로 넣었다. 기본 재질은 사양인 Inferno red다. 위 표의 파일 수치는 이 확인 전의 것이고, 변형을 넣은 뒤의 값은 아래와 같다.

| 항목 | 값 |
|---|---|
| 파일 크기 | 2,115,992바이트 (변형 없이 1,973,816, +142,176) |
| 재질 / 이미지 | 51 / 3 (재질 +40, 이미지 증가 없음) |
| 변형 | 11개. 변형이 걸린 프리미티브 4개 (바디, 넥의 메이플·웬지·퍼플하트) |
| 분리 검증 (바디, 18,748 텍셀) | "색으로 구운 값"과 "무채색 × 계수"의 차이 0 |
| Khronos 검증기 | 오류 0, 경고 0 |
| three.js 0.169 | 11개 전환, 바디 표본 색이 11가지로 모두 다름, 기본 상태의 색이 "Inferno red" 변형과 같음 |
| Google `<model-viewer>` 4.0.0 | 같은 11개 목록을 읽음, 3개를 골라 전환 확인 |
| 재임포트 | 45 / 45, 치수 차이 최대 0.0005 mm |

변형 11개를 한 장에 모은 스크린샷과 `<model-viewer>` 스크린샷을 눈으로 확인했다. 넥의 적층은 어떤 스테인에서도 구분된다.

가정과 한계: 스테인을 바디와 넥에 똑같이 적용했다. 컨피규레이터는 탑과 백·사이드를 따로 고르므로 실제 선택지의 일부만 표현한 것이다. 하드웨어 색(크롬, 블랙, 구리)은 넣지 않았다. Inferno red 외의 변형은 GRAMR 사양이 아니다. `<model-viewer>`의 기본 환경에서는 유광 평면이 하얗게 보인다.

## 소유자가 확정한 값

| 항목 | 값 | 날짜 |
|---|---|---|
| 스케일 길이 | 648 mm (647.7 mm가 아님) | 2026-11-14 |

컨투어, 넥·지판 높이, 프렛 단면, 하드웨어 크기는 소유자가 "일반적인 값으로 진행"하라고 한 것이며 값 자체를 확인받은 것은 아니다.

## 1단계 실행 기록

2026-11-14, Blender 5.3.0 헤드리스. 수치 전체는 `drawings/gramr.stage1-report.json`.

| 항목 | 값 |
|---|---|
| 프렛 24개의 평균율 편차 (최대) | 0.008 mm |
| 너트 쪽 지판 폭 | 43.09 mm (사양 43.0, 차이 +0.09) |
| 바디 | 459.04 × 319.48 mm |
| 헤드스톡 | 179.65 × 95.50 mm |
| 픽가드 | 282.84 × 221.92 mm |
| 픽업 외곽 (넥 / 브리지) | 37.80 × 69.60 / 38.20 × 70.01 mm |
| 브리지 외곽 | 39.99 × 83.49 mm |
| 윤곽 이음 최대 틈 | 0.049 pt |
| 생성 오브젝트 | 54 (전면 윤곽 7, 후면 바디 윤곽 1, 힐 경계선 1, 프렛 24, 중심점 21) |

## 2단계 실행 기록

2026-11-14. `scripts/build_body.py`로 바디 슬래브를 만들었다. 수치 전체는 `drawings/gramr.stage2-report.json`.

```bash
python scripts/build_body.py --config drawings/gramr.json --blend gramr_stage1.blend --out gramr_stage2.blend --report gramr_stage2.json --preview-dir previews
```

| 항목 | 값 |
|---|---|
| 크기 | 459.06 × 319.48 × 45.000 mm |
| 전면 윤곽과 후면 윤곽의 최대 차이 | 0.015 mm |
| 곡선 분할에 따른 최대 오차 | 0.020 mm |
| 메시 | 닫힌 메시, 중심 접합선(Y = 0)에서 분할 |
| 부피 | 4,658 cm³ (캐비티·컨투어 없는 슬래브 기준) |

넥 포켓 쪽은 이렇게 닫았다.

| 변 | 길이 | 근거 |
|---|---|---|
| X = 392.86 mm의 횡방향 변 | 54.32 mm | 후면 투영의 힐 경계선(경로 5613). 투영선일 뿐이며 힐 가공 형상은 미승인 |
| 고음 쪽 윤곽 끝(X = 428.15)에서 힐 경계선까지 | 35.29 mm | **도면에 없는 직선**. 닫기 위해 추가 |

아직 없는 것: 모서리 라운드, 컨투어, 캐비티, 넥 포켓. 바디 윗면은 임시로 Z = 0에 두었다. 지판이 바디 위로 올라오는 높이를 알기 전까지는 확정하지 않는다.

## 3단계 실행 기록

2026-11-14. `scripts/build_contours.py`로 모서리 라운드, 포어암 베벨, 터미 컷을 넣었다. **쓰인 수치는 전부 일반적인 값이며 도면·사양 근거가 없다.** 값은 `drawings/gramr.json`의 `contours_illustrative`에 있고, 바디의 `rf_status`는 `illustrative`로 내려갔다. 수치 전체는 `drawings/gramr.stage3-report.json`.

```bash
python scripts/build_contours.py --config drawings/gramr.json --blend gramr_stage2.blend --stage2-report gramr_stage2.json --out gramr_stage3.blend --report gramr_stage3.json --preview-dir previews
```

```bash
python scripts/depth_map.py gramr_stage3.blend RF_GRAMR_Body previews/stage3_depth
```

| 요소 | 가정한 값 | 만든 방법 |
|---|---|---|
| 모서리 라운드 | 반경 6 mm, 앞뒤 테두리 | 베벨 6분할. 넥 포켓을 닫은 변은 각진 채로 둠 |
| 포어암 베벨 | 윗면 저음 쪽 꼬리, 힌지선 각도 32°, 폭 90 mm, 테두리에서 깊이 19 mm | 힌지선에서 윗면에 접하는 원통면(반경 222.66 mm) |
| 터미 컷 | 뒷면 저음 쪽, 중심 X = 590 mm, 안쪽으로 75 mm, 길이 220 mm, 테두리에서 깊이 19 mm | 타원체로 파낸 오목면(단면 반경 120 mm) |

| 확인 항목 | 값 |
|---|---|
| 평면 크기 | 459.06 × 319.48 × 45.00 mm (변화 없음) |
| 컨투어가 닿지 않은 중앙부 두께 | 45.000 mm |
| 포어암: 테두리 8 mm 안쪽의 윗면 높이 | −15.652 mm (계산값 −15.649) |
| 터미: 테두리 8 mm 안쪽의 파인 높이 | 19.346 mm (계산값 19.374) |
| 부피 | 4,658.2 → 4,445.9 cm³ (라운드 −22.7, 포어암 −58.2, 터미 −131.4) |
| 메시 | 닫혀 있음 |

남은 한계: 컨투어가 테두리와 만나는 모서리는 라운드 없이 날카롭다. 사양의 "스컬프티드 힐"은 조인트가 미승인이라 만들지 않았다. 캐비티와 넥 포켓도 없다.

## 4단계 실행 기록

2026-11-14. `scripts/build_neck.py`로 지판, 넥, 헤드스톡을 만들고 바디를 지판 기준 높이로 내렸다. 평면 형상은 도면에서, 지판 반경과 적층 순서는 사양에서 왔다. **높이·두께·뒷면 프로파일·헤드스톡 단차·적층 폭은 전부 일반적인 값이다.** 값은 `drawings/gramr.json`의 `neck_illustrative`에 있고, 넥과 지판의 `rf_status`는 `illustrative`다. 수치 전체는 `drawings/gramr.stage4-report.json`.

```bash
python scripts/build_neck.py --config drawings/gramr.json --blend gramr_stage3.blend --stage1-report gramr_stage1.json --out gramr_stage4.blend --report gramr_stage4.json --preview-dir previews
```

| 도면·사양에서 온 값 | |
|---|---|
| 지판 평면 | 길이 494.01 mm, 너트 43.09 mm, 끝 56.01 mm |
| 지판 반경 | 406.4 mm (가장자리 처짐: 너트 0.571 mm, 끝 0.966 mm) |
| 헤드스톡 윤곽 | 도면 그대로. 너트선(43.09 mm)에서 닫음 |
| 넥 적층 순서 | 메이플 / 웬지 / 퍼플하트 / 웬지 / 메이플 |

| 가정한 값 | |
|---|---|
| 지판 두께 (중앙) | 6.0 mm |
| 지판 윗면이 바디 윗면보다 높은 정도 | 9.5 mm |
| 넥 두께 (지판 포함, 중앙) | 너트 20.5 mm → 12프렛 22.5 mm |
| 힐 두께 | 25.4 mm, X = 345 mm부터 각진 블록으로 전환 |
| 넥 뒷면 프로파일 | 지수 2.3의 초타원 (C형에 가까움) |
| 헤드스톡 | 두께 14.5 mm, 앞면이 지판 윗면보다 11.0 mm 아래, 너트 뒤 턱 3.5 mm, 경사 반경 20 mm |
| 적층 폭 | 퍼플하트 10 mm, 웬지 각 3 mm |

| 확인 항목 | 값 |
|---|---|
| 넥 두께 (1프렛 / 12프렛 / 힐) | 20.724 / 22.500 / 25.400 mm |
| 헤드스톡 두께, 앞면 높이 | 14.500 mm, Z = −11.000 mm |
| 바디 높이 범위 | Z = −54.5 ~ −9.5 mm |
| 전체 길이 | 961.16 mm |
| 메시 | 넥·지판 모두 닫혀 있음 |

남은 한계: 넥 포켓을 파지 않아 힐 블록이 바디와 겹친다(조인트는 `pending`). 프렛 홈, 너트, 튜너 구멍, 트러스 로드 접근부가 없다. 헤드스톡 뒷면 모서리는 각져 있다. 재질은 단색 자리 표시다.

## 5단계 실행 기록

2026-11-14. `scripts/build_frets.py`로 프렛 24개를 만들었다. 위치는 도면의 프렛선, 곡률은 사양의 지판 반경, 길이는 도면의 지판 평면을 따른다. **와이어 단면과 끝 베벨은 일반적인 값이다.** 사양에는 크기 등급(Extra Jumbo)과 합금만 있다. 값은 `drawings/gramr.json`의 `fret_illustrative`에 있고 프렛의 `rf_status`는 `illustrative`다. 수치 전체는 `drawings/gramr.stage5-report.json`.

```bash
python scripts/build_frets.py --config drawings/gramr.json --blend gramr_stage4.blend --stage1-report gramr_stage1.json --out gramr_stage5.blend --report gramr_stage5.json --preview-dir previews
```

| 가정한 값 | |
|---|---|
| 크라운 폭 × 높이 | 2.9 × 1.45 mm (반경 1.45 mm의 원호) |
| 끝 베벨 | 수직에서 30° (가로 0.837 mm) |

| 확인 항목 | 값 |
|---|---|
| 개수 | 24 |
| 도면 위치와 평균율 계산값의 최대 차이 | 0.0081 mm |
| 도면 프렛선 길이와 지판 폭의 최대 차이 | 0.08 mm |
| 12프렛 크라운 꼭대기 높이 | Z = 1.450 mm |
| 프렛 길이 (1프렛 / 24프렛) | 43.98 / 55.74 mm |
| 마지막 프렛 뒤 지판 여유 | 8.0 mm |
| 메시 | 24개 모두 닫혀 있음 |

남은 한계: 크라운만 있고 탱과 프렛 홈은 없다. 프렛 끝은 지판 가장자리에서 0.03 mm 안쪽에서 끝난다(끝면이 지판 옆면과 겹쳐 보이지 않게 하려는 처리). 재질은 단색 자리 표시다.

## 6단계 실행 기록

2026-11-14. `scripts/build_hardware.py`로 하드웨어 18개 오브젝트를 만들었다. 위치와 평면 외곽은 도면에서, 픽가드 두께와 너트 폭은 사양에서 왔다. **높이, 단면, 작은 부품은 전부 일반적인 크기의 블록아웃이다.** 제조사 형상·로고·각인은 쓰지 않았다. 값은 `drawings/gramr.json`의 `hardware_illustrative`에 있다. 수치 전체는 `drawings/gramr.stage6-report.json`.

```bash
python scripts/build_hardware.py --config drawings/gramr.json --blend gramr_stage5.blend --stage1-report gramr_stage1.json --out gramr_stage6.blend --report gramr_stage6.json --preview-dir previews
```

| 오브젝트 | 도면·사양에서 온 것 | 가정한 것 | 상태 |
|---|---|---|---|
| 픽가드 | 윤곽(도면), 두께 2.3 mm(사양) | 없음. 3플라이·모서리 베벨·구멍은 생략 | `spec` |
| 너트 | 폭 43.0 mm(사양) | 높이(지판 중앙 위 1.9 mm), 두께 3.5 mm, 줄 홈 없음 | `illustrative` |
| 픽업 2개 | 평면 외곽 | 높이(픽가드 위 5 mm). 보빈·폴피스 없는 블록 | `illustrative` |
| 브리지 | 베이스 플레이트 평면 | 플레이트 두께 3 mm, 바디 위 0.5 mm, 새들 6개(피치 10.8 mm, 높이 9 mm) | `illustrative` |
| 잭 플레이트 | 평면 외곽 | 두께 1.5 mm의 평판, 구멍 위치·크기 | `illustrative` |
| 노브 2개 | 중심 위치 | 지름 19 mm, 높이 16 mm, 골드 마감 | `illustrative` |
| 셀렉터 | 슬롯 선 | 슬롯 폭, 레버 형상과 위치 | `illustrative` |
| 픽가드 나사 13개 | 중심 위치 | 머리 지름 6 mm, 골드 마감 | `illustrative` |
| 튜너 6개 | 포스트 보어 중심 | 와셔, 부싱, 포스트 높이(너트 쪽 3개 10 mm, 먼 쪽 3개 8 mm), 하우징, 축, 버튼 | `illustrative` |

| 확인 항목 | 값 |
|---|---|
| 픽가드 아래 바디 윗면 | 전 구간 Z = −9.5 mm (컨투어와 겹치지 않음) |
| 픽가드 나사 중 픽가드 안에 있는 것 | 13 / 13 |
| 노브·셀렉터·픽업 중심이 픽가드 안에 있는가 | 모두 예 |
| 잭 플레이트 중심이 픽가드 안에 있는가 | 아니오 (픽가드 밖 바디 위, 도면대로) |
| 브리지 외곽의 X 범위 | 637.57 ~ 677.56 mm. 스케일 선 648 mm가 이 안에 있음 |
| 튜너 간격 | 24.06 ~ 24.44 mm |
| 튜너 중심에서 헤드스톡 가장자리까지 | 11.93 ~ 12.53 mm, 버튼은 저음 쪽 가장자리로 향함 |

만들지 않은 것: 현, 스트랩 버튼, 조인트 볼트(`pending`), 트레몰로 암·스터드·스프링·블록, 캐비티와 구멍. 바디에 들어가는 부품은 바디와 겹쳐 있다.

## 7단계 실행 기록

2026-11-15. `scripts/build_materials.py`로 자리 표시 색을 절차적 재질 11개로 바꿨다. 이미지 텍스처는 쓰지 않았다. **색은 컨피규레이터의 표시색이고, 나뭇결 무늬·광택·금속 반응은 가정이다.** 모든 재질에 `rf_status = illustrative`와 색 출처를 넣었다. 값은 `drawings/gramr.json`의 `materials_illustrative`, 수치 전체는 `drawings/gramr.stage7-report.json`.

```bash
python scripts/build_materials.py --config drawings/gramr.json --blend gramr_stage6.blend --out gramr_stage7.blend --report gramr_stage7.json --preview-dir previews
```

| 색 | 값 | 출처 |
|---|---|---|
| Inferno Red 스테인 | `#b3121c` | `assets/configurator-preview.js` `stainColours[0]` |
| 애쉬 / 메이플 / 웬지 / 퍼플하트 / 로즈우드 | `#c5a779` / `#e2c695` / `#493e32` / `#60405f` / `#573c30` | `assets/configurator-materials.js` `catalog` |
| 골드 | `#c9a75c` | `assets/configurator-preview.js` `metals.hw_gold` |
| 니켈실버, 본, 블랙 플라스틱 | `#c8c5ba`, `#e3dcc4`, `#0b0b0b` | 가정 |

| 재질 | 적용 대상 | 비고 |
|---|---|---|
| `RF_MAT_SwampAsh_InfernoRedGrainFilledGloss` | 바디 | 중심 접합선 양쪽이 서로 다른 판재로 보이게 처리. 북매치는 아님 |
| `RF_MAT_HardMaple_InfernoRed`, `RF_MAT_Wenge_InfernoRed`, `RF_MAT_Purpleheart_InfernoRed` | 넥 적층 | 메이플 대비 밝기: 웬지 0.087, 퍼플하트 0.119 |
| `RF_MAT_IndianRosewood_Natural` | 지판 | 착색 없음, 코트 없음 |
| `RF_MAT_Gold` | 하드웨어 11개 오브젝트 | |
| `RF_MAT_NickelSilver` | 프렛 24개 | |
| `RF_MAT_Bone`, `RF_MAT_BlackPlastic_Gloss`, `RF_MAT_BlackPlastic_Matte`, `RF_MAT_Dark` | 너트, 픽가드, 픽업·레버, 구멍 표시 | |

| 확인 항목 | 값 |
|---|---|
| 재질이 없는 오브젝트 | 0 |
| 남은 자리 표시 재질 | 0 |
| 이미지 텍스처 | 0 |

가정으로 남은 것: 넥 뒷면과 헤드스톡 앞면까지 전부 붉게 칠했다(사양은 "넥 마감: 투명 Inferno Red"만 밝힘). 넥의 광택 정도, 3플라이 픽가드의 흰 중간층 생략, 나뭇결의 간격과 흐름. 미리보기는 색이 덜 바래는 Khronos PBR Neutral 표시 방식으로 렌더했다. 금속은 조명에 따라 어둡게 보이며, 이는 8단계에서 다룬다.

## 8단계 실행 기록

2026-11-15. `scripts/build_render.py`로 스튜디오 조명 4개와 카메라 5개를 파일에 저장하고 전부 렌더했다. 조명과 카메라는 보여 주기 위한 선택이며 악기 자체에 대한 정보가 아니다. 값은 `drawings/gramr.json`의 `studio`, 수치 전체는 `drawings/gramr.stage8-report.json`.

```bash
python scripts/build_render.py --config drawings/gramr.json --blend gramr_stage7.blend --out gramr_stage8.blend --report gramr_stage8.json --render-dir renders
```

`--draft`를 붙이면 작고 거친 시험 렌더만 뽑는다. 조명 세기와 구도는 이 방식으로 세 번 조정했다.

| 조명 | 역할 |
|---|---|
| `RF_LIGHT_Overhead` | 넓고 약한 천장. 평평한 금속면이 반사할 대상 |
| `RF_LIGHT_Key` | 주광. 정면 정사영 카메라에 평평한 유광면이 그대로 비치지 않도록 비스듬히 둠 |
| `RF_LIGHT_Fill` | 그림자 완화 |
| `RF_LIGHT_Rim` | 먼 쪽 가장자리 하이라이트 |

| 카메라 | 내용 | 해상도 |
|---|---|---|
| `RF_CAM_Front_Ortho` | 정면 정사영 | 2400 × 900 |
| `RF_CAM_Rear_Ortho` | 후면 정사영 (헤드 왼쪽, 저음 쪽이 위) | 2400 × 900 |
| `RF_CAM_ThreeQuarter` | 3/4 뷰, 85 mm | 2000 × 1250 |
| `RF_CAM_Heel` | 넥 조인트 쪽 근접, 85 mm | 1600 × 1000 |
| `RF_CAM_Headstock` | 헤드스톡 근접, 85 mm | 1600 × 1000 |

렌더마다 캡션 없는 원본과 ko/en/de 표기 문구를 붙인 `_captioned` 사본이 나온다. 정면 정사영에는 도면 원본 윤곽을 겹쳐 그린 `_front_ortho_overlay`도 나온다.

| 최종 점검 (스킬의 보고 형식) | 값 |
|---|---|
| 모델 / 원본 | GRAMR / `RavenForge_Superstrat_24F_ver3_STRICT_R12`, SHA-256 `3edaab84…` |
| 스케일 실측 | 648.01 mm (사양 648.0 mm) |
| 윤곽 점검 (허용 0.1 mm) | 바디 1,935점 중 1,935점, 헤드스톡 175점 중 175점 통과 |
| 상태별 메시 오브젝트 | `drawing` 0 / `spec` 1 / `illustrative` 44 / `pending` 0 |
| 상태나 출처가 빠진 오브젝트 | 0 |
| 만들지 않고 `pending`으로 남긴 것 | 넥 조인트(포켓, 볼트 좌표, 딥 테넌, 스컬프티드 힐), 현, 스트랩 버튼, 캐비티, 트레몰로 내부 |

`drawing` 상태의 메시가 없는 이유: 도면에서 온 것은 평면 윤곽과 위치뿐이고, 모든 부품의 높이 방향에 가정이 섞여 있어 규칙대로 낮은 쪽으로 기록했다. 도면 그대로인 것은 `RF_GRAMR_Source`의 원본 커브 54개다.
