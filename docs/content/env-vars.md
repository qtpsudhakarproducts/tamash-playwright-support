# Environment variables

Loaded from a `.env` in your project root — both TypeScript and Python use this same convention (Python via `python-dotenv`); Java uses its own usual mechanism.

## Core

| Variable | Default | |
|---|---|---|
| `HEALER_ENABLED` | `true` | Master switch. Anything other than `false` / `0` leaves it on. |
| `HEALER_PROVIDER` | *(unset — healing off)* | `ollama` \| `openai` \| `anthropic` \| `gemini` \| `claude-subscription` \| `copilot-subscription` \| `ollama-local` \| `tamash` \| `kiro-subscription` \| `codex-subscription` \| `cursor-subscription` |
| `HEALER_ACTION_RECOVERY_ENABLED` | `false` | Enable the [action-recovery](action-recovery.html) layer. |

## Per provider

| Provider | Variables |
|---|---|
| `ollama` | `OLLAMA_MODEL`, `OLLAMA_API_KEY`, `OLLAMA_BASE_URL` *(opt)* |
| `openai` | `OPENAI_MODEL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL` *(opt)* |
| `anthropic` | `ANTHROPIC_MODEL`, `ANTHROPIC_API_KEY` |
| `gemini` | `GEMINI_MODEL`, `GEMINI_API_KEY`, `GEMINI_BASE_URL` *(opt)* |
| `claude-subscription` | `CLAUDE_SUBSCRIPTION_MODEL` *(default `haiku`)*, `CLAUDE_CODE_OAUTH_TOKEN` *(CI)* |
| `copilot-subscription` | `COPILOT_SUBSCRIPTION_MODEL`, `COPILOT_GITHUB_TOKEN` *(CI PAT — checked ahead of `GITHUB_TOKEN`)* |
| `ollama-local` | `OLLAMA_LOCAL_MODEL`, `OLLAMA_LOCAL_BASE_URL` *(default `http://localhost:11434`)*, `OLLAMA_LOCAL_API_KEY` *(opt)* |
| `tamash` | *(none)* |
| `kiro-subscription` | `KIRO_API_KEY` *(or `kiro-cli login`)* |
| `codex-subscription` | *(`codex login`)* |
| `cursor-subscription` | `CURSOR_API_KEY` *(or `agent login`)*, `CURSOR_SUBSCRIPTION_MODEL` *(opt)* |

A provider whose required `_MODEL` / key is missing constructs successfully but returns nothing — healing is simply off for it. `doctor` tells you which var is missing.

## `playwright.config.ts` (not env)

`use.actionTimeout` — must be set, comfortably below `timeout`, or healing never gets a turn. See [Installation](installation.html#3-set-actiontimeout).
