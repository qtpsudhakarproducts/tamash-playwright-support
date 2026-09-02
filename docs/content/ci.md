# Running in CI

Runtime healing works unattended — a broken locator in CI is recovered from the live page and the run stays green, with every heal in the artifacts. Two things are worth setting up beyond that.

## 1. A provider that authenticates in CI

| Provider | CI auth |
|---|---|
| `ollama` / `openai` / `anthropic` / `gemini` | the API key as a secret |
| `claude-subscription` | `CLAUDE_CODE_OAUTH_TOKEN` secret (`claude setup-token`) |
| `copilot-subscription` | on GitHub Actions: `permissions: copilot-requests: write` if the repo owner has Copilot, otherwise a `COPILOT_GITHUB_TOKEN` PAT — see [Claude / Copilot subscription](providers-subscription.html#github-actions) |
| `tamash` | nothing — no key, no network |
| `kiro` / `codex` / `cursor` subscription | **not supported in CI** — local development only |

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      HEALER_ENABLED: true
      HEALER_PROVIDER: ollama
      OLLAMA_MODEL: gpt-oss:120b
      OLLAMA_API_KEY: ${{ secrets.OLLAMA_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/* }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with: { name: playwright-report, path: playwright-report/ }
      - uses: actions/upload-artifact@v4          # the heal log — apply-heals reads this
        if: ${{ !cancelled() }}
        with:
          name: heals-log
          path: .tamash-playwright/heals.jsonl
          if-no-files-found: ignore
```

## 2. `apply-heals` in CI (heals become a reviewed PR)

Add a job after `test` that downloads the heal-log artifact, applies the fixes to source, verifies them **with healing off**, and opens a PR. A cache hit within one CI run is free, but only `apply-heals` landing the real fix stops the repeat AI calls across runs.

```yaml
  apply-heals:
    needs: test
    if: ${{ !cancelled() && github.event_name == 'push' }}
    runs-on: ubuntu-latest
    permissions: { contents: write, pull-requests: write }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/* }
      - run: npm ci
      - uses: actions/download-artifact@v4
        with: { name: heals-log, path: shard-logs }
        continue-on-error: true                    # no artifact = nothing healed this run
      - run: npx tamash-playwright apply-heals --logs-dir shard-logs
      # ... git diff check -> install browsers -> re-run affected tests with HEALER_ENABLED=false
      #     -> open a PR with the verified diff
```

`--logs-dir <path>` merges every `heals.jsonl` found under `<path>` (any nesting), so it scales to sharded suites. A full working example lives in the [TypeScript sample repo](https://github.com/qtpsudhakarproducts/tamash-playwright-typescript-playwright)'s `.github/workflows/playwright.yml`. See [Making heals permanent](apply-heals.html) for how `apply-heals` decides what to change.

## Non-Playwright runners

`copilot-subscription` keeps a shared subprocess open across calls for performance. Playwright's own runner force-exits regardless — invisible there — but a runner that doesn't (Cucumber, a plain script) will hang after your tests finish. Call this from its teardown hook (a no-op if `copilot-subscription` was never used):

```ts
import { closeCopilotSubscriptionClient } from 'tamash-playwright';
// Cucumber AfterAll, Jest afterAll, your script's cleanup, …
await closeCopilotSubscriptionClient();
```
