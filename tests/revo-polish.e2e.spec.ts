import { expect, test as base, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { placeAssemblyPart } from "./helpers/revo-assembly";

const storageKey = "revo:industry-1:progress";
const parts = ["boiler", "pipe", "piston", "flywheel", "textile"];
const checkIds = ["steam", "rotation", "factory"];
const screenshots = path.resolve("test-results/revo/screenshots/revo-007");
const demoVideos = path.resolve("test-results/revo/videos/revo-007");
const baseURL = process.env.REVO_BASE_URL ?? "http://127.0.0.1:3001";

function progress(value: { stage?: number; placed?: string[]; checks?: string[]; experimentComplete?: boolean; answers?: number[]; soundEnabled?: boolean } = {}) {
  const placed = value.placed ?? parts;
  const checks = value.checks ?? checkIds;
  const experimentComplete = value.experimentComplete ?? false;
  const answers = value.answers ?? [];
  return {
    version: 1,
    selectedEra: "industry-1",
    explored: parts,
    assembly: { placed, checks },
    completedStages: experimentComplete ? ["exploration", "assembly", "experiment", "reflection", "level"] : ["exploration", "assembly"],
    experimentComplete,
    reflection: { answers: [], draftAnswer: null, checked: false, resultAnswers: experimentComplete ? answers : null, retaking: false },
    levelComplete: experimentComplete,
    checkpoint: experimentComplete ? 4 : (value.stage ?? 1),
    preferences: { soundEnabled: value.soundEnabled ?? false },
  };
}

async function expectNoDocumentScroll(page: Page) {
  const bounds = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight }));
  expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.width);
  expect(bounds.scrollHeight).toBeLessThanOrEqual(bounds.height);
}

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await use(errors);
    expect(errors).toEqual([]);
  }, { auto: true }],
});

test("audio is opt-in, uses one context, preserves Indonesian transcript and saved preference", async ({ page }) => {
  await page.addInitScript(() => {
    const observed = window as Window & { __revoAudioContexts?: number };
    observed.__revoAudioContexts = 0;
    const NativeContext = window.AudioContext;
    if (!NativeContext) return;
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: new Proxy(NativeContext, {
        construct(target, args) {
          observed.__revoAudioContexts = (observed.__revoAudioContexts ?? 0) + 1;
          return Reflect.construct(target, args);
        },
      }),
    });
  });
  await page.goto("/revo-lab/industry-1");
  await page.getByRole("button", { name: "Jelajahi Ketel uap", exact: true }).click();
  await expect(page.getByRole("button", { name: "Aktifkan suara", exact: true })).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => (window as Window & { __revoAudioContexts?: number }).__revoAudioContexts)).toBe(0);

  await page.getByRole("button", { name: "Aktifkan suara", exact: true }).click();
  await expect(page.getByRole("button", { name: "Matikan suara", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => (window as Window & { __revoAudioContexts?: number }).__revoAudioContexts)).toBe(1);
  await page.getByRole("button", { name: "Matikan suara", exact: true }).click();
  await expect(page.getByRole("button", { name: "Aktifkan suara", exact: true })).toHaveAttribute("aria-pressed", "false");

  await page.locator(".revo-hud-history summary").click();
  await page.getByRole("button", { name: "Baca cerita di baliknya", exact: true }).click();
  const story = page.getByRole("dialog", { name: "Cerita tenaga uap", exact: true });
  await expect(story.locator(".revo-transcript")).toBeVisible();
  await expect(page.locator(".revo-transcript")).toContainText("akhir abad kedelapan belas");
  await page.getByRole("button", { name: "Putar / ulangi", exact: true }).click();
  await expect(page.locator(".revo-narration-status")).toContainText("Aktifkan suara");
  await story.getByRole("button", { name: "Aktifkan suara", exact: true }).click();
  await page.getByRole("button", { name: "Putar / ulangi", exact: true }).click();
  const pauseNarration = page.getByRole("button", { name: "Jeda narasi", exact: true });
  if (await pauseNarration.isVisible().catch(() => false)) {
    await pauseNarration.click();
    await expect(page.getByRole("button", { name: "Lanjutkan narasi", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Lanjutkan narasi", exact: true }).click();
    await expect(page.locator(".revo-narration-status")).toContainText("Narasi dilanjutkan.");
    await page.getByRole("button", { name: "Hentikan", exact: true }).click();
  } else {
    await expect(page.locator(".revo-narration-status")).toContainText(/suara bahasa Indonesia belum tersedia|tidak dapat diputar|tidak didukung/i);
  }
  await expect(page.locator(".revo-transcript")).toBeVisible();
  await expect(story.getByRole("button", { name: "Matikan suara", exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __revoAudioContexts?: number }).__revoAudioContexts)).toBe(1);
  await page.getByRole("button", { name: "Tutup dialog", exact: true }).click();
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? "null")?.preferences?.soundEnabled, storageKey)).toBe(true);
  await page.reload();
  await expect(page.getByRole("button", { name: "Aktifkan suara tersimpan", exact: true })).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => (window as Window & { __revoAudioContexts?: number }).__revoAudioContexts)).toBe(0);
});

