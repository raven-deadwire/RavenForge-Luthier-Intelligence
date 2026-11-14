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
4. **배율 검증**: SVG 임포트는 배율이 실제와 다르게 들어온다. 도면에서 값이 확실한 두 점(너트 ~ 12프렛 = 스케일의 절반, 또는 너트 폭) 사이를 재서 배율을 구하고 전체에 적용한다. 서로 다른 두 치수로 교차 확인해 오차가 0.2 mm를 넘으면 진행하지 않는다.
5. **정렬**: 중심선을 X축에, 너트 앞면(또는 제로 프렛)을 원점에 맞춘다.
6. **기록**: 복제해 만든 각 메시에 `rf_status = drawing`, `rf_source`(파일명 + 경로 인덱스), `rf_source_sha256`을 넣는다.

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
