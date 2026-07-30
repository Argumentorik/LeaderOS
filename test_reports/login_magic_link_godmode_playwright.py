"""
Focused Playwright verification for Iteration 124 auth/login fixes.

Validated flows:
- Wrong password shows localized German auth error (not English backend token)
- Valid accelerator login reaches /dashboard and /api/auth/me is authenticated
- Authenticated user visiting /login is redirected back to /dashboard
- Magic-link request shows enumeration-safe confirmation copy
"""

BASE_URL = "https://command-center-229.preview.emergentagent.com"


async def run(page):
    async def accept_cookie_banner():
        banner = page.locator('[data-testid="cookie-consent-banner"]')
        if await banner.count() > 0 and await banner.first.is_visible(timeout=1000):
            await page.locator('[data-testid="consent-accept-all"]').click(force=True)
            await page.wait_for_timeout(300)
            print("Accepted cookie consent banner")
        else:
            print("Cookie consent banner not visible")

    async def print_error_selector_state():
        error_text = await page.evaluate("""() => {
            const errorElements = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]'));
            return errorElements.map(el => el.textContent).join(", ");
        }""")
        if error_text:
            print(f"Found error message: {error_text}")
        else:
            print("No error messages found on the page")

    try:
        await page.set_viewport_size({"width": 1920, "height": 1080})
        await page.context.clear_cookies()
        await page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        await page.evaluate("""() => {
            sessionStorage.clear();
            localStorage.removeItem('wladbot_recent_logins_v1');
            localStorage.removeItem('lo_consent_v1');
        }""")
        await page.reload(wait_until="domcontentloaded")
        await page.locator('[data-testid="login-page"]').wait_for(state="visible", timeout=15000)
        await accept_cookie_banner()

        # Ensure German UI language.
        lang = (await page.locator('[data-testid="login-lang-toggle"]').inner_text()).strip().upper()
        if "EN" in lang:
            await page.locator('[data-testid="login-lang-toggle"]').click(force=True)
            await page.wait_for_timeout(300)
            print("Switched UI language to German")
        else:
            print("UI language is German")

        # P1 fix: wrong password must show German error, not English Invalid credentials.
        await page.locator('[data-testid="login-email-input"]').fill('accelerator@wladbot.test')
        await page.locator('[data-testid="login-password-input"]').fill('wrong-password-124')
        async with page.expect_response(lambda r: '/api/auth/login' in r.url, timeout=20000) as invalid_resp_info:
            await page.locator('[data-testid="login-submit-btn"]').click(force=True)
        invalid_resp = await invalid_resp_info.value
        print(f"Wrong-password login response status: {invalid_resp.status}")
        await page.locator('[data-testid="auth-error"]').wait_for(state="visible", timeout=10000)
        invalid_error = (await page.locator('[data-testid="auth-error"]').inner_text()).strip()
        print(f"Wrong-password visible error: {invalid_error}")
        await print_error_selector_state()
        assert 'E-Mail oder Passwort ist falsch.' in invalid_error, f"German invalid-login copy missing: {invalid_error}"
        assert 'Invalid credentials' not in invalid_error, f"English backend token leaked: {invalid_error}"
        print("PASS: Wrong password renders localized German auth error")

        # Regression: valid login must reach dashboard.
        await page.locator('[data-testid="login-password-input"]').fill('test123')
        async with page.expect_response(lambda r: '/api/auth/login' in r.url, timeout=20000) as valid_resp_info:
            await page.locator('[data-testid="login-submit-btn"]').click(force=True)
        valid_resp = await valid_resp_info.value
        print(f"Valid login response status: {valid_resp.status}")
        await page.wait_for_url(lambda url: '/dashboard' in url or '/onboarding' in url, timeout=30000)
        print(f"Post-login URL: {page.url}")
        assert '/dashboard' in page.url, f"Expected /dashboard after valid accelerator login, got {page.url}"
        await page.locator('[data-testid="dashboard-page"]').wait_for(state="visible", timeout=30000)
        me_result = await page.evaluate("""async () => {
            const r = await fetch('/api/auth/me', { credentials: 'include' });
            let body = null;
            try { body = await r.json(); } catch (e) {}
            return { status: r.status, body };
        }""")
        print(f"/api/auth/me after login: {me_result}")
        assert me_result['status'] == 200, f"/api/auth/me not authenticated after login: {me_result}"
        assert me_result['body'] and me_result['body'].get('email') == 'accelerator@wladbot.test', f"Unexpected /me body: {me_result}"
        print("PASS: Valid accelerator login lands on dashboard and session is authenticated")

        # Session persistence / already-authenticated redirect.
        await page.reload(wait_until="domcontentloaded")
        await page.locator('[data-testid="dashboard-page"]').wait_for(state="visible", timeout=30000)
        print(f"Dashboard persisted across reload: {page.url}")
        await page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        await page.wait_for_url(lambda url: '/dashboard' in url or '/onboarding' in url, timeout=30000)
        print(f"Already-authenticated /login redirect URL: {page.url}")
        assert '/dashboard' in page.url, f"Authed /login did not redirect to /dashboard: {page.url}"
        await page.locator('[data-testid="dashboard-page"]').wait_for(state="visible", timeout=30000)
        print("PASS: Already-authenticated /login visit redirects to dashboard")

        # Regression: magic-link request still gives enumeration-safe confirmation.
        await page.context.clear_cookies()
        await page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        await page.evaluate("""() => {
            sessionStorage.clear();
            localStorage.removeItem('wladbot_recent_logins_v1');
        }""")
        await page.reload(wait_until="domcontentloaded")
        await page.locator('[data-testid="login-page"]').wait_for(state="visible", timeout=15000)
        await accept_cookie_banner()
        await page.locator('[data-testid="tab-magic-link"]').click(force=True)
        await page.locator('[data-testid="magic-link-email-input"]').fill('accelerator@wladbot.test')
        async with page.expect_response(lambda r: '/api/auth/magic-link/request' in r.url, timeout=20000) as magic_resp_info:
            await page.locator('[data-testid="magic-link-submit"]').click(force=True)
        magic_resp = await magic_resp_info.value
        print(f"Magic-link request response status: {magic_resp.status}")
        await page.locator('[data-testid="magic-link-sent"]').wait_for(state="visible", timeout=15000)
        magic_text = (await page.locator('[data-testid="magic-link-sent"]').inner_text()).strip()
        print(f"Magic-link confirmation: {magic_text}")
        assert 'Falls accelerator@wladbot.test bei uns existiert' in magic_text, f"Enumeration-safe German confirmation missing: {magic_text}"
        assert '1-Klick-Login' in magic_text and '15 Minuten' in magic_text, f"Magic-link confirmation incomplete: {magic_text}"
        await print_error_selector_state()
        print("PASS: Magic-link request returns enumeration-safe confirmation")

        print("ALL FOCUSED AUTH BUG VERIFICATION CHECKS PASSED")
    except Exception as exc:
        print(f"TEST FAILURE: {type(exc).__name__}: {exc}")
        await page.screenshot(path='/app/test_reports/login_magic_link_godmode_failure.jpg', quality=40, full_page=False)
        raise