test("engine sound follows simulation pause and stops on menu navigation", async ({ page }) => {
  await page.addInitScript(value => {
    localStorage.setItem("revo:industry-1:progress", JSON.stringify(value));
    const observed = window as Window & { __revoGainTargets?: number[] };
    observed.__revoGainTargets = [];
    const original = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function (target, startTime, timeConstant) {
      observed.__revoGainTargets?.push(target);
      return original.call(this, target, startTime, timeConstant);
    };
  }, progress({ stage: 2, soundEnabled: false }));
  await page.goto("/revo-lab/industry-1");
  await page.getByRole("button", { name: "Aktifkan suara", exact: true }).click();
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect.poll(async () => Number(await page.getByRole("meter", { name: "Kecepatan", exact: true }).getAttribute("aria-valuenow"))).toBeGreaterThan(5);
  expect(await page.evaluate(() => (window as Window & { __revoGainTargets?: number[] }).__revoGainTargets?.some(target => target > 0))).toBe(true);
  await page.getByRole("button", { name: "Jeda simulasi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lanjutkan simulasi", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as Window & { __revoGainTargets?: number[] }).__revoGainTargets?.slice(-4))).toEqual([0, 0, 0, 0]);
  await page.getByRole("button", { name: "Lanjutkan simulasi", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { __revoGainTargets?: number[] }).__revoGainTargets?.slice(-4)?.some(target => target > 0))).toBe(true);
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(page.locator(".revo-experience")).toHaveAttribute("data-revo-screen", "main-menu");
  await expect.poll(() => page.evaluate(() => (window as Window & { __revoGainTargets?: number[] }).__revoGainTargets?.slice(-4))).toEqual([0, 0, 0, 0]);
});

test("captures REVO-007 screens and a short interactive demo recording", async ({ browser }) => {
  test.setTimeout(120_000);
  await mkdir(screenshots, { recursive: true });
  await mkdir(demoVideos, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    recordVideo: { dir: demoVideos, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  const video = page.video();
  const outputVideo = path.join(demoVideos, "revo-007-interactive-demo.webm");

  try {
    await page.goto(`${baseURL}/revo-lab`);
    await expect(page.getByRole("heading", { name: "REVO — Jelajah Revolusi Industri" })).toBeFocused();
    await page.waitForLoadState("networkidle");
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, image => image.decode().catch(() => undefined)));
    });
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(screenshots, "main-menu-desktop.png"), animations: "disabled" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(screenshots, "main-menu-mobile.png") });
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key: storageKey, data: progress({ stage: 1, placed: ["boiler", "pipe", "flywheel"], checks: ["steam"], soundEnabled: true }) });
    await page.reload();
    await expect(page.getByRole("link", { name: "Lanjutkan", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Lanjutkan", exact: true }).click();
    await expect(page.getByText("3/5 terpasang", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Aktifkan suara tersimpan", exact: true }).click();
    await page.getByRole("button", { name: "Pilih Mesin tekstil", exact: true }).click();
    await page.getByLabel("Sambungan tujuan", { exact: true }).selectOption("piston");
    await page.getByRole("button", { name: "Pasang komponen", exact: true }).click();
    await expect(page.locator(".revo-live-feedback")).toContainText("Belum cocok");
    await page.screenshot({ path: path.join(screenshots, "assembly-feedback-wrong-target.png") });
    await page.getByLabel("Sambungan tujuan", { exact: true }).selectOption("textile");
    await page.getByRole("button", { name: "Pasang komponen", exact: true }).click();
    await expect(page.getByText("4/5 terpasang", { exact: true })).toBeVisible();
    await placeAssemblyPart(page, "piston", "Mekanisme piston");
    await expect(page.getByText("5/5 terpasang", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Batang penghubung dan engkol mengubah gerak bolak-balik; roda gila membantu menjaga putaran.", exact: true }).click();
    await page.getByRole("button", { name: "Mesin dapat digerakkan tanpa bergantung sepenuhnya pada tenaga aliran sungai.", exact: true }).click();
    await expect(page.getByRole("heading", { name: "PERAKITAN SELESAI", exact: true })).toBeVisible();
    await page.waitForTimeout(340);
    await page.screenshot({ path: path.join(screenshots, "assembly-feedback-correct-snap.png") });
    await page.getByRole("button", { name: "UJI MESIN", exact: true }).click();
    await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
    await expect.poll(async () => Number(await page.getByTestId("production").textContent())).toBeGreaterThan(0);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(screenshots, "gameplay-hud-desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoDocumentScroll(page);
    await page.screenshot({ path: path.join(screenshots, "gameplay-hud-mobile.png") });
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
      key: storageKey,
      data: progress({ experimentComplete: true, answers: [1, 0, 2], soundEnabled: true }),
    });
    await page.reload();
    await expect(page.getByRole("heading", { name: "LEVEL COMPLETED", exact: true })).toBeVisible();
    await expect(page.getByText("3/3", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "LEVEL COMPLETED", exact: true })).toBeFocused();
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(screenshots, "level-completed-desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoDocumentScroll(page);
    await page.screenshot({ path: path.join(screenshots, "level-completed-mobile.png") });
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    if (video) await video.saveAs(outputVideo);
  }
});

test("screen transitions move keyboard focus and reduced motion removes entrance animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/revo-lab");
  const menuTitle = page.getByRole("heading", { name: "REVO — Jelajah Revolusi Industri" });
  await expect(menuTitle).toBeFocused();
  expect(await page.locator(".revo-menu-left").evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  await page.getByRole("link", { name: "Mulai Jelajah", exact: true }).click();
  await expect(page.getByRole("heading", { name: "JELAJAHI EMPAT REVOLUSI INDUSTRI" })).toBeFocused();
  expect(await page.locator(".revo-era-intro").evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  await page.getByRole("link", { name: "Jelajahi Era", exact: true }).click();
  await expect(page.getByRole("heading", { name: "THE AGE OF STEAM", exact: true })).toBeFocused();
  await page.getByRole("link", { name: "Mulai Simulasi", exact: true }).click();
  await page.waitForURL(/\/revo-lab\/industry-1$/);
  await expect(page.locator(".revo-hud-title h1")).toBeFocused();
  expect(await page.locator(".revo-hud-workspace").evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  await expectNoDocumentScroll(page);
});
