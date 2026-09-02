# Introduction

`tamash-playwright` is **plug-and-play self-healing for Playwright**, across **TypeScript**, **Python**, and **Java**.

Websites change constantly. A button gets renamed or moved, and a test can't find it anymore — even though the app still works fine for real users. Normally that just means a broken test and a red build.

`tamash-playwright` fixes this automatically. When a test can't find an element, it asks an AI model (or a free, zero-AI rule-based matcher) to locate it on the current page and retries. If it succeeds, your test keeps going. If it can't, the test fails normally — exactly like stock Playwright. Every attempt — healed or not — is logged: which provider, the selector it suggested, the token cost, and where in your own code the locator lives.

No rewrites, no new framework. In most projects it's **one import swap** or **one config line** — your tests stay exactly as you wrote them.

```ts
// before
import { test, expect } from '@playwright/test';
// after
import { test, expect } from 'tamash-playwright';
```

## Two levels of resilience

**Runtime healing** keeps a run green through a UI change — including in CI, unattended. The action that would have failed is recovered from the live page and retried. No human, no agent, at heal time.

**`apply-heals`** is the deliberate follow-up: it turns those runtime heals into a permanent source change, re-runs the affected tests **with healing switched off** to prove the fix stands on its own, and (in CI) opens a reviewed pull request. See [Making heals permanent](apply-heals.html).

## Or hand the whole loop to your coding agent

`npx tamash-playwright init-skill` installs a skill that teaches Claude Code, Cursor, GitHub Copilot, Windsurf, Kiro, or Zed the entire workflow — set up, run, review each heal with real judgment, apply the permanent fix, verify it, open the PR. It pauses for you only at a genuinely ambiguous fix or a failed verification. See [The AI agent skill](agent-skill.html).

## What it heals

- Any wrapped Playwright action — `click`, `fill`, `check`, `selectOption`, `dragTo`, `dispatchEvent`, read methods like `textContent` / `getAttribute`, `screenshot`, and more — with every original argument preserved on the healed retry.
- Elements with no accessible name of their own, resolved by page **structure** (the label right next to a field, the row containing some text).
- Popups, new tabs, and `<iframe>` content — automatically, no manual wrapping.
- A **[screenshot-based vision fallback](vision-fallback.html)** when text matching isn't enough.
- An optional **[action-recovery](action-recovery.html)** layer for when the element is found but covered / off-screen / mid-animation.

`waitFor` and `expect(...)` assertions are deliberately **not** healed — a timeout there can legitimately mean "this correctly never appeared", which can't be told apart from a broken selector.

## Providers, your choice

Bring an API key for **Ollama** (free), **OpenAI**, **Anthropic**, or **Gemini** — or use your existing **Claude** or **GitHub Copilot** subscription with no API key at all (works in CI too). Or run **`tamash`** mode: deterministic, rule-based, zero AI, zero tokens. See [Providers](providers.html).

## Next steps

- [Installation](installation.html) — get it running in a few minutes
- [Writing tests](writing-tests.html) — the import swap and your first healing test
- [How healing works](how-healing-works.html) — the strategies, and what "needs review" means
