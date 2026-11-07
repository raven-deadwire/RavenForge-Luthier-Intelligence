# Quote consultation Worker

## Instrument advisor and optional OpenAI connection

The homepage's “Find my instrument” link opens the existing consultation panel.
Three actions help visitors find an instrument, understand their current options,
and prepare an editable enquiry. The last priced configuration can be reviewed
and explicitly applied. Enquiries download as text; nothing is sent automatically.

The production configuration uses `AI_PROVIDER = "openai"`,
`OPENAI_MODEL = "gpt-5-mini"`, `OPENAI_EFFORT = "low"` and placement near
`api.openai.com`. Provision `OPENAI_API_KEY` as a Worker secret
through the deployment environment's secure secret input, never in HTML or Git.
For local testing, supply these values through the local process environment or
an ignored `.dev.vars` file. Do not copy a secret into a tracked file.

OpenAI uses Responses with `store: false`, the same pricing tool and the existing
request, output and rate limits. It does not silently fall back to another provider.
The `MODEL` and `EFFORT` variables remain Anthropic-specific. The key currently
created for this project has a 30-day expiration: replace the server secret before
expiry and verify a price question, or create a non-expiring key if account policy
allows. This repository change does not alter the key's expiration.

Before enabling OpenAI publicly, run the test suite and catalog check, verify a
live answer with the deployment's own secret, and check account spending controls.
The existing visitor limit is approximate and is not a global spending cap.

`node tools/test_instrument_advisor.cjs` (from the repository root) checks the new
review/apply and editable enquiry workflow with mocked responses, in three
languages on desktop and mobile. It uses the same browser and URL environment
variables as `tools/test_configurator_chat.cjs`.

Configurator 옆에서 고객의 악기 선택과 견적 상담에 답하는 Cloudflare Worker입니다. 운영 설정은 OpenAI API를 사용하며 가격은 `configurator.html`과 같은 카탈로그와 규칙으로 계산합니다. 아래 Claude 설정과 비용 기록은 기존 제공자 운영 기록입니다. 롤백할 때는 `AI_PROVIDER = "anthropic"`과 `api.anthropic.com` placement를 함께 복원합니다.

## 동작 방식

- **가격은 코드가 계산합니다.** 모델은 `price_configuration` 도구를 호출하고, 도구가 configurator의 `summary`와 같은 방식(같은 `normalizeSelections`, `isOptionVisible`, 가격표)으로 줄별 금액과 합계를 돌려줍니다. 모델이 금액을 직접 만들지 않도록 프롬프트에서 막아 두었습니다.
- **카탈로그는 사이트에서 복사합니다.** `npm run build:catalog`가 `configurator.html`과 `assets/configurator-platforms.js`에서 데이터와 규칙을 `src/catalog.generated.js`로 그대로 복사합니다. Workers는 eval을 쓸 수 없어서 빌드할 때 복사합니다. 사이트 가격이나 옵션을 바꾸면 다시 실행해야 하고, 복사본이 오래되면 CI(`.github/workflows/quote-consult-worker.yml`)가 실패합니다.
- **옵션 연동도 같은 소스입니다.** 빌드가 실제 `handleOptionChange`의 본문을 복사합니다. 가상 변경은 배열 순서대로 화면 클릭과 같은 Fishman/EQ·너트·브리지 연동을 거치며, 거절된 변경과 사용할 수 없는 추가 옵션을 별도로 반환합니다.
- **대화 기록은 페이지가 가집니다.** Worker는 상태를 저장하지 않습니다. 페이지가 텍스트 대화 기록과 현재 configurator 상태를 매번 보내고, Worker는 답변 텍스트와 마지막 견적 결과를 돌려줍니다.

## 원화 참고가 (한국수출입은행 환율 API)

한국어 페이지(`language: "ko"`)에서는 견적 요약에 원화 참고가를 함께 보여 줍니다. 견적은 계속 유로(EUR)로 계산하고, 모델은 통화를 직접 환산하지 않습니다.

