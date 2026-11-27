"""Exercise the shipped dist/ with Chromium, Playwright and no backend.

Run npm run test:edition:browser after installing Python Playwright and its
Chromium. Set CHROMIUM_EXECUTABLE to use an existing Chromium build.
All page requests are fulfilled from dist/ or refused. No server, accounts,
provider calls, or test data in the user's browser are required.
"""
import argparse
import mimetypes
import os
from pathlib import Path
from urllib.parse import unquote, urlsplit

from playwright.sync_api import expect, sync_playwright

ROOT = Path(os.environ.get("EDITION_TEST_DIST", Path(__file__).resolve().parents[1] / "dist")).resolve()
ORIGIN = "https://edition.test"
STOPS = ["le-grand-jeu", "mur-oberkampf", "le-lavomatik"]
QR = {"mentalism": "mentalism", "shadow-work": "mentalism",
      "correspondence": "correspondence", "as-above": "correspondence",
      "so-below": "correspondence", "vibration": "vibration",
      "underground": "vibration", "polarity": "polarity", "rhythm": "rhythm",
      "cause-effect": "cause-effect", "transmute": "cause-effect", "generation": "gender"}


class StaticEdition:
    def __init__(self, browser, width, height, screenshots):
        self.context = browser.new_context(
            viewport={"width": width, "height": height}, has_touch=width < 850,
            is_mobile=width < 850, locale="cs-CZ", device_scale_factor=1,
            reduced_motion="reduce", service_workers="block",
        )
        self.width = width
        self.height = height
        self.screenshots = screenshots
        self.api, self.permissions, self.errors, self.missing = [], [], [], []
        self.context.route("**/*", self.serve)
        self.context.expose_binding("editionPermissionProbe", lambda _, name: self.permissions.append(name))
        self.context.add_init_script("""(() => {
          if(navigator.mediaDevices) navigator.mediaDevices.getUserMedia=() => {
            window.editionPermissionProbe('microphone'); return Promise.reject(Error('no device'));
          };
          if(navigator.geolocation) navigator.geolocation.getCurrentPosition=() => window.editionPermissionProbe('GPS');
        })()""")
        self.page = self.context.new_page()
        self.page.on("pageerror", lambda error: self.errors.append(error.stack or str(error)))
        self.page.set_default_timeout(6000)

    def serve(self, route):
        request = route.request
        url = urlsplit(request.url)
        if url.netloc != "edition.test":
            return route.abort("internetdisconnected")
        if url.path.startswith("/api/") or request.method != "GET":
            self.api.append(f"{request.method} {url.path}")
            return route.fulfill(status=404, body="static host")
        target = (ROOT / unquote(url.path).lstrip("/")).resolve()
        if not target.is_relative_to(ROOT):
            return route.fulfill(status=404)
        if target.is_dir():
            target /= "index.html"
        if not target.is_file():
            self.missing.append(url.path)
            return route.fulfill(status=404)
        return route.fulfill(path=target, content_type=mimetypes.guess_type(target.name)[0] or "application/octet-stream")

    def open(self, path):
        self.page.goto(ORIGIN + path, wait_until="domcontentloaded")

    def expect_no_overflow(self):
        width = self.page.evaluate("({viewport:document.documentElement.clientWidth, page: document.documentElement.scrollWidth})")
        assert width["page"] <= width["viewport"] + 1, (self.page.url, width)

    def picture(self, name):
        if self.screenshots:
            self.screenshots.mkdir(parents=True, exist_ok=True)
            self.page.screenshot(path=self.screenshots / f"{self.width}x{self.height}-{name}.png")

    def close(self):
        self.context.close()
        assert not self.errors, self.errors
        assert not self.permissions, self.permissions
        assert not self.api, self.api
        assert not self.missing, self.missing


def enter(page, selector):
    target = page.locator(selector).filter(visible=True).first
    expect(target).to_be_visible()
    target.click()


