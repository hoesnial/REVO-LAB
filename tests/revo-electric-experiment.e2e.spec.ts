import { expect, test as base, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { PARTS } from "../src/lib/revo/industry-2/content";
import { CONCEPTS, CONNECTIONS } from "../src/lib/revo/industry-2/assembly";
import { ELECTRIC_PROGRESS_KEY as electricKey } from "../src/lib/revo/industry-2/progress";
import { ELECTRIC_SCENARIOS } from "../src/lib/revo/industry-2/experiment";
import { initialObservations } from "../src/lib/revo/experiment";

const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", event => { if (event.type() === "error") errors.push(event.text()); });
    await use(errors);
    expect(errors).toEqual([]);
  }, { auto: true }],
});

const menu = "/revo-lab";
const era = menu + "/industry-2";
const route = era + "/experiment";
const steamKey = "revo:industry-1:progress";
const conceptAnswers = Object.fromEntries(CONCEPTS.map(concept => [concept.id, concept.correct]));
const ready = { version: 2, stage: "assembly", explored: PARTS.map(({ id }) => id), selected: "motor",
  connections: CONNECTIONS.map(({ id }) => id), conceptAnswers };
const steam = {
  version: 2, selectedEra: "industry-1", checkpoint: 0, explored: ["boiler"], assembly: { placed: [], checks: [] },
  observations: initialObservations(), completedStages: [], experimentComplete: false, levelComplete: false,
  reflection: { answers: [], draftAnswer: null, checked: false, resultAnswers: null, retaking: false }, preferences: { soundEnabled: false },
};

const start = (page: Page) => page.getByRole("button", { name: "Mulai", exact: true });
const stop = (page: Page) => page.getByRole("button", { name: "Henti", exact: true });
const note = (page: Page) => page.getByRole("button", { name: "Catat observasi" });
const control = (page: Page, name: string) => page.getByRole("switch", { name, exact: true });
const canvas = (page: Page) => page.locator(".electric-canvas canvas");
const meter = (page: Page) => page.getByRole("progressbar", { name: "Progres observasi" });
const key = (page: Page, name: string) => page.evaluate(k => localStorage.getItem(k), name);
const save = async (page: Page) => JSON.parse((await key(page, electricKey))!);

async function seed(page: Page, value: object = ready) {
  await page.goto(menu);
  await page.evaluate(items => {
    for (const [name, contents] of Object.entries(items)) localStorage.setItem(name, JSON.stringify(contents));
  }, { [electricKey]: value, [steamKey]: steam });
}

async function status(page: Page, states: string[]) {
  const list = page.locator("dl[aria-label='Status mesin']");
  await expect(list.locator("dt")).toHaveText(["Listrik", "Motor", "Transmisi", "Konveyor", "Produksi"]);
  await expect(list.locator("dd")).toHaveText(states);
}

const standby = ["Tersedia", "Berhenti", "Tersambung", "Berhenti", "Siaga"];
const normal = ["Tersedia", "Berputar", "Tersambung", "Bergerak", "Mengalir"];
const noPower = ["Terputus", "Berhenti", "Tersambung", "Berhenti", "Terputus"];
const noDrive = ["Tersedia", "Berputar", "Terputus", "Berhenti", "Terputus"];
const blocked = ["Tersedia", "Tertahan", "Tersambung", "Terhalang", "Terputus"];

async function directReady(page: Page) {
  await seed(page);
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "Uji penggerak konveyor" })).toBeVisible();
  await status(page, standby);
}

test("direct route rejects missing checks and forged progress; V2 assembly opens idle without invented evidence", async ({ page, request }) => {
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "Eksperimen terkunci" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Buka Briefing" })).toBeVisible();
  await expect(canvas(page)).toHaveCount(0);
  await seed(page, { ...ready, version: 3, stage: "experiment", conceptAnswers: { C1: "rotate" },
    assemblyComplete: true, experimentComplete: true, observations: { normal: true, "no-power": true, "no-drive": true, blocked: true } });
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "Eksperimen terkunci" })).toBeVisible();
  await page.getByRole("link", { name: "Buka Perakitan" }).click();
  await expect(page.getByText("5/5 sambungan · 1/3 cek konsep")).toBeVisible();
  await expect(page.getByRole("button", { name: "Eksperimen terkunci" })).toBeDisabled();
  await seed(page, { ...ready, experimentComplete: true, observations: { normal: true } });
  await page.goto(era + "/assembly");
  await expect(page.getByRole("heading", { name: "Perakitan selesai" })).toBeVisible();
  await page.getByRole("link", { name: "Uji Penggerak" }).click();
  await expect(page).toHaveURL(route);
  await status(page, standby);
  await expect(meter(page)).toHaveJSProperty("value", 0);
  expect(await save(page)).toMatchObject({ version: 3, stage: "experiment", conceptAnswers, observations: {}, experimentComplete: false });
  for (const stage of ["reflection", "completed"]) expect((await request.get(era + "/" + stage)).status()).toBe(404);
});

