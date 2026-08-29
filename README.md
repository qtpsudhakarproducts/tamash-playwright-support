# tamash-playwright — Support & Documentation

Plug-and-play **self-healing for Playwright**, across **TypeScript**, **Python**, and **Java**.

Websites change often — a button gets renamed or moved, and a test can't find it anymore, even though the app still works fine for real users. `tamash-playwright` fixes this automatically: when a test can't find an element, it asks an AI model to locate it on the current page and retries. If it succeeds, your test keeps going. If not, it fails normally, just like before. Every attempt — healed or not — is fully logged: provider used, selector suggested, token cost.

No rewrites, no new framework to learn. In most cases it's one import swap or one config line — your tests stay exactly as you wrote them.

This repository (`tamash-playwright-support`) is the **home for documentation and support**: how to install and use `tamash-playwright` in each language, and where to raise bugs, feature requests, or support questions. The library source lives in the per-language packages and sample repos linked below.

> This is step one of a bigger idea — **TAMASH: Test Automation Monitoring And Self-Healing**. The original vision was full observability into test execution, monitored the way we monitor applications. Playwright kept shipping pieces of that vision natively, so instead of building a competing platform, we're building focused packages on top of it. Self-healing and reporting first — more to come.

Free to use, including commercially. Pick your provider — **Ollama** (free), **OpenAI**, **Anthropic**, **Gemini**, or (TypeScript only, for now) your own **Claude or GitHub Copilot subscription**, no API key needed — and give it a try.

---

## Contents

