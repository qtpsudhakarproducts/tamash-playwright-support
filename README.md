# tamash-playwright — Support & Documentation

Plug-and-play **self-healing for Playwright**, across **TypeScript**, **Python**, and **Java**.

When a test can't find an element, `tamash-playwright` asks an AI model (or a free, zero-AI rule-based matcher) to locate it on the live page and retries. If it succeeds, the test keeps going; if not, it fails normally — exactly like stock Playwright. Every attempt is logged: provider, suggested selector, token cost, and where the locator lives in your code. In most projects it's one import swap.

This repo is the **home for documentation and support**. The library source lives in the per-language packages.

> Step one of a bigger idea — **TAMASH: Test Automation Monitoring And Self-Healing**. Playwright kept shipping pieces of the original observability vision natively, so instead of a competing platform we build focused packages on top of it. Self-healing and reporting first.

## 📖 Documentation

**→ [qtpsudhakarproducts.github.io/tamash-playwright-support](https://qtpsudhakarproducts.github.io/tamash-playwright-support/)**

| | |
|---|---|
| [Introduction](https://qtpsudhakarproducts.github.io/tamash-playwright-support/intro.html) · [Installation](https://qtpsudhakarproducts.github.io/tamash-playwright-support/installation.html) · [Writing tests](https://qtpsudhakarproducts.github.io/tamash-playwright-support/writing-tests.html) · [Running in CI](https://qtpsudhakarproducts.github.io/tamash-playwright-support/ci.html) | Getting started |
| [How healing works](https://qtpsudhakarproducts.github.io/tamash-playwright-support/how-healing-works.html) · [Making heals permanent](https://qtpsudhakarproducts.github.io/tamash-playwright-support/apply-heals.html) · [The AI agent skill](https://qtpsudhakarproducts.github.io/tamash-playwright-support/agent-skill.html) | Guides |
| [Providers overview](https://qtpsudhakarproducts.github.io/tamash-playwright-support/providers.html) · [CLI](https://qtpsudhakarproducts.github.io/tamash-playwright-support/cli.html) · [Environment variables](https://qtpsudhakarproducts.github.io/tamash-playwright-support/env-vars.html) · [Troubleshooting](https://qtpsudhakarproducts.github.io/tamash-playwright-support/troubleshooting.html) | Reference |
| [TypeScript](https://qtpsudhakarproducts.github.io/tamash-playwright-support/typescript.html) · [Python](https://qtpsudhakarproducts.github.io/tamash-playwright-support/python.html) · [Java](https://qtpsudhakarproducts.github.io/tamash-playwright-support/java.html) | By language |

## Packages

| Language | Package | Registry |
|---|---|---|
| TypeScript | `tamash-playwright` | [npm](https://www.npmjs.com/package/tamash-playwright) |
| Python | `tamash-playwright` | [PyPI](https://pypi.org/project/tamash-playwright/) |
| Java | `io.github.qtpsudhakarproducts:tamash-playwright` | [Maven Central](https://central.sonatype.com/artifact/io.github.qtpsudhakarproducts/tamash-playwright) |

## Working examples

| Language / Framework | Repo |
|---|---|
| TypeScript + Playwright Test | [tamash-playwright-typescript-playwright](https://github.com/qtpsudhakarproducts/tamash-playwright-typescript-playwright) |
| TypeScript + Cucumber | [tamash-playwright-typescript-cucumber](https://github.com/qtpsudhakarproducts/tamash-playwright-typescript-cucumber) |
| Python + pytest | [tamash-playwright-python-pytest](https://github.com/qtpsudhakarproducts/tamash-playwright-python-pytest) |
| Java + JUnit 5 | [tamash-playwright-java-junit](https://github.com/qtpsudhakarproducts/tamash-playwright-java-junit) |

## Support, bugs, feature requests

All support — every language — goes through this repo's [Issues](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues). Open one and pick the template:

| Template | Use it for |
|---|---|
| 🐛 **Bug report** | Something not working as documented — healing fails unexpectedly, wrong selector, crash, install/config problem |
| 🚀 **Feature request** | A new capability, provider, or improvement |
| 🙋 **Support request** | "How do I…", configuration help, anything you're stuck on |

Each template asks for your **Language** and **Framework**, package version, provider, and logs — used to auto-label the issue. Please [search existing issues](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues?q=is%3Aissue) first.

### Filtering issues

Issues are auto-labeled `lang: typescript|python|java` and `framework: playwright-test|pytest|junit5|testng`, plus `bug` / `enhancement` / `question`. Examples: [all Python](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues?q=is%3Aissue+label%3A%22lang%3A+python%22) · [open TypeScript bugs](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues?q=is%3Aissue+is%3Aopen+label%3Abug+label%3A%22lang%3A+typescript%22) · [all labels](https://github.com/qtpsudhakarproducts/tamash-playwright-support/labels).

---

Free to use, including commercially. Source may not be copied, modified, redistributed, or resold without prior written permission — see each package's LICENSE. Questions: support@vibetestq.com.
