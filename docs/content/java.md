# tamash-playwright

`tamash-playwright` is a plug and play self-healing solution for Playwright + JUnit 5. Install it, add your AI API key details, and swap one annotation.

That's it. No changes needed to your actual test methods if you're following standard Playwright/JUnit best practices.

> Also available for TypeScript ([`tamash-playwright` on npm](https://www.npmjs.com/package/tamash-playwright)) and Python (`tamash-playwright` on PyPI) — same name, same idea, separate package per ecosystem.

### Why you need this

Websites change often. A button gets renamed or moved, and your test can't find it anymore — even though the app still works fine for real users. Normally, that just means a broken test.

`tamash-playwright` fixes this automatically. When a test action can't find an element, it asks an AI model to find it on the current page and tries again. If it succeeds, your test keeps going. If not, it fails normally, just like before.

Here are the detailed steps to use this package.

## Step 1: Install it

Add the dependency to your `pom.xml`:

```xml
<dependency>
  <groupId>io.github.qtpsudhakarproducts</groupId>
  <artifactId>tamash-playwright</artifactId>
  <version>0.1.0</version>
</dependency>
```

This pulls in Playwright and JUnit 5 as transitive dependencies. If you're starting fresh, you'll also need the Playwright browsers:

```sh
mvn exec:java -e -Dexec.mainClass=com.microsoft.playwright.CLI -Dexec.args="install"
```

## Step 2: Connect an AI model

`tamash-playwright` needs an AI model to decide where a broken element actually went. Pick one of Ollama, OpenAI, Anthropic (Claude), or Google Gemini, and give it an API key.

Create a file named `.env` in your project folder:

```sh
# Master on/off switch. Leave this as true, or remove the line entirely.
HEALER_ENABLED=true

# Pick one: ollama | openai | anthropic | gemini
HEALER_PROVIDER=ollama

# --- Ollama Cloud (https://ollama.com) ---
OLLAMA_MODEL=gpt-oss:120b
OLLAMA_API_KEY=

# --- OpenAI ---
# OPENAI_MODEL=gpt-4.1-mini
# OPENAI_API_KEY=

# --- Anthropic ---
# ANTHROPIC_MODEL=claude-haiku-4-5
# ANTHROPIC_API_KEY=

# --- Google Gemini ---
# GEMINI_MODEL=
# GEMINI_API_KEY=
```

Just fill in the API key and model for whichever one you want to use, and leave the rest as-is (or delete them).

### Getting a free Ollama key (fastest way to get started)

Ollama Cloud is a quick, free way to get an API key without signing up for OpenAI/Anthropic/Gemini billing.

1. Go to [ollama.com](https://ollama.com/) and create an account.
2. Once signed in, go to [ollama.com/settings/keys](https://ollama.com/settings/keys).
3. Create a new API key and copy it.
4. Paste it into your `.env` file:

```sh
HEALER_ENABLED=true
HEALER_PROVIDER=ollama
OLLAMA_MODEL=gpt-oss:120b
OLLAMA_API_KEY=paste_your_key_here
```

That's all you need — no other variables required.

## Step 3: Use it in your tests

Swap Playwright's own `@UsePlaywright` for `@UseTamashPlaywright` at the top of your test class — everything else about writing the test stays the same:

```java
// Before
import com.microsoft.playwright.junit.UsePlaywright;

@UsePlaywright
public class LoginTest { ... }

// After
import io.github.qtpsudhakarproducts.tamash.junit.UseTamashPlaywright;

@UseTamashPlaywright
public class LoginTest { ... }
```

Write your tests as normal — `Page` is injected as a method parameter exactly like Playwright's own JUnit integration:

```java
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import io.github.qtpsudhakarproducts.tamash.junit.UseTamashPlaywright;
import org.junit.jupiter.api.Test;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static io.github.qtpsudhakarproducts.tamash.bindings.Bindings.unwrap;

@UseTamashPlaywright
public class LoginTest {

  @Test
  void logsIn(Page page) {
    page.navigate("/");
    page.getByPlaceholder("Username").fill("Admin"); // healed automatically if this breaks
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Login")).click();
    assertThat(unwrap(page.getByRole(AriaRole.HEADING, new Page.GetByRoleOptions().setName("Dashboard")))).isVisible();
  }
}
```

**Important:** `assertThat(...)` needs `unwrap(...)` around any locator/page you pass to it — see "What gets healed (and what doesn't)" below for why this is required, not optional, in Java specifically.

Under the hood, `@UseTamashPlaywright` runs its own Playwright/Browser/BrowserContext/Page lifecycle rather than wrapping Playwright's own `playwright-junit` extension — JUnit 5 doesn't allow two independent extensions to both resolve the same `Page` parameter type, so this package manages that lifecycle itself (launch once per test class, fresh context per test method), the same way the TS package defines its own `test.extend()` and the Python port defines its own `page` fixture. `Browser`, `BrowserContext`, and `Playwright` are also injectable as parameters if you need them.

## Step 4: Check your setup

Run the built-in doctor command to confirm everything's wired up correctly:

```sh
mvn exec:java -Dexec.args="doctor"
```

It checks three things:

1. **AI connectivity** — confirms `HEALER_ENABLED`/`HEALER_PROVIDER` are set correctly and actually calls your configured provider to make sure the API key and model work.
2. **Missing `.describe()` labels** — scans your test files (`src/test/java` by default, or pass `-Dexec.args="doctor --dir <path>"`) for locators that don't have a `.describe("...")` label, flagging the ones most worth fixing (raw CSS/XPath selectors first).
3. **Locators written directly in test files** — flags any locator defined inline in a test rather than inside a Page Object class, a Playwright best practice regardless of self-healing.

If it finds issues, the fastest fix is to open the project in an AI coding assistant (Claude Code, Cursor, GitHub Copilot, etc.) and ask it to address what it flagged. You can also add a standing rule to that assistant's instructions/skill file (e.g. `CLAUDE.md`, `.cursor/rules`, `.github/copilot-instructions.md`) so it follows both practices automatically on any new test code going forward.

### A quick tip for better results

If you're using plain CSS selectors (like `page.locator("input[name='username']")`) rather than Playwright's more descriptive locators (`getByRole`, `getByPlaceholder`, etc.), it helps to add a short, human-readable label so the healer knows what it's actually looking for. Chain `.describe("...")` right onto the locator:

```java
Locator username = page.locator("input[name='username']").describe("Username Textbox");
username.fill("testadmin");
```

This step is optional, but recommended — without it, the healer has to guess purely from a broken CSS selector, which gives it a lot less to work with.

One Java-specific limitation worth knowing: for `getByRole(...)`, the auto-derived description (used when you don't call `.describe()`) only captures the role itself (e.g. `role:button`), not the accessible name you passed via `GetByRoleOptions.setName(...)` — Java's generated `Options` classes don't expose a way to read that value back out. If you rely on `getByRole` with a name and want the full description quality, add `.describe("...")` explicitly.

## What gets healed (and what doesn't)

Only real Playwright actions that can be safely retried are healed: `click`, `fill`, `check`, `hover`, `press`, `selectOption`, `setInputFiles`, `focus`, `blur`, `dblclick`, `tap`, `clear`, `uncheck`. `dragTo` and anything unlisted is intentionally left alone rather than guessed at.

`assertThat(...)` assertions are **not** healed — they use Playwright's own built-in auto-retrying assertions, a separate mechanism this package doesn't touch. If a locator only ever appears inside an assertion and never in an action, `.describe()` on it is a readability nicety, not something that affects healing.

**`assertThat(...)` requires `unwrap(...)`, and this is Java-specific.** `PlaywrightAssertions.assertThat(Locator)` casts its argument internally to Playwright's concrete implementation class, not just the `Locator` interface. This package's self-healing `Page`/`Locator` objects are `java.lang.reflect.Proxy` instances — they satisfy `Locator`/`Page` interface checks fine (which is all normal Playwright calls need), but a `Proxy` can never satisfy a cast to an unrelated concrete class, so passing one straight into `assertThat(...)` throws `ClassCastException`. Wrap it with `unwrap(...)` first:

```java
import static io.github.qtpsudhakarproducts.tamash.bindings.Bindings.unwrap;

assertThat(unwrap(page.locator("h6"))).hasText("Dashboard");
```

This isn't a bug to work around case-by-case — it's a structural difference from the TS/Python versions of this package, where `expect()`/`assertThat()` work directly on the wrapped object. Always unwrap before asserting in Java.

## License

Free to use, including commercially. The source code may not be copied, modified, redistributed, or resold without prior written permission. See the LICENSE file included in this package for the full terms.

## Support

For questions or concerns, contact us at support@vibetestq.com.
