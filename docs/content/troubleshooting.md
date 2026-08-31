# Troubleshooting

Run `npx tamash-playwright doctor` first — it names most of these.

## Nothing heals — no `[self-healer]` lines at all

- **`HEALER_PROVIDER` not set**, or its `_MODEL` / key missing → `doctor` → AI Provider `[WARN]`/`[FAIL]`.
- **`HEALER_ENABLED=false`** somewhere (a shell export, a CI env) overriding `.env`.
- **You imported `test` from `@playwright/test`**, not `tamash-playwright`, in the spec file.

## Heals show `stage=no_snapshot`

`actionTimeout` is missing or too close to `timeout` — the broken locator burns the whole test budget before failing, leaving no time to heal. Set `actionTimeout` well below `timeout`. See [Installation](installation.html#3-set-actiontimeout).

## `doctor` AI Provider `[FAIL]`

| Category | Fix |
|---|---|
| `not-installed` | Run the `npm install` / vendor installer `doctor` prints. `claude-subscription` needs `@anthropic-ai/claude-agent-sdk`; `copilot-subscription` needs `@github/copilot-sdk`; the CLI providers need their CLI on `PATH`. |
| `not-authenticated` | Bad/absent key, expired login, or over quota. Run `claude login` / check the key / confirm the subscription is active. |
| `timeout` | The provider didn't answer within your `actionTimeout`. Raise it. For `claude`/`copilot`-subscription it can be a one-time CLI cold start — re-run once. Slower models (`gpt-oss:120b`, some Gemini) may just need a bigger budget. |
| `bad-model` | The `<PROVIDER>_MODEL` value isn't a model that provider serves. |
| `network` | DNS / proxy / firewall, or a wrong custom base URL. |
| `bad-response` | Connected, but the reply couldn't be parsed — usually a model that's too small or not following instructions. Try a stronger one. |

## First `claude-subscription` / `copilot-subscription` heal fails with "not authenticated?"

Often the one-time subprocess cold start exhausting a tight `actionTimeout`, not a real auth problem. Raise `actionTimeout` or just re-run before assuming your login/token is broken.

## `copilot-subscription` in GitHub Actions: `Authorization error, you may need to run /login`

Copilot must be enabled for **the repo owner** (org, if the repo belongs to one) — a personal subscription doesn't carry to an org's repos. Use a personal-account PAT as `COPILOT_GITHUB_TOKEN` instead. See [Claude / Copilot subscription](providers-subscription.html#github-actions).

## A non-Playwright runner hangs after all tests pass

`copilot-subscription` keeps a subprocess open. Call `closeCopilotSubscriptionClient()` in the runner's teardown. See [Running in CI](ci.html#non-playwright-runners).

## `cursor-subscription`: lots of `stage=ai_declined`

Cursor's `agent` CLI answers conversationally rather than with JSON. Switch to `kiro-subscription` or `codex-subscription`. See [Kiro / Codex / Cursor](providers-cli-subscription.html#cursor).

## A `waitFor` / assertion "isn't healing"

By design — see [How healing works](how-healing-works.html#what-is-never-healed). A timeout there can legitimately mean "this correctly never appeared."

## Still stuck?

[Open an issue](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues/new/choose) — pick the template, include your `HEALER_PROVIDER`, package version, and the `[self-healer]` console line.
