import { test as base, expect, type Page } from "@playwright/test";
import { assemblyParts, correctAssemblyAnswers, openAssembly, placeAssemblyPart } from "./helpers/revo-assembly";
import { mkdir } from "node:fs/promises";

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await use(errors); expect(errors).toEqual([]);
  }, { auto: true }],
});
async function progress(page: Page, value: number) {
  await expect(page.getByRole("progressbar", { name: "Progres perakitan", exact: true })).toHaveAttribute("aria-valuenow", String(value));
}
async function keyboardPlace(page: Page, id: string, name: string) {
  const part = page.getByRole("button", { name: `Pilih ${name}`, exact: true });
  await part.focus(); await page.keyboard.press("Enter");
  const target = page.getByLabel("Sambungan tujuan", { exact: true });
  await target.focus(); await page.keyboard.press("s");
  await expect(target).toHaveValue(id);
  await page.getByRole("button", { name: "Pasang komponen", exact: true }).focus(); await page.keyboard.press("Enter");
}
async function dragPart(page: Page, id: string, socket: string | null) {
  await expect(page.locator(`[data-tray="${id}"]`)).toBeVisible();
  const source = await page.locator(`[data-tray="${id}"]`).boundingBox();
  const target = socket ? await page.locator(`[data-socket="${socket}"]`).boundingBox() : await page.locator('[data-tray="textile"]').boundingBox();
  if (!source || !target) throw new Error("Projected assembly target is missing");
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await expect(page.getByRole("button", { name: `Pilih ${assemblyParts.find(part => part[0] === id)?.[1]}`, exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 24 });
  await page.mouse.up();
}
async function assertFits(page: Page) {
  const size = await page.evaluate(() => ({ w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }));
  expect(size.sw).toBeLessThanOrEqual(size.w); expect(size.sh).toBeLessThanOrEqual(size.h);
  const scene = await page.locator(".revo-scene canvas").boundingBox();
  expect(scene?.width).toBeGreaterThan(180); expect(scene?.height).toBeGreaterThan(110);
}

test("keyboard selection, wrong placement, duplicates and assembly-only reset", async ({ page }) => {
  await page.goto("/revo-lab/industry-1");
  await expect(page.getByRole("tab", { name: /Perakitan/ })).toBeDisabled();
  await expect(page.getByRole("tab", { name: /Eksperimen/ })).toBeDisabled();
  await openAssembly(page);
  const boiler = page.getByRole("button", { name: "Pilih Ketel uap", exact: true });
  await boiler.focus(); await page.keyboard.press("Enter");
  await expect(boiler).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("article", { name: "Petunjuk Ketel uap" })).toContainText("Keluaran ketel dihubungkan ke pipa");
  await page.getByLabel("Sambungan tujuan", { exact: true }).selectOption("textile");
  await page.getByRole("button", { name: "Pasang komponen", exact: true }).press("Enter");
  await expect(page.locator(".revo-live-feedback")).toContainText("Belum cocok");
  await progress(page, 0); await expect(boiler).toHaveAttribute("aria-pressed", "true");
  await keyboardPlace(page, "boiler", "Ketel uap");
  await progress(page, 13); await expect(boiler).toBeDisabled();
  await expect(page.getByRole("button", { name: "Pasang komponen", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Ulangi perakitan", exact: true }).click();
  await progress(page, 0); await expect(boiler).toBeEnabled();
  await page.getByRole("tab", { name: /Eksplorasi/ }).click();
  await expect(page.getByText("5/5 komponen dijelajahi")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Perakitan/ })).toBeEnabled();
  await expect(page.getByRole("tab", { name: /Eksperimen/ })).toBeDisabled();
});

test("3D raycast dragging rejects wrong and missed sockets, snaps, and releases controls", async ({ page }) => {
  await openAssembly(page);
  await expect(page.getByText("Tampilan 3D belum tersedia")).not.toBeVisible();
  await dragPart(page, "boiler", "textile");
  await expect(page.locator(".revo-live-feedback")).toContainText("Belum cocok");
  await progress(page, 0);
  await dragPart(page, "boiler", null);
  await progress(page, 0);
  await dragPart(page, "boiler", "boiler");
  await progress(page, 13);
  await expect(page.getByRole("button", { name: "Pilih Ketel uap", exact: true })).toBeDisabled();
  for (const [id] of assemblyParts.slice(1)) await dragPart(page, id, id);
  await expect(page.getByText("5/5 terpasang", { exact: true })).toBeVisible();
  await progress(page, 63);
  // Orbit is usable again after pointer capture ends.
  const marker = page.locator('[data-socket="textile"]');
  const before = await marker.getAttribute("style");
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw new Error("Canvas not present");
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .35); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .92, box.y + box.height * .46, { steps: 16 }); await page.mouse.up();
  await expect.poll(() => marker.getAttribute("style")).not.toBe(before);
});

