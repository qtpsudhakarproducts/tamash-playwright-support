# tamash-playwright

`tamash-playwright` is a plug and play self-healing solution for any Playwright test framework. All you need to do is install the package, update your AI API key details, and import `test` from `tamash-playwright`.

That's it. No code changes required if you're following standard Playwright best practices.

### Why you need this

Websites change often. A button gets renamed or moved, and your test can't find it anymore — even though the app still works fine for real users. Normally, that just means a broken test.

`tamash-playwright` fixes this automatically. When a test can't find an element, it asks an AI model to find it on the current page and tries again. If it succeeds, your test keeps going. If not, it fails normally, just like before.

Here are the detailed steps to use this package.

## Step 1: Install it

```sh
npm install tamash-playwright
```

You also need Playwright's own test package, if you don't already have it:

```sh
npm install -D @playwright/test
```

## Step 2: Connect an AI model

`tamash-playwright` needs an AI model to decide where a broken element actually went. Pick one of Ollama, OpenAI, Anthropic (Claude), or Google Gemini, and give it an API key.

Create a file named `.env` in your project folder:

```sh
# Master on/off switch. Leave this as true, or remove the line entirely.
HEALER_ENABLED=true

# Pick one: ollama | openai | anthropic | gemini
HEALER_PROVIDER=ollama

# Optional, off by default — see "Action recovery" below.
# HEALER_ACTION_RECOVERY_ENABLED=true

# --- Ollama Cloud (https://ollama.com) ---
OLLAMA_MODEL=gpt-oss:120b
OLLAMA_API_KEY=

# --- OpenAI ---
# OPENAI_MODEL=gpt-4.1-mini
# OPENAI_API_KEY=

# --- Anthropic (Claude) ---
# ANTHROPIC_MODEL=claude-haiku-4-5
# ANTHROPIC_API_KEY=

# --- Google Gemini ---
# GEMINI_MODEL=
# GEMINI_API_KEY=
```

Just fill in the API key and model for whichever one you want to use, and leave the rest as-is (or delete them).

### Getting a free Ollama key (fastest way to get started)

Ollama Cloud is a quick, free way to get an API key without signing up for OpenAI/Anthropic/Gemini billing.

