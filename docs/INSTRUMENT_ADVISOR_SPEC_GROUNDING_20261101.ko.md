# 악기 추천 사양 설명의 근거 보강 — PR #82 후속

작업 기준: 2026-11-01 요청. 기반은 PR #82의
`f1742bcea13989f4f52d2b2c88d716322f8847e0`이며, 후보 Worker 버전은
`20261101-advisor-spec-grounding-1`이다.

## 판정

네 설명 오류를 일으킨 모델별 근거 누락을 보완했다. 현재/기본/추천 구성을
구별하는 구조화된 사양, 실제 선택 가능한 메뉴, 컨피겨레이터가 계산한 전원
요구사항을 프롬프트와 가격 도구 결과에 전달한다. 가격 계산과 옵션 적용 규칙은
변경하지 않았다.

**수정 후보의 새 OpenAI 응답 품질은 아직 미검증이다.** 실행 환경에
`OPENAI_API_KEY`가 없어 실제 호출 도구는 `blocked_missing_openai_api_key`로
종료했고, API 시도는 0회다. 기존 운영 응답의 재검토, 합성 문장 검사,
모의 API 전달 검사, 실제 OpenAI 호출을 같은 결과로 집계하지 않는다.

후속 PR의 base는 `fix/advisor-validation-20261031`이다. #82의 카탈로그 누락,
문의서 데이터 보존, 재시도 변경을 다시 포함하지 않는다. #82를 먼저 병합한 뒤
이 PR의 base를 main으로 옮기고 최신 차이와 CI를 확인해야 한다.

## 원본 응답과 실제 사양 대조

원본은 [기존 보고서](INSTRUMENT_ADVISOR_VALIDATION_20261031.ko.md)와
[`instrument-advisor-20261031`](evidence/instrument-advisor-20261031/)에 그대로
보존한다. 당시 응답은 운영 Worker `20261031-instrument-advisor-1` /
제품 소스 `2546afa584d662243cd48646a9100dba387cc74d`에서 얻었다.

| 오류 | 정확한 원본 위치 | 현행 소스에 따른 정정 |
|---|---|---|
| EDDA xPure를 배터리 없이 사용 가능한 듯 안내 | `live-api/ko-EDDA.json`, `calls[phase=explain]` | `delano_buffer`는 패시브 컨트롤에서 사용하는 **9V 버퍼**다. 패시브 컨트롤 호환과 전원 불필요는 다르다. |
| EDDA에 John East·Glockenklang·LHZ를 포괄적으로 추천 | `live-api/de-EDDA.json`, `calls[phase=explain]` | EDDA는 **John East ACG EQ-01 (`eq01`)을 지원**한다. **John East Uni Pre 5 (`john_east`)는 EMBLA 전용**이고, Glockenklang·LHZ는 EDDA 메뉴에 없다. 브랜드 전체를 금지하지 않는다. |
| EMBLA의 기본 전자회로를 패시브라고 설명 | `live-apply.json`, `[model=EMBLA,language=en]` | 해당 요청의 현재 모델은 EDDA/passive, 추천 견적은 EMBLA/Zuta였다. EMBLA 기본은 **Zuta Bass Core / 9V**다. 패시브는 EMBLA의 현재 선택 옵션에도 없다. |
| GRAMR의 지판에서 other/exotic 메뉴를 안내 | `live-api/en-GRAMR.json`, `calls[phase=compare]` | GRAMR은 **Indian rosewood (`guitar_indian_rosewood`)만** 선택 가능하다. 에보니/기타 수종을 별도로 문의할 수는 있지만, 이를 메뉴·확정 옵션·확정 가격으로 안내하지 않는다. |

EMBLA의 잘못된 문장은 `live-api/en-EMBLA.json`의 설명 단계가 아니라 별도
브라우저 적용 검증 기록에 있다. 과거 응답의 HTTP 200과 일치한 가격을
사양 설명의 정확성 근거로 사용하지 않는다.

## 구현

### 원본 데이터와 전원 규칙 재사용

