# `tamash` — rule-based, no AI

```sh
HEALER_PROVIDER=tamash
```

No API key, no subscription, no network call, no tokens. Available in every language.

## How it resolves a broken locator

It searches the page's accessibility tree for the same text your `.describe()` label (or a decoded named-variable, e.g. `txtLastName` → "Last Name") already gives it, then applies the **same structural-widening logic** — nearby-label anchoring — that the AI providers use once they've found the right anchor.

`doctor` always reports it connected — there's nothing external for it to reach.

## The honest tradeoff

It **never guesses**. These all get an honest decline (`stage=ai_declined`) rather than a guessed heal:

- a paraphrased description that doesn't closely match on-page text
- a raw CSS/XPath selector with no human-readable text at all
- two equally-plausible elements near the same anchor

Those are exactly the cases an AI's real reasoning can resolve and a text search can't. `tamash` also can't do the [vision fallback](vision-fallback.html) (no model to look at an image) or [action-recovery](action-recovery.html) tactics (both need inference it deliberately doesn't attempt).

## When to use it

A fast, free, fully deterministic first line of defense — especially for well-`.describe()`d, Page-Object-style suites, where its success rate is genuinely close to an AI's. Fall back to one of the [AI providers](providers.html) for anything it declines.
