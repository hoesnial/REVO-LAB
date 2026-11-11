import { openEraSelection } from "./helpers/revo-menu";
import { finishAssembly } from "./helpers/revo-assembly";
import { test as base, expect, type Page } from "@playwright/test";
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
const screenshots = "test-results/revo/screenshots";

async function enterLabFromMenu(page: Page) {
  await openEraSelection(page);
  await expect(page).toHaveURL(/\/revo-lab\/eras$/);
  await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab\/industry-1\/briefing$/);
  await page.getByRole("link", { name: "Mulai Eksplorasi", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab\/industry-1$/);
}

async function assertMenuFits(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight,
    contentWidth: document.documentElement.scrollWidth,
    contentHeight: document.documentElement.scrollHeight,
  }));
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.width);
  expect(dimensions.contentHeight).toBeLessThanOrEqual(dimensions.height);
  // Check the content, too: overflow:hidden alone could conceal clipped controls.
  for (const locator of [page.getByRole("heading", { level: 1 }), page.getByRole("button", { name: "Progres Saya", exact: true }), page.getByRole("button", { name: "Cara Bermain" }), page.locator(".revo-menu-footer"), page.locator('[data-era="industry-1"] .revo-menu-era-art')]) {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(dimensions.height + 1);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(dimensions.width + 1);
    expect(box!.height).toBeGreaterThan(0);
  }
}

