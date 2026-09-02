# Troubleshooting

Run `npx tamash-playwright doctor` first — it names most of these.

## Nothing heals — no `[self-healer]` lines at all

- **`HEALER_PROVIDER` not set**, or its `_MODEL` / key missing → `doctor` → AI Provider `[WARN]`/`[FAIL]`.
- **`HEALER_ENABLED=false`** somewhere (a shell export, a CI env) overriding `.env`.
- **You imported `test` from `@playwright/test`**, not `tamash-playwright`, in the spec file.

## Heals show `stage=no_snapshot`

`actionTimeout` is missing or too close to `timeout` — the broken locator burns the whole test budget before failing, leaving no time to heal. Set `actionTimeout` well below `timeout`. See [Installation](installation.html#3-set-actiontimeout).

## `doctor` AI Provider `[FAIL]`

| Category | Fix |
|---|---|
| `not-installed` | Run the `npm install` / vendor installer `doctor` prints. `claude-subscription` needs `@anthropic-ai/claude-agent-sdk`; `copilot-subscription` needs `@github/copilot-sdk`; the CLI providers need their CLI on `PATH`. |
| `not-authenticated` | Bad/absent key, expired login, or over quota. Run `claude login` / check the key / confirm the subscription is active. |
| `timeout` | The provider didn't answer within your `actionTimeout`. Raise it. For `claude`/`copilot`-subscription it can be a one-time CLI cold start — re-run once. Slower models (`gpt-oss:120b`, some Gemini) may just need a bigger budget. |
| `bad-model` | The `<PROVIDER>_MODEL` value isn't a model that provider serves. |
| `network` | DNS / proxy / firewall, or a wrong custom base URL. |
| `bad-response` | Connected, but the reply couldn't be parsed — usually a model that's too small or not following instructions. Try a stronger one. |

## No pytest / no test framework at all (Python)

Calling `bind_page(page)` / `bind_context(context)` directly on plain `playwright.sync_api` works
standalone — no pytest needed for healing itself. Two things behave differently without it, though:

- **No automatic `.env` loading.** `load_dotenv()` is only called by `doctor` and the pytest
  plugin — a bare script never reads a `.env` file on its own. Either call
  `from dotenv import load_dotenv; load_dotenv()` yourself before anything else, or just set real
  environment variables (simpler — see the Docker section below, since it sidesteps this
  entirely).
- **No automatic `tamash-report.html`.** That HTML report is wired through pytest's own hooks.
  Outside pytest you still get the console `[self-healer] ...` lines and `get_healing_reports()`
  in-process, just not the report file.

## Environment variables inside Docker

`HEALER_PROVIDER`/etc. showing up as `none` (or `provider=none, stage=no_provider` in the console
line) almost always means the variables never reached the container process — not a package bug.
Docker does **not** auto-inherit a host `.env` file, and `docker-compose`'s own `.env` (next to
`docker-compose.yml`) is only for `${VAR}` substitution *inside the compose file*, not automatic
injection into the container.

Pass them explicitly:
```sh
docker run --env-file .env your-image
# or
docker run -e HEALER_PROVIDER=openai -e OPENAI_API_KEY=... your-image
```
```yaml
# docker-compose.yml
services:
  tests:
    env_file: .env      # or an explicit environment: list
```

Confirm they actually landed, rather than guessing:
```sh
docker exec -it <container> env | grep HEALER
```
Empty output there is the definitive answer — fix how the container was started, not the code.

**Check *every* var the provider needs, not just `HEALER_PROVIDER`.** `provider=none` looks
identical whether `HEALER_PROVIDER` itself is missing, or it's set correctly but that provider's
own required vars (`OPENAI_API_KEY` + `OPENAI_MODEL`, etc.) aren't there. Print all of them
together with `repr()`, not `print()` — `repr()` reveals a hidden trailing `\r`/whitespace (a
classic CRLF-line-ending gotcha in an `--env-file`) that plain `print()` can hide:
```python
print(repr(os.environ.get("HEALER_PROVIDER")))
print(repr(os.environ.get("OPENAI_API_KEY")))
print(repr(os.environ.get("OPENAI_MODEL")))
```

## Env vars are correct but it still shows `none` (Python)

The provider is resolved **once per process** and cached from then on — including a negative
(`None`) result. If anything touches the healer before your real config is fully in place (an
early action failure, earlier test/setup code), that `None` sticks for the rest of the process even
after you fix the environment. Force a fresh resolution:
```python
from tamash_playwright.healer.providers import reset_provider_cache
reset_provider_cache()   # call once, after final env config, before bind_page()/the first action
```
The durable fix is making sure every required var is set *before* anything touches the healer at
all, so the first resolution is already correct and this never comes up.

