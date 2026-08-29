# tamash-playwright

`tamash-playwright` is a plug and play self-healing solution for any Playwright test framework. All you need to do is install the package, connect an AI provider, and import `test` from `tamash-playwright`.

That's it. No code changes required if you're following standard Playwright best practices.

### Why you need this

Websites change often. A button gets renamed or moved, and your test can't find it anymore — even though the app still works fine for real users. Normally, that just means a broken test.

`tamash-playwright` fixes this automatically. When a test can't find an element, it asks an AI model to find it on the current page and tries again. If it succeeds, your test keeps going. If not, it fails normally, just like before. Every attempt is logged, and a real fix can be turned into permanent source code with one command — see [Making a heal permanent](#making-a-heal-permanent-apply-heals) below.

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

`tamash-playwright` needs an AI model to decide where a broken element actually went. Pick one of Ollama, OpenAI, Anthropic (Claude), Google Gemini — or, if you don't have an API key issued to you, your own Claude or GitHub Copilot subscription instead.

Create a file named `.env` in your project folder:

```sh
# Master on/off switch. Leave this as true, or remove the line entirely.
HEALER_ENABLED=true

# Pick one: ollama | openai | anthropic | gemini | claude-subscription | copilot-subscription
# (also `ollama-local` and `tamash` — self-hosted Ollama and free zero-AI healing respectively,
# both currently in the @beta release — see "Trying the latest features early" below)
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

# --- Claude subscription (no API key — uses your Claude subscription) ---
# CLAUDE_SUBSCRIPTION_MODEL=haiku
# CLAUDE_CODE_OAUTH_TOKEN=

# --- GitHub Copilot subscription (no API key — uses your Copilot subscription/free tier) ---
# COPILOT_SUBSCRIPTION_MODEL=mai-code-1-flash-picker
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

### Using your Claude or GitHub Copilot subscription instead of an API key

If you don't have an API key issued to you but do have a personal Claude (Pro/Max/Team/Enterprise) or GitHub Copilot subscription (including the free tier), you can use that instead — no billing setup, no key to paste anywhere.

**Claude subscription** — works both locally and unattended in CI:

```sh
npm install -g @anthropic-ai/claude-code   # the CLI itself — needed so `claude login` exists to run.
                                            # @anthropic-ai/claude-agent-sdk (below) bundles its own
                                            # copy of the Claude Code binary too, but only for its own
                                            # internal use — it exposes no `claude` command of its own,
                                            # so this separate install is still required for the login
                                            # step below.
npm install @anthropic-ai/claude-agent-sdk # the SDK — what tamash-playwright actually calls
claude login                               # one-time, locally
```

```sh
HEALER_PROVIDER=claude-subscription
CLAUDE_SUBSCRIPTION_MODEL=haiku
```

For CI, generate a long-lived token once (`claude setup-token`) and set it as a secret instead of logging in interactively:

```sh
CLAUDE_CODE_OAUTH_TOKEN=the-token-you-copied
```

**GitHub Copilot subscription** — works locally, and unattended in GitHub Actions specifically:

```sh
npm install -g @github/copilot   # the CLI itself — needed so `copilot` exists to sign in with
npm install @github/copilot-sdk  # the SDK — what tamash-playwright actually calls (wraps the CLI,
                                  # doesn't replace it, so both installs above are required)
copilot                          # sign in once, locally
```

```sh
HEALER_PROVIDER=copilot-subscription
COPILOT_SUBSCRIPTION_MODEL=mai-code-1-flash-picker
```

In a GitHub Actions workflow, no secret is needed at all *if the repo's owning account/org has Copilot enabled* — just grant the job permission to use it:

```yaml
permissions:
  copilot-requests: write