1. Go to [ollama.com](https://ollama.com/) and create an account.
2. Once signed in, go to [ollama.com/settings/keys](https://ollama.com/settings/keys).
3. Create a new API key and copy it.
4. Paste it into your `.env` file:

```sh
HEALER_ENABLED=true
HEALER_PROVIDER=ollama
OLLAMA_MODEL=gpt-oss:120b
OLLAMA_API_KEY=paste_your_key_here
```

That's all you need — no other variables required.

## Step 3: Check your setup

Run the built-in doctor command to confirm everything's wired up correctly before you rely on it:

```sh
npx tamash-playwright doctor
```

It checks:

1. **AI connectivity** — confirms `HEALER_ENABLED`/`HEALER_PROVIDER` are set correctly and actually calls your configured provider to make sure the API key and model work.
2. **Action recovery status** — whether `HEALER_ACTION_RECOVERY_ENABLED` is on (see below).
3. **Vision capability** — whether your configured model is expected to support the screenshot-based fallback (see below), based on its name.
4. **Missing `.describe()` labels** — scans your test files (`tests/` by default, or pass `--dir <path>`) for locators that don't have a `.describe('...')` label, and flags the ones most worth fixing (raw CSS/XPath selectors first).
5. **Locators written directly in test files** — flags any locator defined inline in a test rather than inside a Page Object class, which is a Playwright best practice regardless of self-healing: it keeps tests readable and means a UI change only needs a fix in one place.

If it finds issues, the fastest fix is to open the project in an AI coding assistant (Claude Code, Cursor, GitHub Copilot, etc.) and ask it to address what it flagged — add `.describe()` calls, or extract locators into Page Object classes. You can also add a standing rule to that assistant's instructions/skill file (e.g. `CLAUDE.md`, `.cursor/rules`, `.github/copilot-instructions.md`) so it follows both practices automatically on any new test code going forward.

## Step 4: Use it in your tests

Change one line at the top of your test file — everything else about how you write tests stays exactly the same:

```ts
// Before
import { test, expect } from '@playwright/test';

// After
import { test, expect } from 'tamash-playwright';
```

That's it. Write your tests as normal:

```ts
import { test, expect } from 'tamash-playwright';

test('logs in', async ({ page }) => {
  await page.goto('/');
  const txtUserName = page.locator('input[name="username"]').describe('User Name Textbox');
  await txtUserName.fill('testadmin');

  const txtPassword = page.locator('input[placeholder="Password"]').describe('Password Textbox');
  await txtPassword.fill('secret');

  const btnLogin = page.locator('button[type="submit"]').describe('Login Button');
  await btnLogin.click();

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

### A quick tip for better results

If you're using plain CSS selectors (like `page.locator('input[name="username"]')`) rather than Playwright's more descriptive locators (`getByRole`, `getByPlaceholder`, etc.), it helps to add a short, human-readable label so the healer knows what it's actually looking for. Chain `.describe('...')` right onto the locator:

```ts
test('login test using CSS Selectors', async ({ page }) => {
  await page.goto('https://example.com/auth/login');

  const txtUserName = page.locator('input[name="username"]').describe('User Name Textbox');
  await txtUserName.fill('testadmin');

  const txtPassword = page.locator('input[placeholder="Password"]').describe('Password Textbox');
  await txtPassword.fill('secret');

  const btnLogin = page.locator('button[type="submit"]').describe('Login Button');
  await btnLogin.click();

  await expect(page.locator('h6')).toHaveText('Dashboard');
});
```

This step is optional, but recommended — without it, the healer has to guess purely from a broken CSS selector, which gives it a lot less to work with.

## What else it heals — no extra setup needed

Beyond a single broken `click`/`fill`/`getByRole` on the main page, all of this works automatically once you've done Steps 1–2:

- **Popups and extra tabs.** A page opened via `context.newPage()`, `window.open`, or a `target="_blank"` link is just as healing-aware as your main `page` — no manual wrapping needed.
- **Elements inside `<iframe>`s.** `page.frameLocator('#my-iframe')` and anything chained off it heals the same way, scoped correctly to the iframe's own document.
- **Most of the Playwright API surface**, not just clicks and fills — `check`, `selectOption`, `dragTo`, `dispatchEvent`, read methods like `textContent`/`getAttribute`/`isChecked`, `screenshot`, and more. Methods that can't be safely healed by guessing a replacement element (`dragTo`, `drop`) are still reported honestly on failure, they're just never silently retried with a different element.

## When text alone isn't enough: vision fallback

Sometimes an element has nothing useful to match on by text — an icon-only button with no label, or several visually distinct elements that all look identical in the accessibility tree. If your configured model supports image input (e.g. `gpt-4o`, `claude-haiku-4-5`, `gemini-2.0-flash`), `tamash-playwright` automatically falls back to a screenshot-based search after the normal text-based attempt fails — no separate setup, it just uses the same provider and API key from Step 2. Run `npx tamash-playwright doctor` to check whether your configured model is expected to support this.

## Action recovery (optional)

Occasionally a locator heals correctly — the AI found the right element — but the *action* on it still fails, e.g. it's covered by an overlay or needs scrolling into view first. Set `HEALER_ACTION_RECOVERY_ENABLED=true` to let the AI pick a recovery tactic from a fixed, safe set (scroll into view, retry bypassing actionability checks, wait briefly and retry, or dispatch the DOM event directly) before giving up. It's off by default since it's a second, more speculative layer of intervention beyond selector healing — the AI only ever picks from that fixed menu, it never decides how to interact with the page on its own.

## Checking what actually happened

Every healing attempt — whether it succeeded or not — shows up in Playwright's own HTML report (`npx playwright show-report`), no separate report to check:

- An annotation on the test summarizing what happened, e.g. `Recovered using ollama:gpt-oss:120b (role:button:Submit)`.
- A JSON attachment with the full detail: which provider was used, whether the vision or action-recovery fallback was involved, the AI's suggested selector, token cost, and — if it didn't heal — which stage it stopped at (e.g. `ai_declined`, `replay_failed`).
- Exactly where in your own code the locator was created — a test file or a Page Object class, whichever it really is — so you know which line to go fix even if you never look at the healing report again.

The same detail is also printed to the console as it happens, one line per attempt:

```
[self-healer] src/pages/loginpage.ts:11 — locator.fill "Username Textbox" -> HEALED [provider=ollama:gpt-oss:120b, vision=no, actionRecovery=no, suggested="role:textbox:Username", 620 tokens (489 input + 131 output)] — locator.fill: Timeout 8000ms exceeded.
```

## License

Free to use, including commercially. The source code may not be copied, modified, redistributed, or resold without prior written permission. See the LICENSE file included in this package for the full terms.

## Support

For questions or concerns, contact us at support@vibetestq.com.
