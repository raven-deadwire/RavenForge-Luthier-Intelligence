# 모델 사양

이 표는 2026-11-07 시점 `RavenForge-Luthier-Intelligence` 레포에서 옮긴 요약이다. **작업 때마다 "확인 위치"의 파일을 다시 읽는다.** 값이 다르면 레포가 맞다.

## 모델 개요

| 모델 | 종류 | 현 | 스케일 | 넥 기본 | 확인 위치 |
|---|---|---|---|---|---|
| EDDA | 베이스 | 4 | 34″ | 1피스 | `assets/configurator-platforms.js` |
| EMBLA | 베이스 | 5 | 34″ | 5피스 | 같음 |
| ASKR | 베이스 | 5 | 37–34″ 멀티스케일 | 5피스 | 같음 |
| GRAMR | 기타 | 6 | 25.5″ | 5피스 | `concepts/gramr-superstrat-24f/meta.json` |
| SKAÐI Fimbulvetr | 베이스 (컨셉) | 5 | 36″ / 914.4 mm | 9피스 | `concepts/skadi-fimbulvetr/meta.json` |

베이스 3종은 컨피규레이터 옵션에 따라 픽업·전자부·브리지가 달라진다. 렌더할 구성은 `?cfg=` 링크나 사용자 지정으로 받는다. 기본값을 임의로 가정하지 않는다.

## 미확정이라 반드시 물어야 하는 값

- **ASKR**: 수직 프렛 번호, 너트·브리지에서의 현 간격. 원본 도면에서만 읽는다.
- **ASKR 픽업 구성**: 플랫폼 기본값과 홈페이지 소개 문구가 서로 다르게 읽힌다. 어느 리비전을 그릴지 확인한다.
- **GRAMR 스케일**: 사양 표기는 "25.5″ / 648 mm"인데 25.5″는 정확히 647.7 mm다. 도면이 쓰는 값을 따른다.
- **EDDA / EMBLA / ASKR 바디 두께·컨투어**: 이 스킬에 수치가 없다. 도면 또는 사용자에게서 받는다.
- **SKAÐI**: 바디 두께와 목표 중량은 사양서에 "estimated"로 적혀 있다. `illustrative`로 취급한다.

## GRAMR — Superstrat 24F (컨셉)

| 항목 | 값 |
|---|---|
| 프렛 | 24, Extra Jumbo |
| 바디 | 2피스 스웜프 애쉬, 중심 접합, 두께 45.0 mm |
| 컨투어 | 포어암 베벨, 후면 터미 컷, 스컬프티드 힐 |
| 마감 | Transparent Inferno Red, 그레인필, 하이글로스 |
| 넥 | 5피스: Northern Hard Maple / Wenge / Purpleheart / Wenge / Northern Hard Maple |
| 넥 마감 | Transparent Inferno Red, 적층이 보이게 |
| 조인트 | 볼트온 딥 테넌, 5볼트 2-2-1, 넥 플레이트 없음 |
| 지판 | 인디안 로즈우드, 반경 16″ (406.4 mm), 전면 인레이 없음 |
| 너트 | 43.0 mm, 버팔로 본 |
| 픽업 | Lundgren M6 넥 + 브리지, 블랙 오픈코일 |
| 컨트롤 | 1 Volume / 1 Tone / 5-way 블레이드 |
| 브리지 | Gotoh 510T-FE1 골드, 42 mm 블록 |
| 튜너 | Gotoh SG381-07-MGT 골드, 6-in-line, 스태거드 |
| 픽가드 | 3플라이 블랙 B/W/B, 약 2.3 mm |
| 잭 | 리세스드 탑 잭, 골드 |

조인트의 볼트 좌표, 딥 테넌, 최종 힐 형상은 `docs/CONFIGURATOR_DRAWING_AUDIT.md`에서 **미승인**이다. `pending`으로 둔다.

## SKAÐI — Fimbulvetr (컨셉)

| 항목 | 값 |
|---|---|
| 형식 | 5현 컴팩트 싱글컷, 스트레이트 스케일 |
| 프렛 | 제로 프렛 + 26 |
| 지판 | Stabilized White Holly, 반경 16″ |
| 너트 폭 | 45 mm |
| 브리지 현 간격 | 16.5 mm |
| 탑 | White Holly 5–6 mm + Black Ebony 베니어 0.8–1.0 mm |
| 바디 | 1피스 월넛, 허니컴 챔버 |
| 넥 | 9피스 Ash / Walnut / Wenge / Roasted Maple |
| 헤드스톡 | 컴팩트 3+2 |
| 픽업 | Delano The Xtender 5 HE/S × 1, 119 × 56.2 × 20 mm |
| 픽업 위치 | 중앙에서 약간 브리지 쪽. 최종 위치는 지그 테스트로 결정 → `pending` |
| 하드웨어 색 | 루테늄 |

제로 프렛 모델이므로 스케일 원점은 제로 프렛이다.

## 레포에 기록된 하드웨어 외곽 치수

| 부품 | 치수 | 출처 등급 |
|---|---|---|
| Schaller 3D-4 (1213) | 평면 79.7 × 57.4 mm, 현 간격 19 mm, 장착 구멍 3 | 제조사 공식 도면 → `spec` |
| Schaller 3D-5 (1214) | 평면 86.3 × 57 mm, 현 간격 16.6 mm | 제조사 공식 도면 → `spec` |
| ETS Custom (EDDA / EMBLA) | 수치 없음, 카탈로그 사진 참고 | `illustrative` |
| ETS / Nova Custom (ASKR) | 프로토타입 PDF의 윤곽만 | 도면 윤곽은 `drawing`, 나머지 `pending` |

EDDA 생산 옵션은 Schaller 브리지를 허용하지 않는다. 옵션 제약은 `docs/CONFIGURATOR_PARTS.md`를 따른다. 그 외 부품은 제조사 공식 도면을 직접 찾아 `rf_source`에 URL을 남긴다.
