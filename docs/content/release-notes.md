# Release notes

The full, dated changelog ships inside the package and is on GitHub:

- **TypeScript** — [`CHANGELOG.md`](https://www.npmjs.com/package/tamash-playwright?activeTab=code) in the published package
- **Python** — [PyPI release history](https://pypi.org/project/tamash-playwright/#history)
- **Java** — [Maven Central versions](https://central.sonatype.com/artifact/io.github.qtpsudhakarproducts/tamash-playwright)

New TypeScript capabilities land on npm's `beta` tag first:

```sh
npm install tamash-playwright@beta
```

## Highlights — 0.11.0 (TypeScript)

**`doctor` now tells you *why* a provider failed, and the fix.** Not "no valid response" any more — it's `not-installed` (with the exact `npm install`), `not-authenticated` (`claude login` / check the key / over quota), `timeout` (raise `actionTimeout`), `bad-model`, `network`, or `bad-response`. The raw error is printed underneath. See [Troubleshooting](troubleshooting.html).

**`npx tamash-playwright init-skill`** — installs the [orchestration skill](agent-skill.html) into `.claude/skills/` and `.agents/skills/` (the convention Playwright's own `install --skills` uses). Your coding agent can then run the whole set-up → run → review → apply → verify → PR loop.

**Local-dev subscription providers** — heal off a [Kiro or Codex](providers-cli-subscription.html) subscription via their CLI, read-only, no API key. (`cursor-subscription` is experimental.)

**Readable failure reports** — ANSI colour codes are stripped from captured error text, so a not-healed report attachment reads as plain text.

**Tougher AI-response parsing** — conversational model output no longer causes a valid heal to be dropped.

Plus the accumulated beta fixes: wider popup / new-tab coverage, a `tamash` rule-based edge case on floating labels, the `ollama-local` provider, and a stale-`dist` cleanup.

Validated in CI across `claude-subscription`, `copilot-subscription`, `ollama`, and `tamash` on the [TypeScript sample repos](https://github.com/qtpsudhakarproducts/tamash-playwright-typescript-playwright) before release.
