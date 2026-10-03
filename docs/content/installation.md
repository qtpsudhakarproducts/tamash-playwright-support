# Installation

This page is the TypeScript / Playwright Test path. For Python or Java, see [Python](python.html) / [Java](java.html) — the concepts are identical, only the install and `.env` wiring differ.

## 1. Install the package

```sh
npm install @vibetestq/tamash-playwright
npm install -D @playwright/test   # if you don't already have it
```

`@vibetestq/tamash-playwright` is a restricted (private) package and needs a license under the TAMASH Software License. Licensed users receive an npm access token with read access to the `@vibetestq` organization. Put it in an `.npmrc` file in the project root, and in the CI environment as a secret:

```ini
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

Set `NPM_TOKEN` to the token before running `npm install`. For a token or a license, write to support@vibetestq.com.

The package was published as `tamash-playwright` up to 0.15.0-beta.1. To move, replace the package in `package.json` and change imports from `'tamash-playwright'` to `'@vibetestq/tamash-playwright'`. The `npx tamash-playwright` commands are unchanged.

## License key (TypeScript)

Healing in the TypeScript package needs the license key of your project. In the TAMASH portal, open **Projects**, copy the key of your project, and set it as `TAMASH_LICENSE_KEY` in `.env` and in your CI secrets:

```sh
TAMASH_LICENSE_KEY=TAMASH1.xxxxxxxx.xxxxxxxx
```

The key is checked on your machine, with no network call. With no key, healing works for 14 days from the first use in the project, then it is off. A trial key allows 20 heals. An expired key works for its grace period. When healing is off because of the key, a failed action fails as it does in plain Playwright, and the console says why. `npx tamash-playwright doctor` shows the state of the key. The Python and Java packages do not check a key yet.

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
import { test, expect } from '@vibetestq/tamash-playwright';   // was '@playwright/test'
```

That's the whole integration. Continue to [Writing tests](writing-tests.html).
