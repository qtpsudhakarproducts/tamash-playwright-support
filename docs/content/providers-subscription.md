# Claude / Copilot subscription

If you have a personal **Claude** (Pro/Max/Team/Enterprise) or **GitHub Copilot** subscription (including the free tier) but no API key issued to you, use that instead — no billing setup, no key to paste. These are the only "subscription, no API key, **works in CI too**" providers. **TypeScript only.**

## Claude

Works locally and unattended in CI.

```sh
npm install -g @anthropic-ai/claude-code     # the CLI, so `claude login` exists
npm install @anthropic-ai/claude-agent-sdk   # the SDK tamash-playwright calls
claude login                                 # one-time, locally
```

```sh
HEALER_PROVIDER=claude-subscription
CLAUDE_SUBSCRIPTION_MODEL=haiku
```

For CI, mint a long-lived token once (`claude setup-token`) and set it as a secret:

```sh
CLAUDE_CODE_OAUTH_TOKEN=the-token-you-copied
```

## GitHub Copilot

Works locally, and unattended on **GitHub Actions** specifically.

```sh
npm install -g @github/copilot      # the CLI, to sign in with
npm install @github/copilot-sdk     # the SDK tamash-playwright calls (wraps the CLI, both required)
copilot                             # sign in once, locally
```

```sh
HEALER_PROVIDER=copilot-subscription
COPILOT_SUBSCRIPTION_MODEL=mai-code-1-flash-picker
```

### GitHub Actions

If **the repo's owning account/org has Copilot enabled**, no secret is needed — just grant the job permission:

```yaml
permissions:
  copilot-requests: write
```

> **Gotcha, confirmed by testing.** This only works if Copilot is enabled for whoever *owns the repo*. A personal Copilot subscription does **not** carry to a separate organization's repos, even one you administer. If the job fails with `Authorization error, you may need to run /login` despite the permission being set, use a personal-account fine-grained PAT instead — set it as `COPILOT_GITHUB_TOKEN` (**Account permissions → Copilot Requests: Read**). The SDK checks that variable ahead of the ambient `GITHUB_TOKEN`.

## First-call cold start

Both providers spawn the vendor's CLI as a subprocess — the **first** call in a fresh process pays a one-time spawn + auth cost on top of the model call. On a slow machine that alone can exhaust a tight `actionTimeout` and surface as a misleading "not authenticated?" warning. `doctor` tests connectivity within your real `actionTimeout` and, on a `[FAIL]` for these two, explicitly suggests it may be the cold start rather than a real auth problem — try raising `actionTimeout` (or just re-run) before assuming your login is broken.

## Non-Playwright runners

`copilot-subscription` keeps a shared subprocess open. Call `closeCopilotSubscriptionClient()` from your runner's teardown — see [Running in CI](ci.html#non-playwright-runners).

## Other subscriptions

A ChatGPT or Google AI subscription can back **local** runs via those vendors' own CLIs — see [Kiro / Codex / Cursor](providers-cli-subscription.html) — but neither offers unattended CI use yet.