test("all knowledge checks require understanding; retries unlock a stopped existing simulator", async ({ page }) => {
  await openAssembly(page);
  for (const [id, name] of assemblyParts) await placeAssemblyPart(page, id, name);
  await expect(page.getByRole("tab", { name: /Eksperimen/ })).toBeDisabled();
  await page.getByRole("button", { name: "Pipa menghasilkan uap saat roda berputar.", exact: true }).click();
  await expect(page.getByRole("region", { name: "Cek pemahaman perakitan" })).toContainText("Belum tepat. Coba lagi.");
  await expect(page.getByRole("region", { name: "Cek pemahaman perakitan" })).toContainText("Pipa menyalurkan uap");
  await progress(page, 63);
  for (const answer of correctAssemblyAnswers) await page.getByRole("button", { name: answer, exact: true }).click();
  await expect(page.getByRole("heading", { name: "PERAKITAN SELESAI", exact: true })).toBeVisible();
  await expect(page.getByLabel("Aliran energi", { exact: true })).toContainText("Ketel uap");
  await expect(page.getByLabel("Aliran energi", { exact: true })).toContainText("Mesin tekstil");
  await progress(page, 100);
  await mkdir("test-results/revo/screenshots", { recursive: true });
  await page.screenshot({ path: "test-results/revo/screenshots/assembly-complete.png" });
  await page.getByRole("button", { name: "UJI MESIN", exact: true }).click();
  await expect(page.getByRole("tab", { name: /Eksperimen/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("production")).toHaveText("0");
  await expect(page.getByRole("meter", { name: "Bahan bakar", exact: true })).toHaveAttribute("aria-valuenow", "35");
  await expect(page.getByRole("meter", { name: "Persediaan air", exact: true })).toHaveAttribute("aria-valuenow", "65");
  await expect(page.getByRole("button", { name: "Nyalakan mesin", exact: true })).toBeEnabled();
  await expect(page.getByRole("tab", { name: /Refleksi/ })).toBeDisabled();
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId("production").textContent()), { timeout: 30_000 }).toBeGreaterThan(0);
  await page.getByRole("tab", { name: /Perakitan/ }).click();
  await page.getByRole("button", { name: "Ulangi perakitan", exact: true }).click();
  await progress(page, 0);
  await expect(page.getByRole("tab", { name: /Eksperimen/ })).toBeDisabled();
  await page.getByRole("tab", { name: /Eksplorasi/ }).click();
  await expect(page.getByText("5/5 komponen dijelajahi")).toBeVisible();
  expect(Number(await page.getByTestId("production").textContent())).toBeGreaterThan(0);
});

