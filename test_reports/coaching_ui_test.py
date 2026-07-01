"""Iter 92.46 - Coaching page UI verification."""
import asyncio, requests
from playwright.async_api import async_playwright

BASE = "https://command-center-229.preview.emergentagent.com"

JS_STACK = """
() => {
    const stack = document.querySelector("[data-testid='hero-glass-stack']");
    if (!stack) return null;
    const allP = Array.from(stack.querySelectorAll('p'));
    const layerLabels = allP.map(p => p.textContent.trim()).filter(t => t.toLowerCase().startsWith('layer '));
    const cards = Array.from(stack.children).filter(c => c.style && c.style.transform);
    const cardInfo = cards.map(c => {
        const r = c.getBoundingClientRect();
        return {
            transform: c.style.transform,
            zIndex: c.style.zIndex,
            x: Math.round(r.x), y: Math.round(r.y),
            w: Math.round(r.width), h: Math.round(r.height),
            visible: r.width > 0 && r.height > 0
        };
    });
    return { layerLabels, cardInfo };
}
"""

JS_STATS = """
() => {
    const section = document.querySelector("[data-testid='social-proof-section']");
    if (!section) return null;
    const cards = Array.from(section.querySelectorAll('.grid.grid-cols-2 > div'));
    return {
        count: cards.length,
        numbers: cards.map(c => { const n = c.querySelector('p.text-3xl'); return n ? n.textContent.trim() : null; }),
        hasHover: cards.map(c => c.className.includes('hover:-translate-y-1')),
        tileGradient: cards.map(c => !!c.querySelector('.rounded-2xl.bg-gradient-to-br'))
    };
}
"""

JS_TESTIMONIALS = """
() => {
    const out = [];
    for (let i=0; i<3; i++){
        const t = document.querySelector('[data-testid="testimonial-' + i + '"]');
        if (!t) { out.push(null); continue; }
        const img = t.querySelector('img');
        const svgs = t.querySelectorAll('svg');
        let starCount = 0, hasQuote = false;
        svgs.forEach(s => {
            const cls = s.getAttribute('class') || '';
            if (cls.includes('lucide-star')) starCount++;
            if (cls.includes('lucide-quote')) hasQuote = true;
        });
        out.push({
            src: img ? img.src : null,
            imgLoaded: img ? (img.complete && img.naturalWidth > 0) : false,
            starCount: starCount, hasQuote: hasQuote
        });
    }
    return out;
}
"""

JS_CTAS = """
() => ({
    primary: !!document.querySelector("[data-testid='hero-primary-cta']"),
    secondary: !!document.querySelector("[data-testid='hero-secondary-cta']"),
    tier_leadership: !!document.querySelector("[data-testid='tier-card-leadership_os']"),
    tier_plus: !!document.querySelector("[data-testid='tier-card-leadership_os_plus']"),
})
"""

