# CLI commands

```
npx tamash-playwright doctor       [--dir <path>]
npx tamash-playwright apply-heals   [--dry-run] [--logs-dir <path>] [--yes]
npx tamash-playwright init-skill    [--target claude|agents] [--user] [--force] [--dry-run] [--dir <path>]
```

For Python/Java, the same commands run through that language's own entry point — see [Python](python.html) / [Java](java.html).

## `doctor`

Pre-flight checks. Prints a colour-coded summary table.

| Check | |
|---|---|
| **AI Provider** | Calls your configured provider within your real `actionTimeout`. A `[FAIL]` names the category and the fix — see below. |
| **Action Timeout** | `actionTimeout` set, and well below `timeout`. |
| **Vision capability** | Whether your model is expected to support the [screenshot fallback](vision-fallback.html) (by name). |
| **Locators without `.describe()`** | Scans `tests/` (or `--dir <path>`), raw CSS/XPath first, ranked. |
| **Inline locators** | Locators written straight into a test rather than a Page Object. |
| **Skill** | Whether the [agent skill](agent-skill.html) is installed in `.claude/skills/` / `.agents/skills/` and current. |

A provider `[FAIL]` is one of: `not-installed` (with the exact `npm install` / vendor installer), `not-authenticated` (`claude login` / check the key / subscription over quota), `timeout` (raise `actionTimeout`), `bad-model` (fix the `<PROVIDER>_MODEL` value), `network` (proxy / base URL), `bad-response` (model too small / off-task). The raw error line is printed underneath.

- `--dir <path>` — directory to scan for locators (default `tests`).

## `apply-heals`

Rewrites broken locators to the selectors that healed at runtime. See [Making heals permanent](apply-heals.html).

- `--dry-run` — preview the source changes (and `verify-heals.cjs`) without writing.
- `--logs-dir <path>` — merge every `heals.jsonl` found under `<path>` (any nesting) instead of the local log — for sharded CI.
- `--yes` / `-y` — skip the confirmation prompt at a real terminal too (already skipped in CI / non-interactive).

Every real run also writes `.tamash-playwright/verify-heals.cjs` — run `node .tamash-playwright/verify-heals.cjs` to re-verify the affected tests with healing off.

## `init-skill`

Installs the orchestration skill (`SKILL.md` + `references/`) into `.claude/skills/tamash-playwright/` **and** `.agents/skills/tamash-playwright/`. See [The AI agent skill](agent-skill.html).

- `--target <claude\|agents>` — install just one location (default: both).
- `--user` — install under your home directory (`~/.claude`, `~/.agents`) — covers every project.
- `--force` — overwrite a skill directory that has no version marker (a hand-edited copy).
- `--dry-run` — show what would be written.
- `--dir <path>` — treat `<path>` as the project root.