def verify_story(edition):
    page = edition.page
    edition.open("/")
    expect(page.locator("[data-film-story]")).to_be_visible()
    enter(page, "[data-film-story]")
    enter(page, "#needle-street [data-play]")
    enter(page, '[data-window="1"]')
    enter(page, "[data-back]")
    enter(page, "[data-follow]")
    enter(page, '[data-route="wall"]')
    enter(page, '[data-mark="out"]')
    for step in [0, 3, 6]:
        enter(page, f'[data-imprint-step="{step}"]')
    enter(page, "[data-imprint-save]")
    original = page.evaluate("JSON.parse(localStorage.getItem('caisik-needle-imprint-v1'))")
    assert original == {"steps": [True, False, False, True, False, False, True, False], "returned": False}
    # A returning visitor must be able to resume without replaying or scrolling the film.
    edition.open("/#story/continue")
    expect(page.locator("[data-imprint-return]")).to_be_in_viewport()
    enter(page, "[data-imprint-return]")
    expect(page.locator("[data-imprint-window-mark]")).to_be_visible()
    dots = page.locator("[data-imprint-window-mark] > *").evaluate_all("(dots) => dots.map(d => d.classList.contains('is-on'))")
    assert dots == original["steps"]
    edition.expect_no_overflow()
    edition.picture("okno")
    enter(page, "[data-trails-entry]")
    expect(page.locator("[data-trail-card]:visible")).to_have_count(5)
    expect(page.locator('[data-trail-card="mc"] [data-trail-open]')).to_be_disabled()
    enter(page, '[data-trail-card="writer"] [data-trail-open]')
    enter(page, '[data-writer-stage="0"] [data-writer-next]')
    enter(page, '[data-writer-stage="1"] [data-writer-next]')
    enter(page, '[data-writer-preset="hook"]')
    enter(page, '[data-writer-save]')
    paths = [page.locator(f"[data-writer-{area}] [data-writer-path]").first.get_attribute("points") for area in ("wall", "sleeve")]
    assert paths[0] and paths[0] == paths[1], paths
    edition.open("/#blackbook/works")
    expect(page.locator("#edition-blackbook")).to_be_visible()
    expect(page.locator("#edition-blackbook")).to_contain_text("Můj takt v okně II", ignore_case=True)
    edition.expect_no_overflow()


def verify_zin(edition):
    page = edition.page
    for stop in STOPS:
        edition.open(f"/#atlas/zin/{stop}?mode=home&view=list&page=document")
        expect(page.locator("#paris-zin")).to_be_visible()
        expect(page.locator(f'[data-zin-stop="{stop}"]')).to_be_attached()
        edition.expect_no_overflow()
    enter(page, '[data-zin-mode="paris"]')
    expect(page.locator('[data-zin-mode="paris"]')).to_have_attribute("aria-current", "true")
    enter(page, '[data-zin-view="map"]')
    expect(page.locator(".z-map svg")).to_be_visible()
    assert page.locator("[data-zmap-stop]").count() == 3
    enter(page, '[data-zmap-stop="mur-oberkampf"]')
    expect(page.locator('[data-zmap-stop="mur-oberkampf"]')).to_have_attribute("aria-current", "location")
    edition.picture("zin-map")
    enter(page, "[data-zin-back]")
    expect(page.locator('[data-zin-view="list"]')).to_have_attribute("aria-current", "true")
    expect(page.locator(".z-map")).to_have_count(0)
    enter(page, '[data-zin-mode="home"]')
    expect(page.locator('[data-zin-mode="home"]')).to_have_attribute("aria-current", "true")
    source = "#atlas/zin/mur-oberkampf?mode=paris&view=list&page=work"
    edition.open("/" + source)
    note = page.locator("textarea[data-zin-note]")
    note.fill("Poznámka k okraji zdi – mobilní zkouška.")
    pad = page.locator("svg[data-zin-pad]")
    pad.scroll_into_view_if_needed()
    box = pad.bounding_box()
    assert box and box["width"] > 30 and box["height"] > 20, box
    x, y = box["x"] + box["width"] * .35, box["y"] + box["height"] * .45
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x + 16, y - 6, steps=5)
    page.mouse.move(x + 24, y + 10, steps=5)
    page.mouse.up()
    expect(page.locator("[data-zin-undo]")).to_be_enabled()
    edition.picture("zin")
    enter(page, "[data-zin-detour]")
    page.wait_for_function("location.hash.startsWith('#story/writer/')")
    # The return link must land on the same mode, stop, view and side of the spread.
    enter(page, ".story-detour-back")
    page.wait_for_function("hash => location.hash === hash", arg=source)
    expect(note).to_have_value("Poznámka k okraji zdi – mobilní zkouška.")
    expect(page.locator("[data-zin-undo]")).to_be_enabled()
    enter(page, "[data-zin-workshop]")
    page.wait_for_function("location.hash.startsWith('#workshop/frequency')")
    draft = page.locator("#fl-draft")
    draft.fill("Na skle se láme rytmus ulice.")
    enter(page, "#edition-source-back [data-source-back]")
    page.wait_for_function("hash => location.hash === hash", arg=source)
    enter(page, "[data-zin-workshop]")
    expect(draft).to_have_value("Na skle se láme rytmus ulice.")
    page.reload(wait_until="domcontentloaded")
    expect(draft).to_have_value("Na skle se láme rytmus ulice.")
    edition.expect_no_overflow()


