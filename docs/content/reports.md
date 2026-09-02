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
