# 파이프라인

도면 PDF 한 장에서 캡션이 붙은 렌더까지 8단계로 만든다. 각 단계는 앞 단계의 `.blend`를 읽어 새 `.blend`와 JSON 보고서를 쓴다. 모델에 관한 값은 전부 `drawings/<model>.json`에 있고 스크립트에는 없다.

## 실행 환경

- 파이썬에 `bpy`(Blender 파이썬 모듈)와 `pymupdf`가 있으면 된다. Blender GUI는 필요 없다.
- 2026-11에 `bpy` 5.3.0, 파이썬 3.13, 리눅스, CPU 4코어, GPU 없음에서 확인했다. 다른 버전은 확인하지 않았다.
- 렌더는 Cycles CPU를 쓴다. EEVEE는 GPU가 없으면 한 장에 수십 초가 걸려 쓰지 않는다.
- Blender GUI와 BlenderMCP로 작업해도 규칙은 같다. 그때는 스크립트를 그대로 실행하거나 같은 순서를 손으로 따른다.

## 한 번에 돌리기

```bash
python scripts/run_pipeline.py --config drawings/gramr.json --pdf SOURCE.pdf --workdir out
```

```bash
python scripts/run_pipeline.py --config drawings/gramr.json --pdf SOURCE.pdf --workdir out --draft --no-previews --compare drawings
```

두 번째 형태는 렌더를 작게 뽑고, 만든 보고서가 `drawings/`의 기록과 같은지 비교한다. 스크립트나 설정을 고친 뒤 의도하지 않은 변화가 없는지 볼 때 쓴다. 의도한 변화라면 새 보고서를 `drawings/<model>.stageN-report.json`으로 복사해 기록을 갱신한다.

## 단계

| 단계 | 스크립트 | 도면·사양에서 오는 것 | 가정하는 것 (설정 키) |
|---|---|---|---|
| 1 임포트 | `import_drawing.py` | 윤곽, 프렛선, 중심점 전부 | 없음. 스케일 길이는 소유자 확인 값 |
| 2 바디 | `build_body.py` | 윤곽, 두께, 힐 경계선 | 넥 포켓 쪽을 닫는 직선 한 변 |
| 3 컨투어 | `build_contours.py` | 없음 | 모서리 반경, 포어암 베벨, 터미 컷 (`contours_illustrative`) |
| 4 넥·지판 | `build_neck.py` | 지판 평면, 지판 반경, 헤드 윤곽, 적층 순서 | 모든 높이와 두께, 뒷면 프로파일, 헤드 단차, 적층 폭 (`neck_illustrative`) |
| 5 프렛 | `build_frets.py` | 위치, 곡률, 길이 | 와이어 단면, 끝 베벨 (`fret_illustrative`) |
| 6 하드웨어 | `build_hardware.py` | 위치, 평면 외곽, 픽가드 두께, 너트 폭 | 높이, 단면, 작은 부품 전부 (`hardware_illustrative`) |
| 7 머티리얼 | `build_materials.py` | 색 (컨피규레이터 표시색) | 나뭇결, 광택, 금속 반응 (`materials_illustrative`) |
| 8 렌더 | `build_render.py` | 해당 없음 | 조명, 카메라, 캡션 (`studio`) |

### 단계별로 알아둘 것

**2 바디.** 윤곽이 넥 포켓 쪽에서 열려 있다. 후면 투영의 힐 경계선으로 닫고, 남는 틈은 직선 한 변으로 잇는다. 그 직선은 도면에 없는 선이므로 보고서의 `closure`에 길이와 함께 남는다. 전면과 후면 윤곽이 같은지도 여기서 확인한다.

**3 컨투어.** 평면 윤곽은 바뀌지 않아야 한다. 보고서의 `size_before_mm`와 `size_after_mm`가 같은지, 부피가 요소마다 줄었는지 본다. 그다음 `depth_map.py`로 윗면과 뒷면의 깊이 지도를 뽑아 위치와 형태를 눈으로 확인한다.

**4 넥·지판.** 원점의 Z = 0은 지판 윗면 중앙이다. 이 단계에서 바디를 그 아래로 내린다. 넥 포켓은 파지 않으므로 힐 블록이 바디와 겹친다. 헤드스톡이 평평한지 각이 졌는지는 도면 평면도로 알 수 없다. 소유자에게 묻거나 가정임을 적는다.

**5 프렛.** 도면 프렛선의 위치를 쓰고, `fret_math.py`의 계산값과 비교한 최대 차이를 보고한다. 프렛 끝은 지판 가장자리에서 0.03 mm 안쪽에서 끝낸다.

