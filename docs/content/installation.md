# Installation

This page is the TypeScript / Playwright Test path. For Python or Java, see [Python](python.html) / [Java](java.html) — the concepts are identical, only the install and `.env` wiring differ.

## 1. Install the package

```sh
npm install tamash-playwright
npm install -D @playwright/test   # if you don't already have it
```

New capabilities land on npm's `beta` tag before promotion to `latest`:

```sh
npm install tamash-playwright@beta
```

## 2. Connect an AI provider

`tamash-playwright` needs a model to decide where a broken element went. Create a `.env` in your project root:

```sh
# Master on/off switch. Leave as true, or delete the line.
HEALER_ENABLED=true

# ollama | openai | anthropic | gemini | claude-subscription | copilot-subscription
# | ollama-local | tamash          (and, local-dev only: kiro-subscription | codex-subscription | cursor-subscription)
HEALER_PROVIDER=ollama

# --- Ollama Cloud (free key from ollama.com/settings/keys) ---
OLLAMA_MODEL=gpt-oss:120b
OLLAMA_API_KEY=

# --- OpenAI ---
# OPENAI_MODEL=gpt-4.1-mini
# OPENAI_API_KEY=

# --- Anthropic (Claude) ---
# ANTHROPIC_MODEL=claude-haiku-4-5
# ANTHROPIC_API_KEY=

# --- Google Gemini ---
# GEMINI_MODEL=gemini-2.5-flash
# GEMINI_API_KEY=
```

Fill in the key + model for whichever one you want; delete the rest. See [Providers](providers.html) for every option, including the subscription and zero-AI ones, and [Environment variables](env-vars.html) for the full list.

### Fastest start: a free Ollama key

1. Create an account at [ollama.com](https://ollama.com/).
2. Go to [ollama.com/settings/keys](https://ollama.com/settings/keys), create a key, copy it.
3. Paste it into `.env` as `OLLAMA_API_KEY`. Nothing else needed.

## 3. Set `actionTimeout`

By default Playwright lets a broken locator retry silently for your **entire** test timeout before it throws — so healing never gets a turn. Set `actionTimeout` well below your test `timeout` in `playwright.config.ts`:

```ts
export default defineConfig({
  timeout: 60000,
  use: {
    actionTimeout: 8000, // comfortably less than the test timeout
  },
});
```

Without this, heals show `stage=no_snapshot` and never run. `doctor` (next step) checks this for you.

## 4. Check your setup — `doctor`

```sh
npx tamash-playwright doctor
```

It verifies, in one pass:

| Check | What it does |
|---|---|
| **AI Provider** | Confirms `HEALER_ENABLED` / `HEALER_PROVIDER`, then actually calls the provider — within your real `actionTimeout` — and on failure tells you *which* kind of problem it is (SDK/CLI not installed → the exact `npm install`; not authenticated → `claude login` / check the key; timeout → raise `actionTimeout`; bad model id; network) |
| **Action Timeout** | Reads `playwright.config` — flags a missing or too-close-to-`timeout` value |
| **Vision capability** | Whether your model is expected to support the [screenshot fallback](vision-fallback.html) |
| **Locators without `.describe()`** | Scans your tests, raw CSS/XPath first |
| **Inline locators** | Flags locators written straight into tests rather than a Page Object |
| **Skill installation** | Whether the [agent skill](agent-skill.html) is installed and current |

See [CLI commands](cli.html#doctor) for flags, and [Troubleshooting](troubleshooting.html) for what each `[FAIL]` means.

## 5. Swap the import

```ts
import { test, expect } from 'tamash-playwright';   // was '@playwright/test'
```

That's the whole integration. Continue to [Writing tests](writing-tests.html).