def verify_qr(edition):
    for alias, principle in QR.items():
        edition.open(f"/q/{alias}/")
        lesson = edition.page.locator("#ap-lesson")
        expect(lesson).to_be_visible()
        selected = edition.page.locator("#principles [role=tab][aria-selected=true]")
        expect(selected).to_have_count(1)
        index = ["mentalism", "correspondence", "vibration", "polarity", "rhythm", "cause-effect", "gender"].index(principle)
        expect(selected).to_have_attribute("data-principle", str(index))
        expect(edition.page.locator("#principles [role=tab]:disabled")).to_have_count(0)
        assert edition.page.locator("[data-film-prologue]:visible").count() == 0


def verify_drop(edition):
    page = edition.page
    edition.open("/shop/")
    expect(page.locator("main")).to_contain_text("Drop", ignore_case=True)
    page.locator("[data-shop-search]").fill("OMERTA")
    enter(page, "[data-shop-grid] [data-drop-product]")
    expect(page.locator("[data-shop-dialog]")).to_be_visible()
    page.locator('[data-drop-option="Size"]').select_option(label="M")
    expect(page.locator("[data-drop-variant]")).to_contain_text("Black / M")
    page.keyboard.press("Escape")
    expect(page.locator("[data-shop-dialog]")).to_be_hidden()
    assert page.locator("a[href*='i234.me']:visible").count() == 0
    assert page.locator("a[href*='checkout']:visible").count() == 0
    assert page.locator("a[href*='/art/']:visible").count() > 0
    assert page.locator("a[href*='/q/']:visible, a[href*='#atlas/principles/']:visible").count() > 0
    edition.expect_no_overflow()
    edition.picture("drop")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--screenshots", type=Path)
    args = parser.parse_args()
    with sync_playwright() as driver:
        browser = driver.chromium.launch(executable_path=os.environ.get("CHROMIUM_EXECUTABLE"), headless=True)
        for width, height in [(390, 844), (844, 390), (1366, 900)]:
            edition = StaticEdition(browser, width, height, args.screenshots)
            try:
                verify_story(edition)
                verify_zin(edition)
                verify_drop(edition)
                if width == 390:
                    verify_qr(edition)
            finally:
                edition.close()
            print(f"PASS {width}×{height}: Okno II, five trails, writer stroke, Blackbook, zine, detour, Frequency, Drop")
        browser.close()
    print("PASS all 12 QR portals on mobile. No backend, permission or external connection was used.")


if __name__ == "__main__":
    main()
