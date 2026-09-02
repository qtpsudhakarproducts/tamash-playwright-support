# How healing works

When a wrapped action fails (a `fill` times out, a `click` can't find its target), `tamash-playwright`:

1. Captures an **AI-optimized accessibility snapshot** of the page — every element, including nameless ones, with its real parent/child/sibling structure. Not a flat list of named things.
2. Sends the failed action, your `.describe()` label, and that snapshot to the [configured provider](providers.html).
3. Gets back a single element the description points at — anywhere in the tree.
4. A separate, **deterministic** step (no extra AI call) works out the most durable way to describe that element going forward.
5. Retries the original action — with every original argument preserved — against the durable locator.

## Deriving a durable locator

Once the model has pointed at an element, the fix is built from, in order of preference:

1. **Its own identity** — a real id, test id, accessible role + name, label, or placeholder. Covers the large majority of cases.
2. **A nearby label** — if it has none of the above but a label sits right next to it *in the page's structure* (the actual DOM relationship, not "somewhere on screen"), the fix anchors on that text.
3. **Positional fallback** — whatever Playwright's own locator-generation can produce, even one that depends on element order.

Every candidate at every step is verified against the live page — confirmed to be the exact same element by real DOM identity, not "something matched" — before it's trusted.

The 9 structured strategies the derivation can emit: `role`, `text`, `testId`, `label`, `placeholder`, `css`, `near` ("the field next to this text"), `scoped` ("this control inside that dialog"), `containing` ("the row containing this text"). Never a brittle `nth-child` guess.

## Never guess

The healer **declines** rather than pick wrong. A paraphrased description, a dead CSS selector with no human-readable text, or two equally-plausible elements near the same anchor all get an honest "couldn't resolve this" — reported as `stage=ai_declined` — not a guessed heal into a similar-looking element.

## When a fix needs a second look — `needsReview`

- **Not flagged** — the selector came from the element's own identity (step 1). As solid as anything you'd write by hand.
- **`needsReview`** — it came from a nearby label (step 2) or a positional fallback (step 3). Correct *right now* (verified live) but worth a glance before you rely on it long term.

Shown as `needsReview=yes` in the console line, a `self-heal-needs-review` annotation in the HTML report, and a `[NEEDS REVIEW]` tag in `apply-heals` output. It's informational, never a gate.

## `getDurable()` on demand

The same derivation is a method:

```ts
const durable = await locator.getDurable('fill');
await durable.click();
```

Most useful on a locator built from an `aria-ref=` — resolves it to a stable `getByRole` / `getByLabel` / css. Throws if nothing durable can be derived.

## What is never healed

- **`dragTo` / `drop`** — a two-sided operation; guessing a replacement for one side isn't safe.
- **`waitFor`** — a state check, not an action. A timeout can mean a broken selector *or* "this correctly never appeared" (verifying absence, a real app bug). Those can't be told apart from the error alone, so healing stays out of it — the failure is still reported cleanly.
- **`expect(locator).toBeVisible()` and similar assertions** — same reasoning, and they never reach this mechanism anyway (Playwright's own matcher machinery).

## Beyond selectors

- [Vision fallback](vision-fallback.html) — a screenshot-based search when text matching can't distinguish the element.
- [Action recovery](action-recovery.html) — optional: the element was found but the action still failed (covered, off-screen, mid-animation).
- [Heal caching](caching.html) — a confirmed heal is retried before any AI call.
