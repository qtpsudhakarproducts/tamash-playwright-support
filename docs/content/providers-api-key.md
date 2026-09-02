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

Pointed `OPENAI_BASE_URL` at a self-hosted/internal OpenAI-compatible gateway behind a self-signed
or internal-CA cert (not the real OpenAI API)? Try `pip install pip-system-certs` first; as a last
resort, `OPENAI_TLS_VERIFY=false` (Python only, for now) skips verification — only has any effect
when `OPENAI_BASE_URL` is actually set to something other than the real OpenAI API. Same reasoning
as [`ollama-local`'s own TLS note](provider-ollama-local.html#a-self-signed-or-internal-ca-cert-python-only-for-now).

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

Uses Gemini's OpenAI-compatible endpoint. `GEMINI_TLS_VERIFY=false` is available too, same
last-resort/`GEMINI_BASE_URL`-only reasoning as `OPENAI_TLS_VERIFY` above.

## Vision

`gpt-4o` / `gpt-4.1`, recent Claude models, `gemini-2.5-*`, and vision-capable Ollama models all support the [screenshot fallback](vision-fallback.html). `npx tamash-playwright doctor` reports whether yours does.

## If `doctor` reports a failure

`doctor` names the category: `not-authenticated` (bad/absent key, or over quota), `bad-model` (the model id isn't one this provider serves — check the `_MODEL` var), `network` (DNS / proxy / base URL), `timeout` (raise `actionTimeout`, or the model is just slow). See [Troubleshooting](troubleshooting.html).
