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
| 생성 오브젝트 | 52 (윤곽 7, 프렛 24, 중심점 21) |

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
