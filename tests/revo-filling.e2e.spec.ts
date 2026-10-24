import { test as base, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { finishAssembly } from "./helpers/revo-assembly";

const shots = "test-results/revo/screenshots/revo-005-1";
const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await use(errors); expect(errors).toEqual([]);
  }, { auto: true }],
});
async function experiment(page: Page) {
  await page.goto("/revo-lab/industry-1");
  await expect(page.locator(".revo-scene canvas")).toBeVisible();
  for (const name of ["Ketel uap", "Roda gila", "Piston", "Pipa uap", "Mesin tekstil"])
    await page.getByLabel("Pilih komponen mesin", { exact: true }).getByRole("button", { name: new RegExp(name) }).click();
  await finishAssembly(page);
  await page.getByRole("button", { name: "Reset kamera", exact: true }).click();
}
const fuel = (page: Page) => page.getByRole("meter", { name: "Bahan bakar", exact: true });
const water = (page: Page) => page.getByRole("meter", { name: "Persediaan air", exact: true });
const progress = (page: Page, kind: "coal" | "water") => page.getByRole("progressbar", { name: kind === "coal" ? "Pengisian bahan bakar" : "Pengisian air", exact: true });
async function fill(page: Page, kind: "coal" | "water") {
  await page.getByRole("button", { name: kind === "coal" ? "Tambah bahan bakar" : "Tambah air", exact: true }).click();
  await expect(progress(page, kind)).toBeVisible();
  await expect(progress(page, kind)).toHaveCount(0);
}
async function orbit(page: Page, dx: number) {
  const box = await page.locator(".revo-scene canvas").boundingBox();
  if (!box) throw new Error("Canvas missing");
  await page.mouse.move(box.x + box.width * .65, box.y + box.height * .7); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .65 + dx, box.y + box.height * .73, { steps: 18 }); await page.mouse.up();
}

test("mechanism and raised gauge render from multiple angles; pause freezes actual geometry", async ({ page }) => {
  await experiment(page); await mkdir(shots, { recursive: true });
  await page.getByLabel("Pilih komponen mesin", { exact: true }).getByRole("button", { name: /Piston/ }).click();
  await page.getByRole("button", { name: "Tutup informasi komponen", exact: true }).click();
  await page.locator(".revo-scene canvas").screenshot({ path: `${shots}/piston-connecting-rod.png` });
  await orbit(page, 135);
  await page.locator(".revo-scene canvas").screenshot({ path: `${shots}/mechanism-side.png` });
  await page.getByLabel("Pilih komponen mesin", { exact: true }).getByRole("button", { name: /Ketel uap/ }).click();
  await page.getByRole("button", { name: "Tutup informasi komponen", exact: true }).click();
  await page.locator(".revo-scene canvas").screenshot({ path: `${shots}/boiler-gauge.png` });
  await orbit(page, -85);
  await page.locator(".revo-scene canvas").screenshot({ path: `${shots}/gauge-side.png` });
  await page.getByRole("button", { name: "Reset kamera", exact: true }).click();
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect.poll(async () => Number(await page.getByRole("meter", { name: "Kecepatan", exact: true }).getAttribute("aria-valuenow"))).toBeGreaterThan(5);
  const canvas = page.locator(".revo-scene canvas"); const moving = await canvas.screenshot();
  await expect.poll(async () => (await canvas.screenshot()).equals(moving)).toBe(false);
  await page.getByRole("button", { name: "Jeda simulasi", exact: true }).click();
  const frozen = await canvas.screenshot(); await page.waitForTimeout(800);
  expect((await canvas.screenshot()).equals(frozen)).toBe(true);
  await page.getByRole("button", { name: "Lanjutkan simulasi", exact: true }).click();
  await expect.poll(async () => (await canvas.screenshot()).equals(frozen)).toBe(false);
});

