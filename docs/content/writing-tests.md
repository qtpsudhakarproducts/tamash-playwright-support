# Writing tests

Once the [import is swapped](installation.html#5-swap-the-import), you write tests exactly as before.

```ts
import { test, expect } from 'tamash-playwright';

test('logs in', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('textbox', { name: 'Username' }).fill('testadmin');
  await page.getByRole('textbox', { name: 'Password' }).fill('secret');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

If any of those locators breaks later — the button is renamed, the field's placeholder changes — the test still passes, and you get a line telling you exactly what healed.

## Page Object Model

**Nothing about your Page Object classes needs to change.** A Page Object built on plain `Locator` / `Page` types from `@playwright/test` is already healing-aware the moment the `page` it receives came from a `test()` imported from `tamash-playwright`. Only the `test` / `expect` import in your **spec files** matters.

```ts
// pages/LoginPage.ts — unchanged
import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly username: Locator;
  constructor(page: Page) {
    this.username = page.getByRole('textbox', { name: 'Username' });
  }
}
```

```ts
// login.spec.ts — the only change is here
import { test } from 'tamash-playwright';
import { LoginPage } from './pages/LoginPage';
```

## Give the healer something to work with: `.describe()`

If you use descriptive Playwright locators (`getByRole`, `getByLabel`, `getByPlaceholder`), the healer already knows what it's looking for. If you use **raw CSS or XPath**, add a short human-readable label so it isn't guessing from a dead selector:

```ts
const username = page.locator('input[name="username"]').describe('Username field');
await username.fill('testadmin');
```

`.describe()` is purely additive — it never changes runtime behaviour. `doctor` flags every locator that's missing one, raw CSS/XPath first.

> **Tip.** You can skip `.describe()` on a named variable — the healer will decode `txtLastName` → "Last Name" as a fallback. An explicit `.describe()` is still better, because you can describe what the element *is*, not just what the variable is called.

## Getting a durable locator on demand: `getDurable()`

The "work out the most resilient way to describe this element" logic is also a method on any locator:

```ts
const durable = await someLocator.getDurable();     // a real Locator: getByRole / getByLabel / css / …
await durable.click();
```

Pass the action you're about to do (`getDurable('fill')`) so it can guess a role when the element's own role is generic. It throws if nothing durable can be derived — it never hands back something it doesn't trust. See [How healing works](how-healing-works.html).

## What else heals — no extra setup

- **Popups & new tabs** — a page from `context.newPage()`, `window.open`, a `target="_blank"` link, or `context.waitForEvent('page')` / `page.on('popup', …)` is just as healing-aware as your main `page`.
- **`<iframe>` content** — `page.frameLocator('#f')` and anything chained off it, scoped to the iframe's document.
- **Most of the API surface** — not just clicks and fills. `dragTo` / `drop` and `waitFor` are deliberately excluded (see [How healing works](how-healing-works.html#what-is-never-healed)), but still reported honestly on failure.

## Not using `@playwright/test` as the runner?

Cucumber, Jest, a plain script — it all works, but see [Running in CI](ci.html#non-playwright-runners) for one teardown call `copilot-subscription` needs.
