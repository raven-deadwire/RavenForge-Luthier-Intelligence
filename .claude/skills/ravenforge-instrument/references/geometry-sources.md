# 형상 원본과 임포트

## 원본 등급

| 순위 | 원본 | 사용 |
|---|---|---|
| 1 | 사용자 소유 CAD의 DXF 내보내기 | 가장 좋음. 단위가 보존된다 |
| 2 | 사용자 소유 CAD PDF의 벡터 경로 | 사용 가능. 회전·축척 보정 필요 |
| 3 | 레포의 `configurator-*-reference.svg` | **겹침 검증용으로만**. 3D 원본으로 쓰지 않는다 |
| 금지 | 컨셉 PNG, 사진, AI 생성 이미지에서 따라 그린 윤곽 | 사용하지 않는다 |

레포에 기록된 원본 PDF (배포되지 않음, 사용자 로컬에만 있음):

| 모델 | 파일 | SHA-256 |
|---|---|---|
| ASKR #001 | `RavenForge_ASKR_MS5001_john0-Model(1).pdf` | `94962ee6ea46a1d87c35910537aea98d13adfd9a2ea47c372ae1cbc9b89b6fc5` |
| EMBLA #002 | `RavenForge_EMBLA_002_LYW_34_5ST-Model.pdf` | `b5953882c1c5018d5eede0fa73f8e16dfd113e772de44f0629dd7614e82aaef5` |
| GRAMR | `RavenForge_Superstrat_24F_ver3_STRICT_R12-Model(1).pdf` | `3edaab849e644ba2c1aa2e28abdbed9c92a246cb7a3ca5591da152d22c609b1d` |

EDDA는 벡터 도면이 레포 기록에 없다. 전면은 후면 컨셉 경로의 미러로 만들어졌다. 도면을 받기 전에는 EDDA 바디를 `illustrative`로만 만든다.

## 절차

1. **해시 확인**: 받은 파일의 SHA-256을 위 표와 비교한다. 다르면 다른 리비전이다. 멈추고 사용자에게 알린다.
   ```python
   import hashlib, pathlib
   hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
   ```
2. **벡터 추출**:
   - DXF가 있으면 그대로 임포트한다. Blender 버전에 따라 DXF 임포터는 확장으로 따로 설치해야 한다.
   - PDF뿐이면 SVG로 바꾼 뒤 임포트한다. 레포의 `tools/extract_*_geometry.py`가 PyMuPDF로 경로를 읽고 페이지 회전을 적용하는 방식을 이미 쓰고 있으니 같은 경로 인덱스를 재사용한다.
3. **임포트**: 결과 커브를 `RF_<MODEL>_Source` 컬렉션에 넣고 렌더에서 제외한다. 이 커브는 수정하지 않는다. 작업은 복제본에서 한다.
4. **배율 검증**: mm 단위가 명시된 SVG는 실제 크기로 들어온다(Blender 5.3.0에서 100 mm × 50 mm SVG로 확인). 그래도 PDF에서 뽑은 SVG는 단위가 포인트이고 도면 자체에 출력 축척이 걸려 있을 수 있으므로 검증은 생략하지 않는다. 도면에서 값이 확실한 두 점(너트 ~ 12프렛 = 스케일의 절반, 또는 너트 폭) 사이를 재서 실제 값과 비교하고, 어긋나면 배율을 구해 전체에 적용한다. 서로 다른 두 치수로 교차 확인해 오차가 0.2 mm를 넘으면 진행하지 않는다.
5. **정렬**: 중심선을 X축에, 너트 앞면(또는 제로 프렛)을 원점에 맞춘다.
6. **기록**: 복제해 만든 각 메시에 `rf_status = drawing`, `rf_source`(파일명 + 경로 인덱스), `rf_source_sha256`을 넣는다.

## 자동화 스크립트

위 1~6단계는 `scripts/import_drawing.py`가 한 번에 수행한다. `bpy`와 `pymupdf`가 설치된 파이썬으로 실행한다.

```bash
python scripts/import_drawing.py --config drawings/gramr.json --pdf SOURCE.pdf
```

```bash
python scripts/import_drawing.py --config drawings/gramr.json --pdf SOURCE.pdf --scale-mm 648 --out gramr_stage1.blend --report gramr_stage1.json
```

- 첫 번째 형태는 측정만 한다. 프렛선을 평균율에 맞춰 너트 위치와 도면상의 스케일 길이를 구하고, 너트 폭으로 역산한 스케일 길이를 알려 준다.
- 두 번째 형태는 지정한 스케일 길이로 축척을 정하고, 너트 폭과 0.2 mm 넘게 어긋나면 멈춘다. 통과하면 `RF_<MODEL>_Source`에 커브를 만든다.
- 도면이 1:1로 출력되지 않았어도 된다. GRAMR 원본 PDF는 도면상 스케일 길이가 487.84 mm로, 출력 축척이 0.7528이다.
- 스케일 값은 이 검증으로 정해지지 않는다. 648 mm와 647.7 mm는 너트 폭 기준으로 0.02 mm밖에 차이 나지 않는다. GRAMR은 소유자가 648 mm로 확정했다(2026-11-14).
- 모델별 경로 인덱스는 `drawings/<model>.json`에 둔다. 현재 GRAMR 전면만 있다.
- 바디 윤곽은 넥 포켓 쪽이, 헤드 윤곽은 너트 쪽이 열린 채로 들어온다. 돌출 전에 직선으로 닫고, 그 닫는 변은 도면에 없는 선이므로 `rf_note`에 적는다.

### GRAMR 1단계 실행 기록

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

### GRAMR 2단계 실행 기록

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

### GRAMR 3단계 실행 기록

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

### GRAMR 4단계 실행 기록

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

### GRAMR 5단계 실행 기록

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

## 도면에 없는 정보

평면도에는 두께 방향 정보가 없다. 아래는 별도 근거가 필요하다.

| 필요한 것 | 근거가 없을 때 |
|---|---|
| 바디 두께 | 사양 값이 있으면 `spec`, 없으면 묻는다 |
| 컨투어 깊이·곡률 | `illustrative`로 만들고 `rf_note`에 가정 기록 |
| 넥 뒷면 프로파일, 두께 | 같음 |
| 헤드스톡 각도·볼류트 | 같음 |
| 넥 포켓, 캐비티 깊이 | `pending`. 모델링하지 않는다 |

## 파일 관리

- 원본 PDF/DXF는 `.blend`에 팩하지 않고 저장소에도 넣지 않는다.
- `.blend`를 공개 저장소에 올릴 때는 `RF_<MODEL>_Source` 컬렉션을 제거한 사본을 쓴다. 원본 커브가 곧 도면이기 때문이다.
- GLB에는 `Source` 컬렉션을 포함하지 않는다.
