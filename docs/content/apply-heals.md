# Making heals permanent — `apply-heals`

Runtime healing never touches your source. The original broken locator stays in your test file or Page Object forever, healed at runtime on every run, until you fix it. `apply-heals` closes that loop: it rewrites the broken locator to the selector that actually worked.

```sh
npx playwright test                          # heals at runtime, records to heals.jsonl
npx tamash-playwright apply-heals --dry-run  # preview the source changes
npx tamash-playwright apply-heals            # write them
```

Every run — dry or real — prints a table of exactly what it found before touching anything:

```
Fixes (1)
  ┌───────────────────────────┬──────────────────────────┬─────────────────────────────────────────────┬────────┐
  │ Location                  │ Before                   │ After                                       │ Review │
  ├───────────────────────────┼──────────────────────────┼─────────────────────────────────────────────┼────────┤
  │ src/pages/loginpage.ts:11 │ .locator('input[name="…' │ .getByRole("textbox", { name: "Username" }) │ —      │
  └───────────────────────────┴──────────────────────────┴─────────────────────────────────────────────┴────────┘

1 fix(es) applied to 1 file(s), 0 skipped.
```

## Proving the fix stands on its own

Every real run also writes a verification script — `.tamash-playwright/verify-heals.cjs` (TS) or `.tamash-playwright/verify_heals.py` (Python):

```sh
node .tamash-playwright/verify-heals.cjs    # TS
python .tamash-playwright/verify_heals.py   # Python
```

This re-runs **exactly the affected tests** with `HEALER_ENABLED=false`. A pass proves the rewritten selectors work standalone — not just "worked while healing was still propping them up." In CI, this verification step runs automatically and its result goes into the PR body.

## Good to know

- **Nothing runs automatically.** `apply-heals` is a separate, deliberate command — a test run never edits source on its own.
- **Only real selector fixes qualify.** Text / ARIA-based heals, including vision heals that resolved to something reusable. Never an [action-recovery](action-recovery.html) heal.
- **Surgical edits.** `.describe('...')` and everything else on the line is untouched — only the `.locator(...)` / `.getByRole(...)` call is replaced.
- **`needsReview` is not a gate.** A flagged fix is still applied; the flag just shows in the table and the reports.
- **A real run asks for confirmation — at a real terminal only.** In CI / non-interactive it proceeds (no stdin). `--yes` skips the prompt at a terminal too.
- **Every run leaves a report** — `.tamash-playwright/apply-heals-report.md` / `.json`, archived under `history/`.
- **Always review before committing.** It rewrites source files. `git diff`, re-run, commit deliberately.

## In CI

Run it as a job after your test job, feeding it the heal-log artifact. `--logs-dir <path>` merges `heals.jsonl` from multiple sharded jobs. It opens a PR with the verified diff rather than committing directly. See [Running in CI](ci.html#2-apply-heals-in-ci-heals-become-a-reviewed-pr).
