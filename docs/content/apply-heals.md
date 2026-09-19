# Making heals permanent — `apply-heals`

Runtime healing never touches your source. The original broken locator stays in your test file or Page Object forever, healed at runtime on every run, until you fix it. `apply-heals` closes that loop: it rewrites the broken locator to the selector that actually worked.

```sh
npx playwright test                          # heals at runtime, records to heals.jsonl
npx tamash-playwright apply-heals --dry-run  # preview the source changes
npx tamash-playwright apply-heals            # write them
```

Every run — dry or real — lists what it found before touching anything.

**TypeScript** lists each change on its own lines, then the files that change and the tests to re-verify:

```
Fixes (2, 1 needing review)

  1. src/pages/loginpage.ts:11
     Before  .locator('input[name="username"]')
     After   .getByRole("textbox", { name: "Username" })

  2. ⚠ tests/employee-id.spec.ts:31
     Before  .getByPlaceholder('Employee')
     After   .locator('div').filter({ hasText: 'Employee Id' }).getByRole('textbox')
     Review  No stable identity of its own — durable selector anchors on nearby text instead. Please verify this still targets the right element if the page layout changes.

Files to change

  Page objects and helpers (1)
    src/pages/loginpage.ts  1 fix

  Test files (1)
    tests/employee-id.spec.ts  1 fix

Tests to re-verify
  tests/employee-id.spec.ts:25
  tests/login.spec.ts:7
```

Fixes that could not be applied are listed under `Skipped`, each with its reason. When several elements on the page are identical and nothing distinguishes them, the fix can only be a position (`.first()`, `.nth(n)`); the fix then also shows an `Identical` line, for example `2 elements on the page are identical. #2 was picked by position (AI).` See [How healing works](how-healing-works.html#identical-elements).

**Python** prints a table with `Location`, `Before`, `After` and `Review` columns.

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
- **Every real run leaves a report** — `.tamash-playwright/apply-heals-report.md` / `.json`, archived under `history/`. In TypeScript, `--dry-run` writes `apply-heals-preview.md` / `.json` instead, headed "Nothing has been applied", and does not overwrite the latest report or add to `history/`.
- **Always review before committing.** It rewrites source files. `git diff`, re-run, commit deliberately.

## In CI

Run it as a job after your test job, feeding it the heal-log artifact. `--logs-dir <path>` merges `heals.jsonl` from multiple sharded jobs. It opens a PR with the verified diff rather than committing directly. See [Running in CI](ci.html#2-apply-heals-in-ci-heals-become-a-reviewed-pr).
