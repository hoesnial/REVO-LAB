import { finishAssembly } from "./helpers/revo-assembly";
import { expect, test as base, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const screenshots = path.resolve("test-results/revo/screenshots");

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
    page.on("console", message => {
      if (message.type() === "error") errors.push(`console.error: ${message.text()}`);
    });
    await use(errors);
    expect(errors, "The complete browser flow must have no runtime or console errors").toEqual([]);
  }, { auto: true }],
});

async function openLab(page: Page) {
  await page.goto("/revo-lab/industry-1");
  await expect(page.getByRole("heading", { name: "THE AGE OF STEAM." })).toBeVisible();
  await expect(page.locator(".revo-scene canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Jelajahi Ketel uap", exact: true })).toBeVisible();
  await expect(page.getByText("Tampilan 3D belum tersedia")).not.toBeVisible();
  await expect(page.getByTestId("production")).toHaveText("0");
}

async function resetLab(page: Page) {
  const completedScreen = page.getByRole("heading", { name: "LEVEL COMPLETED", exact: true });
  if (await completedScreen.isVisible().catch(() => false)) await page.getByRole("button", { name: "Ulangi Level", exact: true }).click();
  else await page.getByRole("button", { name: "Ulangi seluruh level", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /Ulangi .*Industry 1\.0/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Ulangi Level", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId("production")).toHaveText("0");
  await expect(page.getByRole("meter", { name: "Bahan bakar", exact: true })).toHaveAttribute("aria-valuenow", "35");
  await expect(page.getByRole("tab", { name: /Refleksi/ })).toBeDisabled();
}

async function pressure(page: Page) {
  return Number.parseInt(await page.getByTestId("pressure").innerText(), 10);
}

async function inspectFiveComponents(page: Page) {
  const componentList = page.getByLabel("Pilih komponen mesin", { exact: true });
  for (const name of ["Ketel uap", "Roda gila", "Piston", "Pipa uap", "Mesin tekstil"]) {
    await componentList.getByRole("button", { name: new RegExp(name) }).click();
  }
  await expect(page.getByText("5/5 komponen dijelajahi")).toBeVisible();
}

async function machineSnapshot(page: Page) {
  return page.evaluate(() => ({
    production: document.querySelector<HTMLElement>(".revo-production-track > i")?.style.width,
    fuel: document.querySelector<HTMLElement>('[role="meter"][aria-label="Bahan bakar"] i')?.style.width,
    water: document.querySelector<HTMLElement>('[role="meter"][aria-label="Persediaan air"] i')?.style.width,
    pressure: document.querySelector<SVGPathElement>(".revo-pressure svg path:nth-of-type(2)")?.getAttribute("stroke-dasharray"),
  }));
}

async function imageDifference(left: Buffer, right: Buffer) {
  const [first, second] = await Promise.all([
    sharp(left).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(right).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (first.info.width !== second.info.width || first.info.height !== second.info.height) return 1;
  let total = 0;
  for (let index = 0; index < first.data.length; index += 1) total += Math.abs(first.data[index] - second.data[index]);
  return total / (first.data.length * 255);
}

test("the 3D transmission hotspot explains the real drive path and belts follow the paused engine", async ({ page }) => {
  await openLab(page);
  await mkdir(screenshots, { recursive: true });
  const canvas = page.locator(".revo-scene canvas");
  await canvas.screenshot({ path: path.join(screenshots, "power-transmission-default.png") });

  const hotspot = page.getByRole("button", { name: "Informasi Transmisi Tenaga", exact: true });
  await expect(hotspot).toBeVisible();
  await hotspot.focus();
  await page.keyboard.press("Enter");
  const info = page.getByRole("dialog", { name: "Transmisi Tenaga", exact: true });
  await expect(info.getByLabel("Aliran energi: uap, piston, engkol, roda gila, sabuk, poros transmisi, roda gigi siku, mesin tenun")).toBeVisible();
  await expect(info).toContainText("sabuk, dan poros transmisi untuk menggerakkan mesin tenun");
  await info.screenshot({ path: path.join(screenshots, "power-transmission-learning.png") });
  await info.getByRole("button", { name: "Kembali ke mesin", exact: true }).click();

  await inspectFiveComponents(page);
  await finishAssembly(page);
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect.poll(async () => Number(await page.getByRole("meter", { name: "Kecepatan", exact: true }).getAttribute("aria-valuenow"))).toBeGreaterThan(8);
  await page.waitForTimeout(500);
  const moving = await canvas.screenshot();
  await page.waitForTimeout(900);
  expect((await canvas.screenshot()).equals(moving)).toBe(false);
  await canvas.screenshot({ path: path.join(screenshots, "power-transmission-moving.png") });

  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Transmission canvas has no bounding box");
  await page.mouse.move(bounds.x + bounds.width * 0.76, bounds.y + bounds.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.43, bounds.y + bounds.height * 0.68, { steps: 14 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  await canvas.screenshot({ path: path.join(screenshots, "power-transmission-side.png") });

  await page.getByRole("button", { name: "Jeda simulasi", exact: true }).click();
  const paused = await canvas.screenshot();
  await page.waitForTimeout(900);
  expect((await canvas.screenshot()).equals(paused)).toBe(true);
  await expect(page.getByRole("button", { name: "Lanjutkan simulasi", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Lanjutkan simulasi", exact: true }).click();
  await page.getByRole("button", { name: "Reset kamera", exact: true }).click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Hentikan mesin", exact: true }).click();
  const stoppedBounds = await canvas.boundingBox();
  if (!stoppedBounds) throw new Error("Transmission canvas disappeared after stopping the engine");
  const machinery = { x: stoppedBounds.x + stoppedBounds.width * 0.38, y: stoppedBounds.y + stoppedBounds.height * 0.2, width: stoppedBounds.width * 0.52, height: stoppedBounds.height * 0.5 };
  await page.waitForTimeout(4200);
  const settled = await page.screenshot({ clip: machinery });
  await page.screenshot({ clip: machinery, path: path.join(screenshots, "power-transmission-coast-a.png") });
  await page.waitForTimeout(900);
  const rest = await page.screenshot({ clip: machinery });
  await page.screenshot({ clip: machinery, path: path.join(screenshots, "power-transmission-coast-b.png") });
  expect(await imageDifference(rest, settled)).toBeLessThan(0.002);
  await page.screenshot({ clip: machinery, path: path.join(screenshots, "power-transmission-stopped.png") });
});

test("exploration counts unique inspections and unlocks Assembly after all five and Experiment after assembly", async ({ page }) => {
  await openLab(page);
  const experiment = page.getByRole("tab", { name: /Eksperimen/ });
  const reflection = page.getByRole("tab", { name: /Refleksi/ });
  const start = page.getByRole("button", { name: "Nyalakan mesin", exact: true });
  const componentList = page.getByLabel("Pilih komponen mesin", { exact: true });

  await expect(page.getByRole("tab", { name: /Eksplorasi/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("0/5 komponen dijelajahi")).toBeVisible();
  await expect(experiment).toBeDisabled();
  await expect(reflection).toBeDisabled();
  await expect(start).toBeDisabled();

  const boiler = componentList.getByRole("button", { name: /Ketel uap/ });
  await boiler.click();
  await expect(page.getByRole("heading", { name: "Ketel uap", exact: true })).toBeVisible();
  await expect(page.locator(".revo-component-role")).toContainText("Mengubah panas pembakaran");
  await expect(page.getByText("1/5 komponen dijelajahi")).toBeVisible();
  await boiler.click();
  await expect(page.getByText("1/5 komponen dijelajahi")).toBeVisible();
  await expect(experiment).toBeDisabled();

  for (const name of ["Roda gila", "Piston", "Pipa uap", "Mesin tekstil"]) {
    await componentList.getByRole("button", { name: new RegExp(name) }).click();
  }
  await expect(page.getByText("5/5 komponen dijelajahi")).toBeVisible();
  await expect(page.locator(".revo-learning-note")).toContainText("Seluruh komponen");
  await expect(page.getByRole("tab", { name: /Perakitan/ })).toBeEnabled();
  await expect(experiment).toBeDisabled();
  await expect(reflection).toBeDisabled();
  await expect(start).toBeDisabled();
  await finishAssembly(page);
  await expect(experiment).toHaveAttribute("aria-selected", "true");
  await expect(start).toBeEnabled();
  await expect(reflection).toBeDisabled();
});

test("manual pause, guidance and stage changes freeze the machine until Experiment resumes", async ({ page }) => {
  await openLab(page);
  await inspectFiveComponents(page);
  await finishAssembly(page);
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId("production").textContent()), { timeout: 30_000 }).toBeGreaterThan(1);

  await page.getByRole("button", { name: "Jeda simulasi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lanjutkan simulasi", exact: true })).toBeVisible();
  const manuallyPaused = await machineSnapshot(page);
  await page.waitForTimeout(1500);
  expect(await machineSnapshot(page)).toEqual(manuallyPaused);
  await page.getByRole("button", { name: "Lanjutkan simulasi", exact: true }).click();
  await expect.poll(async () => (await machineSnapshot(page)).production).not.toBe(manuallyPaused.production);

  await page.getByRole("button", { name: "Panduan belajar" }).click();
  const guide = page.getByRole("dialog", { name: "Panduan belajar" });
  await expect(guide).toBeVisible();
  const guidePaused = await machineSnapshot(page);
  await page.waitForTimeout(1500);
  expect(await machineSnapshot(page)).toEqual(guidePaused);
  await guide.getByRole("button", { name: "Tutup dialog" }).click();
  await expect.poll(async () => (await machineSnapshot(page)).production).not.toBe(guidePaused.production);

  await page.getByRole("tab", { name: /Eksplorasi/ }).click();
  const stagePaused = await machineSnapshot(page);
  await page.waitForTimeout(1500);
  expect(await machineSnapshot(page)).toEqual(stagePaused);
  await page.getByRole("tab", { name: /Eksperimen/ }).click();
  await expect.poll(async () => (await machineSnapshot(page)).production).not.toBe(stagePaused.production);
  await expect(page.getByRole("button", { name: "Hentikan mesin", exact: true })).toBeVisible();
});

test("desktop: explore five components, control the camera, run a real safe mission, and score the quiz", async ({ page }) => {
  await openLab(page);
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({ path: path.join(screenshots, "desktop-initial.png"), fullPage: true });
  await expect(page.getByRole("tab", { name: /Refleksi/ })).toBeDisabled();

  await test.step("all five 3D hotspots open their learning content", async () => {
    const components = [
      ["Ketel uap", "Ketel uap"],
      ["Roda gila", "Roda gila"],
      ["Piston", "Piston & batang penghubung"],
      ["Pipa uap", "Pipa & katup uap"],
      ["Mesin tekstil", "Mesin tekstil"],
    ];
    for (const [hotspot, heading] of components) {
      await page.getByRole("button", { name: `Jelajahi ${hotspot}`, exact: true }).click();
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await expect(page.locator(".revo-component-role")).toContainText("PERAN DALAM MESIN");
    }
    await expect(page.getByText("5/5 komponen dijelajahi")).toBeVisible();
    await finishAssembly(page);
    await expect(page.getByRole("tab", { name: /Eksperimen/ })).toHaveAttribute("aria-selected", "true");
  });

  await test.step("zoom and pointer orbit visibly change the rendered diorama", async () => {
    await page.getByRole("button", { name: "Reset kamera", exact: true }).click();
    const canvas = page.locator(".revo-scene canvas");
    const initial = await canvas.screenshot();
    await page.getByRole("button", { name: "Perbesar tampilan", exact: true }).click();
    await expect.poll(async () => (await canvas.screenshot()).equals(initial), { message: "Zoom must change canvas pixels" }).toBe(false);
    const zoomed = await canvas.screenshot();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("3D canvas has no bounding box");
    await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.72);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.78, { steps: 18 });
    await page.mouse.up();
    await expect.poll(async () => (await canvas.screenshot()).equals(zoomed), { message: "Orbit must change canvas pixels" }).toBe(false);
    await page.getByRole("button", { name: "Reset kamera", exact: true }).click();
  });

  await test.step("audio can be enabled and muted by the learner", async () => {
    await page.getByRole("button", { name: "Aktifkan suara", exact: true }).click();
    await expect(page.getByRole("button", { name: "Matikan suara", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Matikan suara", exact: true }).click();
    await expect(page.getByRole("button", { name: "Aktifkan suara", exact: true })).toHaveAttribute("aria-pressed", "false");
  });

  await test.step("a real running engine changes geometry and reaches 100 safe units", async () => {
    // Reenter through the full journey so browser Back during reflection has
    // a real briefing destination; all five explored components must survive.
    await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
    await page.getByRole("link", { name: "Mulai Jelajah", exact: true }).click();
    await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click();
    await page.getByRole("link", { name: "Mulai Simulasi", exact: true }).click();
    await expect(page.getByText("5/5 komponen dijelajahi")).toBeVisible();
    await expect(page.getByRole("tab", { name: /Eksperimen/ })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
    await expect(page.getByRole("button", { name: "Hentikan mesin", exact: true })).toBeVisible();
    await expect.poll(async () => Number(await page.getByRole("meter", { name: "Kecepatan", exact: true }).getAttribute("aria-valuenow"))).toBeGreaterThan(5);
    const canvas = page.locator(".revo-scene canvas");
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("3D canvas disappeared after starting");
    // The lower central crop contains the flywheel/piston and excludes both
    // steam emitters and all live DOM metrics. No clock or state is mocked.
    const clip = { x: box.x + box.width * 0.2, y: box.y + box.height * 0.49, width: box.width * 0.55, height: box.height * 0.4 };
    const motionA = await page.screenshot({ clip, path: path.join(screenshots, "mechanism-frame-a.png") });
    await expect.poll(async () => (await page.screenshot({ clip })).equals(motionA), { message: "The running mechanical assembly must visibly move" }).toBe(false);
    await page.screenshot({ clip, path: path.join(screenshots, "mechanism-frame-b.png") });
    await expect(page.getByRole("dialog", { name: "Misi berhasil", exact: true })).toBeVisible({ timeout: 110_000 });
    await expect(page.getByRole("dialog", { name: "Misi berhasil", exact: true })).toHaveCount(1);
    await expect(page.getByTestId("production")).toHaveText("100");
    await expect(page.getByText("Batas aman terlewati — ulangi misi")).toHaveCount(0);
    expect(await pressure(page)).toBeLessThanOrEqual(75);
    await page.screenshot({ path: path.join(screenshots, "mission-complete.png") });
  });

  await test.step("submit all three conceptual answers and display the score", async () => {
    await page.getByRole("button", { name: "Lanjut refleksi", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Refleksi dan evaluasi", exact: true });
    const answers = [
      "Pabrik lebih sedikit bergantung pada arus sungai sebagai sumber tenaga.",
      "Energi kimia bahan bakar → panas → energi pada uap → gerak mekanis.",
      "Produksi meningkat, tetapi ritme kerja, risiko bagi buruh, dan lingkungan juga berubah.",
    ];
    for (let i = 0; i < answers.length; i += 1) {
      await expect(dialog.getByText(`Pertanyaan ${i + 1} dari 3`, { exact: true })).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Periksa jawaban", exact: true })).toBeDisabled();
      await dialog.getByRole("radio", { name: answers[i], exact: true }).check();
      await dialog.getByRole("button", { name: "Periksa jawaban", exact: true }).click();
      await expect(dialog.getByText("Tepat!", { exact: true })).toBeVisible();
      await expect(dialog.locator(".revo-quiz-feedback p")).not.toBeEmpty();
      if (i === 0) {
        // Returning through menu/era/briefing must keep the open quiz's own
        // step, selected answer, feedback and score, not just the lab reducer.
        await page.goBack();
        await expect(page).toHaveURL(/\/revo-lab\/industry-1\/briefing$/);
        await expect(dialog).toHaveCount(0);
        await page.getByRole("link", { name: "Kembali ke Pilih Era", exact: true }).click();
        await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
        await page.getByRole("link", { name: "Mulai Jelajah", exact: true }).click();
        await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click();
        await page.getByRole("link", { name: "Mulai Simulasi", exact: true }).click();
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText("Pertanyaan 1 dari 3", { exact: true })).toBeVisible();
        // After submission, the correct-answer icon joins the accessible name.
        await expect(dialog.getByRole("radio", { name: answers[0] })).toBeChecked();
        await expect(dialog.getByText("Tepat!", { exact: true })).toBeVisible();
        await expect(page.getByTestId("production")).toHaveText("100");
      }
      await dialog.getByRole("button", { name: i === 2 ? "Lihat hasil" : "Pertanyaan berikutnya", exact: true }).click();
    }
    await expect(dialog.locator(".revo-quiz-score")).toHaveText("3 / 3");
    await page.screenshot({ path: path.join(screenshots, "quiz-complete.png") });
    await dialog.getByRole("button", { name: "Kembali ke laboratorium", exact: true }).click();
    await resetLab(page);
    await expect(page.getByText("0/5 komponen dijelajahi")).toBeVisible();
  });
});

test("resource controls, depleted fuel, and excessive pressure produce honest safety feedback", async ({ page }) => {
  await openLab(page);
  await inspectFiveComponents(page);
  await finishAssembly(page);
  const fuel = page.getByRole("meter", { name: "Bahan bakar", exact: true });
  const water = page.getByRole("meter", { name: "Persediaan air", exact: true });
  await page.getByRole("button", { name: "Tambah bahan bakar", exact: true }).click();
  await expect(fuel).toHaveAttribute("aria-valuenow", "50");
  await page.getByRole("button", { name: "Kurangi bahan bakar", exact: true }).click();
  await expect(fuel).toHaveAttribute("aria-valuenow", "40");
  await page.getByRole("button", { name: "Tambah air", exact: true }).click();
  await expect(water).toHaveAttribute("aria-valuenow", "80");
  for (let i = 0; i < 4; i += 1) await page.getByRole("button", { name: "Kurangi bahan bakar", exact: true }).click();
  await expect(fuel).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect(page.locator(".revo-live-feedback")).toContainText("Bahan bakar tidak cukup");
  await expect(page.getByRole("button", { name: "Nyalakan mesin", exact: true })).toBeVisible();
  await expect(page.getByTestId("production")).toHaveText("0");

  for (let i = 0; i < 7; i += 1) await page.getByRole("button", { name: "Tambah bahan bakar", exact: true }).click();
  await expect(fuel).toHaveAttribute("aria-valuenow", "100");
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect(page.locator(".revo-engine-status")).toContainText("Tekanan tinggi", { timeout: 60_000 });
  await expect(page.getByText("Batas aman terlewati — ulangi misi")).toBeVisible();
  await page.getByRole("button", { name: "Tambah air", exact: true }).click();
  await expect(page.locator(".revo-live-feedback")).toContainText("Pengisian tidak aman");
  await expect(page.getByRole("progressbar", { name: "Pengisian air", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Tambah bahan bakar", exact: true }).click();
  await expect(page.locator(".revo-live-feedback")).toContainText("Pengisian tidak aman");
  await expect(page.getByRole("progressbar", { name: "Pengisian bahan bakar", exact: true })).toHaveCount(0);
  await expect(page.locator(".revo-engine-status")).toContainText("Berhenti darurat", { timeout: 45_000 });
  expect(await pressure(page)).toBeGreaterThanOrEqual(90);
  await expect(page.locator(".revo-live-feedback")).toContainText("Mesin berhenti darurat");
  await expect(page.getByRole("tab", { name: /Refleksi/ })).toBeDisabled();
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect(page.locator(".revo-live-feedback")).toContainText("Pengaman aktif");
  const beforeVenting = await pressure(page);
  await page.getByRole("button", { name: "Lepaskan tekanan", exact: true }).click();
  expect(await pressure(page)).toBeLessThan(beforeVenting - 15);
  await expect(page.locator(".revo-live-feedback")).toContainText("Uap dilepaskan");
  await page.getByRole("button", { name: "Ulangi misi", exact: true }).click();
  await expect(page.getByTestId("production")).toHaveText("0");
  await expect(page.getByTestId("pressure")).toHaveText("10/100");
  await expect(fuel).toHaveAttribute("aria-valuenow", "35");
  await expect(water).toHaveAttribute("aria-valuenow", "65");
  await expect(page.getByText("5/5 komponen dijelajahi")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Eksperimen/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: /Refleksi/ })).toBeDisabled();
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId("production").textContent()), { timeout: 30_000 }).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Hentikan mesin", exact: true }).click();
  await resetLab(page);
  await expect(page.getByTestId("pressure")).toHaveText("10/100");
  await expect(page.getByText("0/5 komponen dijelajahi")).toBeVisible();
});

test("mobile: the 390px layout, component inspection, and machine controls remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLab(page);
  await mkdir(screenshots, { recursive: true });
  await page.screenshot({ path: path.join(screenshots, "mobile-initial.png"), fullPage: true });
  const assertNoOverflow = async () => {
    const dimensions = await page.evaluate(() => ({ width: window.innerWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1);
  };
  await assertNoOverflow();
  const keyboardComponents = page.getByLabel("Pilih komponen mesin", { exact: true });
  await keyboardComponents.getByRole("button", { name: /Ketel uap/ }).click();
  await expect(page.getByRole("heading", { name: "Ketel uap", exact: true })).toBeVisible();
  await assertNoOverflow();
  for (const name of ["Roda gila", "Piston", "Pipa uap", "Mesin tekstil"]) {
    await keyboardComponents.getByRole("button", { name: new RegExp(name) }).click();
  }
  await finishAssembly(page);
  await page.getByRole("button", { name: "Tambah air", exact: true }).click();
  await expect(page.getByRole("meter", { name: "Persediaan air", exact: true })).toHaveAttribute("aria-valuenow", "80");
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect.poll(async () => Number(await page.getByRole("meter", { name: "Kecepatan", exact: true }).getAttribute("aria-valuenow"))).toBeGreaterThan(5);
  await page.getByRole("button", { name: "Hentikan mesin", exact: true }).click();
  await expect(page.getByRole("button", { name: "Nyalakan mesin", exact: true })).toBeVisible();
  await assertNoOverflow();
  await page.screenshot({ path: path.join(screenshots, "mobile-controls.png"), fullPage: true });
});

test("fullscreen HUD keeps the scene and learning controls reachable at four viewport sizes", async ({ page }) => {
  await page.goto("/revo-lab/industry-1");
  const canvas = page.locator(".revo-scene canvas");
  const lab = page.getByRole("region", { name: "Laboratorium interaktif" });
  await expect(canvas).toBeVisible();
  await expect(lab.getByRole("progressbar", { name: "Produksi kain" })).toBeVisible();
  await inspectFiveComponents(page);
  await finishAssembly(page);

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
    { name: "short landscape", width: 844, height: 390 },
  ]) {
    await test.step(viewport.name, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const geometry = await page.evaluate(() => {
        const app = document.querySelector(".revo-app")?.getBoundingClientRect();
        const scene = document.querySelector(".revo-scene canvas")?.getBoundingClientRect();
        const scroller = document.scrollingElement;
        return {
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          documentWidth: scroller?.scrollWidth ?? 0,
          documentHeight: scroller?.scrollHeight ?? 0,
          documentScrollY: window.scrollY,
          app: app && { top: app.top, bottom: app.bottom },
          scene: scene && { width: scene.width, height: scene.height },
        };
      });
      expect(geometry.documentWidth, `${viewport.name}: document must not scroll horizontally`).toBeLessThanOrEqual(geometry.viewportWidth + 1);
      expect(geometry.documentHeight, `${viewport.name}: HUD must fit the viewport without page scrolling`).toBeLessThanOrEqual(geometry.viewportHeight + 1);
      expect(geometry.app?.top, `${viewport.name}: HUD starts at the viewport top`).toBeGreaterThanOrEqual(-1);
      expect(geometry.app?.bottom, `${viewport.name}: HUD fills the viewport`).toBeGreaterThanOrEqual(geometry.viewportHeight - 2);
      expect(geometry.app?.bottom, `${viewport.name}: HUD remains inside the viewport`).toBeLessThanOrEqual(geometry.viewportHeight + 2);
      expect(geometry.scene?.width, `${viewport.name}: 3D scene has useful width`).toBeGreaterThan(180);
      expect(geometry.scene?.height, `${viewport.name}: 3D scene has useful height`).toBeGreaterThan(110);

      const tools = lab.locator(".revo-workspace-actions");
      await expect(tools).toContainText("ERA 01");
      await expect(tools.getByRole("button", { name: "Aktifkan suara", exact: true })).toBeVisible();
      await expect(tools.getByRole("button", { name: "Reset mesin", exact: true })).toBeVisible();
      await expect(tools.getByRole("button", { name: "Ulangi seluruh level", exact: true })).toBeVisible();
      await expect(tools.getByRole("button", { name: "Jeda simulasi", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
      await expect(page.getByRole("button", { name: "Hentikan mesin", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Hentikan mesin", exact: true }).click();
      await expect(page.getByRole("button", { name: "Nyalakan mesin", exact: true })).toBeVisible();
      expect(await page.evaluate(() => window.scrollY), `${viewport.name}: using controls must not scroll the document`).toBe(0);
    });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await lab.locator(".revo-workspace-actions").getByRole("button", { name: "Aktifkan suara", exact: true }).click();
  await expect(lab.getByRole("button", { name: "Matikan suara", exact: true })).toHaveAttribute("aria-pressed", "true");
  await lab.getByRole("button", { name: "Ulangi seluruh level", exact: true }).click();
  const reset = page.getByRole("dialog", { name: "Ulangi seluruh Industry 1.0", exact: true });
  await expect(reset).toBeVisible();
  await reset.getByRole("button", { name: "Pertahankan progres", exact: true }).click();

  await page.getByRole("tab", { name: /Eksplorasi/ }).click();
  await page.getByRole("tab", { name: /Eksplorasi/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Perakitan/ })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Eksperimen/ })).toHaveAttribute("aria-selected", "true");
  await page.getByLabel("Pilih komponen mesin", { exact: true }).getByRole("button", { name: /Ketel uap/ }).click();
  await expect(page.getByRole("heading", { name: "Ketel uap", exact: true })).toBeVisible();

  const history = page.locator("details").filter({ hasText: "Konteks sejarah" });
  await history.locator("summary").click();
  await expect(history).toHaveAttribute("open", "");
  await expect(history.getByText("Dari sungai ke pabrik", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY), "Exploration and history must remain inside the HUD").toBe(0);
});