```

**Gotcha, confirmed by real testing, not just docs**: this only works if Copilot is enabled for whoever *owns the repo* — an organization, if that's who the repo belongs to. A personal Copilot subscription on your own account does **not** carry over to a separate organization's repos, even one you administer yourself. If the job fails with `Authorization error, you may need to run /login` despite the permission being set correctly, this is almost certainly why — use a personal-account fine-grained PAT (`COPILOT_GITHUB_TOKEN`, **Account permissions → Copilot Requests: Read**) instead, since the SDK checks that variable ahead of the ambient `GITHUB_TOKEN`.

**One thing worth knowing**: only Claude and Copilot support this "subscription, no API key, works in CI too" combination — a ChatGPT or Google AI subscription can back local runs the same way via those vendors' own CLIs, but neither currently offers a way to use that subscription unattended in CI.

**If you're not using `@playwright/test` as your runner** (Cucumber, Jest, a plain script, …): `copilot-subscription` keeps a shared client open across calls for performance. Playwright's own test runner force-exits its process regardless, so this is invisible there — but a runner that doesn't force-exit will hang indefinitely after all your tests have actually finished. Call `closeCopilotSubscriptionClient()` from your runner's own teardown hook to fix it — it's a no-op if `copilot-subscription` was never used, so safe to add unconditionally:

```ts
import { closeCopilotSubscriptionClient } from 'tamash-playwright';

