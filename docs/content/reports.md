# Reports & logs

Every healing attempt — succeeded or not — is recorded in three places.

## The Playwright HTML report

`npx playwright show-report` — no separate report to check.

- **An annotation** on the test summarizing what happened: `Recovered using ollama:gpt-oss:120b (getByRole("button", { name: "Submit" }))`, or `self-heal-needs-review`, or `self-heal-failed`.
- **A JSON attachment** (`self-healing-<action>`) with the full detail: provider, whether vision / action-recovery was involved, the suggested selector, token usage, and — if it didn't heal — the stage it stopped at (`ai_declined`, `replay_failed`, `provider_error`, …). Error text is plain (ANSI colour codes stripped, so it's readable rather than a wall of escape sequences).
- **On a failed heal**, a second attachment (`self-healing-<action>-aria-snapshot`) with the exact accessibility tree the model reasoned over — the ground truth for "did it pick the wrong element, or pick right but the replay failed?"
- **Where in your code** the locator was created — a test file or a Page Object, whichever it really is.

## The console line

Printed as it happens, one line per attempt, with the exact copy-pasteable locator it used:

```
[self-healer] src/pages/loginpage.ts:11 — locator.fill "Username Textbox" -> HEALED [provider=ollama:gpt-oss:120b, vision=no, actionRecovery=no, suggested="getByRole("textbox", { name: "Username" })", 620 tokens (489 input + 131 output)] — locator.fill: Timeout 8000ms exceeded.
```

A not-healed line names the stage:

```
[self-healer] src/pages/x.ts:8 — locator.waitFor "…" -> NOT healed [provider=skipped, stage=state-wait-not-healed] — locator.waitFor: Timeout 10000ms exceeded.
```

## `heals.jsonl`

`.tamash-playwright/heals.jsonl` — one JSON line per successful heal. This is what powers [caching](caching.html) and [`apply-heals`](apply-heals.html). Gitignored; upload it as a CI artifact so the `apply-heals` job can read it (see [Running in CI](ci.html)).

## Failure stages

| Stage | Meaning |
|---|---|
| `no_provider` | `HEALER_PROVIDER` not set / its env vars missing |
| `disabled` | `HEALER_ENABLED=false` |
| `no_snapshot` | the action didn't fail in time to capture a snapshot — usually `actionTimeout` too close to `timeout` |
| `not-a-selector-issue` | the element was found; the failure was actionability, not a missing selector |
| `state-wait-not-healed` | a `waitFor` — never sent to the model (see [How healing works](how-healing-works.html#what-is-never-healed)) |
| `ai_declined` | the model returned `{"strategy":"none"}` — no confident match |
| `provider_error` | the provider call itself failed (network, aborted at the timeout, unparseable) |
| `unbuildable_suggestion` | the model's answer couldn't be turned into a working locator |
| `replay_failed` | a durable locator was built, but replaying the action on it still failed |

## Understanding why a test failed

**TypeScript only.** Healing covers **actions** — `expect()` assertions are never touched, since silently "fixing" one could mask a real bug. Once a test's retries are exhausted and it's still failing, a separate capability classifies *why*, on by default (`FAILURE_ANALYSIS_ENABLED`, see [Environment variables](env-vars.html)): `likely-defect`, `likely-wrong-locator`, `likely-timing-or-environment`, or `inconclusive`, with a short explanation. No reporter to add — it runs the moment `test` is imported, reusing whichever `HEALER_PROVIDER` is already configured (`tamash` always declines — classifying a failure needs reasoning, not text matching).

Covers any final failure, not just `expect()` — an action healing already tried and reported on (its own `self-heal-failed` annotation) is folded into the same classification, using healing's own diagnosis (provider, failure stage, its reason) as extra context, rather than skipped or explained a second time.

```
[self-healer] checkout > pays with a saved card — failure analysis: likely-defect — The "Order confirmed" heading never appeared on any attempt; the page consistently shows a generic error banner instead.
```

| Verdict | Meaning |
|---|---|
| `likely-defect` | the app looks broken (error state, wrong content, a crash) — worth filing a bug |
| `likely-wrong-locator` | something that plausibly *is* the target exists on the page, under different text/structure — fix the test |
| `likely-timing-or-environment` | looks like a loading race, or the failure varied between attempts — investigate stability, not the app or selector |
| `inconclusive` | the evidence doesn't point any direction |

Spends a real AI call on every genuinely-failed test (unlike healing, which only spends when an action fails). Reported the same way as healing's own reports: a `failure-analysis` annotation, a `failure-analysis-tokens-used` annotation (its own type, separate from healing's `llm-tokens-used`, so the two costs can be compared), and a `failure-analysis` JSON attachment with every attempt's error and page snapshot. `expect()` itself is never touched — this only ever adds information next to a failure that already happened.

"Exactly once, on the final attempt" is reliable when retries come from `playwright.config.ts`'s top-level `retries:` (or `--retries`). A per-file `test.describe.configure({ retries })` override isn't visible to it, so that case analyzes every failing attempt instead of just the last — still safe, no crash or wrong verdict, just extra AI calls for that test.

## Trends across runs: `tamash-playwright-dashboard`

Everything above is per-run. [`tamash-playwright-dashboard`](https://www.npmjs.com/package/tamash-playwright-dashboard) is a separate Playwright reporter package (own `npm install`, own npm listing — TypeScript only, since it's a Playwright reporter) that tracks history across runs: pass-rate trends, per-test history, step-level detail with real locators and source locations, and a Test Health view (Newly Failed, Newly Fixed, Still Failing with fail streaks, Flaky). Specific to this package: a **Self-Healing Analytics** page — tests/elements healed, token usage per run and cumulatively with a trend chart, and every heal event across your recorded history.

```sh
npm install -D tamash-playwright-dashboard
```

```ts
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['list'],
    ['tamash-playwright-dashboard'],
  ],
});
```

Zero configuration for the self-healing side: it reads the `self-healing-<action>` JSON attachment described above straight off the test result, so installing both packages is the entire integration. Output is one self-contained `index.html` plus `history.json` — no server, safe to open via `file://` or host anywhere. [Live sample report](https://qtpsudhakarproducts.github.io/tamash-playwright-dashboard/) (synthetic demo data) · [live from the TypeScript sample project](https://qtpsudhakarproducts.github.io/tamash-playwright-typescript-playwright/dashboard/index.html) (real heals from CI, growing every run).
