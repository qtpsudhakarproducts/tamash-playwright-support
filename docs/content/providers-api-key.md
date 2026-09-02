# API-key providers

The four providers you point at with an API key. All work in CI (set the key as a secret) and in every language.

## Ollama

Ollama Cloud — a free, fast way to get a key without OpenAI/Anthropic/Gemini billing.

1. Create an account at [ollama.com](https://ollama.com/).
2. [ollama.com/settings/keys](https://ollama.com/settings/keys) → create a key.

```sh
HEALER_PROVIDER=ollama
OLLAMA_MODEL=gpt-oss:120b
OLLAMA_API_KEY=your_key
# OLLAMA_BASE_URL=https://ollama.com   # default
```

For your **own** Ollama server rather than the cloud, use [`ollama-local`](provider-ollama-local.html) instead.

## OpenAI

```sh
HEALER_PROVIDER=openai
OPENAI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=sk-...
# OPENAI_BASE_URL=https://api.openai.com/v1   # default; set for a compatible gateway
```

`OPENAI_API_KEY` is required for the real OpenAI API above. Pointed `OPENAI_BASE_URL` at a
self-hosted/internal OpenAI-compatible gateway instead? Two things loosen (Python only, for now):

- **`OPENAI_API_KEY` becomes optional** — plenty of internal deployments have no auth layer at
  all, the same reasoning as [`ollama-local`'s own optional key](provider-ollama-local.html). No
  key set means no `Authorization` header is sent at all, rather than a broken one.
- **A self-signed/internal-CA cert** gets the same opt-in escape hatch as `ollama-local`: try
  `pip install pip-system-certs` first; as a last resort, `OPENAI_TLS_VERIFY=false` skips
  verification — only has any effect when `OPENAI_BASE_URL` is actually set to something other
  than the real OpenAI API. Same reasoning as
  [`ollama-local`'s own TLS note](provider-ollama-local.html#a-self-signed-or-internal-ca-cert-python-only-for-now).

## Anthropic

```sh
HEALER_PROVIDER=anthropic
ANTHROPIC_MODEL=claude-haiku-4-5
ANTHROPIC_API_KEY=sk-ant-...
```

Uses the official `@anthropic-ai/sdk` (a bundled dependency — nothing extra to install).

## Gemini

```sh
HEALER_PROVIDER=gemini
GEMINI_MODEL=gemini-3.6-flash
GEMINI_API_KEY=...
# GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai   # default
```

Uses Gemini's OpenAI-compatible endpoint. Same self-hosted-gateway notes as OpenAI above —
`GEMINI_API_KEY` becomes optional and `GEMINI_TLS_VERIFY=false` is available, both only when
`GEMINI_BASE_URL` is set to something other than the real Gemini API.

## Vision

`gpt-4o` / `gpt-4.1`, recent Claude models, `gemini-2.5-*`, and vision-capable Ollama models all support the [screenshot fallback](vision-fallback.html). `npx tamash-playwright doctor` reports whether yours does.

## If `doctor` reports a failure

`doctor` names the category: `not-authenticated` (bad/absent key, or over quota), `bad-model` (the model id isn't one this provider serves — check the `_MODEL` var), `network` (DNS / proxy / base URL), `timeout` (raise `actionTimeout`, or the model is just slow). See [Troubleshooting](troubleshooting.html).