// e.g. Cucumber's AfterAll, Jest's afterAll, or your own script's cleanup
await closeCopilotSubscriptionClient();
```

**Gotcha, confirmed live**: `claude-subscription` and `copilot-subscription` both work by spawning the vendor's own CLI as a subprocess — the *first* call in a fresh process pays a one-time cold-start cost (spawning it, authenticating) on top of the actual model call, and on a slower machine or network that alone can exhaust a tight `actionTimeout` before the model ever responds, surfacing as a generic "not authenticated?" warning that points at the wrong root cause. If your very first heal with one of these two providers fails this way, try raising `actionTimeout` a little before assuming your login/token is actually broken — `0.11.0-beta.5`+ also makes `doctor` test connectivity within your real configured `actionTimeout` specifically to catch this ahead of time (see the beta section below).

## Step 3: Set `actionTimeout`

By default, Playwright lets a broken locator retry silently for your *entire* test timeout before it ever throws an error — which means self-healing never gets a turn at all, since it only kicks in once an action actually fails. Set `actionTimeout` in `playwright.config.ts` to something well below your test timeout so a broken locator fails fast, leaving real time for healing to run:

```ts
export default defineConfig({
  timeout: 60000, // your overall test timeout
  use: {
    actionTimeout: 8000, // must be comfortably less than the test timeout above
  },
});
```

Without this, healing attempts will show `stage=no_snapshot` in the console and never recover anything — not because healing failed, but because it never had time to run before the whole test was torn down. `npx tamash-playwright doctor` (next step) checks this for you.

## Step 4: Check your setup

Run the built-in doctor command to confirm everything's wired up correctly before you rely on it:

```sh
npx tamash-playwright doctor
```

It checks:

1. **AI connectivity** — confirms `HEALER_ENABLED`/`HEALER_PROVIDER` are set correctly and actually calls your configured provider to make sure the API key/subscription and model work.
2. **`actionTimeout` configuration** — checks your `playwright.config.ts` for an `actionTimeout` set well below your test `timeout` (see above); flags it if missing or too close to the test timeout.
3. **Vision capability** — whether your configured model is expected to support the screenshot-based fallback (see below), based on its name.
4. **Missing `.describe()` labels** — scans your test files (`tests/` by default, or pass `--dir <path>`) for locators that don't have a `.describe('...')` label, and flags the ones most worth fixing (raw CSS/XPath selectors first) in a table, ranked by priority.
5. **Locators written directly in test files** — flags any locator defined inline in a test rather than inside a Page Object class, which is a Playwright best practice regardless of self-healing: it keeps tests readable and means a UI change only needs a fix in one place.

The output is color-coded (when run in a real terminal) with a Summary table at the end so you can see every check's result at a glance.

If it finds issues, the fastest fix is to open the project in an AI coding assistant (Claude Code, Cursor, GitHub Copilot, etc.) and ask it to address what it flagged — add `.describe()` calls, or extract locators into Page Object classes. You can also add a standing rule to that assistant's instructions/skill file (e.g. `CLAUDE.md`, `.cursor/rules`, `.github/copilot-instructions.md`) so it follows both practices automatically on any new test code going forward.

## Step 5: Use it in your tests

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

If you're using a Page Object Model, nothing about your Page Object classes needs to change at all — only the `test`/`expect` import in your spec files matters. A Page Object built entirely on plain `Locator`/`Page` types from `@playwright/test` is already healing-aware the moment the `page` it receives came from a `test()` imported from `tamash-playwright`.

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
- **Most of the Playwright API surface**, not just clicks and fills — `check`, `selectOption`, `dragTo`, `dispatchEvent`, read methods like `textContent`/`getAttribute`/`isChecked`, `screenshot`, and more. Every original argument (including a trailing options object like `{ force: true }` or `{ modifiers: [...] }`) is preserved on a healed replay. A few are deliberately excluded, but still reported honestly on failure rather than silently retried: `dragTo`/`drop` can't be safely healed by guessing a replacement element for just one side of a two-sided drag, and `waitFor` is a state check rather than an action — a timeout on it can mean a genuinely broken selector, or that the element correctly never reached the expected state (verifying something does *not* appear, say), which can't be told apart from the error alone. (`expect(locator).toBeVisible()` and similar assertions are excluded for the same reason, but never even reach this mechanism — they're Playwright's own matcher, not a method this wraps.)

## When there's no name to match: finding elements by structure

Sometimes the broken element has no useful identity of its own — a plain `<input>` with no name, no working placeholder, and a label that's visually right next to it but never actually linked (no `<label for>`, no `aria-labelledby`). A human finds it instantly by sight; matching purely on accessible name has nothing to grab onto.

For exactly these cases, `tamash-playwright` reads a structural map of the whole page — every element, including nameless ones, with its real parent/child/sibling relationships — instead of just a flat list of named elements. The AI's job becomes simpler as a result: point at the exact element the description matches, wherever it sits in that structure, rather than invent a matching strategy from a handful of abstract options.

Once the AI has pointed at an element, a separate, deterministic step (no extra AI call) works out the most durable way to describe it going forward:

1. **Its own identity** — if the element has a real id, test id, accessible role and name, label, or placeholder, that's used directly. This covers the large majority of real cases.
2. **A nearby label** — if it has none of the above but a label sits right next to it in the page's own structure (not just "somewhere on the screen" — the actual DOM relationship), the fix anchors on that text instead.
3. **Positional fallback** — if neither applies, it falls back to whatever selector Playwright's own locator-generation logic can produce, even one that depends on element order.

Every candidate at every step is verified against the live page — confirmed to be the exact same element, by real DOM identity, not just "something matched" — before it's trusted. Steps 2 and 3 are also the ones flagged `needsReview` (see below), since they're inherently less durable than a selector built from real identity.

### When a fix needs a second look

Not every healed selector is equally durable, and `tamash-playwright` tells you which is which:

- **Not flagged** — the selector came from the element's own real identity (step 1 above). About as solid as anything a human would write by hand.
- **Flagged `needsReview`** — the selector came from a nearby label (step 2) or a positional fallback (step 3). It's correct *right now* — verified against the live page — but worth a glance before you fully rely on it long-term.

Look for it in three places: `needsReview=yes` in the console line, a `self-heal-needs-review` annotation in the HTML report, or a `[NEEDS REVIEW]` tag in `apply-heals`'s output (see below). It's informational, not a gate.

### Getting a durable locator directly: `locator.getDurable()`

The same "work out the most durable way to describe this element" logic is also available as a method on any locator you already have:

```ts
const durable = await someLocator.getDurable();
// durable is a real Locator (getByRole/getByLabel/a css selector/…), safe to act on directly
await durable.click();
```

Pass the action you're about to perform as an optional argument if you know it (`getDurable('fill')`, `getDurable('selectOption')`) — it's used only to guess a role (e.g. `textbox` for a fill target) when the element's own accessibility role is missing or generic. `getDurable()` throws if nothing durable could be derived at all, rather than silently handing back something it doesn't trust.

## When text alone isn't enough: vision fallback

Sometimes an element has nothing useful to match on by text — an icon-only button with no label, or several visually distinct elements that all look identical in the accessibility tree. If your configured model supports image input (this includes `claude-subscription`/`copilot-subscription` with a suitable model, not just the API-key providers), `tamash-playwright` automatically falls back to a screenshot-based search after the normal text-based attempt fails — no separate setup, it just uses the same provider from Step 2. Run `npx tamash-playwright doctor` to check whether your configured model is expected to support this.

## Action recovery (optional)

Occasionally a locator heals correctly — the AI found the right element — but the *action* on it still fails, e.g. it's covered by an overlay or needs scrolling into view first. Set `HEALER_ACTION_RECOVERY_ENABLED=true` to let the AI pick a recovery tactic from a fixed, safe set (scroll into view, retry bypassing actionability checks, wait briefly and retry, or dispatch the DOM event directly) before giving up. It's off by default since it's a second, more speculative layer of intervention beyond selector healing — the AI only ever picks from that fixed menu, it never decides how to interact with the page on its own.

## Not paying for the same heal twice

Once a locator heals successfully, `tamash-playwright` remembers the fix in `.tamash-playwright/heals.jsonl`. The next time that exact locator breaks the same way, it tries the previously-confirmed selector *first* — no ARIA snapshot, no AI call. Only if that no longer works (the page changed again) does it fall through to a fresh snapshot-and-AI-call.

**Locally**, this is a real, ongoing saving: the log lives on your disk and persists across every run on that checkout — the same broken locator only ever costs one AI call, no matter how many times you re-run afterward.

**In CI, this only helps *within* one run** — most runners start from a fresh checkout each time. What actually eliminates repeat AI calls in CI is `apply-heals` (below) merging the real fix into your source. A cache hit shows up in the console as `provider=cache` with no token count.

## Making a heal permanent: `apply-heals`

Runtime healing (including the caching above) never touches your source code — the original locator stays broken in your test file or Page Object forever, healed at runtime on every run, until you fix it yourself. `apply-heals` closes that loop: it rewrites the original broken locator to the selector that actually worked, so the next run doesn't need healing at all.

```sh
npx playwright test                            # heals at runtime, records what it healed
npx tamash-playwright apply-heals --dry-run    # preview the source changes
npx tamash-playwright apply-heals              # write them
```

Every run — dry or real — shows a table of exactly what it found before touching anything:

```
Fixes (1)
  ┌────────────────────────────┬──────────────────────────┬──────────────────────────────────────────────┬────────┐
  │ Location                   │ Before                   │ After                                          │ Review │
  ├────────────────────────────┼──────────────────────────┼──────────────────────────────────────────────┤────────┤
  │ src/pages/loginpage.ts:11  │ .locator('input[name="…' │ .getByRole("textbox", { name: "Username" })   │ —      │
  └────────────────────────────┴──────────────────────────┴──────────────────────────────────────────────┴────────┘

1 fix(es) applied to 1 file(s), 0 skipped.
Review the changes (e.g. `git diff`) before committing.
```

**A real run then asks for confirmation before writing — but only at an actual terminal.** In CI, or any non-interactive invocation, the prompt is skipped automatically and it proceeds exactly as it always has (there's no stdin to read an answer from there). Pass `--yes`/`-y` to skip it at a real terminal too, e.g. for your own scripts.

A fix is applied regardless of its `needsReview` status — the flag is informational (shown in the table and the reports), never a gate. A few other things worth knowing:

- **Nothing runs automatically.** `apply-heals` is a separate, deliberate command — a test run never edits your source on its own.
- **Only real selector fixes qualify.** Text/ARIA-based heals only, including ones the vision fallback resolved to something reusable — never an action-recovery heal, where the locator was already right and only the action needed help.
- **Surgical edits.** `.describe('...')` and everything else on the line is untouched — only the `.locator(...)`/`.getByRole(...)` call itself is replaced.
- **Every run leaves a report.** `.tamash-playwright/apply-heals-report.md` and `.json` — a before/after per fix, archived under `history/` so a second run doesn't erase the first's record.
- **Proving a fix actually works**: every real run also writes `.tamash-playwright/verify-heals.cjs` — run `node .tamash-playwright/verify-heals.cjs` to re-run exactly the affected tests with `HEALER_ENABLED=false`. A pass proves the rewritten selectors work standalone, not just "worked while healing was still propping them up."
- **Always review before committing.** This rewrites source files. Check `git diff`, rerun tests, commit deliberately — like any other automated change.
- **Works the same way in CI.** Run it as a step after your test job (`--logs-dir <path>` merges `heals.jsonl` from multiple sharded test jobs' artifacts into one) — it can open a PR with the fix for review instead of committing directly. See the TypeScript sample repo's own GitHub Actions workflow for a full working example.

## Checking what actually happened

Every healing attempt — whether it succeeded or not — shows up in Playwright's own HTML report (`npx playwright show-report`), no separate report to check:

- An annotation on the test summarizing what happened, e.g. `Recovered using ollama:gpt-oss:120b (getByRole("button", { name: "Submit" }))`.
- A JSON attachment with the full detail: which provider was used, whether the vision or action-recovery fallback was involved, the AI's suggested selector, token cost, and — if it didn't heal — which stage it stopped at (e.g. `ai_declined`, `replay_failed`).
- Exactly where in your own code the locator was created — a test file or a Page Object class, whichever it really is — so you know which line to go fix even if you never look at the healing report again.

The same detail is also printed to the console as it happens, one line per attempt, showing the exact, copy-pasteable locator code it used — not an abbreviated shorthand:

```
[self-healer] src/pages/loginpage.ts:11 — locator.fill "Username Textbox" -> HEALED [provider=ollama:gpt-oss:120b, vision=no, actionRecovery=no, suggested="getByRole("textbox", { name: "Username" })", 620 tokens (489 input + 131 output)] — locator.fill: Timeout 8000ms exceeded.
```

## Trying the latest features early: the `@beta` release

New capabilities land first on npm's `beta` tag before being promoted to `latest`, so you can try them ahead of a stable release:

```sh
npm install tamash-playwright@beta
```

Currently in beta:

- **`HEALER_PROVIDER=tamash` — rule-based healing, no AI required.** No API key, no subscription, no network call, no tokens. It resolves a broken locator by searching the page's accessibility tree for the same text your `.describe()` (or a named locator variable) already gives it, using the same structural-widening logic (nearby-label anchoring) the AI-backed providers use. `doctor` always reports it connected, since there's nothing external for it to fail to reach. The real, honest tradeoff: it never guesses — a paraphrased description, a raw CSS/XPath selector with no human-readable text, or two equally-plausible elements near the same anchor all get an honest decline rather than a guessed heal, exactly the cases an AI's actual reasoning can resolve that a text search can't. It also can't do the vision fallback or action-recovery tactics (both require inference this provider deliberately doesn't attempt). Best as a fast, free, fully deterministic first line of defense for well-`.describe()`d, Page-Object-style suites — fall back to one of the AI providers above for anything it declines.
- **Wider popup/new-tab healing coverage.** Beyond `context.newPage()`, `window.open`, and `target="_blank"` links (already covered in the stable release — see above), the beta also makes pages opened via `context.waitForEvent('page')`, `page.on('popup', ...)`, and `page.waitForEvent('popup')` fully healing-aware.
- **`HEALER_PROVIDER=ollama-local` — your own self-hosted Ollama server, not Ollama Cloud.** A deliberately separate provider from `ollama` above, not a flag on it, because the auth default is genuinely different: Ollama Cloud always requires `OLLAMA_API_KEY`, while a self-hosted `ollama serve` normally has none at all, so `OLLAMA_LOCAL_API_KEY` is optional here. Set it only if your internal deployment sits behind a reverse proxy or API gateway that requires a bearer token — it's sent the same way the cloud provider's key is (`Authorization: Bearer <token>`) when present, and omitted entirely when not. `OLLAMA_LOCAL_BASE_URL` defaults to `http://localhost:11434`.

  ```sh
  HEALER_PROVIDER=ollama-local
  OLLAMA_LOCAL_MODEL=gpt-oss:120b
  OLLAMA_LOCAL_BASE_URL=http://your-internal-ollama-host:11434
  # OLLAMA_LOCAL_API_KEY=   # only if your deployment requires one
  ```
- **A skill for running the local workflow inside an AI coding assistant.** Ships at `node_modules/tamash-playwright/skills/tamash-playwright/` — reviewing, applying, verifying, and landing whatever healed at runtime, or bringing a project up to standard first (provider setup, `actionTimeout`, `.describe()` labels) if it hasn't adopted these standards yet. Pure orchestration over the exact CLI commands already documented above (`doctor`, `apply-heals`, `verify-heals.cjs`) — no new capability. Supported today: Claude Code, Kiro (identical `SKILL.md` format), Cursor, GitHub Copilot, and any `AGENTS.md`-reading tool (Antigravity, Gemini CLI, Windsurf, Zed, Aider, and others) — each with its own one-time copy step (no agent auto-discovers a skill sitting in `node_modules`), documented in the skill's own `SKILL.md`. Tested by handing it to real, unbriefed agents with zero prior context in isolated environments rather than just reviewing it for plausibility — that testing directly found the next fix below.
- **`doctor`'s connectivity check now tests within your real configured `actionTimeout`**, instead of a fixed, generous default completely decoupled from it. Found via the skill testing above: a from-scratch setup could get `[OK] Connected successfully` from `doctor`, then have its very first real heal for `claude-subscription`/`copilot-subscription` fail with a misleading "not authenticated?" warning — the true cause being the one-time CLI cold-start cost these two providers pay on their first call in a process, which `doctor`'s old generous timeout never had to absorb. A `[FAIL]` for one of these two providers now explicitly suggests it may be that cold-start cost rather than a real auth problem.
- **Three more subscription providers — `cursor-subscription`, `kiro-subscription`, `codex-subscription` — all explicitly local-development-only, never for CI.** Extends the same "use what you're already paying for" idea to three more real subscriptions, but for two different reasons neither is documented for CI: Cursor's and Kiro's own headless-mode docs confirm neither can fully disable tool/file/command access the way `claude-subscription`/`copilot-subscription` can, so a heal call could in principle take a real action instead of just answering — fine locally where you're watching (`git status`/`git diff` would show it immediately), not fine unattended in CI where nobody is; `kiro-subscription` deliberately never grants the trust flags that would remove its own timeout-bounded safety net. `codex-subscription` is local-only for a simpler reason: `codex exec`'s default read-only, no-approval sandbox is already as safe as the existing two, it just has no confirmed long-lived token for unattended CI use yet. None of the three vendors ship a Node SDK, so all three spawn the vendor's own CLI directly, paying a fresh process-start cost on every call, not just the first. **Antigravity was investigated and ruled out** — its dedicated SDK is Python-only, has no tool-restricted mode, and its subscription tie-in isn't published.

As with any beta, expect it to be promoted to `latest` once it's had real-world mileage — check the [CHANGELOG](https://github.com/qtpsudhakarproducts/tamash-playwright/blob/main/CHANGELOG.md) for what's shipped in the version you're running.

## License

Free to use, including commercially. The source code may not be copied, modified, redistributed, or resold without prior written permission. See the LICENSE file included in this package for the full terms.

## Support

For questions or concerns, contact us at support@vibetestq.com.