`tools/build-catalog.mjs`가 `configurator.html`의 기존
`getAutomaticPowerSupply` 함수 몸체를 가져온다. React 범위의 모델과 UI
참조를 인수로 바꾸며, 전압 판단 로직은 재작성하지 않는다. 페이지의
`stepConfig` 카테고리 목록과 KO/EN/DE의 사양·전원 번역도 복사한다.

원본 카탈로그/가격표/`normalizeSelections`/`applyOptionChange`는 변경하지
않았다. 생성 파일에는 전원 함수, 메뉴 목록과 설명용 번역 데이터가 추가된다.

### 구조화된 도구 응답

`src/specifications.js`의 `withSpecifications`가 현재 구성과 가격 도구 결과에
`specification`을 추가한다. 기존 API 필드를 대체하지 않는다.

| 필드 | 의미 |
|---|---|
| `model` | 이 사양 객체가 설명하는 모델 |
| `standard` | 해당 모델의 정규화된 기본 전자회로·전원·지판 |
| `selected` | 해당 견적에 실제 반영된 전자회로·전원·부가옵션 |
| `available_categories` | 실제 화면 단계에 있고, 고정/숨김/의존성 필터를 통과한 선택 메뉴와 옵션 |
| `available_instrument_options` | 현재 회로 조건에서 선택 가능한 부가옵션 |
| `fixed_specifications` | 고정된 사양 값. 사용자가 열거나 변경할 수 있는 메뉴가 아님 |

옵션별로 원문과 페이지 언어의 이름·사양을 함께 전달한다. xPure의 전원
판단에는 요청된 부가옵션 전체가 아니라 **가격 결과에 실제 남은 항목만**
사용한다. 따라서 active EQ 때문에 거절된 xPure가 전원 설명에 들어가지 않는다.

전원 상태는 다음처럼 구별한다.

| `status` | `battery_required` | `voltage` | 설명 |
|---|---|---|---|
| `required` | `true` | 9 또는 18 | 현재 RavenForge 구성에서 해당 전원이 필요 |
| `not_required` | `false` | `null` | 배터리 불필요. 전압 해당 없음 |
| `confirmation_required` | `null` | `null` | 미확정. 무전원이나 0V라는 뜻이 아님 |

GRAMR의 예정된 Zuta Core는 `circuit_type=unconfirmed`를 유지한다. 이 구성을
EMBLA의 확정된 Zuta Bass Core/9V와 합치지 않는다. 표의 전압은 이 프로젝트의
구성 기준이며 제조사 제품의 전체 허용 전압 범위를 주장하지 않는다.

### 프롬프트 규칙

모델별 기본 사양은 같은 정규화 함수에서 생성해 시스템 프롬프트에 넣는다.
제품 지식이나 이전 assistant 답변보다 서버가 전달한 모델별 사실을 우선한다.
무료 옵션을 기본값으로 추론하지 않고, 변경 구성/다른 모델을 설명하기 전에는
가격 도구로 실제 지원 조합을 확인한다. 도구의 거절 목록과 실제 메뉴 목록을
따라야 하며, 없는 사실은 제작자 확인이 필요하다고 답하도록 명시한다.

한국어·영어·독일어에 같은 규칙을 적용한다. 미확정 전자회로, 전원,
제작 요청을 확정된 판매 사양으로 바꾸지 않도록 한다. 자유 문장은 확률적
모델 출력이므로 이 규칙 추가만으로 모든 환각이 제거됐다고 주장하지 않는다.

## 검증 결과와 적용 범위

