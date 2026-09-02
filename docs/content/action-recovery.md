# Action recovery

Occasionally a locator heals correctly — the model found the right element — but the **action** on it still fails: it's covered by an overlay, needs scrolling into view, or the page is mid-animation.

Action recovery is an optional second layer. Enable it:

```sh
HEALER_ACTION_RECOVERY_ENABLED=true
```

When on, and only after the element is already located, the model picks **one tactic from a fixed, safe menu**:

| Tactic | When |
|---|---|
| `scroll` | element is outside the viewport — scroll it in, then retry |
| `force` | an overly strict actionability check (e.g. "not stable" after a finished animation) — retry bypassing checks |
| `wait` | something transient still settling — wait briefly, then retry |
| `dispatch` | genuinely covered by another element — dispatch the DOM event directly (last resort) |
| `none` | nothing above would plausibly help |

The model never decides *how* to interact with the page — it only picks from those five. That's why it's **off by default**: it's a more speculative layer than selector healing.

## In the report

`actionRecovery=yes` in the console line and attachment. An action-recovery heal is **not** eligible for [`apply-heals`](apply-heals.html) — the locator was already right, only the action needed help, so there's no source change to make.