- [How it works](#how-it-works)
- [Packages](#packages)
- [Full documentation](#full-documentation)
- [Quick start — TypeScript](#quick-start--typescript)
- [Quick start — Python](#quick-start--python)
- [Quick start — Java](#quick-start--java)
- [Supported AI providers](#supported-ai-providers)
- [Sample implementations](#sample-implementations)
- [Getting support, reporting bugs, requesting features](#getting-support-reporting-bugs-requesting-features)
- [Filtering issues by language and framework](#filtering-issues-by-language-and-framework)

---

## How it works

1. Your test runs as normal using Playwright.
2. A locator fails to find its element (page changed, selector went stale, etc.).
3. `tamash-playwright` captures an accessibility/ARIA snapshot of the current page.
4. It sends that snapshot to your configured AI provider and asks it to find the described element.
5. If the model finds a match, the locator is healed and the test retries and continues.
6. If it can't be healed, the test fails normally — same as stock Playwright.
7. Every attempt (healed or not) is logged: provider, model, suggested selector, and token cost, plus an HTML report of the run.

## Packages

| Language | Package | Registry |
|---|---|---|
| TypeScript | `tamash-playwright` | [npm](https://www.npmjs.com/package/tamash-playwright) |
| Python | `tamash-playwright` | [PyPI](https://pypi.org/project/tamash-playwright/) |
| Java | `io.github.qtpsudhakarproducts:tamash-playwright` | [Maven Central](https://mvnrepository.com/artifact/io.github.qtpsudhakarproducts/tamash-playwright) |

## Full documentation

Complete, per-language guides — install steps, `.env` setup, every code pattern (plain tests, Page Object Model, fixtures), what gets healed vs. not, and how to read the report — are published on this repo's site:

- **[TypeScript / Playwright Test docs →](https://qtpsudhakarproducts.github.io/tamash-playwright-support/typescript.html)**
- **[Python / pytest docs →](https://qtpsudhakarproducts.github.io/tamash-playwright-support/python.html)**
- **[Java / JUnit 5 docs →](https://qtpsudhakarproducts.github.io/tamash-playwright-support/java.html)**

The quick starts below are the short version — start there if you just want a working example.

## Quick start — TypeScript

Works with Playwright Test.

```bash
npm install tamash-playwright
npm install -D @playwright/test
```

Create a `.env` file with your AI provider (see [Supported AI providers](#supported-ai-providers)):

```sh
HEALER_ENABLED=true
HEALER_PROVIDER=ollama
OLLAMA_MODEL=gpt-oss:120b
OLLAMA_API_KEY=your_key_here
```

**No API key issued to you?** If you have a personal Claude or GitHub Copilot subscription (including the free Copilot tier), use that instead — no key to paste anywhere:

```sh
HEALER_ENABLED=true
HEALER_PROVIDER=claude-subscription
CLAUDE_SUBSCRIPTION_MODEL=haiku
```

Both work unattended in CI too (a `claude setup-token` token for Claude; the ambient `GITHUB_TOKEN` in GitHub Actions, or a personal-account PAT elsewhere, for Copilot). See [Supported AI providers](#supported-ai-providers) below and the [TypeScript docs](https://qtpsudhakarproducts.github.io/tamash-playwright-support/typescript.html) for the one-time CLI install/login step each needs.

Swap your import — nothing else about the test changes:

```diff
- import { test, expect } from '@playwright/test';
+ import { test, expect } from 'tamash-playwright';
```

Verify your setup before running tests:

```bash
npx tamash-playwright doctor
```

Run tests as usual (`npx playwright test`, or however your project already runs them). Full guide: [TypeScript docs](https://qtpsudhakarproducts.github.io/tamash-playwright-support/typescript.html). Working example: [`tamash-playwright-typescript-playwright`](https://github.com/qtpsudhakarproducts/tamash-playwright-typescript-playwright).

## Quick start — Python

Works with `pytest` + `pytest-playwright`.

```bash
pip install tamash-playwright
playwright install
```

Create a `.env` file with your AI provider, same variables as above, then wire in the one line that activates healing — add this once to your project's `conftest.py`:

```python
# conftest.py
from tamash_playwright.plugin import page  # noqa: F401
```

Write tests exactly as you would with plain Playwright — the `page` fixture is now healing- and reporting-aware:

```python
from tamash_playwright import expect

def test_login(page):
    page.goto("/")
    page.get_by_placeholder("Username").fill("Admin")
    page.get_by_role("button", name="Login").click()
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible()
```

Run tests with the step-by-step HTML report turned on:

```bash
pytest --tamash-report=report.html
```

Full guide: [Python docs](https://qtpsudhakarproducts.github.io/tamash-playwright-support/python.html). Working example (plain tests, Page Object Model, and fixture-composition styles): [`tamash-playwright-python-pytest`](https://github.com/qtpsudhakarproducts/tamash-playwright-python-pytest).

## Quick start — Java

Works with JUnit 5.

Add the dependency to `pom.xml` (check [Maven Central](https://mvnrepository.com/artifact/io.github.qtpsudhakarproducts/tamash-playwright) for the latest version):

```xml
<dependency>
    <groupId>io.github.qtpsudhakarproducts</groupId>
    <artifactId>tamash-playwright</artifactId>
    <version>0.1.0</version>
</dependency>
```

Create a `.env` file with your AI provider, same variables as above, then swap Playwright's own `@UsePlaywright` for `@UseTamashPlaywright`:

```diff
- import com.microsoft.playwright.junit.UsePlaywright;
- @UsePlaywright
+ import io.github.qtpsudhakarproducts.tamash.junit.UseTamashPlaywright;
+ @UseTamashPlaywright
  public class LoginTest { ... }
```

`Page` is injected as a method parameter exactly like Playwright's own JUnit integration — write tests as normal. One Java-specific gotcha: wrap any locator/page passed to `assertThat(...)` with `unwrap(...)` (see the full guide for why).

Verify your setup:

```bash
mvn exec:java -Dexec.args="doctor"
```

Full guide: [Java docs](https://qtpsudhakarproducts.github.io/tamash-playwright-support/java.html). Working example (direct-locator and Page Object Model styles): [`tamash-playwright-java-junit`](https://github.com/qtpsudhakarproducts/tamash-playwright-java-junit).

## Supported AI providers

Pick whichever fits your budget and environment. Configuration is via environment variables (typically loaded from a `.env` file) in every language binding.

| Provider | Notes | Available in |
|---|---|---|
| **Ollama** | Free, runs locally (or Ollama Cloud) — good default for trying things out | TypeScript, Python, Java |
| **OpenAI** | Requires an OpenAI API key | TypeScript, Python, Java |
| **Anthropic** | Requires an Anthropic API key | TypeScript, Python, Java |
| **Gemini** | Requires a Google Gemini API key | TypeScript, Python, Java |
| **Claude subscription** | No API key — uses a personal Claude Pro/Max/Team/Enterprise subscription. Works unattended in CI too, via a `claude setup-token` token. | TypeScript |
| **GitHub Copilot subscription** | No API key — uses a personal Copilot subscription, including the free tier. Works unattended in GitHub Actions via the ambient `GITHUB_TOKEN`, or a personal-account PAT elsewhere. | TypeScript |

Each sample repo's `.env.example` documents the exact variable names for the healer toggle, provider selection, model, and API key for that language. The two subscription-based providers are TypeScript-only for now.

There's also a free, zero-AI option — `HEALER_PROVIDER=tamash` — currently in the TypeScript package's `@beta` release (`npm install tamash-playwright@beta`). No API key, no network call, no tokens: it resolves broken locators purely by matching your `.describe()` text against the page's own accessibility tree. The same `@beta` release adds `HEALER_PROVIDER=ollama-local` for teams running their own self-hosted Ollama server instead of Ollama Cloud, with an optional auth token for deployments that sit behind a gateway — and a skill for running the whole local workflow inside an AI coding assistant (Claude Code, Kiro, Cursor, GitHub Copilot, or any `AGENTS.md`-reading tool). See the [TypeScript docs' beta section](https://qtpsudhakarproducts.github.io/tamash-playwright-support/typescript.html#trying-the-latest-features-early-the-beta-release) for all three.

## Sample implementations

Want to see it wired into a real framework before you touch your own?

| Language / Framework | Repo |
|---|---|
| Python + pytest | [tamash-playwright-python-pytest](https://github.com/qtpsudhakarproducts/tamash-playwright-python-pytest) |
| TypeScript + Playwright Test | [tamash-playwright-typescript-playwright](https://github.com/qtpsudhakarproducts/tamash-playwright-typescript-playwright) |
| Java + JUnit 5 | [tamash-playwright-java-junit](https://github.com/qtpsudhakarproducts/tamash-playwright-java-junit) |

## Getting support, reporting bugs, requesting features

All support for `tamash-playwright` — across every language — is handled through this repository's [Issues](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues).

Open a new issue and pick the template that matches what you need:

| Template | Use it for |
|---|---|
| 🐛 **Bug report** | Something isn't working as documented (healing fails unexpectedly, wrong selector suggested, crash, install/config problem, etc.) |
| 🚀 **Feature request** | An idea for a new capability, a new provider, or an improvement |
| 🙋 **Support request** | "How do I…", configuration help, or anything you're stuck on |

Each template asks you to select your **Language** (TypeScript / Python / Java) and **Framework** (Playwright Test / pytest / JUnit 5 / TestNG), plus the package version, provider, and relevant logs. That information is used to automatically label your issue (see below) and routes it to the right context faster.

Before opening a new issue, please search [existing issues](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues?q=is%3Aissue) to avoid duplicates.

## Filtering issues by language and framework

Every issue opened through a template is automatically labeled based on the Language/Framework you selected, using labels like:

- `lang: typescript`, `lang: python`, `lang: java`
- `framework: playwright-test`, `framework: pytest`, `framework: junit5`, `framework: testng`

along with the standard `bug` / `enhancement` / `question` type labels.

Use the [Issues label filter](https://github.com/qtpsudhakarproducts/tamash-playwright-support/labels) or a search query to narrow things down, for example:

- All Python issues: [`label:"lang: python"`](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues?q=is%3Aissue+label%3A%22lang%3A+python%22)
- All pytest issues: [`label:"framework: pytest"`](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues?q=is%3Aissue+label%3A%22framework%3A+pytest%22)
- Open TypeScript bugs: [`label:"lang: typescript" label:bug is:open`](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues?q=is%3Aissue+is%3Aopen+label%3Abug+label%3A%22lang%3A+typescript%22)

---

**Links:** [npm](https://www.npmjs.com/package/tamash-playwright) · [PyPI](https://pypi.org/project/tamash-playwright/) · [Maven Central](https://mvnrepository.com/artifact/io.github.qtpsudhakarproducts/tamash-playwright) · [Python sample](https://github.com/qtpsudhakarproducts/tamash-playwright-python-pytest) · [TypeScript sample](https://github.com/qtpsudhakarproducts/tamash-playwright-typescript-playwright) · [Java sample](https://github.com/qtpsudhakarproducts/tamash-playwright-java-junit)

We automate for the future. It should survive future changes.
