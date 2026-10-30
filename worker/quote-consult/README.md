# Quote consultation Worker

Configurator 옆에서 고객의 견적 상담에 답하는 Cloudflare Worker입니다. Claude API를 쓰고, 가격은 `configurator.html`과 같은 카탈로그와 규칙으로 계산합니다.

## 동작 방식

- **가격은 코드가 계산합니다.** 모델은 `price_configuration` 도구를 호출하고, 도구가 configurator의 `summary`와 같은 방식(같은 `normalizeSelections`, `isOptionVisible`, 가격표)으로 줄별 금액과 합계를 돌려줍니다. 모델이 금액을 직접 만들지 않도록 프롬프트에서 막아 두었습니다.
- **카탈로그는 사이트에서 복사합니다.** `npm run build:catalog`가 `configurator.html`과 `assets/configurator-platforms.js`에서 데이터와 규칙을 `src/catalog.generated.js`로 그대로 복사합니다. Workers는 eval을 쓸 수 없어서 빌드할 때 복사합니다. 사이트 가격이나 옵션을 바꾸면 다시 실행해야 하고, 복사본이 오래되면 CI(`.github/workflows/quote-consult-worker.yml`)가 실패합니다.
- **옵션 연동도 같은 소스입니다.** 빌드가 실제 `handleOptionChange`의 본문을 복사합니다. 가상 변경은 배열 순서대로 화면 클릭과 같은 Fishman/EQ·너트·브리지 연동을 거치며, 거절된 변경과 사용할 수 없는 추가 옵션을 별도로 반환합니다.
- **대화 기록은 페이지가 가집니다.** Worker는 상태를 저장하지 않습니다. 페이지가 텍스트 대화 기록과 현재 configurator 상태를 매번 보내고, Worker는 답변 텍스트와 마지막 견적 결과를 돌려줍니다.

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
```
