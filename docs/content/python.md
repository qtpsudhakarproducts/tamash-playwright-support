# tamash-playwright

`tamash-playwright` is a plug and play self-healing **and reporting** solution for Playwright +
pytest. Install it, add your AI API key details, and wire in one fixture override.

That's it. No changes needed to your actual test functions if you're following standard Playwright/pytest best practices.

### Why you need this

Websites change often. A button gets renamed or moved, and your test can't find it anymore — even though the app still works fine for real users. Normally, that just means a broken test.

`tamash-playwright` fixes this automatically. When a test action can't find an element, it asks an AI model to find it on the current page and tries again. If it succeeds, your test keeps going. If not, it fails normally, just like before.

On top of that, it gives you a step-by-step HTML report of everything your tests actually did — every action, assertion, network call, and fixture, in order, with timing and full detail on anything that got healed or failed — something Playwright's own `pytest-playwright` plugin doesn't provide at all ([confirmed not planned](https://github.com/microsoft/playwright/issues/14046)).

Here are the detailed steps to use this package.

## Step 1: Install it

```sh
pip install tamash-playwright
```

This pulls in `pytest-playwright` as a dependency, so if you're starting fresh you'll also need the Playwright browsers:

```sh
playwright install
```

Using Anthropic (Claude) as your provider needs one extra install:

```sh
pip install "tamash-playwright[anthropic]"
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

# --- Anthropic (Claude) ---
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

## Step 3: Wire it in

pytest's plugin model means the reliable way to activate self-healing is **one line in your project's `conftest.py`**, added once — not per test file:

```python
# conftest.py
from tamash_playwright.plugin import page  # noqa: F401
```

Why this line, and not nothing at all: `tamash-playwright` registers itself as a pytest plugin automatically on install, and its `page` fixture *may* already override `pytest-playwright`'s own `page` fixture depending on plugin load order — but that order isn't something pytest guarantees across environments. A `conftest.py` fixture, on the other hand, is *always* preferred by pytest over a same-named fixture from an installed plugin, so re-exporting it there is the one setup step that's guaranteed to work everywhere, every time.

With that line in place, every test using the `page` fixture — no matter how many test files you have — automatically gets self-healing and reporting. Nothing else changes:

```python
from tamash_playwright import expect

def test_login(page):
    page.goto("/")
    page.get_by_placeholder("Username").fill("Admin")  # healed automatically if this breaks
    page.get_by_role("button", name="Login").click()
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible()  # recorded in the report too
```

Any *other* page your test opens itself — a popup, a manually opened tab, a `target="_blank"` link — is automatically healing/reporting-aware too, with no extra code. So is `context`, if your test uses it directly (`context.new_page()`, `context.route()`, etc.).

## Step 4: Turn on the report

Add one flag when you run pytest:

```sh
pytest --tamash-report=report.html
```

Open `report.html` and you'll see, for every test: duration, a pass/healed/failed badge, and every step it took — in order, with timing. Steps are split into three categories (filterable in the report itself):

- **action** — clicks, fills, navigation, drag-and-drop, mouse/keyboard input, network requests, everything a test *does*
- **assert** — every `expect(...)` check
- **fixture** — fixture/hook setup and teardown, including any custom fixture named directly in a test's own signature

Anything that got healed shows which AI provider recovered it, what it recovered *to*, and token usage. Anything that failed outright shows the real Playwright error message and a screenshot at the moment of failure.

This works alongside `pytest-html` (`pip install pytest-html`, then add `--html=report.html`) rather than replacing it — the two are complementary, not overlapping. `tamash-report.html` shows *what Playwright did and whether it healed*. `pytest-html`'s report shows *why an assertion failed* (the exact line and value diff), which matters for the checks below that can't go through `expect()` at all — see "API testing" and "What gets reported" for why. Running both is recommended:

```sh
pytest --html=report.html --self-contained-html --tamash-report=tamash-report.html
```

## Step 5: Check your setup

Run the built-in doctor command to confirm everything's wired up correctly:

```sh
tamash-playwright doctor
```

It checks three things:

1. **AI connectivity** — confirms `HEALER_ENABLED`/`HEALER_PROVIDER` are set correctly and actually calls your configured provider to make sure the API key and model work.
2. **Missing `.describe()` labels** — scans your test files (`tests/` by default, or pass `--dir <path>`) for locators that don't have a `.describe('...')` label, flagging the ones most worth fixing (raw CSS/XPath selectors first).
3. **Locators written directly in test files** — flags any locator defined inline in a test rather than inside a Page Object class, a Playwright best practice regardless of self-healing.

If it finds issues, the fastest fix is to open the project in an AI coding assistant (Claude Code, Cursor, GitHub Copilot, etc.) and ask it to address what it flagged. You can also add a standing rule to that assistant's instructions/skill file (e.g. `CLAUDE.md`, `.cursor/rules`, `.github/copilot-instructions.md`) so it follows both practices automatically on any new test code going forward.

### A quick tip for better results

If you're using plain CSS selectors (like `page.locator('input[name="username"]')`) rather than Playwright's more descriptive locators (`get_by_role`, `get_by_placeholder`, etc.), it helps to add a short, human-readable label so the healer knows what it's actually looking for. Chain `.describe('...')` right onto the locator:

```python
def test_login_using_css_selectors(page):
    page.goto("https://example.com/auth/login")

    txt_username = page.locator('input[name="username"]').describe("User Name Textbox")
    txt_username.fill("testadmin")

    txt_password = page.locator('input[placeholder="Password"]').describe("Password Textbox")
    txt_password.fill("secret")

    btn_login = page.locator('button[type="submit"]').describe("Login Button")
    btn_login.click()
```

This step is optional, but recommended — without it, the healer has to guess purely from a broken CSS selector, which gives it a lot less to work with.

## Writing tests

Both of the patterns below work exactly as they would with plain Playwright — the `page` fixture is the only thing that changed (see Step 3), so nothing here is `tamash-playwright`-specific syntax.

### A normal test (no Page Object Model)

```python
from tamash_playwright import expect

def test_login(page):
    page.goto("https://example.com/login")

    page.get_by_placeholder("Username").fill("testadmin")
    page.get_by_placeholder("Password").fill("secret")
    page.get_by_role("button", name="Login").click()

    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible()
```

### A Page Object Model test

Page Object classes just take `page` in their constructor like normal — `.describe()` on each locator is optional but recommended (see "A quick tip for better results" above):

```python
# pages/login_page.py
class LoginPage:
    def __init__(self, page):
        self.page = page
        self.txt_username = page.get_by_placeholder("Username").describe("Username Textbox")
        self.txt_password = page.get_by_placeholder("Password").describe("Password Textbox")
        self.btn_login = page.get_by_role("button", name="Login").describe("Login Button")

    def login(self, username, password):
        self.txt_username.fill(username)
        self.txt_password.fill(password)
        self.btn_login.click()
```

```python
# pages/dashboard_page.py
from tamash_playwright import expect

class DashboardPage:
    def __init__(self, page):
        self.page = page
        self.header = page.get_by_role("heading", name="Dashboard").describe("Dashboard Header")

    def verify_loaded(self):
        expect(self.header).to_be_visible()
```

```python
# tests/test_login.py
from pages.dashboard_page import DashboardPage
from pages.login_page import LoginPage

def test_login_with_pom(page):
    page.goto("https://example.com/login")

    login_page = LoginPage(page)
    login_page.login("testadmin", "secret")

    dashboard_page = DashboardPage(page)
    dashboard_page.verify_loaded()
```

Healing and reporting apply the same way regardless of which style you use — the `page` object passed into a Page Object's constructor is the same wrapped `page` your test received, so every locator built from it is tracked and healable whether it's created directly in the test function or inside a Page Object method.

### A "base test" pattern (your own fixtures on top of `page`)

A common next step beyond plain Page Objects is a project's own `conftest.py` fixtures that hand tests a ready-to-use Page Object instead of constructing one inline every time:

```python
# conftest.py
import pytest
from pages.dashboard_page import DashboardPage
from pages.login_page import LoginPage

@pytest.fixture
def login_page(page):
    return LoginPage(page)

@pytest.fixture
def dashboard_page(page):
    return DashboardPage(page)
```

```python
# tests/test_login.py
def test_login_with_base_fixtures(page, login_page, dashboard_page):
    page.goto("https://example.com/login")
    login_page.login("testadmin", "secret")
    dashboard_page.verify_loaded()
```

This needs no `tamash-playwright`-specific code at all — it's the same fixture-composition pattern you'd write against plain Playwright. The reason it's worth calling out explicitly: `login_page`/`dashboard_page` both depend on `page`, and by Step 3 `page` is already the healing/reporting-wrapped one — so **any fixture layer you build on top of it inherits healing and reporting automatically, no matter how deep the composition goes**. If your project already has fixtures like this before adopting `tamash-playwright`, you don't need to touch them at all — the one `conftest.py` line from Step 3 is the only change anywhere in your test suite.

## API testing

For a browser-driven test that also makes an API call, `page.request` and `context.request` are already reporting-aware — no setup needed, same as `page` itself. (Reporting only, not healing — there's no locator involved in an HTTP call, so nothing for the AI to recover.)

For pure API testing (no browser at all), use the `api_request_context` fixture:

```python
def test_members_api(api_request_context):
    response = api_request_context.get(
        "https://example.com/api/members",
        headers={"Authorization": "Basic ..."},
    )
    assert response.status == 200
```

It's named `api_request_context` rather than `request`: pytest already has its own built-in `request` fixture (test/fixture introspection metadata, a completely different thing), and pytest-playwright doesn't ship a request-context fixture of its own to override the way it does for `page`. `api_request_context` gives you a standalone, wrapped `APIRequestContext` (`playwright.request.new_context()` under the hood) with no browser involved.

There's nothing to heal for API calls — no locator was ever involved — but every `get`/`post`/`put`/`patch`/`delete`/`head`/`fetch` call shows up in the report with its URL, duration, and status code.

If you build your own `APIRequestContext` some other way (e.g. via `playwright.request.new_context()` directly, outside this fixture), wrap it yourself with `bind_api_request_context()` to get the same tracking:

```python
from tamash_playwright import bind_api_request_context

context = playwright.request.new_context()
bind_api_request_context(context)
```

### `expect()` vs plain `assert` for API responses

Use `tamash_playwright.expect(response).to_be_ok()` when a check only cares "did this succeed" — it's real Playwright API (`APIResponseAssertions` has exactly `to_be_ok()`/`not_to_be_ok()`), so it shows up in the report like any other assertion. For anything more specific — an exact status code, a JSON body field, a header value — use a plain `assert`: Playwright's `expect()` only accepts `Locator`/`Page`/`APIResponse` objects, not plain Python values, so `expect(response.status)` or `expect(some_string)` raises `ValueError: Unsupported type`. That's not a gap in this package — it's a hard limit of Playwright's own Python `expect()` — and it's deliberately not "fixed" with a custom assertion helper, since that would force test code to deviate from standard Playwright/Python just to get report coverage. Plain-`assert` failures still show up in your report as an overall test failure; pair with `pytest-html` (see Step 4) if you want the exact failing line and value diff too.

## What gets healed

Any Playwright action *or read* that resolves a selector and genuinely raises on failure is healed — verified empirically per method, not assumed, since some Playwright methods are designed to degrade gracefully instead of throwing (see below):

- **Actions**: `click`, `dblclick`, `tap`, `hover`, `fill`, `clear`, `press`, `check`, `uncheck`, `select_option`, `set_input_files`, `focus`, `blur`, `type`, `press_sequentially`, `set_checked`, `scroll_into_view_if_needed`, `dispatch_event`, `wait_for` (`Locator.wait_for()` specifically — a bad selector means it never reaches the state you're waiting for, same underlying problem as a bad click).
- **Reads**: `text_content`, `inner_text`, `get_attribute`, `input_value`, `is_checked`, `is_enabled`, `is_disabled`, `is_editable` — these resolve a selector exactly like `click` does, and a successful heal returns the *actual* value instead of raising (e.g. a healed `text_content()` call still returns the real text, not `None`).

`drag_to` is tracked but never healed — it needs *two* locators (source + target), and guessing a replacement drop target is too risky to attempt safely.

Six read methods are deliberately **not** healable, because they're designed by Playwright to degrade gracefully rather than throw — confirmed directly (not assumed) by testing each one against a locator matching nothing: `is_visible`/`is_hidden` return `False`/`True`, `count` returns `0`, `all`/`all_inner_texts`/`all_text_contents` return `[]`. There's no exception for the healer to ever catch, so no matter how broken the locator is, these can't be healing candidates — they're still tracked in the report, just never as a heal attempt.

`expect(...)` assertions (`to_have_text`, `to_be_visible`, etc.) are **not** healed — they use Playwright's own built-in auto-retrying assertions, which are a separate mechanism this package doesn't touch. If a locator only ever appears inside an `expect(...)` call and never in an action, `.describe()` on it is a readability nicety, not something that affects healing.

Content inside an `<iframe>` (via `frame_locator()`) is healed the same way as anything else — the healer snapshots and rebuilds from inside the correct frame, not the outer page.

### When healing doesn't fully recover

Not every heal attempt succeeds, and the report tells you exactly how far it got rather than collapsing everything into a generic "failed":

- **Never triggered at all** — `HEALER_ENABLED=false`, no AI provider configured (missing API key/model), or the page's accessibility snapshot couldn't be captured. Nothing was ever sent to the AI.
- **Triggered, but didn't recover** — the AI call itself failed (network error, wrong API key — a real `401`/`403` fails the *heal*, not your test; the original Playwright error is still what your test fails with), the AI explicitly found nothing plausible in the snapshot, or — the most informative case — the AI *did* suggest a specific replacement and it was actually tried, but that failed too. That last case shows you the exact selector the AI guessed, not just that healing didn't work.

Every one of these shows up in both the console (`[self-healer] ...`) and `tamash-report.html`'s failed-step detail, with a plain-language reason and, where relevant, the AI's actual suggestion and token usage — even on a failed attempt, since token spend on a wrong guess is still worth seeing.

## What gets reported

Beyond the core click/fill/navigate actions and `expect()` assertions, all of the following show up in the report automatically, with no extra setup:

- **Multi-page and popups** — any second page a test opens (`context.new_page()`, `expect_popup()`, a `target="_blank"` link) is auto-wrapped the moment it appears, via the browser context's own `"page"` event.
- **iframes** — `frame_locator()` and anything resolved through it, including nested iframes.
- **Mouse/keyboard** — `page.mouse.*` and `page.keyboard.*` calls (reporting only, nothing to heal since there's no locator involved).
- **Network interception** — `page.route()`/`context.route()`, including whichever terminal action the handler takes (`fulfill`/`abort`/`continue_`/`fallback`).
- **Dialogs** — `page.on("dialog", ...)` and `page.once("dialog", ...)`, including whichever terminal method the handler calls (`accept`/`dismiss`).
- **Downloads** — captured automatically via an always-on listener, whether your test uses `expect_download()` or its own `on("download", ...)` handler.
- **JS execution** — `evaluate()`/`evaluate_handle()` on Page, Frame, and Locator (reporting only — a JS error is almost always a bug in the expression itself, not a "couldn't find the element" problem, so it's not treated as a healing candidate).
- **Explicit waits** — `wait_for_load_state`, `wait_for_url`, `wait_for_timeout`, `wait_for_event`, `wait_for_function` on Page, Frame, *and* Locator (reporting only, no locator involved in what they're waiting for). `Locator.wait_for()` is different — see "What gets healed" above.
- **Non-throwing read methods** — `is_visible`, `is_hidden`, `count`, `all`, `all_inner_texts`, `all_text_contents` (reporting only — see "What gets healed" for why these specifically can't be healing candidates).
- **API calls** — see "API testing" above.

`page.on("request"/"response", ...)` and any other event name aren't special-cased — they pass straight through unaffected, so plain Playwright event-handling code keeps working exactly as written.

## Known limitations

`.first` / `.last` don't get healing or reporting: they're Python properties, not method calls, so there's no way to patch the Locator they return without globally patching Playwright's own `Locator` class — which this package deliberately never does (everything it touches is scoped to objects it handed back to your own code). Use `.nth(0)` / `.nth(-1)` instead — same result, and a real method call that gets full healing and reporting.

## License

Free to use, including commercially. The source code may not be copied, modified, redistributed, or resold without prior written permission. See the LICENSE file included in this package for the full terms.

## Support

For questions or concerns, contact us at support@vibetestq.com.
