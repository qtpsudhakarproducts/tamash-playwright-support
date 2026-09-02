# TypeScript

TypeScript with the native **Playwright Test** runner is the primary, most complete integration — the [Getting Started](installation.html) and [Guides](how-healing-works.html) sections are written against it.

Current version on npm: **`0.11.0`** (`npm install tamash-playwright@beta` for the next one). See [Release notes](release-notes.html).

## Setup, in short

```sh
npm install tamash-playwright
npm install -D @playwright/test
```

```ts
// spec files only — Page Objects don't change
import { test, expect } from 'tamash-playwright';
```

Then a `.env` with `HEALER_PROVIDER` + its key ([Installation](installation.html#2-connect-an-ai-provider)), an `actionTimeout` in `playwright.config.ts` ([Installation](installation.html#3-set-actiontimeout)), and `npx tamash-playwright doctor` to check it.

## TypeScript-specific

- **Subscription providers, no API key** — `claude-subscription` and `copilot-subscription` are TypeScript-only, and work in CI. So are the local-dev-only `kiro` / `codex` / `cursor` providers. See [Claude / Copilot subscription](providers-subscription.html) and [Kiro / Codex / Cursor](providers-cli-subscription.html).
- **`apply-heals`, `init-skill`, and the agent skill** are TypeScript CLI features — see [CLI commands](cli.html).
- **Non-`@playwright/test` runners** (Cucumber, Jest, a plain script) — the import swap still works; add `closeCopilotSubscriptionClient()` to teardown if you use `copilot-subscription`. See [Running in CI](ci.html#non-playwright-runners).
- **`getDurable()`** on any locator — [Writing tests](writing-tests.html#getting-a-durable-locator-on-demand-getdurable).

## Working examples

- [TS + Playwright Test](https://github.com/qtpsudhakarproducts/tamash-playwright-typescript-playwright) — with and without Page Object Model, plus the full `apply-heals` CI workflow
- [TS + Cucumber](https://github.com/qtpsudhakarproducts/tamash-playwright-typescript-cucumber)
