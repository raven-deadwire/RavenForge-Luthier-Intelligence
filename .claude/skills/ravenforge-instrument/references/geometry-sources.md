# 형상 원본과 임포트

## 원본 등급

| 순위 | 원본 | 사용 |
|---|---|---|
| 1 | 사용자 소유 CAD PDF의 벡터 경로 | 검증된 경로. 회전·축척 보정은 스크립트가 한다 |
| 2 | 사용자 소유 CAD의 DXF나 mm 단위 SVG | 단위가 보존되지만 이 스킬의 스크립트로는 아직 읽지 않는다 |
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

`scripts/import_drawing.py`가 아래를 한 번에 수행한다. 손으로 할 때도 순서는 같다.

1. **해시 확인**: 받은 파일의 SHA-256을 위 표와 비교한다. 다르면 다른 리비전이다. 멈추고 사용자에게 알린다. 업로드 과정에서 파일명에 접두어가 붙거나 `(1)`이 빠질 수 있으므로 이름이 아니라 해시로 판단한다.
2. **경로 읽기**: PyMuPDF로 PDF의 벡터 경로를 직접 읽고 페이지 회전을 적용한다. 래스터를 따라 그리지 않는다. 읽을 경로의 인덱스는 `drawings/<model>.json`에 둔다.
3. **축척 산출**: 프렛선들을 평균율에 맞춰 너트 위치와 도면상의 스케일 길이를 구한다. 실제 스케일 길이를 이 값으로 나눈 것이 축척이다. 도면이 1:1로 출력됐다고 가정하지 않는다.
4. **교차 검증**: 그 축척으로 잰 너트 폭을 사양과 비교한다. 0.2 mm 넘게 어긋나면 멈춘다.
5. **좌표 변환**: 너트를 원점, 중심선을 X축으로 놓는다. 후면 투영은 중심선 기준으로 뒤집어 전면 좌표로 옮긴다.
6. **커브 생성과 기록**: `RF_<MODEL>_Source` 컬렉션에 커브와 중심점을 만들고 렌더에서 제외한다. 각 오브젝트에 `rf_status = drawing`, `rf_source`(파일명 + 경로 인덱스), `rf_source_sha256`을 넣는다. 이 커브는 수정하지 않는다.

```bash
python scripts/import_drawing.py --config drawings/gramr.json --pdf SOURCE.pdf
```

```bash
python scripts/import_drawing.py --config drawings/gramr.json --pdf SOURCE.pdf --out gramr_stage1.blend --report gramr_stage1.json
```

- 첫 번째 형태는 측정만 한다. 설정에 스케일 길이가 없으면 너트 폭으로 역산한 스케일 길이를 알려 준다.
- 두 번째 형태는 설정의 `scale_mm`(또는 `--scale-mm`)로 축척을 정하고 커브를 만든다.
- **스케일 값은 이 검증으로 정해지지 않는다.** 예를 들어 648 mm와 647.7 mm는 너트 폭 기준으로 0.02 mm밖에 차이 나지 않는다. 도면의 치수 기입이나 소유자에게서 확인한다.
- 바디 윤곽은 넥 포켓 쪽이, 헤드 윤곽은 너트 쪽이 열린 채로 들어온다. 닫는 방법은 `pipeline.md`의 2단계와 4단계에 있다.

### 설정 파일에 든 도면 좌표

`drawings/<model>.json`의 `nut_edge_pt`, `board_pt`, `selector_pt`, 윤곽의 `start`는 PDF 포인트 좌표다. 레포의 `tools/extract_*_geometry.py`가 같은 도면에서 읽어 기록해 둔 값을 옮긴 것이며, 컨피규레이터의 표시 좌표(`configurator-*-geometry.js`)와는 다르다. 표시 좌표는 3D 원본으로 쓰지 않는다.

### 다른 형식

- DXF는 단위가 보존되어 더 좋지만, 헤드리스 `bpy` 5.3.0에는 DXF 임포터가 없었다. DXF만 있으면 CAD에서 PDF나 mm 단위 SVG로 다시 내보낸다.
- mm 단위가 명시된 SVG는 Blender의 SVG 임포터로 실제 크기로 들어온다(100 mm × 50 mm SVG로 확인). 포인트 단위 SVG가 어떤 크기로 들어오는지는 확인하지 않았다.

### 새 모델을 추가할 때

1. 소유자에게서 원본 PDF를 받아 해시를 위 표와 맞춘다.
2. 레포의 `tools/extract_<model>_*.py`에 기록된 경로 인덱스를 `drawings/<model>.json`으로 옮긴다. 인덱스가 없으면 `page.get_drawings()`로 경로를 나열해 찾고, 찾은 근거를 설정의 `note`에 적는다.
3. 측정만 먼저 돌려 프렛 편차와 너트 폭을 본다. 팬프렛 모델은 지금의 축척 산출(프렛이 중심선에 수직이라고 가정)이 맞지 않으므로 `import_drawing.py`를 먼저 고쳐야 한다.
4. `scripts/test_import_drawing.py`가 통과하는지 확인한 뒤 진행한다.

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
