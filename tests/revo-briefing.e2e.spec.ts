import { expect, test, type Page, type Locator } from "@playwright/test";
import sharp from "sharp";
import { STEAM_LEARNING_OBJECTIVES } from "../src/lib/revo/eras";
import { ELECTRIC_OBJECTIVES } from "../src/lib/revo/industry-2/content";

const cases = [
  { era: "industry-1", title: "Era Mesin Uap", objectives: STEAM_LEARNING_OBJECTIVES, summaries: 4 },
  { era: "industry-2", title: "Era Listrik & Produksi Massal", objectives: ELECTRIC_OBJECTIVES, summaries: 5 },
] as const;

const camera = (page: Page) => page.locator(".revo-briefing-canvas canvas");
const activate = (page: Page) => page.getByRole("button", { name: "Aktifkan pratinjau 3D" });
const snapshot = (page: Page) => page.evaluate(() =>
  ["revo:industry-1:progress", "revo:industry-2:progress"].map(key => localStorage.getItem(key)));

async function cameraPixels(canvas: Locator) {
  return sharp(await canvas.screenshot()).resize(192, 128, { fit: "fill" }).removeAlpha().raw().toBuffer();
}

async function cameraDifference(canvas: Locator, reference: Buffer) {
  const current = await cameraPixels(canvas);
  return current.reduce((sum, channel, index) => sum + Math.abs(channel - reference[index]), 0) / current.length;
}

for (const { era, title, objectives, summaries } of cases) {
  test(`${era} briefing fits four viewports and keeps every original objective readable`, async ({ page }) => {
    await page.goto(`/revo-lab/${era}/briefing`);
    for (const [width, height] of [[1440, 900], [1280, 720], [390, 844], [320, 568]]) {
      await page.setViewportSize({ width, height });
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Kembali ke Menu Utama", exact: true })).toHaveCount(1);
      await expect(page.getByRole("link", { name: "Mulai Eksplorasi", exact: true })).toBeInViewport({ ratio: 1 });
      const content = page.getByRole("region", { name: "Ringkasan level dan tujuan pembelajaran" });
      expect(await content.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
      if (width >= 1280) expect(await content.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => [document.documentElement.scrollWidth - innerWidth, document.documentElement.scrollHeight - innerHeight])).toEqual([0, 0]);
      await expect(content).toHaveCSS("animation-name", "none");
      await expect(activate(page)).toBeInViewport({ ratio: 1 });
      const preview = content.getByRole("figure");
      await expect(preview.getByRole("status")).toBeInViewport({ ratio: 1 });
      expect(await preview.evaluate(figure => {
        const hint = figure.querySelector(".revo-briefing-camera-note")!;
        return hint.getBoundingClientRect().bottom <= figure.getBoundingClientRect().bottom;
      })).toBe(true);
      const summary = content.getByRole("region", { name: "Tujuan Pembelajaran" });
      await expect(summary.getByRole("listitem")).toHaveCount(summaries);
      const open = summary.getByRole("button", { name: "Lihat tujuan lengkap" });
      await open.click();
      const dialog = page.getByRole("dialog", { name: "Tujuan Pembelajaran" });
      const list = dialog.getByRole("listitem");
      await expect(list).toHaveText(objectives.map(([verb, text]) => verb + text));
      for (const item of await list.all()) {
        await item.evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
        await expect(item).toBeInViewport({ ratio: 1 });
        expect(await item.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
      }
      await page.keyboard.press("Escape");
      await expect(open).toBeFocused();
    }
  });

  test(`${era} live preview rotates, zooms and resets without writing progress`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/revo-lab/${era}/briefing`);
    const before = await snapshot(page);
    await expect(camera(page)).toHaveCount(0);
    await activate(page).click();
    const canvas = camera(page);
    await expect(canvas).toBeVisible();
    const reset = page.getByRole("button", { name: "Reset kamera" });
    await expect(reset).toBeVisible();
    // Use pixels from the actual WebGL canvas, not hidden camera internals.
    const original = await cameraPixels(canvas);
    const right = page.getByRole("button", { name: "Putar kamera ke kanan" });
    await right.press("Enter");
    await expect.poll(() => cameraDifference(canvas, original)).toBeGreaterThan(1);
    await reset.press("Enter");
    await expect.poll(() => cameraDifference(canvas, original)).toBeLessThan(.35);
    await page.getByRole("button", { name: "Perbesar kamera" }).click();
    await expect.poll(() => cameraDifference(canvas, original)).toBeGreaterThan(1);
    await reset.click();
    await expect.poll(() => cameraDifference(canvas, original)).toBeLessThan(.35);
    const box = (await canvas.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 68, y + 11, { steps: 6 });
    await page.mouse.up();
    await expect.poll(() => cameraDifference(canvas, original)).toBeGreaterThan(1);
    const rotated = await cameraPixels(canvas);
    await canvas.click();
    await expect.poll(() => cameraDifference(canvas, rotated)).toBeLessThan(.35);
    await expect(page.getByRole("group", { name: "Penanda eksplorasi mesin" })).toHaveCount(0);
    expect(await snapshot(page)).toEqual(before);
    await page.getByRole("link", { name: "Mulai Eksplorasi", exact: true }).click();
    await expect(page).toHaveURL(`/revo-lab/${era}`);
    await expect(canvas).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test("briefing fallback preserves the static scene and CTA when WebGL is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.startsWith("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  for (const { era } of cases) {
    await page.goto(`/revo-lab/${era}/briefing`);
    await activate(page).click();
    await expect(page.getByText("Pratinjau 3D tidak tersedia. Gambar diorama tetap dapat dilihat.")).toBeVisible();
    await expect(page.getByRole("img", { name: /Diorama pabrik Revolusi Industri/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mulai Eksplorasi" })).toBeInViewport();
    await expect(camera(page)).toHaveCount(0);
  }
});

test.describe("compact touch preview", () => {
  test.use({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true });
  test("touch controls remain reachable and context loss restores the image", async ({ page }) => {
    await page.goto("/revo-lab/industry-2/briefing");
    await activate(page).tap();
    const canvas = camera(page);
    await expect(canvas).toBeVisible();
    const left = page.getByRole("button", { name: "Putar kamera ke kiri" });
    await expect(left).toBeInViewport({ ratio: 1 });
    const original = await cameraPixels(canvas);
    await left.tap();
    await expect.poll(() => cameraDifference(canvas, original)).toBeGreaterThan(1);
    const beforeSwipe = await cameraPixels(canvas);
    const box = (await canvas.boundingBox())!;
    const x = Math.round(box.x + box.width * .55);
    const y = Math.round(box.y + box.height * .5);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + 40, y: y + 9 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
    await expect.poll(() => cameraDifference(canvas, beforeSwipe)).toBeGreaterThan(1);
    await canvas.dispatchEvent("webglcontextlost", { cancelable: true });
    await expect(page.getByText(/Pratinjau 3D tidak tersedia/)).toBeVisible();
    await expect(canvas).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Mulai Eksplorasi" })).toBeInViewport({ ratio: 1 });
  });
});