## `doctor`'s AI-connectivity check is stuck at 15000ms (Python, no pytest)

`doctor`'s connectivity-check budget comes from scanning `conftest.py`/`pytest.ini`/
`pyproject.toml`/`setup.cfg`/`tox.ini` for a configured timeout — a project with no pytest has
nothing for that scan to find, so it's stuck on the generous default. Override it directly:
```sh
tamash-playwright doctor --timeout 30000
```

## `CERTIFICATE_VERIFY_FAILED` against a self-hosted/internal gateway (Python)

A self-hosted deployment (an internal Ollama server, or an OpenAI-compatible gateway reached via a
custom `OPENAI_BASE_URL`/`GEMINI_BASE_URL`) is often behind a self-signed or internal-CA cert.
Try `pip install pip-system-certs` first (uses your OS's own trust store — a managed corporate
machine usually already has the right CA installed there). If that's not enough, the matching
opt-in flag skips verification for that provider only, never for the real public API:
```sh
OLLAMA_LOCAL_TLS_VERIFY=false   # or OPENAI_TLS_VERIFY / GEMINI_TLS_VERIFY
```
See [`ollama-local`](provider-ollama-local.html#a-self-signed-or-internal-ca-cert-python-only-for-now)
and [API-key providers](providers-api-key.html) for the full detail.

## `bad-model` / `HTTP 404` against a custom base URL, but the model id looks right

A bare 404 is classified as `bad-model` by default, but for a provider with a *configurable* base
URL (`openai`/`gemini`/`ollama`/`ollama-local`), a 404 is just as likely to mean the URL itself is
wrong — a typo'd path, or a server that isn't actually what that provider expects — as it is a bad
model id. If the error body doesn't mention a model at all (e.g. a generic
`{"message": "Path not found"}`), check the base URL, not just the `_MODEL` value. `doctor`'s own
message points at both for exactly this reason.

**A related, subtler mismatch**: if that "404" URL is really a *different API shape entirely* — an
OpenAI-compatible gateway (path like `/v1/chat/completions`) mistakenly configured under
`ollama-local` (which expects Ollama's own native `/api/chat` path and request/response shape) —
no amount of fixing the URL or model id helps, because it's structurally the wrong provider. Switch
to `openai` (pointed at that same gateway via `OPENAI_BASE_URL`, without the `/chat/completions`
suffix — the provider adds that itself) instead.

**Also watch for cross-provider model-naming confusion**: Ollama's own `name:tag` convention (e.g.
`gpt-oss:120b`) only means something inside Ollama's model registry. A different backend serving
the "same" model under a plain name (no tag) will 404 on the tagged form — check what the target
server's own model catalog actually calls it.

## Unauthenticated self-hosted gateway — do I need an API key at all?

For `openai`/`gemini`: no, not if `OPENAI_BASE_URL`/`GEMINI_BASE_URL` is pointed at a self-hosted
deployment with no auth layer — the key becomes optional in that case (same reasoning
`ollama-local`'s own optional key already covers), and no `Authorization` header is sent at all
when it's absent. The key is still required against the real public OpenAI/Gemini APIs.

## First `claude-subscription` / `copilot-subscription` heal fails with "not authenticated?"

Often the one-time subprocess cold start exhausting a tight `actionTimeout`, not a real auth problem. Raise `actionTimeout` or just re-run before assuming your login/token is broken.

## `copilot-subscription` in GitHub Actions: `Authorization error, you may need to run /login`

Copilot must be enabled for **the repo owner** (org, if the repo belongs to one) — a personal subscription doesn't carry to an org's repos. Use a personal-account PAT as `COPILOT_GITHUB_TOKEN` instead. See [Claude / Copilot subscription](providers-subscription.html#github-actions).

## A non-Playwright runner hangs after all tests pass

`copilot-subscription` keeps a subprocess open. Call `closeCopilotSubscriptionClient()` in the runner's teardown. See [Running in CI](ci.html#non-playwright-runners).

## `cursor-subscription`: lots of `stage=ai_declined`

Cursor's `agent` CLI answers conversationally rather than with JSON. Switch to `kiro-subscription` or `codex-subscription`. See [Kiro / Codex / Cursor](providers-cli-subscription.html#cursor).

## A `waitFor` / assertion "isn't healing"

By design — see [How healing works](how-healing-works.html#what-is-never-healed). A timeout there can legitimately mean "this correctly never appeared."

## Still stuck?

[Open an issue](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues/new/choose) — pick the template, include your `HEALER_PROVIDER`, package version, and the `[self-healer]` console line.