- Worker가 [한국수출입은행 현재환율 API](https://www.koreaexim.go.kr/ir/HPHKIR020M01?apino=2&viewtype=C)(`data=AP01`)에서 EUR 매매기준율을 받아 `krw_reference`로 응답에 붙입니다. 금액은 1,000원 단위로 반올림합니다.
- 환율은 영업일 오전 11시(KST) 무렵 게시됩니다. 오늘부터 9일 전까지 탐색하되 토·일요일은 호출 없이 건너뛰고, 조회 한 번당 HTTP 최대 7회와 전체 2.5초 제한을 적용합니다. 공휴일은 빈 응답으로 판별하며, 제한 안에서 환율을 찾지 못하면 원화 표시를 생략합니다.
- 결과는 isolate당 3시간, 실패는 10분 캐시합니다. 같은 키의 동시 조회는 한 번으로 합칩니다. 공유 조회는 `ctx.waitUntil`로 유지해 모델 오류로 시작 요청이 먼저 끝나도 다른 요청의 환율 대기가 중단되지 않도록 합니다. 다른 isolate·지역·재시작 사이에는 캐시나 진행 중 조회가 공유되지 않으므로 이 처리가 문서상의 하루 1,000회 호출 한도를 보장하지는 않습니다. 전역 호출량 제한이 필요하면 별도의 공유 수집자나 Durable Object가 필요합니다.
- 키가 없거나 조회에 실패하면 `krw_reference`를 생략하고 EUR 상담 답변은 유지합니다. 환율은 모델 호출과 병렬로 실행되므로 모델이 먼저 끝나면 남은 환율 조회시간만큼 응답을 기다릴 수 있습니다. 만료된 정상 환율을 무기한 재사용하지 않습니다.
- 키는 `KOREAEXIM_API_KEY` Worker Secret으로 등록하며 소스·`[vars]`·로그에 넣지 않습니다. 요청 URL, 원시 응답과 외부 예외 메시지도 기록하지 않습니다. HTTP redirect는 허용하지 않습니다.
- `wrangler secret put`은 새 버전을 즉시 배포합니다. 배포 승인 전 준비에는 `wrangler versions secret put` 또는 보안 임시 파일을 사용하는 `wrangler versions upload --secrets-file`을 사용하고, 확인한 버전 ID를 지정해 배포합니다. 임시 파일은 저장소 밖에서 접근권한을 제한하고 사용 후 삭제합니다. 실제 키 등록·운영 API 검증 여부는 별도로 확인해야 합니다.

응답 예: `"krw_reference": { "total_krw": 3856000, "rate": 1512.34, "rate_date": "2026-11-06", "source": "koreaexim-deal-bas-r", "price_on_request": false }`

## API

`POST /chat`

```json
{
  "messages": [{ "role": "user", "content": "EMBLA에 에보니 지판 하면 얼마예요?" }],
  "configuration": { "model": "EMBLA", "selections": { "fretboard": "wenge" }, "specialOptions": [], "accessories": [] },
  "language": "ko"
}
```

- `messages`: user와 assistant가 번갈아 오고 user로 끝나는 텍스트 턴, 최대 30개. 사용자 턴은 2000자, assistant 턴은 6000자 이하이고 전체 대화는 20000자 이하입니다. JSON 요청 본문은 128 KiB까지 읽습니다.
- `configuration`: configurator의 `selectedModel`, `selections`, `specialOptions`, `accessories`. 없으면 생략합니다.
- `language`: `en` | `de` | `ko`.

응답: `{ "reply": "...", "quote": { "total": 2600, "lines": [...], ... } | null, "stop_reason": "end_turn" }`

### Configurator 채팅 UI

`configurator.html`에는 이미 채팅 UI가 붙어 있습니다(`assets/configurator-chat.js`, `assets/configurator-chat.css`). Worker를 배포한 뒤 `configurator.html`의 아래 태그에 Worker URL을 넣으면 켜집니다. 비어 있으면 채팅이 보이지 않습니다.

```html
<script src="./assets/configurator-chat.js?v=..." data-endpoint="https://ravenforge-quote-consult.<your-subdomain>.workers.dev"></script>
```

사양 요약 카드 머리글의 "견적 상담" 버튼과 모바일 하단 바의 "상담" 링크로 열립니다. 대화는 패널을 닫아도 유지되고, 새로고침하면 사라집니다.

다른 페이지에서 직접 호출하는 예:

```js
const history = [];
async function ask(text, state) {
  history.push({ role: 'user', content: text });
  const res = await fetch('https://ravenforge-quote-consult.<your-subdomain>.workers.dev/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history, configuration: state, language })
  });
  const data = await res.json();
  if (!res.ok) { history.pop(); throw new Error(data.error); }
  history.push({ role: 'assistant', content: data.reply });
  return data;
}
// state = { model: selectedModel, selections, specialOptions, accessories }
```

## 설정과 배포

```bash
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npm run deploy
```

`wrangler.toml`의 `[vars]`:

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | `https://raven-deadwire.github.io` | `/chat`을 호출할 수 있는 페이지 origin (쉼표로 구분) |
| `MODEL` | `claude-opus-5-5` | `claude-sonnet-5-5`로 바꾸면 토큰당 비용이 절반입니다 |
| `EFFORT` | `medium` | `low`로 낮추면 더 빠르고 저렴합니다 |

API 응답은 호출당 최대 4096 출력 토큰, 요청 전체 최대 8192 출력 토큰·4회 호출·8개 가격 도구 호출·90초로 제한하고 SDK 자동 재시도는 끕니다. 키나 rate-limit binding이 없으면 요청을 차단합니다.

방문자 IP당 분당 5회를 Cloudflare Rate Limiting binding에 설정합니다(`[[ratelimits]]`). 이는 위치별·eventual consistency 기반 근사 제한이며 정확한 6번째 요청 차단 또는 전역 비용 한도를 보장하지 않습니다 ([Cloudflare 공식 문서](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/#accuracy)). 2026-10-30 고정 IP 시험(분당 10회 설정)에서는 몇 초 안에 몰아 보낸 15회가 모두 통과했고, 1초 간격으로 보낸 25회 중에서는 약 20회 이후 일부만 429로 차단되어 설정값을 5로 낮췄습니다. 엄격한 전역 제한이 필요하면 Durable Objects로 별도 구현해야 합니다. Origin 검사는 브라우저 밖에서는 우회할 수 있으니, Claude Console에서 월 지출 한도도 걸어 두세요.

로컬 실행: `.dev.vars`에 `ANTHROPIC_API_KEY=...`와 `ALLOWED_ORIGINS=http://localhost:8000`을 넣고 `npm run dev`를 실행합니다.

## 비용

시스템 프롬프트와 카탈로그에 prompt cache를 사용합니다. 실제 요금은 Console의 Usage에서 확인합니다. 토큰·IP 제한은 월 비용 상한을 대체하지 않으며, 공개 전 Claude Console에서 월별 지출 한도와 자동 충전 설정을 확인해야 합니다. 2026-10-30 점검 시 조직 한도 US$20/월, 자동 충전 OFF를 확인했습니다. 이 한도는 해당 조직의 다른 API 사용과 공유됩니다.

## 테스트

```bash
npm test               # 가격 계산과 대화 처리 (API 호출 없음)
npm run check:catalog  # 카탈로그 복사본이 최신인지 확인
# npm ci (devDependencies 포함) 후 Workers 런타임의 공유 조회/요청 수명 검사:
node tools/check-fx-workerd.mjs
```
