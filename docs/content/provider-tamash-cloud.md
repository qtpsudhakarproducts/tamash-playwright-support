# tamash-cloud — no AI key of your own

`HEALER_PROVIDER=tamash-cloud` heals with the key of your project and nothing else. There is no AI account to create and no model to choose. TypeScript only.

```sh
TAMASH_LICENSE_KEY=TAMASH1.xxxxxxxx.xxxxxxxx
HEALER_PROVIDER=tamash-cloud
```

Copy the key of your project from **Projects** in the TAMASH portal (see [Installation](installation.html)).

## How a heal goes

1. **Your machine first.** The package checks its own cache of earlier heals, then the same rule-based matcher that [`tamash`](provider-tamash.html) uses. No network, no tokens. Most heals end here.
2. **The portal for the rest.** What the rules cannot place goes to the TAMASH portal: the action, the description of the element and the accessibility snapshot of the page (the first 40,000 characters). The portal answers from your project's cache of locators that worked, then from its own model.
3. **Your page decides.** The package tries the suggestion on the real page. It tells the portal whether it worked, and sends the durable locator it made from the answer. The portal keeps that locator for your project, and not the page, so the next run of the project, including a fresh CI checkout, does not need the model again.

## What is and is not kept

The portal does not store the snapshot or the description. It keeps the locator that worked, with a hash of the page's structure, for 30 days, for your project only. It counts heals, which step answered, and tokens. See [License key](installation.html) for what the package sends.

## When the portal cannot answer

Healing carries on with the rules, and the console says why. A test never fails because of the portal.

| Message | What it means |
|---|---|
| The TAMASH model service could not be reached | Your network or the portal. Only the rules run until it can be reached |
| No key available for your organization right now | TAMASH has no model key set up for you; write to support@vibetestq.com |
| Reached its limit for this month | A ceiling on model calls for your project; the rules still run |
| Air-gapped | Your license sends nothing out, so only the rules run |
| The heals included in the key are used up | Healing is off until the month changes, or you add heals |

`npx tamash-playwright doctor` shows whether the portal is reachable and accepts your key. Set `TAMASH_OFFLINE=true` to send nothing.