test("records four exact causal observations, restores them stopped, and resets without touching other learning", async ({ page }) => {
  await directReady(page);
  const originalSteam = await key(page, steamKey);
  await expect(note(page)).toBeDisabled();
  await start(page).click();
  await status(page, normal);
  await expect(meter(page)).toHaveJSProperty("value", 0);
  await note(page).click();
  await expect(page.getByRole("button", { name: "Sudah dicatat" })).toBeDisabled();
  await control(page, "Listrik").click();
  await status(page, noPower);
  await control(page, "Transmisi").click();
  await expect(page.getByRole("heading", { name: "Lebih dari satu gangguan" })).toBeVisible();
  await expect(note(page)).toBeDisabled();
  await expect(meter(page)).toHaveJSProperty("value", 1);
  await control(page, "Transmisi").click();
  await note(page).click();
  await control(page, "Listrik").click();
  await control(page, "Transmisi").click();
  await status(page, noDrive);
  await note(page).click();
  await expect(meter(page)).toHaveJSProperty("value", 3);
  await expect(page.getByText(/Eksperimen selesai/)).toHaveCount(0);
  await control(page, "Transmisi").click();
  await control(page, "Penghalang").click();
  await status(page, blocked);
  await note(page).click();
  await expect(page.getByText("Eksperimen selesai · 4/4 observasi")).toBeVisible();
  await expect(page.getByRole("button", { name: "Refleksi belum tersedia" })).toBeDisabled();
  await expect(page.getByRole("link", { name: /Refleksi/ })).toHaveCount(0);
  const complete = await save(page);
  expect(complete).toMatchObject({
    stage: "experiment", experimentComplete: true, assemblyComplete: true,
    observations: {
      normal: { inputs: { running: true, power: true }, outcome: { motor: "turning", conveyor: "moving", production: "flowing" } },
      "no-power": { inputs: { running: true, power: false }, outcome: { motor: "off", conveyor: "stopped", production: "interrupted" } },
      "no-drive": { inputs: { running: true, transmission: false }, outcome: { motor: "turning", conveyor: "stopped", production: "interrupted" } },
      blocked: { inputs: { running: true, obstruction: true }, outcome: { motor: "stalled", conveyor: "blocked", production: "interrupted" } },
    },
  });
  expect(complete).not.toHaveProperty("levelComplete");
  await page.reload();
  await status(page, standby);
  await expect(meter(page)).toHaveJSProperty("value", 4);
  await page.getByRole("link", { name: "Lanjutkan Perakitan" }).click();
  await expect(page.getByRole("heading", { name: "Perakitan selesai" })).toBeVisible();
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await page.getByRole("link", { name: /Industry 2.0 Tinjau Eksperimen/ }).click();
  await expect(meter(page)).toHaveJSProperty("value", 4);
  const reset = page.getByRole("button", { name: "Reset Eksperimen" });
  await reset.click();
  const dialog = page.getByRole("dialog", { name: "Reset Eksperimen" });
  await dialog.getByRole("button", { name: "Batal" }).click();
  await expect(reset).toBeFocused();
  expect(await save(page)).toEqual(complete);
  await reset.click();
  await dialog.getByRole("button", { name: "Hapus catatan eksperimen" }).click();
  await expect(meter(page)).toHaveJSProperty("value", 0);
  await status(page, standby);
  expect(await save(page)).toEqual({ ...complete, experimentComplete: false, observations: {} });
  expect(await key(page, steamKey)).toBe(originalSteam);
  await page.getByRole("button", { name: "Reset progres 2.0" }).click();
  await page.getByRole("button", { name: "Hapus progres 2.0" }).click();
  await expect(page).toHaveURL(era + "/briefing");
  expect(await key(page, electricKey)).toBeNull();
  expect(await key(page, steamKey)).toBe(originalSteam);
});

test("real 3D motion respects Start, interruption, reduced motion, dialog, hidden page and route changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await directReady(page);
  await expect(canvas(page)).toBeVisible();
  await start(page).press("Enter");
  await status(page, normal);
  await expect(page.locator(".electric-canvas")).toHaveAttribute("data-motion", "active");
  const pixel = () => canvas(page).screenshot();
  const moving = await pixel();
  await expect.poll(async () => (await pixel()).equals(moving)).toBe(false);
  await control(page, "Listrik").press("Space");
  await status(page, noPower);
  await expect(page.locator(".electric-canvas")).toHaveAttribute("data-motion", "still");
  const stopped = await pixel();
  expect((await pixel()).equals(stopped)).toBe(true);
  await control(page, "Listrik").press("Space");
  await status(page, normal);
  // Wait for the restored motion frame so "still" cannot match the preceding outage.
  await expect(page.locator(".electric-canvas")).toHaveAttribute("data-motion", "active");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".electric-canvas")).toHaveAttribute("data-motion", "still");
  const reduced = await pixel();
  expect((await pixel()).equals(reduced)).toBe(true);
  await page.getByRole("button", { name: "Tujuan Pembelajaran" }).press("Enter");
  await expect(page.getByRole("dialog", { name: "Tujuan Pembelajaran" })).toBeVisible();
  await page.keyboard.press("Escape");
  await status(page, standby);
  await start(page).press("Enter");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await status(page, standby);
  await page.evaluate(() => Reflect.deleteProperty(document, "visibilityState"));
  await start(page).press("Enter");
  await expect(stop(page)).toBeVisible();
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(canvas(page)).toHaveCount(0);
  await page.getByRole("link", { name: /Industry 2.0 Lanjutkan Eksperimen/ }).click();
  await status(page, standby);
});

