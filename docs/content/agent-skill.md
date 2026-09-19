# The AI agent skill

Nobody enjoys configuring test self-healing. So hand it to your coding agent.

```sh
npx tamash-playwright init-skill
```

That installs a **skill** — a packaged set of instructions — that teaches Claude Code, Cursor, GitHub Copilot, Windsurf, Kiro, or Zed the entire `tamash-playwright` workflow. From then on you talk to your agent and it runs the loop:

- *"Set up self-healing for this suite"* → it runs `doctor`, picks a provider with you, writes `.env` (never handling your key), sets `actionTimeout`, adds `.describe()` labels by reading what each element actually is, and re-checks until `doctor` is green.
- *"Run the tests and land whatever healed"* → runs the suite, opens the report, reviews **each heal with real judgment** (was the model's pick right? does it match the page?), then `apply-heals` rewrites the source, re-verifies **with healing off**, and opens a PR.

It pauses for a human at exactly two points: a genuinely ambiguous fix, or a verification that failed. Everything else it handles.

- *"Get this suite healthy and tell me what is really broken"* → for tests that still fail after healing, it collects evidence from the Playwright JSON report and its attachments, groups failures by shared cause, explores the failing state, and classifies each failure as locator drift, an intentional app change, a suspected product defect, a flaky test, an environment or data problem, or cannot tell. It fixes locator drift; changes an assertion, an expected value or a flow step only with evidence the app change was intended (a ticket, PR, release note or changelog entry) or with your approval; never changes product code; and never weakens a test to make it pass. It verifies with healing off, repeated three times, and reports two sections: **Fixed**, and **Needs a human**, which lists suspected defects, flaky tests, environment problems, unresolved cases and heals marked as [identical elements](how-healing-works.html#identical-elements). Tests in the second section are left unchanged.

It's pure orchestration over the CLI commands already documented here — `doctor`, `apply-heals`, `verify-heals.cjs`. No new capability, and it never commits or opens a PR without asking.

## Limits of the maintenance step

- The classification is made by an AI model and can be wrong. Drift versus defect is the hardest call, because the application alone cannot show whether a change was intended.
- A heal can land on the wrong element and the test can still pass. Heals flagged `needsReview`, and heals that change a name, label or text, need review.
- "Suspected defect" means the failure could not be explained as a test problem. It is not a confirmed bug.
- The list of tests that depend on a shared file is found by searching imports. It can miss dynamic imports and generated code.
- The rules are instructions to an agent. Results differ between agents and models.
- Token and cost limits are set by the agent or its account, not by this package.
- Every pull request needs review before merging.

## Where it installs

The same skill (`SKILL.md` + a `references/` folder) goes into **both** standard locations — the convention Playwright's own `playwright-cli install --skills` uses:

| Location | Read by |
|---|---|
| `.claude/skills/tamash-playwright/` | Claude Code |
| `.agents/skills/tamash-playwright/` | the cross-tool standard — Cursor, GitHub Copilot, Windsurf, Kiro, Zed, and others |

Same content in both; **no per-agent format conversion**.

```sh
npx tamash-playwright init-skill --target claude   # only .claude/skills/
npx tamash-playwright init-skill --target agents   # only .agents/skills/
npx tamash-playwright init-skill --user            # under your home dir, covers every project
npx tamash-playwright init-skill --dry-run         # show what would be written
```

Each install carries a version marker. `npx tamash-playwright doctor` flags when the installed skill is behind the package — re-run `init-skill` to refresh.

## Agents that read `AGENTS.md`

`init-skill` does not write `AGENTS.md`. For an agent that reads `AGENTS.md` but not the skills folders, add a pointer to the installed skill:

```md
## Test maintenance

For healed locators, failing Playwright tests or maintaining the suite, follow the skill in
`.agents/skills/tamash-playwright/SKILL.md`. Start with `npx tamash-playwright doctor`.
```

> **Upgrading from a `0.11.0-beta.7` install?** That earlier version wrote a Cursor-specific `.mdc` file and appended blocks into `.github/copilot-instructions.md` / `AGENTS.md`. Those aren't produced any more — `init-skill` and `doctor` point out any leftovers so you can delete them.