| 구분 | 결과 | 검증한 것 / 한계 |
|---|---|---|
| 기존 + 신규 Worker 테스트 | **63개 통과: 기존 34 + 신규 29** | 데이터·함수·프롬프트 전달 경로의 결정적 검사 |
| 기존 페이지 핸들러/가격 대조 | **1,108개 옵션 전환 통과** | 총액, 선택값과 Fishman/EQ 등 기존 연동 보존 |
| 새 원본 페이지 사양 대조 | **15개 구성 × 3언어 = 45개 조합** | 실제 원본 전원 함수, 최종 UI 메뉴 필터, 번역 사양과 일치; 기존 quote 전체 필드 보존 |
| 네 오류 유형의 다국어 모의 전달 | **4유형 × 3언어 = 12개 통과** | 실제 Worker 루프와 Responses 어댑터에 전달되는 사실·도구 결과. 최종 텍스트는 `MOCK_TRANSPORT_ONLY`이고 실응답 품질 검증 아님 |
| 과거 운영 실응답 재검토 | **기존 오류 4/4 검출** | 이전 응답을 negative evidence로 재검토. 새 API 호출 0회 |
| 합성 문장의 경고 검사 | **통과** | KO/EN/DE의 제한된 오류/부정/정상 비교 fixture. 자유 문장 전체 의미 판정 아님 |
| 카탈로그 freshness | **통과** | 현행 원본과 생성 파일 일치 |
| Worker 번들 dry-run | **통과** | 빌드 가능. 운영 배포 아님 |
| 후보의 새 OpenAI 응답 | **미실행 / 인증 정보 없음** | `blocked_missing_openai_api_key`, API 시도 0회, 품질 판정 미실시 |

개별 test 수는 Node 24의 `--test-isolation=none` 실행 로그에서 집계했다.
표의 세부 조합은 63개 테스트 내부에 포함되어 있으며 별도 test 개수로 더하지
않는다. 브라우저 UI/PDF는 이번에 제품 변경하지 않았으며, 기존 검사를 실행하는
GitHub Actions 결과는 해당 PR의 Checks에서 별도로 확인한다.

신규 검사 파일:

- `test/specifications.test.js`: 원본 페이지와 사양 대조, 정확한 EDDA 제품 구분,
  EMBLA 기본/패시브 거절, GRAMR 지판 거절, LHZ 조건부 메뉴, 고정 사양 분리.
- `test/specification-chat.test.js`: 세 언어 요청과 현재/추천 모델 scope,
  브라우저가 위조한 사양 무시, 도구 결과와 preview 일치, 가격 필드 보존.
- `test/specification-validation.test.js`: 과거 실제 오류와 합성 문장 검사,
  키가 없을 때 실제 API를 호출하지 않고 차단 상태로 기록하는 동작.

## 실제 후보 응답 검증 절차

`worker/quote-consult`에서, 기존 개발 환경에 `OPENAI_API_KEY`를 설정한 뒤 실행한다.
새 키 생성이나 운영 배포는 이 작업의 일부가 아니다.

```bash
node tools/validate-specifications.mjs --live --include-original --output /tmp/rf-spec-live
```

12개 다국어 명시적 질문과 기존 오류가 난 원문 요청·대화 이력 4개를 현재
checkout의 `handleChat` 및 OpenAI Responses 어댑터로 실행한다. 모델 기본값은
운영 설정과 같은 `gpt-5-mini`, effort는 `low`다. 필요하면 한 사례만
`--case ko-xpure_power`로 실행할 수 있다.

기록은 실제 API 요청 ID·요청/응답·도구 결과·후보 버전·소스/프롬프트 해시를
포함한다. Authorization 헤더를 기록하지 않으며 암호화된 reasoning blob은
해시와 길이로만 남긴다. 매 실행마다 새 출력 경로를 사용해 과거 결과를 보존한다.

자동 문장 검사에서 경고가 없어도 `manual_review_required=true`다. 원문을
대조해 네 오류가 재발하지 않았는지, EDDA의 ACG EQ-01 예외와 모델 간 차이를
올바르게 설명하는지 검토해야 한다. 이것은 로컬 후보의 실제 API 검증이며,
이후 배포된 Worker의 CORS/요청 제한/브라우저 동작 확인과는 별도다.

## 근거 파일

이번 실행의 로그와 분류된 결과는
[`instrument-advisor-spec-20261101`](evidence/instrument-advisor-spec-20261101/)에 있다.
`candidate-live-blocked.json`은 실제 호출 결과가 아니라 **실행 차단 기록**이다.
`baseline-audit.json`은 과거 운영 응답을 식별하는 경로·SHA-256·검토 결과만 담아
#82의 원본 응답을 중복 저장하지 않는다. `source-manifest.json`의 파일 해시로
검증 대상 후보 코드를 식별한다.