test("main menu fills desktop, tablet, mobile and short viewports without scrolling", async ({ page }) => {
  await page.goto("/revo-lab");
  await expect(page.getByRole("heading", { name: "REVO — Jelajah Revolusi Industri" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  const image = page.getByRole("img", { name: /Diorama pabrik Revolusi Industri pertama/ });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await mkdir(screenshots, { recursive: true });
  for (const [width, height] of [[1440, 900], [1366, 768], [1024, 768], [768, 1024], [390, 844], [375, 667], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await assertMenuFits(page);
    if (width === 1440 || width === 390) await page.screenshot({ path: path.join(screenshots, `main-menu-${width === 1440 ? "desktop" : "mobile"}.png`) });
  }
});

test("help supports keyboard opening, focus containment, Escape and focus restoration", async ({ page }) => {
  await page.goto("/revo-lab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Progres Saya", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  const help = page.getByRole("button", { name: "Cara Bermain", exact: true });
  await expect(help).toBeFocused();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Cara Bermain", exact: true });
  await expect(dialog).toBeVisible();
  for (const name of ["Putar sudut pandang", "Lihat lebih dekat", "Kenali setiap komponen", "Hidupkan mesin uap", "Amati dan refleksikan"]) await expect(dialog.getByRole("heading", { name })).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Siap menjelajah" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Tutup dialog" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(help).toBeFocused();
  await help.click();
  await dialog.getByRole("button", { name: "Siap menjelajah" }).click();
  await expect(dialog).toHaveCount(0);
  await assertMenuFits(page);
});

test("journey navigation pauses the machine and preserves exploration, resources, production and sound preference", async ({ page }) => {
  await page.goto("/revo-lab");
  await enterLabFromMenu(page);
  await expect(page.getByRole("button", { name: "Jelajahi Ketel uap", exact: true })).toBeVisible();
  const componentList = page.getByLabel("Pilih komponen mesin", { exact: true });
  for (const name of ["Ketel uap", "Roda gila", "Piston", "Pipa uap", "Mesin tekstil", "Ketel uap"]) {
    await componentList.getByRole("button", { name: new RegExp(name) }).click();
  }
  await expect(page.getByText("Eksplorasi selesai · 5/5 komponen", { exact: true })).toBeVisible();
  await finishAssembly(page);
  // Entering Experiment intentionally clears the old exploration selection.
  // Select a component here so the return assertion checks an actual retained panel.
  await componentList.getByRole("button", { name: /Ketel uap/ }).click();
  await expect(page.getByRole("heading", { name: "Ketel uap", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tambah air", exact: true }).click();
  await page.getByRole("button", { name: "Aktifkan suara", exact: true }).click();
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId("production").textContent()), { timeout: 30_000 }).toBeGreaterThan(1);
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab$/);
  await expect(page.getByRole("button", { name: "Progres Saya", exact: true })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".revo-session")).toHaveAttribute("inert", "");
  const snapshot = async () => ({
    pressure: await page.getByTestId("pressure").textContent(),
    production: await page.getByTestId("production").textContent(),
    water: await page.locator('[role="meter"][aria-label="Persediaan air"]').getAttribute("aria-valuenow"),
    fuel: await page.locator('[role="meter"][aria-label="Bahan bakar"]').getAttribute("aria-valuenow"),
  });
  const paused = await snapshot();
  // A real pause interval proves the hidden lab isn't consuming resources.
  await page.waitForTimeout(2500);
  expect(await snapshot()).toEqual(paused);
  await assertMenuFits(page);
  await openEraSelection(page);
  await expect(page).toHaveURL(/\/revo-lab\/eras$/);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.waitForTimeout(1000);
  expect(await snapshot()).toEqual(paused);
  await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab\/industry-1\/briefing$/);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.waitForTimeout(1000);
  expect(await snapshot()).toEqual(paused);
  await page.getByRole("link", { name: "Mulai Eksplorasi", exact: true }).click();
  await expect(page.getByText("Eksplorasi selesai · 5/5 komponen", { exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Eksperimen/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Ketel uap", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Matikan suara", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Hentikan mesin", exact: true })).toBeVisible();
  await expect.poll(async () => Number(await page.getByTestId("production").textContent())).toBeGreaterThan(Number(paused.production));
  // Browser history also pauses the retained lab and closes native dialogs.
  await page.getByRole("button", { name: "Panduan belajar" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/revo-lab\/industry-1\/briefing$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.goForward();
  await expect(page.getByRole("dialog", { name: "Panduan belajar" })).toBeVisible();
  await page.getByRole("button", { name: "Tutup dialog" }).click();
  await expect(page.getByRole("button", { name: "Jelajahi Ketel uap", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Hentikan mesin", exact: true }).click();
});

test("era cards show static scene previews and only available eras can be opened", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (["webgl", "webgl2", "experimental-webgl"].includes(type)) throw new Error("WebGL should not initialize in the menu");
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  for (const [width, height] of [[1440, 900], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/revo-lab");
    const cards = page.locator(".revo-menu-era-card");
    await expect(cards).toHaveCount(4);
    const photos = cards.locator("img");
    await expect(photos).toHaveCount(2);
    for (const [index, era] of ["industry-1", "industry-2"].entries()) {
      const image = photos.nth(index);
      await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0 && el.currentSrc.includes(".webp"))).toBe(true);
      await expect(image).toHaveAttribute("src", new RegExp(`${era}-preview\\.webp`));
      await expect(image).toHaveCSS("object-fit", "contain");
      await expect(cards.nth(index).getByRole("link")).toHaveAttribute("href", `/revo-lab/${era}/briefing`);
    }
    for (const index of [2, 3]) {
      await expect(cards.nth(index).getByText("Pratinjau konsep", { exact: true })).toHaveCount(1);
      await expect(cards.nth(index).getByRole("img", { name: /Pratinjau konsep/, includeHidden: true })).toHaveCount(1);
      await expect(cards.nth(index).getByRole("link")).toHaveCount(0);
    }
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Jelajahi Industri 1.0" })).toBeInViewport();
    await expect(page.getByRole("link", { name: "Jelajahi Industri 2.0" })).toBeInViewport();
    await mkdir("test-results/revo/010a-menu", { recursive: true });
    await page.screenshot({ path: `test-results/revo/010a-menu/${width}.png` });
  }
  const next = page.getByRole("button", { name: "Era berikutnya" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(next).toBeFocused();
  await expect(page.getByRole("article", { name: "Industri 4.0" })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("article", { name: "Industri 3.0" }).getByText("Pratinjau konsep")).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("link", { name: "Jelajahi Industri 1.0" })).toHaveCount(0);
  await page.getByRole("button", { name: "Era sebelumnya" }).click();
  await expect(page.getByRole("article", { name: "Industri 2.0" })).toBeInViewport({ ratio: 1 });
  await page.getByRole("link", { name: "Jelajahi Industri 2.0" }).click();
  await expect(page).toHaveURL("/revo-lab/industry-2/briefing");
  await expect(page.locator("canvas")).toHaveCount(0);
});


test("menu progress, display setting and about use working accessible dialogs", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/revo-lab");
  await expect(page.getByText("Lanjutkan Belajar")).toHaveCount(0);
  await expect(page.getByText("Informatika Terapan — SMAN 16 Bandung")).toHaveCount(0);
  const progress = page.getByRole("button", { name: "Progres Saya" });
  await progress.click();
  const progressDialog = page.getByRole("dialog", { name: "Progres Saya" });
  await expect(progressDialog.getByText(/Belum ada progres tersimpan/)).toBeVisible();
  await expect(progressDialog.getByText(/0\/5 komponen/)).toBeVisible();
  await expect(progressDialog.getByText(/0\/7 komponen/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(progress).toBeFocused();

  const settings = page.getByRole("button", { name: "Pengaturan" });
  await settings.click();
  const settingsDialog = page.getByRole("dialog", { name: "Pengaturan" });
  const reduce = settingsDialog.getByRole("button", { name: "Kurangi gerakan antarmuka" });
  await expect(reduce).toHaveAttribute("aria-pressed", "false");
  await reduce.click();
  await expect(settingsDialog).toHaveCSS("animation-name", "none");
  await expect(reduce).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(settings).toBeFocused();

  await page.getByRole("button", { name: "Tentang REVO" }).click();
  await expect(page.getByRole("dialog", { name: "Tentang REVO" }).getByText("Informatika Terapan — SMAN 16 Bandung")).toBeVisible();
});
