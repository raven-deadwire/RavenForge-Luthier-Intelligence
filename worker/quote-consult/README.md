# Quote consultation Worker

Configurator 옆에서 고객의 견적 상담에 답하는 Cloudflare Worker입니다. Claude API를 쓰고, 가격은 `configurator.html`과 같은 카탈로그와 규칙으로 계산합니다.

## 동작 방식

- **가격은 코드가 계산합니다.** 모델은 `price_configuration` 도구를 호출하고, 도구가 configurator의 `summary`와 같은 방식(같은 `normalizeSelections`, `isOptionVisible`, 가격표)으로 줄별 금액과 합계를 돌려줍니다. 모델이 금액을 직접 만들지 않도록 프롬프트에서 막아 두었습니다.
- **카탈로그는 사이트에서 복사합니다.** `npm run build:catalog`가 `configurator.html`과 `assets/configurator-platforms.js`에서 데이터와 규칙을 `src/catalog.generated.js`로 그대로 복사합니다. Workers는 eval을 쓸 수 없어서 빌드할 때 복사합니다. 사이트 가격이나 옵션을 바꾸면 다시 실행해야 하고, 복사본이 오래되면 CI(`.github/workflows/quote-consult-worker.yml`)가 실패합니다.
- **알려진 차이:** 화면에서 옵션을 클릭할 때 함께 바뀌는 연동(예: Fishman 픽업을 고르면 EQ도 Fishman으로 바뀜)은 `handleOptionChange` 안에 있어서 복사하지 않았습니다. 그래서 "이걸 바꾸면 얼마?" 같은 가정 견적은 화면과 다를 수 있습니다. 모델은 이를 예상 금액으로 안내하고, 최종 가격은 RavenForge가 확정한다고 말합니다. 페이지가 보내는 *현재* 구성의 가격은 화면과 같습니다.
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

- `messages`: user와 assistant가 번갈아 오고 user로 끝나는 텍스트 턴, 최대 30개. 각 턴은 2000자 이하.
- `configuration`: configurator의 `selectedModel`, `selections`, `specialOptions`, `accessories`. 없으면 생략합니다.
- `language`: `en` | `de` | `ko`.

응답: `{ "reply": "...", "quote": { "total": 2600, "lines": [...], ... } | null, "stop_reason": "end_turn" }`

페이지에서 호출하는 예:

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

방문자 IP당 분당 10회로 제한합니다(`[[ratelimits]]`). Origin 검사는 브라우저 밖에서는 우회할 수 있으니, Claude Console에서 월 지출 한도도 걸어 두세요.

로컬 실행: `.dev.vars`에 `ANTHROPIC_API_KEY=...`와 `ALLOWED_ORIGINS=http://localhost:8000`을 넣고 `npm run dev`를 실행합니다.

## 비용

시스템 프롬프트(카탈로그 포함, 약 8K 토큰)는 프롬프트 캐시에 들어가서 두 번째 요청부터는 캐시 읽기 요금($0.20/MTok, Opus 5.5)으로 처리됩니다. 상담 한 턴은 보통 몇 센트 이하입니다. 실제 사용량은 Console의 Usage 화면에서 확인하세요.

## 테스트

```bash
npm test               # 가격 계산과 대화 처리 (API 호출 없음)
npm run check:catalog  # 카탈로그 복사본이 최신인지 확인
```