test.describe("experiment touch fallback", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 320, height: 568 } });
  test("records all observations on the SVG and status controls without WebGL", async ({ page }) => {
    await page.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
        if (kind.startsWith("webgl")) return null;
        return Reflect.apply(get, this, [kind, ...args]);
      } as typeof get;
    });
    await directReady(page);
    await expect(page.getByRole("img", { name: /Skema percobaan penggerak konveyor/ })).toBeVisible();
    await expect(canvas(page)).toHaveCount(0);
    await start(page).tap();
    await status(page, normal);
    await note(page).tap();
    await control(page, "Listrik").tap();
    await status(page, noPower);
    await note(page).tap();
    await control(page, "Listrik").tap();
    await control(page, "Transmisi").tap();
    await status(page, noDrive);
    await note(page).tap();
    await control(page, "Transmisi").tap();
    await control(page, "Penghalang").tap();
    await status(page, blocked);
    await note(page).tap();
    await expect(page.getByText("Eksperimen selesai · 4/4 observasi")).toBeVisible();
    await expect(page.getByRole("button", { name: "Refleksi belum tersedia" })).toBeDisabled();
    await expectFullscreen(page);
    await shot(page, "320-fallback");
  });
});

const screenshots = "test-results/revo/009b3-visual";
async function expectFullscreen(page: Page) {
  const size = await page.evaluate(() => ({
    viewport: [innerWidth, innerHeight], doc: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], scroll: scrollY,
  }));
  expect(size.doc[0]).toBeLessThanOrEqual(size.viewport[0]);
  expect(size.doc[1]).toBeLessThanOrEqual(size.viewport[1]);
  expect(size.scroll).toBe(0);
}
async function shot(page: Page, name: string) {
  await mkdir(screenshots, { recursive: true });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path: `${screenshots}/${name}.png`, animations: "disabled" });
}

test("captures all four conditions and completion at six full-screen viewports", async ({ page }) => {
  test.setTimeout(240_000);
  await directReady(page);
  await expect(canvas(page)).toBeVisible();
  await start(page).click();
  const sizes = [[1920, 1080], [1440, 900], [1366, 768], [1280, 720], [390, 844], [320, 568]];
  async function compare(name: string, states: string[]) {
    await status(page, states);
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      await expectFullscreen(page);
      for (const target of [note(page), stop(page), control(page, "Listrik"), control(page, "Transmisi"), control(page, "Penghalang"),
        page.getByRole("button", { name: "Reset Eksperimen" })]) {
        await expect(target).toBeInViewport({ ratio: 1 });
        const box = (await target.boundingBox())!;
        expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
      }
      await expect(page.getByRole("button", { name: "Refleksi belum tersedia" })).toBeInViewport({ ratio: 1 });
      const clipped = await page.locator(".electric-run-status dd").evaluateAll(nodes => nodes.filter(el => el.scrollWidth > el.clientWidth).map(el => el.textContent));
      expect(clipped, `${width} × ${height} — ${name}`).toEqual([]);
      const cameraOverlap = await page.locator(".electric-run-status dd").evaluateAll(labels => {
        const camera = document.querySelector(".electric-camera-controls")?.getBoundingClientRect();
        if (!camera) return [];
        return labels.filter(label => {
          const status = label.getBoundingClientRect();
          return status.x < camera.right && status.right > camera.x && status.y < camera.bottom && status.bottom > camera.y;
        }).map(label => label.textContent);
      });
      expect(cameraOverlap, `${width} × ${height} — status obscured by camera controls`).toEqual([]);
      await shot(page, `${width}-${name}`);
    }
    await note(page).click();
  }
  await compare(ELECTRIC_SCENARIOS[0].id, normal);
  await control(page, "Listrik").click();
  await compare(ELECTRIC_SCENARIOS[1].id, noPower);
  await control(page, "Listrik").click();
  await control(page, "Transmisi").click();
  await compare(ELECTRIC_SCENARIOS[2].id, noDrive);
  await control(page, "Transmisi").click();
  await control(page, "Penghalang").click();
  await compare(ELECTRIC_SCENARIOS[3].id, blocked);
  await expect(page.getByText("Eksperimen selesai · 4/4 observasi")).toBeVisible();
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await expectFullscreen(page);
    await expect(page.getByRole("button", { name: "Refleksi belum tersedia" })).toBeInViewport({ ratio: 1 });
    await page.getByRole("heading", { name: "Catatan pengamatan" }).evaluate(el => el.scrollIntoView({ block: "start" }));
    await shot(page, `${width}-complete`);
  }
});
