# Quote consultation release review — 2026-10-30

PR: https://github.com/raven-deadwire/RavenForge-Luthier-Intelligence/pull/77

## Release gate

**Hold until the revised branch's browser and PDF workflows pass.** Earlier green runs on the original activation commit do not validate these changes. At review time GitHub reported all hosted runners busy, on both `ubuntu-24.04` and `ubuntu-latest`; Ubuntu 24.04 userland is retained in the CI container. The local sandbox cannot launch Chromium. No successful new browser/PDF run or public-site chat verification is claimed here.

## Reproduced defects and corrections

- ASKR standard Fishman → EMG pickup: the original live tool returned €3,445 with the Fishman EQ still selected. The actual configurator selects Glockenklang EQ (+€210), giving €3,655. The Worker now extracts and applies the page's actual option-change handler. A new real Claude request returns €3,655 and the correct paired selections.
- Assistant replies over 2,000 characters could make the next request fail validation. Separate user/assistant limits (2,000/6,000), a 20,000-character history limit and frontend history guard fix the mismatch.
- Add bounded body streaming (128 KiB), request/token/tool budgets, no automatic SDK retries, timeouts and fail-closed behavior when the key or rate-limit binding is absent. Disable the pending textarea to prevent failed-request recovery from overwriting newly typed text; constrain mobile textarea width.

## Evidence completed

| Check | Result |
| --- | --- |
| Worker unit tests | 24 passed |
| Page/Worker parity | 1,048 model/category/option transitions compared with the exact page click handler and summary calculation; passed |
| Instrument options/accessories | Every catalog entry compared with the page summary, including passive-only gating; passed |
| Fishman/EQ coupling | Pickup and EQ selection in both directions; passed |
| Catalog freshness and existing source contracts | Passed |
| Real Claude requests | 4 models × 3 languages plus ASKR Fishman → EMG = 13/13 passed |
| Actual public-page fretboards before activation | EMBLA and ASKR each show all six offered fretboards; ebony is +€50, totals €2,600 and €3,250 respectively |
| HTTP origin/method/content/body boundaries | 6/6 passed; see JSON evidence |
| Revised chat desktop/mobile and PDF export | Automated 24-case matrix added; execution pending |

The 12 model/language live requests include gold hardware (+€150), premium gigbag (+€200), leather strap (+€300), and ebony (+€50) on the three bass models. Expected/actual ex-VAT totals: EDDA €2,800; EMBLA €3,250; ASKR €3,900; GRAMR €2,650. The JSON evidence records options, tool totals and actual KO/EN/DE answers. This verifies model coverage separately from the other API prototype; that prototype's reported omission is not attributed to this implementation.

- [Live quotes](quote-chat-live-2026-10-30.json)
- [HTTP guards and rate-limit limitation](quote-chat-guards-2026-10-30.json)

## Deployment and cost controls inspected

The repaired Worker is deployed as `18792a77` (100% traffic), response marker `20261030-quote-review-1`; previous deployment `97bdb2ff` remains available for rollback. The homepage activation is still gated by PR #77.

- Production origin allowlist: `https://raven-deadwire.github.io`; disallowed/missing Origin returned 403. This is browser-origin filtering, not authentication against non-browser clients.
- `ANTHROPIC_API_KEY` is an encrypted Cloudflare Secret. Its value was not accessed; no tracked key literals or local environment files were found.
- Native `RATE_LIMITER` binding: namespace 1001, 10 requests per 60 seconds. Unit tests verify the denial path and Retry-After. **Live 429 was not reproduced**, including a persistent-connection burst; do not claim strict rate-limit enforcement was proven. Cloudflare documents location-local, eventually consistent approximate enforcement: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/#accuracy
- Claude Console organization monthly limit: US$20; automatic reload OFF. Shared by the organization's API usage, not a dedicated consultation budget. No billing setting was changed.
- Each request: 90-second deadline, at most 4 API rounds, 8 tool calls, 4,096 output tokens per call and 8,192 across the request. Input and history limits bound incoming payloads. These controls do not replace the provider's monthly spend limit.

## Remaining acceptance steps

1. Obtain green revised-head chat/browser, candidate PDF and existing regression checks, inspect artifacts and fix failures.
2. Merge #77 only after those checks pass; verify Pages deployment serves the merged version.
3. On the deployed homepage, test real chat for each model, language and mobile/desktop layout; download a quote PDF after chatting and capture evidence.

## CI follow-up — 2026-10-30 12:00 KST

At head `29020818db105dd43e2acf012fe51ceb91340f6f`, Worker CI passed all 24 tests and 1,048 option transitions; chat UI passed 24 combinations and four PDF downloads (mock Claude responses, separate from live API evidence). Tailwind and embed checks passed. Chat evidence archive SHA-256: `50d510d01ce63688cd53c129d4fbe968eeba673177c69688c249fb32ee319a7c`.

Production candidate job [123837062649](https://github.com/raven-deadwire/RavenForge-Luthier-Intelligence/actions/runs/40986002339/job/123837062649) generated all 24 quote, 48 layout and 42 stress PDFs, but each OCR step failed before inspection: Node wrote `/__w/_temp/...` while shell-expanded `runner.temp` pointed Python at `/home/runner/work/_temp/...`. This is a CI container path mismatch, not evidence of a quote/PDF content defect. Set all producer, inspector, packager and artifact paths in that workflow to `/tmp/ravenforge-qa`, retaining every test and assertion. The corrected head still requires a complete green rerun and artifact inspection before merge. Candidate archive SHA-256: `93532306fe42fe2a162ca44c4ec71e8f176cf109b30c72a6f3f17379fadc75bd`.
