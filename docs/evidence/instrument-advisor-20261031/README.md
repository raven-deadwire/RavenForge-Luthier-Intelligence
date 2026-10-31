# Advisor validation evidence, 2026-10-31

See [the Korean audit report](../../INSTRUMENT_ADVISOR_VALIDATION_20261031.ko.md) for scope and limitations.

- `live-api/*.json`: real requests to the deployed Worker, four phases per model/language. Each entry preserves the exact request, HTTP status, response body, completion time and latency. `parity` compares the returned quote to the audited main catalog; it does not grade prose accuracy.
- `live-apply.json`: four fresh production requests from a local candidate browser, without naming the target model, followed by explicit Apply. The `/chat` transport uses curl through the test environment's HTTPS proxy; the returned body is not generated or modified by a mock.
- `unaccepted-drafts.json`: three fresh production requests retaining the original ASKR configuration after an unaccepted comparison.
- `replay-report.json`: saved production responses replayed in 12 model/language combinations at 1440px and 375px. No new OpenAI requests. Recorded failures are retained.
- `*-before.log`: the added regressions failing against the original implementation.
- `*-final.log`, `advisor-existing.log`, `chat-existing.log`, `catalog-check.log`: local candidate checks. The browser regression suites in these logs use mocked API responses.
- `homepage-advisor.json`: localized homepage link and panel checks.
- `live-*-applied.png`: screenshots following explicit application of fresh production responses.
- `summary.json`: machine-readable counts, including failures.

The model's private provider response and request ID are not exposed by the public Worker. Provider identification is based on the audited deployment configuration and Worker version, not on a direct OpenAI request from this test host. No customer messages or orders were submitted; enquiry downloads are local text files.

## Deterministic regressions

From the repository root, install the project's Worker dependencies and Playwright, then serve the repository on port 8000 in a separate terminal:

```sh
npm --prefix worker/quote-consult ci
npm --prefix worker/quote-consult run check:catalog
npm --prefix worker/quote-consult test
python3 -m http.server 8000
```

With Playwright and Chromium installed:

```sh
node tools/test_advisor_enquiry_regressions.cjs
node tools/test_advisor_catalog.cjs
node tools/test_instrument_advisor.cjs
node tools/test_configurator_chat.cjs
```

Use `CHAT_QA_URL` for another local configurator URL and `CONFIGURATOR_BROWSER_PATH` for an installed Chromium. The before/after logs document the expected regressions. Do not confuse those mocks with the live evidence.

## Replaying one live API request

Extract a saved `request` to a JSON file and POST it to the deployed Worker's `/chat` endpoint with `Content-Type: application/json` and an allowed site `Origin`. This makes a new paid model request and may produce different wording. Keep requests sequential and respect the Worker's rate limits. Reading or replaying the saved `body` offline makes no provider request.

The audit's 48-request matrix uses the target model's default configuration, and its initial prompt names that model; the separate four `live-apply.json` prompts deliberately omit model names. The matrix switches the draft request to the compared configuration to represent acceptance. The separate unaccepted-draft requests keep the original configuration. This distinction is necessary when interpreting the draft's specification.
