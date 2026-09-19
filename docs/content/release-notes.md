# Release notes

The full, dated changelog ships inside the package and is on GitHub:

- **TypeScript** — [`CHANGELOG.md`](https://www.npmjs.com/package/tamash-playwright?activeTab=code) in the published package
- **Python** — [`CHANGELOG.md`](https://github.com/qtpsudhakarproducts/tamash-playwright-python/blob/main/CHANGELOG.md) on GitHub, and [PyPI release history](https://pypi.org/project/tamash-playwright/#history)
- **Java** — [Maven Central versions](https://central.sonatype.com/artifact/io.github.qtpsudhakarproducts/tamash-playwright)

New TypeScript capabilities land on npm's `beta` tag first:

```sh
npm install tamash-playwright@beta
```

## Highlights — 0.15.0-beta (TypeScript)

**`apply-heals` output lists each change on its own lines.** Each fix is shown with its `Before`, `After` and, when flagged, `Review` lines in full, followed by the files that change (page objects and helpers, then test files) and the tests to re-verify. See [Making heals permanent](apply-heals.html).

**`apply-heals --dry-run` no longer overwrites the last report.** A dry run writes `apply-heals-preview.md` and `.json`, headed "Nothing has been applied". `apply-heals-report.*` and `history/` describe real runs only.

**Identical elements are recorded.** When several elements are identical and only a positional selector can be written, the report records how many matched, which position was picked and whether the text model or vision picked it. See [How healing works](how-healing-works.html#identical-elements).

**Fix: a nearby-text selector could match more than one element once written to source.** The healer now verifies that selector in the form `apply-heals` writes, and uses the next option when it does not resolve to exactly the target element.

**The [AI agent skill](agent-skill.html) investigates tests that still fail after healing.** It classifies each failure, fixes what is safe to fix, verifies with healing off, and reports suspected defects for review.

## Highlights — 0.13.0-beta (TypeScript)

**AI-powered analysis of why a test failed.** New, on by default (`FAILURE_ANALYSIS_ENABLED`) — once a test's retries are exhausted and it's still failing, classifies it as `likely-defect`, `likely-wrong-locator`, `likely-timing-or-environment`, or `inconclusive`, so you know whether it's worth filing a bug, fixing a stale selector, or investigating flakiness. Covers any final failure, not just `expect()` — an action healing already tried and reported on is folded into the same classification instead of explained twice. No reporter to add; reuses whichever `HEALER_PROVIDER` is already configured. See [Reports & logs](reports.html#understanding-why-a-test-failed).

**A `context`/`page` built off `browser` in `test.beforeAll` now heals.** The common "log in once, reuse the session across every test in the file" pattern — `test.beforeAll(async ({ browser }) => { context = await browser.newContext(); page = await context.newPage(); })` — previously bypassed healing entirely. Now covered the same as `context`/`page` fixtures. See [Writing tests](writing-tests.html).

## Highlights — 0.12.0 (TypeScript)

**Playwright 1.63 support.** Verified against `@playwright/test` 1.63 — existing iframe healing and the wider healing suite are unchanged. `peerDependencies` stays `>=1.40.0`, so no upgrade is forced on you.

**Healing through Playwright 1.63's no-argument `page.frameLocator()`.** 1.63 lets you write `page.frameLocator()` with no selector to mean "any frame on the page." A broken locator reached that way now heals to a real, persistable selector when the page has a single frame — identical to what an explicit `page.frameLocator('#id')` produces, `apply-heals` included. On a page with several frames the healer can't tell which one you meant, so it steps aside cleanly — your original error is reported, never a wrong-frame guess. For healable multi-frame work, name the frame: `page.frameLocator('#id')`. See [Writing tests](writing-tests.html) and [How healing works](how-healing-works.html#what-is-never-healed).

**New companion package: [`tamash-playwright-dashboard`](https://www.npmjs.com/package/tamash-playwright-dashboard).** A zero-config Playwright reporter — pass-rate trends, per-test history, and a Self-Healing Analytics page read straight from this package's own heal reports. See [Reports & logs](reports.html#trends-across-runs-tamash-playwright-dashboard) for setup, or the [live dashboard](https://qtpsudhakarproducts.github.io/tamash-playwright-typescript-playwright/dashboard/index.html) generated from the TypeScript sample project's own CI runs.

## Highlights — 0.11.0 (TypeScript)

**`doctor` now tells you *why* a provider failed, and the fix.** Not "no valid response" any more — it's `not-installed` (with the exact `npm install`), `not-authenticated` (`claude login` / check the key / over quota), `timeout` (raise `actionTimeout`), `bad-model`, `network`, or `bad-response`. The raw error is printed underneath. See [Troubleshooting](troubleshooting.html).

**`npx tamash-playwright init-skill`** — installs the [orchestration skill](agent-skill.html) into `.claude/skills/` and `.agents/skills/` (the convention Playwright's own `install --skills` uses). Your coding agent can then run the whole set-up → run → review → apply → verify → PR loop.

**Local-dev subscription providers** — heal off a [Kiro or Codex](providers-cli-subscription.html) subscription via their CLI, read-only, no API key. (`cursor-subscription` is experimental.)

**Readable failure reports** — ANSI colour codes are stripped from captured error text, so a not-healed report attachment reads as plain text.

**Tougher AI-response parsing** — conversational model output no longer causes a valid heal to be dropped.

Plus the accumulated beta fixes: wider popup / new-tab coverage, a `tamash` rule-based edge case on floating labels, the `ollama-local` provider, and a stale-`dist` cleanup.

Validated in CI across `claude-subscription`, `copilot-subscription`, `ollama`, and `tamash` on the [TypeScript sample repos](https://github.com/qtpsudhakarproducts/tamash-playwright-typescript-playwright) before release.

## Highlights — 0.4.0 (Python)

Brings the Python package to full feature parity with TypeScript's 0.8.0–0.11.0 line:

**`doctor` now tells you *why* a provider failed, and the fix** — the same structured categories as TypeScript (`not-installed`, `not-authenticated`, `timeout`, `bad-model`, `network`, `bad-response`).

**`tamash-playwright init-skill`** and **`apply-heals`** — both now ship in the Python package too, through the same `tamash-playwright` console script (no `npx` needed). See [Python](python.html).

**Local-dev subscription providers** — `cursor-subscription`, `kiro-subscription`, `codex-subscription` join `claude-subscription`/`copilot-subscription`.

**`ollama-local`** and **`tamash`** (the zero-AI, rule-based provider) — both ported over.

**Full per-attempt history** — the console prints an `attempts:` block (cache/ref/text/vision/action-recovery) whenever more than one attempt was made.

Validated in CI across `ollama`, `claude-subscription`, `copilot-subscription`, `openai`, and `anthropic` on the [Python sample repo](https://github.com/qtpsudhakarproducts/tamash-playwright-python-pytest) before release.