async def main():
    results = {"passed": [], "failed": []}
    def ok(msg): print("PASS:", msg); results["passed"].append(msg)
    def fail(msg): print("FAIL:", msg); results["failed"].append(msg)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width":1920, "height":900})
        page = await ctx.new_page()
        page.on("console", lambda m: print("CONSOLE-ERR:", m.text) if m.type == "error" else None)

        await page.goto(BASE + "/", wait_until="domcontentloaded")
        # Login inside browser context so httpOnly cookie is set
        login_result = await page.evaluate("""
            async () => {
                const r = await fetch('/api/auth/login', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email: 'accelerator@wladbot.test', password: 'test123'})
                });
                return {status: r.status, ok: r.ok};
            }
        """)
        print("Login result:", login_result)
        await page.goto(BASE + "/coaching", wait_until="networkidle")
        await page.wait_for_timeout(2500)
        try:
            btn = await page.query_selector("button:has-text('Nur notwendige')")
            if btn:
                await btn.click(force=True); await page.wait_for_timeout(500)
        except: pass

        # TEST 1: glass stack
        stack = await page.query_selector("[data-testid='hero-glass-stack']")
        if not stack:
            fail("hero-glass-stack missing"); return results
        data = await page.evaluate(JS_STACK)
        print("Layer labels:", data['layerLabels'])
        print("Card info:", data['cardInfo'])
        if len(data['layerLabels']) == 3 and all(any(x in l for l in data['layerLabels']) for x in ["01","02","03"]):
            ok("3 Layer labels 01/02/03 present")
        else:
            fail("layer labels missing: " + str(data['layerLabels']))
        transforms = [c['transform'] for c in data['cardInfo']]
        if len(data['cardInfo']) == 3 and len(set(transforms)) == 3:
            ok("3 glass cards with distinct transforms")
        else:
            fail("cards issue: " + str(data['cardInfo']))
        visible = sum(1 for c in data['cardInfo'] if c['visible'])
        print("Visually rendered:", visible, "/3")
        if visible == 3:
            ok("All 3 cards visually rendered (nonzero bounding boxes)")
        else:
            fail(f"Only {visible}/3 cards visually rendered")

        await page.screenshot(path="/app/test_reports/hero_glass_stack.jpg", quality=40, full_page=False, clip={"x":900,"y":80,"width":1000,"height":780})

        # TEST 2: stats
        stats = await page.evaluate(JS_STATS)
        print("Stats:", stats)
        joined = " ".join(str(n) for n in (stats or {}).get('numbers', []))
        expected_vals = ["2.500+","87%","+42%","4.9/5"]
        if stats and stats['count'] >= 4 and all(v in joined for v in expected_vals):
            ok("4 stat cards with correct values")
        else:
            fail("stats issue: " + str(stats))
        if stats and all(stats['hasHover'][:4]):
            ok("stat cards have hover:-translate-y-1")
        else:
            fail("hover missing")
        if stats and all(stats['tileGradient'][:4]):
            ok("gradient tiles present")
        else:
            fail("gradient tiles missing")

        # TEST 3: testimonials
        tdata = await page.evaluate(JS_TESTIMONIALS)
        print("Testimonials:", tdata)
        for i, td in enumerate(tdata):
            if not td:
                fail(f"testimonial-{i} missing"); continue
            if td['src'] and 'images.unsplash.com' in td['src'] and td['starCount']==5 and td['hasQuote']:
                ok(f"testimonial-{i}: unsplash img + 5 stars + quote (loaded={td['imgLoaded']})")
            else:
                fail(f"testimonial-{i}: " + str(td))

        # TEST 4: CTAs regression
        ctas = await page.evaluate(JS_CTAS)
        print("CTAs:", ctas)
        if all(ctas.values()):
            ok("All CTA testids present")
        else:
            fail("CTA missing: " + str(ctas))

        y_before = await page.evaluate("window.scrollY")
        await page.click("[data-testid='hero-primary-cta']", force=True)
        await page.wait_for_timeout(1500)
        y_after = await page.evaluate("window.scrollY")
        print("scroll:", y_before, "->", y_after)
        if y_after > y_before + 100:
            ok("hero-primary-cta scrolls to pricing")
        else:
            fail("primary CTA no scroll")

        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(300)
        await page.click("[data-testid='hero-secondary-cta']", force=True)
        await page.wait_for_timeout(1500)
        print("URL:", page.url)
        if "/chat" in page.url:
            ok("hero-secondary-cta -> /chat")
        else:
            fail("secondary CTA didn't nav: " + page.url)

        await page.goto(BASE + "/coaching", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path="/app/test_reports/coaching_hero_v92_46.jpg", quality=40, full_page=False)
        sp = await page.query_selector("[data-testid='social-proof-section']")
        if sp:
            await sp.scroll_into_view_if_needed(); await page.wait_for_timeout(1000)
            await page.screenshot(path="/app/test_reports/coaching_social_proof_v92_46.jpg", quality=40, full_page=False)

        await browser.close()

    print("\n=== SUMMARY ===")
    print("Passed:", len(results['passed']))
    print("Failed:", len(results['failed']))
    for f in results['failed']: print("  -", f)
    return results

if __name__ == "__main__":
    asyncio.run(main())
