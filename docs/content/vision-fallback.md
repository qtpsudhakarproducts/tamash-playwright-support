# Vision fallback

Sometimes an element has nothing useful to match on by text — an icon-only button with no label, or several visually distinct controls that look identical in the accessibility tree.

When the normal text-based attempt fails and your configured model **accepts image input**, `tamash-playwright` automatically takes a screenshot and asks the model to point at the element visually. Same provider, same `.env` — no separate setup.

If it finds one, that on-screen point is translated back to a real element and a [durable locator](how-healing-works.html#deriving-a-durable-locator) is derived from it, exactly as with the text path.

## Which models support it

Any vision-capable model: `gpt-4o` / `gpt-4.1`, `claude-haiku-4-5` and other recent Claude models, `gemini-2.5-flash` / `gemini-2.5-pro`, vision-capable Ollama models — and `claude-subscription` / `copilot-subscription` when pointed at a vision-capable model.

`tamash` (rule-based) has no model, so it never does vision. Check yours:

```sh
npx tamash-playwright doctor
```

The **Vision capability** row reports whether your configured model is expected to support it (by name — not a live check).

## In the report

A vision heal shows `vision=yes` in the console line and the report attachment. It's strictly a second attempt — the cheaper text path always runs first.
