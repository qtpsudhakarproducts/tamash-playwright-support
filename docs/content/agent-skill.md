# The AI agent skill

Nobody enjoys configuring test self-healing. So hand it to your coding agent.

```sh
npx tamash-playwright init-skill
```

That installs a **skill** — a packaged set of instructions — that teaches Claude Code, Cursor, GitHub Copilot, Windsurf, Kiro, or Zed the entire `tamash-playwright` workflow. From then on you talk to your agent and it runs the loop:

- *"Set up self-healing for this suite"* → it runs `doctor`, picks a provider with you, writes `.env` (never handling your key), sets `actionTimeout`, adds `.describe()` labels by reading what each element actually is, and re-checks until `doctor` is green.
- *"Run the tests and land whatever healed"* → runs the suite, opens the report, reviews **each heal with real judgment** (was the model's pick right? does it match the page?), then `apply-heals` rewrites the source, re-verifies **with healing off**, and opens a PR.

It pauses for a human at exactly two points: a genuinely ambiguous fix, or a verification that failed. Everything else it handles.

It's pure orchestration over the CLI commands already documented here — `doctor`, `apply-heals`, `verify-heals.cjs`. No new capability, and it never commits or opens a PR without asking.

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

> **Upgrading from a `0.11.0-beta.7` install?** That earlier version wrote a Cursor-specific `.mdc` file and appended blocks into `.github/copilot-instructions.md` / `AGENTS.md`. Those aren't produced any more — `init-skill` and `doctor` point out any leftovers so you can delete them.
