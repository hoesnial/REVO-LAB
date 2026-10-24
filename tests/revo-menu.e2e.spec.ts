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
  await page.getByRole("link", { name: "Mulai Jelajah", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab\/eras$/);
  await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab\/industry-1\/briefing$/);
  await page.getByRole("link", { name: "Mulai Simulasi", exact: true }).click();
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
  for (const locator of [page.getByRole("heading", { level: 1 }), page.getByRole("link", { name: "Mulai Jelajah" }), page.getByRole("button", { name: "Cara Bermain" }), page.locator(".revo-menu-footer"), page.locator(".revo-menu-factory")]) {
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
  const image = page.getByRole("img", { name: /Diorama pabrik Revolusi Industri/ });
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
  await expect(page.getByRole("link", { name: "Mulai Jelajah" })).toBeFocused();
  await page.keyboard.press("Tab");
  const help = page.getByRole("button", { name: "Cara Bermain", exact: true });
  await expect(help).toBeFocused();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Cara Bermain", exact: true });
  await expect(dialog).toBeVisible();
  for (const name of ["Putar sudut pandang", "Lihat lebih dekat", "Kenali setiap komponen", "Hidupkan mesin uap", "Selesaikan misi"]) await expect(dialog.getByRole("heading", { name })).toBeVisible();
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
  await expect(page.getByText("5/5 komponen dijelajahi")).toBeVisible();
  await finishAssembly(page);
  await page.getByRole("button", { name: "Tambah air", exact: true }).click();
  await page.getByRole("button", { name: "Aktifkan suara", exact: true }).click();
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId("production").textContent()), { timeout: 30_000 }).toBeGreaterThan(1);
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab$/);
  await expect(page.getByRole("link", { name: "Mulai Jelajah" })).toBeVisible();
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
  await page.getByRole("link", { name: "Mulai Jelajah" }).click();
  await expect(page).toHaveURL(/\/revo-lab\/eras$/);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.waitForTimeout(1000);
  expect(await snapshot()).toEqual(paused);
  await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab\/industry-1\/briefing$/);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.waitForTimeout(1000);
  expect(await snapshot()).toEqual(paused);
  await page.getByRole("link", { name: "Mulai Simulasi", exact: true }).click();
  await expect(page.getByText("5/5 komponen dijelajahi")).toBeVisible();
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