test("pause, help dialog, menu and return retain assembly and prevent actions", async ({ page }) => {
  await openAssembly(page);
  await placeAssemblyPart(page, "boiler", "Ketel uap");
  await page.getByRole("button", { name: "Pilih Pipa uap", exact: true }).click();
  await page.getByRole("button", { name: "Jeda simulasi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lanjutkan perakitan", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pilih Pipa uap", exact: true })).toBeDisabled();
  await progress(page, 13);
  await page.getByRole("button", { name: "Lanjutkan perakitan", exact: true }).click();
  await page.getByRole("button", { name: "Panduan belajar" }).click();
  await expect(page.getByRole("dialog", { name: "Panduan belajar" })).toBeVisible();
  await expect(page.locator('.revo-assembly-fieldset')).toHaveAttribute('disabled', '');
  await page.getByRole("button", { name: "Tutup dialog", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pilih Pipa uap", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "Mulai Jelajah", exact: true }).click();
  await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click();
  await page.getByRole("link", { name: "Mulai Simulasi", exact: true }).click();
  await progress(page, 13);
  await expect(page.getByRole("button", { name: "Pilih Pipa uap", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Sambungan tujuan", { exact: true }).selectOption("pipe");
  await page.getByRole("button", { name: "Pasang komponen", exact: true }).click();
  await progress(page, 25);
});

test("assembly fits desktop, tablet, phone and short landscape without document scrolling", async ({ page }) => {
  await openAssembly(page);
  await mkdir("test-results/revo/screenshots", { recursive: true });
  for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768], [1280, 720], [768, 1024], [390, 844], [375, 667], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await assertFits(page);
    await expect(page.getByRole("tab", { name: /Perakitan/ })).toBeInViewport();
    await page.getByRole("button", { name: "Pilih Pipa uap", exact: true }).click();
    await expect(page.getByRole("article", { name: "Petunjuk Pipa uap" })).toBeVisible();
    if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/revo/screenshots/assembly-${width}.png` });
    await page.locator(".revo-assembly-inventory summary").click();
    await expect(page.locator(".revo-assembly-inventory")).not.toHaveAttribute("open", "");
    await page.getByRole("button", { name: "Pasang komponen", exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Pasang komponen", exact: true })).toBeInViewport();
    await assertFits(page);
    await page.locator(".revo-assembly-inventory summary").click();
  }
});

test.describe("touch interaction", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("tap alternative installs parts and completes checks on a compact screen", async ({ page }) => {
    await openAssembly(page);
    for (const [id, name] of assemblyParts) {
      await page.getByRole("button", { name: `Pilih ${name}`, exact: true }).tap();
      await page.getByLabel("Sambungan tujuan", { exact: true }).selectOption(id);
      await page.getByRole("button", { name: "Pasang komponen", exact: true }).tap();
    }
    for (const answer of correctAssemblyAnswers) await page.getByRole("button", { name: answer, exact: true }).tap();
    await progress(page, 100); await assertFits(page);
    await page.getByRole("button", { name: "UJI MESIN", exact: true }).tap();
    await expect(page.getByRole("button", { name: "Nyalakan mesin", exact: true })).toBeEnabled();
    await assertFits(page);
  });
});

test("pausing during a captured drag cancels placement and allows a fresh drag", async ({ page }) => {
  await openAssembly(page);
  const tray = page.locator('[data-tray="boiler"]');
  await expect(tray).toBeVisible();
  const source = await tray.boundingBox();
  const target = await page.locator('[data-socket="boiler"]').boundingBox();
  if (!source || !target) throw new Error("Assembly markers missing");
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2); await page.mouse.down();
  await expect(page.getByRole("button", { name: "Pilih Ketel uap", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 16 });
  await page.getByRole("button", { name: "Jeda simulasi", exact: true }).focus(); await page.keyboard.press("Enter");
  await page.mouse.up(); await progress(page, 0);
  await page.getByRole("button", { name: "Lanjutkan perakitan", exact: true }).click();
  await dragPart(page, "boiler", "boiler"); await progress(page, 13);
});

test("changing stage during a drag restores exploration camera and future assembly dragging", async ({ page }) => {
  await openAssembly(page);
  const tray = page.locator('[data-tray="boiler"]');
  await expect(tray).toBeVisible();
  const box = await tray.boundingBox();
  if (!box) throw new Error("Tray marker missing");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await expect(page.getByRole("button", { name: "Pilih Ketel uap", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: /Perakitan/ }).focus(); await page.keyboard.press("Home"); await page.mouse.up();
  await expect(page.getByRole("tab", { name: /Eksplorasi/ })).toHaveAttribute("aria-selected", "true");
  const marker = page.getByRole("button", { name: "Jelajahi Ketel uap", exact: true });
  const before = await marker.getAttribute("style");
  const canvas = await page.locator("canvas").boundingBox();
  if (!canvas) throw new Error("Canvas missing");
  await page.mouse.move(canvas.x + canvas.width * .8, canvas.y + canvas.height * .3); await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width * .9, canvas.y + canvas.height * .4, { steps: 14 }); await page.mouse.up();
  await expect.poll(() => marker.getAttribute("style")).not.toBe(before);
  await page.getByRole("button", { name: "Lanjut ke perakitan", exact: true }).click();
  await progress(page, 0);
  await dragPart(page, "boiler", "boiler"); await progress(page, 13);
});
