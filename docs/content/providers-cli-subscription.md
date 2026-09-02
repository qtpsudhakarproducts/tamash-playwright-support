# Kiro / Codex / Cursor subscription

Heal off a **Kiro**, **OpenAI Codex**, or **Cursor** subscription via the vendor's own CLI — no API key. **Local development only — never CI** (see below); available in both TS and Python.

## Why local-only

None of the three has a confirmed long-lived, subscription-only auth token for unattended CI — each expects an interactive login. Use an [API-key provider](providers-api-key.html) or [`claude-subscription` / `copilot-subscription`](providers-subscription.html) for CI.

All three run their CLI in a **read-only mode**, so a heal call can't edit files or run commands:

| Provider | CLI invocation |
|---|---|
| `kiro-subscription` | `kiro-cli chat --no-interactive` — no tool trust granted |
| `codex-subscription` | `codex exec --skip-git-repo-check` — codex's default read-only sandbox, `approval: never` |
| `cursor-subscription` | `agent -p --trust --mode ask --output-format json` — Cursor's read-only Q&A mode |

Every call spawns a fresh CLI process (none of these vendors ship a first-party TS or Python SDK), so they're **slower per call** than an API-key provider — set `actionTimeout` generously (30–45s), and pad it further for a cold process spawn in CI-like environments.

## Kiro

`kiro-cli` is a separate tool from the `kiro` IDE launcher — see [kiro.dev](https://kiro.dev).

```sh
HEALER_PROVIDER=kiro-subscription
KIRO_API_KEY=...        # or run `kiro-cli login`
```

Verified healing real broken locators. Answers cleanly in a few seconds.

## Codex

```sh
HEALER_PROVIDER=codex-subscription
# codex login   (device-code auth may need enabling in your ChatGPT security settings)
```

Verified healing real broken locators. `codex exec` runs read-only with no approval prompts.

## Cursor

**Experimental.**

```sh
HEALER_PROVIDER=cursor-subscription
# agent login   (or set CURSOR_API_KEY)
# CURSOR_SUBSCRIPTION_MODEL=   optional
```

> Cursor's `agent` is an interactive assistant, not a one-shot completion endpoint — given a healing prompt it often replies conversationally instead of with the JSON the healer needs, so the heal is declined (`stage=ai_declined`) more often than with Kiro/Codex. It's kept for feedback but **prefer `kiro-subscription` or `codex-subscription`.**
