# Providers — overview

`tamash-playwright` needs something to decide where a broken element went. Pick one with `HEALER_PROVIDER` in your [`.env`](env-vars.html).

| Provider | Auth | CI | Languages | Notes |
|---|---|---|---|---|
| [`ollama`](providers-api-key.html#ollama) | free API key | ✅ | TS, Python, Java | Ollama Cloud; good default |
| [`openai`](providers-api-key.html#openai) | API key | ✅ | TS, Python, Java | |
| [`anthropic`](providers-api-key.html#anthropic) | API key | ✅ | TS, Python, Java | |
| [`gemini`](providers-api-key.html#gemini) | API key | ✅ | TS, Python, Java | |
| [`claude-subscription`](providers-subscription.html#claude) | `claude login` / OAuth token | ✅ | TS | uses your Claude plan, no API key |
| [`copilot-subscription`](providers-subscription.html#github-copilot) | `copilot` login / PAT | ✅ (GitHub Actions) | TS | uses your Copilot plan, no API key |
| [`tamash`](provider-tamash.html) | none | ✅ | TS, Python, Java | rule-based, zero AI, zero tokens |
| [`ollama-local`](provider-ollama-local.html) | optional | ✅ | TS, Python, Java | your own self-hosted Ollama server |
| [`kiro-subscription`](providers-cli-subscription.html#kiro) | `kiro-cli login` | ❌ local only | TS | verified healing; CLI-based |
| [`codex-subscription`](providers-cli-subscription.html#codex) | `codex login` | ❌ local only | TS | verified healing; CLI-based |
| [`cursor-subscription`](providers-cli-subscription.html#cursor) | `agent login` | ❌ local only | TS | experimental — prefer kiro/codex |

## Choosing

- **Just trying it out** → `ollama` with a free key.
- **You already pay for an LLM API** → `openai` / `anthropic` / `gemini`.
- **You have a Claude or Copilot subscription, no API key** → `claude-subscription` / `copilot-subscription` — the only "subscription, works in CI too" options.
- **No AI at all** → `tamash`. Deterministic, free, narrower success rate — best on well-`.describe()`d Page-Object suites.
- **Local dev, off a Kiro / Codex / Cursor subscription** → [CLI-based providers](providers-cli-subscription.html). Never for CI.

Every provider gracefully disables healing (heals just don't happen) if its own env vars aren't set — switching is an `.env` change, never a code change.

## Cost & vision

Token usage is reported per heal in the console line and the [report](reports.html). `tamash` and cached hits cost nothing. Whether a provider can do the [screenshot fallback](vision-fallback.html) depends on the model — `npx tamash-playwright doctor` tells you.