test("coal pile mesh, shovel, firebox and water pump share exactly-once resource actions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await experiment(page); await mkdir(shots, { recursive: true });
  await page.waitForTimeout(1000); // Let the smooth camera finish its reset.
  const coalMarker = page.locator('[data-resource="coal"]');
  const marker = await coalMarker.boundingBox(); if (!marker) throw new Error("Missing coal marker");
  // Hit the rendered pile underneath its label, without invoking a DOM button.
  await page.addStyleTag({ content: ".revo-resource-markers button { pointer-events: none !important; }" });
  await page.mouse.click(marker.x + marker.width / 2, marker.y + marker.height / 2 + 12);
  await expect(page.getByRole("region", { name: "Pengisian batu bara", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Masukkan Batu Bara", exact: true }).click();
  await expect(fuel(page)).toHaveAttribute("aria-valuenow", "35");
  await page.waitForFunction(() => Number(document.querySelector('[role="progressbar"][aria-label="Pengisian bahan bakar"]')?.getAttribute("aria-valuenow")) >= 40);
  await page.getByRole("button", { name: "Jeda simulasi", exact: true }).click();
  await page.screenshot({ path: `${shots}/coal-filling.png` });
  await page.getByRole("button", { name: "Lanjutkan simulasi", exact: true }).click();
  await expect(progress(page, "coal")).toHaveCount(0); await expect(fuel(page)).toHaveAttribute("aria-valuenow", "50");
  await page.waitForTimeout(500); await expect(fuel(page)).toHaveAttribute("aria-valuenow", "50");
  await expect(page.locator(".revo-live-feedback")).toContainText("Bahan bakar ditambahkan");
  await page.getByRole("button", { name: "Tutup pengisian", exact: true }).click();
  const pump = await page.locator('[data-resource="water"]').boundingBox(); if (!pump) throw new Error("Missing pump marker");
  await page.mouse.click(pump.x + pump.width / 2, pump.y + pump.height / 2 + 18);
  await expect(page.getByRole("region", { name: "Pengisian air", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Isi Air", exact: true }).click();
  await expect(water(page)).toHaveAttribute("aria-valuenow", "65");
  await page.waitForFunction(() => Number(document.querySelector('[role="progressbar"][aria-label="Pengisian air"]')?.getAttribute("aria-valuenow")) >= 35);
  await page.getByRole("button", { name: "Jeda simulasi", exact: true }).click();
  await page.screenshot({ path: `${shots}/water-filling.png` });
  await page.getByRole("button", { name: "Lanjutkan simulasi", exact: true }).click();
  await expect(progress(page, "water")).toHaveCount(0); await expect(water(page)).toHaveAttribute("aria-valuenow", "80");
  await expect(page.locator(".revo-live-feedback")).toContainText("pompa pengisi");
});

test("rapid input, capacity limits and keyboard controls remain consistent", async ({ page }) => {
  await experiment(page);
  const add = page.getByRole("button", { name: "Tambah bahan bakar", exact: true });
  await add.focus(); await page.keyboard.press("Enter");
  await expect(add).toBeDisabled();
  await expect(page.getByRole("button", { name: "Tambah air", exact: true })).toBeDisabled();
  const box = await add.boundingBox(); if (!box) throw new Error("Missing fuel control");
  for (let i = 0; i < 8; i++) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(progress(page, "coal")).toHaveCount(0); await expect(fuel(page)).toHaveAttribute("aria-valuenow", "50");
  for (let i = 0; i < 4; i++) await fill(page, "coal");
  await expect(fuel(page)).toHaveAttribute("aria-valuenow", "100");
  await add.click(); await expect(progress(page, "coal")).toHaveCount(0); await expect(page.locator(".revo-live-feedback")).toContainText("penuh");
  for (let i = 0; i < 3; i++) await fill(page, "water");
  await expect(water(page)).toHaveAttribute("aria-valuenow", "100");
  await page.getByRole("button", { name: "Tambah air", exact: true }).click();
  await expect(page.locator(".revo-live-feedback")).toContainText("penuh");
});

test("pause and help suspend filling; navigation cancels it without granting resources", async ({ page }) => {
  await experiment(page);
  await page.getByRole("button", { name: "Tambah bahan bakar", exact: true }).click();
  await expect.poll(async () => Number(await progress(page, "coal").getAttribute("aria-valuenow"))).toBeGreaterThan(15);
  await page.getByRole("button", { name: "Jeda simulasi", exact: true }).click();
  const frozen = await progress(page, "coal").getAttribute("aria-valuenow");
  const image = await page.locator(".revo-scene canvas").screenshot(); await page.waitForTimeout(1000);
  await expect(progress(page, "coal")).toHaveAttribute("aria-valuenow", frozen!);
  expect((await page.locator(".revo-scene canvas").screenshot()).equals(image)).toBe(true);
  await expect(fuel(page)).toHaveAttribute("aria-valuenow", "35");
  await page.getByRole("button", { name: "Lanjutkan simulasi", exact: true }).click();
  await expect(progress(page, "coal")).toHaveCount(0); await expect(fuel(page)).toHaveAttribute("aria-valuenow", "50");
  await page.getByRole("button", { name: "Tambah air", exact: true }).click();
  await page.getByRole("button", { name: "Panduan belajar", exact: true }).click();
  const waterFrozen = await progress(page, "water").getAttribute("aria-valuenow"); await page.waitForTimeout(500);
  await expect(progress(page, "water")).toHaveAttribute("aria-valuenow", waterFrozen!);
  await page.getByRole("dialog", { name: "Panduan belajar", exact: true }).getByRole("button", { name: "Tutup dialog", exact: true }).click();
  await expect(progress(page, "water")).toHaveCount(0); await expect(water(page)).toHaveAttribute("aria-valuenow", "80");
  await page.getByRole("button", { name: "Tambah bahan bakar", exact: true }).click();
  await page.getByRole("tab", { name: /Eksplorasi/ }).click();
  await page.getByRole("tab", { name: /Eksperimen/ }).click();
  await expect(progress(page, "coal")).toHaveCount(0); await expect(fuel(page)).toHaveAttribute("aria-valuenow", "50");
  await page.getByRole("button", { name: "Tambah air", exact: true }).click();
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await page.waitForTimeout(500); await page.getByRole("link", { name: "Mulai Jelajah", exact: true }).click();
  await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click(); await page.getByRole("link", { name: "Mulai Simulasi", exact: true }).click();
  await expect(water(page)).toHaveAttribute("aria-valuenow", "80"); await expect(progress(page, "water")).toHaveCount(0);
});

test("mobile taps and accessible controls fit compact viewports during filling", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  const mobile = await context.newPage();
  const errors: string[] = [];
  mobile.on("pageerror", error => errors.push(error.message));
  mobile.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  try {
    await mkdir(shots, { recursive: true });
    await experiment(mobile);
    await mobile.getByRole("button", { name: "Pilih pompa air", exact: true }).tap();
    await mobile.getByRole("button", { name: "Isi Air", exact: true }).tap();
    await expect(progress(mobile, "water")).toHaveCount(0); await expect(water(mobile)).toHaveAttribute("aria-valuenow", "80");
    await mobile.screenshot({ path: `${shots}/mobile-filling-controls.png` });
    await mobile.getByRole("button", { name: "Tutup pengisian", exact: true }).tap();
    await fill(mobile, "coal"); await expect(fuel(mobile)).toHaveAttribute("aria-valuenow", "50");
    for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [844, 390], [1440, 900]]) {
      await mobile.setViewportSize({ width, height });
      const size = await mobile.evaluate(() => ({ w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }));
      expect(size.sw).toBeLessThanOrEqual(size.w); expect(size.sh).toBeLessThanOrEqual(size.h);
    }
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});

test("accessible filling remains playable on mobile when WebGL is unavailable", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  // Exercise the supported graphics fallback; no gameplay state or clocks are mocked.
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  const fallback = await context.newPage();
  try {
    await fallback.goto("/revo-lab/industry-1");
    await expect(fallback.getByText("Tampilan 3D belum tersedia", { exact: true })).toBeVisible();
    for (const name of ["Ketel uap", "Roda gila", "Piston", "Pipa uap", "Mesin tekstil"])
      await fallback.getByLabel("Pilih komponen mesin", { exact: true }).getByRole("button", { name: new RegExp(name) }).click();
    await finishAssembly(fallback);
    await fill(fallback, "coal"); await expect(fuel(fallback)).toHaveAttribute("aria-valuenow", "50");
    await fill(fallback, "water"); await expect(water(fallback)).toHaveAttribute("aria-valuenow", "80");
    await fallback.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
    await expect.poll(async () => Number(await fallback.getByRole("meter", { name: "Kecepatan", exact: true }).getAttribute("aria-valuenow"))).toBeGreaterThan(5);
    const size = await fallback.evaluate(() => ({ w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }));
    expect(size.sw).toBeLessThanOrEqual(size.w); expect(size.sh).toBeLessThanOrEqual(size.h);
  } finally { await context.close(); }
});