**6 하드웨어.** 블록아웃이다. 제조사 형상, 로고, 각인은 넣지 않는다. 보고서의 포함 검사(나사·노브·픽업 중심이 픽가드 안에 있는가, 스케일 선이 브리지 외곽 안에 있는가)는 도면 요소끼리 서로 맞는지를 보는 것이다.

**7 머티리얼.** 이미지 텍스처 없이 절차적 무늬만 쓴다. 재질마다 `rf_colour_source`가 들어간다. 재질 없는 오브젝트와 남은 자리 표시 재질이 0인지 본다.

**8 렌더.** `--draft`로 조명과 구도를 먼저 맞춘다. 최종 실행은 스킬의 보고 형식에 필요한 값(스케일 실측, 윤곽 점검, 상태별 오브젝트 수)을 보고서에 모은다.

## GLB 내보내기

7단계나 8단계의 `.blend`에서 웹 뷰어용 파일을 만든다.

```bash
python scripts/export_glb.py --config drawings/gramr.json --blend out/gramr_stage7.blend --out out/gramr.glb --report out/gramr_glb.json
```

```bash
cd scripts/web_check && npm install && node check.cjs ../../out/gramr.glb ../../out/webcheck
```

- **나가는 것**: Body, Neck, Hardware, Electronics 컬렉션의 메시. 모디파이어는 적용된다.
- **나가지 않는 것**: `RF_<MODEL>_Source`의 원본 커브(도면 그 자체다), 카메라, 조명.
- **재질**: glTF는 Blender의 절차적 노드를 담지 못한다. 그래서 목재의 색만 이미지로 구워 넣고(바디·넥 2048 px, 지판 1024 px, JPEG), 금속과 플라스틱은 값으로 나간다. 클리어코트는 `KHR_materials_clearcoat`로 나간다. 입력 `.blend`는 바뀌지 않는다.
- **기록**: 노드마다 `extras.rf_status` / `rf_source` / `rf_note`, 재질마다 `extras.rf_colour_source`, 파일의 `asset.extras`에 세 언어 표기 문구와 원본 해시가 들어간다.
- **스크립트가 하는 점검**: 파일을 다시 읽어 노드·재질·이미지 수와 전체 크기를 재고, 빈 씬에 다시 임포트해 오브젝트별 치수와 상태값이 그대로인지 비교한다.
- **`web_check`가 하는 점검**: Khronos glTF 검증기, 그리고 헤드리스 Chromium에서 three.js로 실제로 열어 네 방향 스크린샷을 찍는다. Node와 Playwright(Chromium 포함)가 필요하다. **스크린샷은 직접 열어 본다.**
- 압축(Draco, meshopt)은 하지 않는다. `bpy` 파이썬 모듈에 해당 라이브러리가 없었다.
- 위에서 수직으로 내려다보면 뷰어의 천장 조명이 유광면에 그대로 비쳐 하얗게 뜬다. 파일 문제가 아니라 뷰어 조명 문제이며, 뷰어를 만들 때 고려해야 한다.

## 단계마다 반드시 할 것

1. 보고서의 수치를 읽는다.
2. **렌더나 깊이 지도를 직접 열어 본다.** 파일럿에서 수치는 통과했는데 그림이 틀린 경우가 여러 번 있었다(`pitfalls.md`).
3. 가정한 값을 사용자에게 표로 보여 주고, 도면·사양에서 온 값과 구분한다.

## 설정 파일

`drawings/<model>.json` 한 파일에 든다.

| 키 | 내용 |
|---|---|
| `sha256`, `source_name`, `page` | 원본 도면 식별 |
| `scale_mm`, `nut_width_mm`, `body_thickness_mm`, `fingerboard_radius_mm`, `pickguard_thickness_mm` | 사양 값과 소유자 확인 값 |
| `frets`, `contours`, `centres`, `rear`, `nut_edge_pt`, `board_pt`, `selector_pt` | 도면의 경로 인덱스와 포인트 좌표 |
| `*_illustrative` | 단계별 가정값. 각각 `note`에 가정임을 밝힌다 |
| `studio` | 조명, 카메라, 캡션 |

가정값을 실제 값으로 바꿀 근거가 생기면 `*_illustrative`에서 꺼내 위쪽의 사양 값으로 옮기고, 해당 스크립트가 붙이는 `rf_status`와 `rf_note`도 함께 고친다.
