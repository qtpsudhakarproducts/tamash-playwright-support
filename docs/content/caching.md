# Heal caching

Once a locator heals successfully, `tamash-playwright` records the confirmed selector in `.tamash-playwright/heals.jsonl`. Next time that exact locator breaks the same way, it tries the cached selector **first** — no accessibility snapshot, no AI call.

Only if the cached selector no longer works (the page changed again) does it fall through to a fresh snapshot-and-AI-call, exactly as before. There's no correctness risk — the cached selector is still verified against the live page before the action runs.

A cache hit shows as `provider=cache` in the console line, with no token count.

## Locally: an ongoing saving

The log lives on your disk and persists across every run on that checkout. A given broken locator only ever costs **one** AI call, no matter how many times you re-run afterward.

## In CI: only within one run

Most CI runners start from a fresh checkout each time, so `.tamash-playwright/` (gitignored, never committed) doesn't carry over between runs. Within a single run it still earns its keep — if the same broken locator appears in several tests (a shared Page Object method), only the first pays for a fresh AI call.

What actually eliminates repeat AI calls across CI runs is [`apply-heals`](apply-heals.html) merging the real fix into your source — then the locator isn't broken any more and healing never runs for it again.
