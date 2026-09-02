# `ollama-local` — your own Ollama server

```sh
HEALER_PROVIDER=ollama-local
OLLAMA_LOCAL_MODEL=gpt-oss:120b
OLLAMA_LOCAL_BASE_URL=http://your-internal-ollama-host:11434
# OLLAMA_LOCAL_API_KEY=   # only if your deployment requires one
```

Points at a self-hosted Ollama server instead of Ollama Cloud. Available in every language, works in CI.

## Why it's a separate provider, not a flag on `ollama`

The auth default is genuinely different. Ollama Cloud **always** requires `OLLAMA_API_KEY`. A self-hosted `ollama serve` normally has **no auth at all** — so `OLLAMA_LOCAL_API_KEY` is **optional** here.

Set it only if your internal deployment sits behind a reverse proxy or API gateway that requires a bearer token. When present it's sent as `Authorization: Bearer <token>`, exactly like the cloud provider's key; when absent, no auth header is sent.

Keeping it separate also means `doctor`, the reports, and the heal log all say plainly which kind of endpoint served a heal.

## Defaults

- `OLLAMA_LOCAL_BASE_URL` → `http://localhost:11434`
- Uses Ollama's native `/api/chat` endpoint (same as `ollama`).

## A self-signed or internal-CA cert (Python only, for now)

An internal deployment reached over `https://` often sits behind a self-signed cert or a private
company CA — that fails TLS verification by default, the same way any HTTPS client would react to
an untrusted cert. Try `pip install pip-system-certs` first (uses your OS's own certificate store,
which a managed corporate machine has usually already been given the right CA for). If that isn't
enough, set:

```sh
OLLAMA_LOCAL_TLS_VERIFY=false
```

Opt-in, defaults to verified, and scoped to `ollama-local` only — never added to `ollama`/`openai`/
`gemini`, whose endpoints are real public cloud APIs where skipping verification would risk leaking
the request (and its API key) to a MITM. `ollama-local` exists specifically for a self-hosted
server you already know and trust, so a self-signed cert there is expected, not a red flag — the
same trust model as an SSH host key on your own internal fleet. Prints a clear warning whenever
it's active. Python-specific right now (the TypeScript package has no equivalent yet).
