import { test as base, expect, type Page, type Locator } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await use(errors);
    expect(errors).toEqual([]);
  }, { auto: true }],
});
const screenshots = path.resolve("test-results/revo/screenshots");

async function assertNoDocumentScroll(page: Page) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, contentWidth: document.documentElement.scrollWidth, contentHeight: document.documentElement.scrollHeight }));
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.width);
  expect(dimensions.contentHeight).toBeLessThanOrEqual(dimensions.height);
}

async function assertFitsViewport(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(box!.height).toBeGreaterThan(0);
}

test("main menu → era selection → briefing → existing factory, with both back routes", async ({ page }) => {
  await page.goto("/revo-lab");
  await page.getByRole("link", { name: "Mulai Jelajah", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab\/eras$/);
  await expect(page.getByRole("heading", { name: "JELAJAHI EMPAT REVOLUSI INDUSTRI" })).toBeVisible();
  await expect(page.locator(".revo-experience")).toHaveAttribute("data-revo-screen", "era-select");
  await expect(page.getByRole("article")).toHaveCount(4);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab\/industry-1\/briefing$/);
  await expect(page.getByRole("heading", { name: "THE AGE OF STEAM", exact: true })).toBeVisible();
  await expect(page.locator(".revo-experience")).toHaveAttribute("data-revo-screen", "level-briefing");
  await expect(page.locator(".revo-briefing-objectives li")).toHaveCount(4);
  await expect(page.getByRole("region", { name: "MISIMU DI ERA INI", exact: true })).toContainText("100 unit produksi");
  await expect(page.getByText("Simulasi edukasi sederhana. Skala 0–100, bukan ukuran termodinamika nyata.")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "Kembali ke Pilih Era", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab\/eras$/);
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab$/);
  await page.getByRole("link", { name: "Mulai Jelajah", exact: true }).click();
  await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click();
  await page.getByRole("link", { name: "Mulai Simulasi", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab\/industry-1$/);
  await expect(page.locator(".revo-experience")).toHaveAttribute("data-revo-screen", "gameplay");
  await expect(page.locator(".revo-scene canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Jelajahi Ketel uap", exact: true })).toBeVisible();
  await expect(page.getByText("Tampilan 3D belum tersedia")).not.toBeVisible();
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab$/);
});

test("unfinished eras explain their disabled state and have no playable route", async ({ page, request }) => {
  await page.goto("/revo-lab/eras");
  await expect(page.getByRole("link", { name: "Jelajahi Era", exact: true })).toHaveCount(1);
  for (const [id, title] of [["industry-2", "THE AGE OF ELECTRICITY"], ["industry-3", "THE AGE OF AUTOMATION"], ["industry-4", "THE AGE OF INTELLIGENCE"]]) {
    const card = page.getByRole("article", { name: title, exact: true });
    const button = card.getByRole("button", { name: "Dalam Pengembangan", exact: true });
    await expect(button).toBeDisabled();
    await expect(button).toHaveAccessibleDescription(/belum dapat dimainkan/);
    await expect(card.getByRole("link")).toHaveCount(0);
    for (const suffix of ["", "/briefing"]) {
      const response = await request.get(`/revo-lab/${id}${suffix}`);
      expect(response.status()).toBe(404);
      const html = await response.text();
      expect(html).toContain("Era ini belum tersedia.");
      expect(html).not.toContain("Nyalakan mesin");
    }
  }
});

test("keyboard navigation activates each available transition and scrolls the era list", async ({ page }) => {
  await page.goto("/revo-lab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Mulai Jelajah", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  const enterEra = page.getByRole("link", { name: "Jelajahi Era", exact: true });
  await enterEra.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/revo-lab\/industry-1\/briefing$/);
  await page.getByRole("link", { name: "Kembali ke Pilih Era", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/revo-lab\/eras$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("region", { name: "Empat era revolusi industri", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("article", { name: "THE AGE OF INTELLIGENCE", exact: true })).toBeInViewport();
  await page.keyboard.press("Home");
  await expect(page.getByRole("article", { name: "THE AGE OF STEAM", exact: true })).toBeInViewport();
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/revo-lab$/);
  await assertNoDocumentScroll(page);
});

test("era selection and briefing fit target viewports with accessible internal scrolling", async ({ page }) => {
  await mkdir(screenshots, { recursive: true });
  for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768], [1280, 720], [390, 844], [768, 1024], [375, 667], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/revo-lab/eras");
    await assertNoDocumentScroll(page);
    await assertFitsViewport(page, page.locator(".revo-flow-header"));
    await assertFitsViewport(page, page.locator(".revo-era-intro"));
    await assertFitsViewport(page, page.locator(".revo-era-grid"));
    // Every card's title, description and action must remain readable when
    // scrolled into the internal list, rather than being clipped by the page.
    for (const card of await page.getByRole("article").all()) {
      await card.scrollIntoViewIfNeeded();
      await assertFitsViewport(page, card);
      await assertFitsViewport(page, card.getByRole("heading"));
      await assertFitsViewport(page, card.locator(".revo-era-description"));
      await assertFitsViewport(page, card.locator(".revo-era-card-bottom"));
    }
    if (width >= 1280) {
      const grid = page.locator(".revo-era-grid");
      expect(await grid.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
      const cardTops = await page.getByRole("article").evaluateAll(els => els.map(el => el.getBoundingClientRect().top));
      expect(Math.max(...cardTops) - Math.min(...cardTops)).toBeLessThanOrEqual(1);
    }
    await page.getByRole("link", { name: "Jelajahi Era", exact: true }).scrollIntoViewIfNeeded();
    if (width === 1440 || width === 390) await page.screenshot({ path: path.join(screenshots, `era-selection-${width}.png`), style: "nextjs-portal {visibility:hidden}" });
    await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click();
    await assertNoDocumentScroll(page);
    await assertFitsViewport(page, page.getByRole("link", { name: "Mulai Simulasi", exact: true }));
    await assertFitsViewport(page, page.getByRole("link", { name: "Kembali ke Pilih Era", exact: true }));
    const reading = page.getByRole("region", { name: "Ringkasan level dan tujuan pembelajaran", exact: true });
    await assertFitsViewport(page, reading);
    if (width >= 1280) expect(await reading.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    for (const item of await page.locator(".revo-briefing-objectives li").all()) {
      await item.scrollIntoViewIfNeeded();
      await assertFitsViewport(page, item);
    }
    await page.locator(".revo-briefing-mission").scrollIntoViewIfNeeded();
    await assertFitsViewport(page, page.locator(".revo-briefing-mission"));
    await page.getByRole("heading", { name: "THE AGE OF STEAM", exact: true }).scrollIntoViewIfNeeded();
    await assertFitsViewport(page, page.getByRole("heading", { name: "THE AGE OF STEAM", exact: true }));
    await assertNoDocumentScroll(page);
    if (width === 1440 || width === 390) await page.screenshot({ path: path.join(screenshots, `level-briefing-${width}.png`), style: "nextjs-portal {visibility:hidden}" });
  }
});
