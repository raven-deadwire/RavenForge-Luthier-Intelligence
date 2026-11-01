# Specification grounding validation evidence

Base: PR #82, `f1742bcea13989f4f52d2b2c88d716322f8847e0`.
Candidate build: `20261101-advisor-spec-grounding-1`.

These records distinguish deterministic tests, mocked transport, recorded old
production responses and the attempted opt-in live-validation command. **No new
candidate OpenAI response was obtained in this run.**

Terminal color escapes and trailing padding are removed from the text logs;
test messages, counts and outcomes are preserved.

| File | Evidence class | Result |
|---|---|---|
| `worker-tests.log` | Deterministic code tests; mocked API transport; synthetic text-audit fixtures | 63 tests passed (34 existing, 29 new); includes 1,108 page/price transitions, 45 source/locale configurations, and 12 targeted mock transport cases |
| `worker-npm-test.log` | Unchanged `npm test` entry point, process isolation | All 12 test files passed; this runtime reports file counts in this mode |
| `catalog-check.log` | Build-time source/catalog parity | Passed |
| `bundle-dry-run.log` | Local Wrangler bundle, no deployment | Passed |
| `baseline-audit.json` | Reinspection of four recorded old production replies | Four known errors identified; zero new API calls |
| `candidate-live-blocked.json` | Opt-in live validator setup outcome | Missing API key, exit 2; 16 requested cases, zero provider attempts/responses and zero completed cases |
| `source-manifest.json` | Reproducibility | SHA-256 of candidate sources, tests, fixtures, generator and page inputs |

The category counts above overlap: the specific cases run inside the 63 tests
and must not be added again to the total. Mock final answers are sentinels, not
evidence that OpenAI generated correct prose. Hand-written text-audit fixtures
test warning detection only. Even live responses with no targeted warning need
manual specification review.

The original production requests/responses remain under
[`../instrument-advisor-20261031`](../instrument-advisor-20261031/). The lean
baseline audit references their paths, hashes and selectors instead of copying
them into the follow-up. Their successful HTTP status is not semantic success.

Commands were run from `worker/quote-consult`:

```bash
node --test --test-isolation=none --test-reporter=tap test/*.test.js
npm test
npm run check:catalog
WRANGLER_SEND_METRICS=false wrangler deploy --dry-run
node tools/validate-specifications.mjs --recorded --output /tmp/rf-spec-recorded-final
node tools/validate-specifications.mjs --live --include-original --output /tmp/rf-spec-live-final
```

The final command was blocked before any provider request. Rerun it in an
authorized development environment with an existing `OPENAI_API_KEY`, using a
fresh output directory. Do not classify that future run as deployed-Worker or
browser validation; the harness calls the local candidate's existing Worker
handler and Responses adapter.
