import { openEraSelection } from "./helpers/revo-menu";
import { expect, test as base, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { OrthographicCamera, Vector3 } from "three";
import { PARTS } from "../src/lib/revo/industry-2/content";
import { CONCEPTS, CONNECTIONS, partName, targetName } from "../src/lib/revo/industry-2/assembly";
import { ELECTRIC_PROGRESS_KEY as electricKey } from "../src/lib/revo/industry-2/progress";

const steamKey = "revo:industry-1:progress";
const briefing = "/revo-lab/industry-2/briefing";
const explore = "/revo-lab/industry-2";
const assembly = "/revo-lab/industry-2/assembly";
const screenshots = "test-results/revo/009b1";
const assemblyShots = "test-results/revo/009b2";
const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await use(errors);
    expect(errors).toEqual([]);
  }, { auto: true }],
});

const partButton = (page: Page, name: string) => page.getByRole("button", { name: new RegExp("^" + name) });
const saved = (page: Page, key: string) => page.evaluate(k => localStorage.getItem(k), key);
async function openExplore(page: Page) {
  await page.goto(briefing);
  await page.getByRole("link", { name: "Mulai Eksplorasi" }).click();
  await expect(page).toHaveURL(explore);
  await expect(page.getByRole("heading", { name: "Kenali Pabrik Listrik" })).toBeVisible();
}

async function expectFullscreen(page: Page) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.width);
  expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.height);
}

async function pickSupplyInScene(page: Page, touch = false, inAssembly = false) {
  const canvas = page.locator(".electric-canvas canvas");
  await expect(canvas).toBeVisible();
  await expect(async () => {
    const box = (await canvas.boundingBox())!;
    const surface = (await page.locator(".electric-canvas").boundingBox())!;
    // R3F's canvas initially has the browser's default dimensions before resize.
    expect(Math.abs(surface.width - box.width) + Math.abs(surface.height - box.height)).toBeLessThan(2);
    const camera = new OrthographicCamera(-box.width / 2, box.width / 2, box.height / 2, -box.height / 2, .1, 70);
    if (inAssembly) {
      camera.position.set(7.2, 7.52, 14);
      camera.lookAt(0, 1.02, 0);
      camera.zoom = Math.min(box.width / 14, box.height / 6.6);
    } else {
      camera.position.set(11, 11, 14);
      camera.lookAt(0, 2, 0);
      camera.updateMatrixWorld();
      const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const up = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      const span = (axis: Vector3) => Math.abs(axis.x) * 6 + Math.abs(axis.y) * 2.8 + Math.abs(axis.z) * 3.65;
      camera.zoom = Math.min(box.width / (2 * span(right)), box.height / (2 * span(up))) * .92 * .94 * (box.width <= 360 ? 1.25 : 1);
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    // Click geometry on the WebGL canvas, not the parallel DOM control.
    const hit = new Vector3(-4.15, inAssembly ? .96 : .82, inAssembly ? -1.08 : -1.55).project(camera);
    const x = box.x + (hit.x + 1) * box.width / 2;
    const y = box.y + (1 - hit.y) * box.height / 2;
    if (touch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    if (inAssembly) await expect(page.getByRole("combobox", { name: "Sumber" })).toHaveValue("supply", { timeout: 700 });
    else await expect(page.locator("#electric-detail h3")).toHaveText("Pasokan listrik", { timeout: 700 });
  }).toPass({ timeout: 10_000 });
}

test("opens briefing from the menu; 3D pick and keyboard unlock Explore only after seven distinct parts", async ({ page, request }) => {
  await page.goto(explore);
  await expect(page.getByRole("heading", { name: "Mulai dari briefing" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.goto(assembly);
  await expect(page.getByRole("heading", { name: "Perakitan terkunci" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.goto("/revo-lab");
  await openEraSelection(page);
  await page.getByRole("link", { name: "Jelajahi Industri 2.0" }).click();
  await expect(page).toHaveURL(briefing);
  await expect(page.getByRole("heading", { name: "Era Listrik & Produksi Massal" })).toBeVisible();
  await page.getByRole("button", { name: "Lihat tujuan lengkap" }).click();
  await expect(page.getByRole("dialog").locator(".revo-learning-objectives li")).toHaveCount(6);
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Mulai Eksplorasi" }).click();
  await expect(page.getByText("0/7 dibuka")).toBeVisible();
  await pickSupplyInScene(page);
  await expect(page.getByText("1/7 dibuka")).toBeVisible();
  await partButton(page, "Pasokan listrik").click();
  await expect(page.getByText("1/7 dibuka")).toBeVisible();
  for (const [index, part] of PARTS.slice(1).entries()) {
    await partButton(page, part.name).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#electric-detail h3")).toHaveText(part.name);
    if (index < 5) {
      await expect(page.getByText(`${index + 2}/7 dibuka`, { exact: true })).toBeVisible();
      await expect(page.getByRole("region", { name: /Eksplorasi selesai/ })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Mulai Perakitan" })).toHaveCount(0);
    } else {
      await expect(page.locator(".revo-explore-count")).toHaveCount(0);
      await expect(page.getByRole("region", { name: "Eksplorasi selesai · 7/7 komponen" })).toBeVisible();
    }
  }
  await expect(page.locator(".revo-explore-count")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Eksplorasi selesai · 7/7 komponen" })).toBeVisible();
  await page.getByRole("link", { name: "Lanjut ke Perakitan", exact: true }).click();
  await expect(page).toHaveURL(assembly);
  await expect(page.getByRole("heading", { name: "Rakit penggerak konveyor" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await pickSupplyInScene(page, false, true);
  await expect(page.getByRole("link", { name: /eksperimen|refleksi/i })).toHaveCount(0);
  await page.goto(`${explore}/experiment`);
  await expect(page.getByRole("heading", { name: "Eksperimen terkunci" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  for (const stage of ["reflection", "completed"]) expect((await request.get(`${explore}/${stage}`)).status()).toBe(404);
});

test("reload, inter-era navigation, one canvas and reset preserve both independent saves", async ({ page }) => {
  await openExplore(page);
  await partButton(page, "Motor listrik").click();
  await partButton(page, "Konveyor").click();
  const electric = await saved(page, electricKey);
  await page.reload();
  await expect(page.locator("#electric-detail h3")).toHaveText("Konveyor");
  await expect(page.getByText("2/7 dibuka")).toBeVisible();
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(page).toHaveURL(/\/revo-lab$/);
  await openEraSelection(page);
  await page.getByRole("link", { name: "Jelajahi Industri 1.0" }).click();
  await expect(page).toHaveURL(/\/revo-lab\/industry-1\/briefing$/);
  await page.getByRole("link", { name: "Mulai Eksplorasi" }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByRole("button", { name: "Jelajahi Ketel uap", exact: true }).click();
  await expect(page.getByText("1/5 komponen dijelajahi", { exact: true })).toBeVisible();
  await expect.poll(() => saved(page, steamKey)).not.toBeNull();
  const steam = await saved(page, steamKey);
  expect(await saved(page, electricKey)).toBe(electric);
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await openEraSelection(page);
  await page.getByRole("link", { name: "Jelajahi Industri 2.0" }).click();
  await expect(page).toHaveURL(briefing);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "Lanjutkan Eksplorasi" }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(".electric-canvas canvas")).toBeVisible();
  await expect(page.getByText("2/7 dibuka")).toBeVisible();
  for (const part of PARTS) await partButton(page, part.name).click();
  await page.getByRole("link", { name: "Mulai Perakitan" }).click();
  await installLink(page, "supply", "panel");
  await expect(page.getByText("1/5 sambungan · 0/3 cek konsep")).toBeVisible();
  await page.getByRole("link", { name: "Eksplorasi", exact: true }).click();
  const electricWithAssembly = await saved(page, electricKey);
  await page.getByRole("button", { name: "Reset progres 2.0" }).click();
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  expect(await saved(page, electricKey)).toBe(electricWithAssembly);
  await page.getByRole("button", { name: "Reset progres 2.0" }).click();
  await page.getByRole("button", { name: "Hapus progres 2.0" }).click();
  await expect(page).toHaveURL(briefing);
  expect(await saved(page, electricKey)).toBeNull();
  expect(await saved(page, steamKey)).toBe(steam);
  await page.getByRole("link", { name: "Mulai Eksplorasi" }).click();
  await expect(page.getByText("0/7 dibuka")).toBeVisible();
  await page.getByRole("link", { name: "REVO — Menu utama" }).click();
  await page.getByRole("link", { name: "Lanjutkan", exact: true }).click();
  await expect(page.getByText("1/5 komponen dijelajahi", { exact: true })).toBeVisible();
});

for (const [label, raw] of [["JSON rusak", "{"], ["versi tidak didukung", '{"version":4,"stage":"explore","explored":[]}'], ["tahap palsu", '{"version":1,"stage":"assembly","explored":["motor"]}']]) {
  test(`rejects ${label} without granting access`, async ({ page }) => {
    await page.goto("/revo-lab");
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: electricKey, value: raw });
    await page.goto(explore);
    await expect(page.getByText(/Simpanan 2.0 tidak dapat dipulihkan/)).toBeVisible();
    expect(await saved(page, electricKey)).toBe(raw);
    await page.getByRole("link", { name: "Buka Briefing", exact: true }).click();
    await page.getByRole("link", { name: "Mulai Eksplorasi" }).click();
    await expect(page.getByText("0/7 dibuka")).toBeVisible();
  });
}

test("repairs fabricated readiness, duplicate and foreign part IDs", async ({ page }) => {
  await page.goto("/revo-lab");
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({
    version: 1, stage: "explore", explored: ["motor", "motor", "boiler", 7], selected: "panel", exploreComplete: true,
  })), electricKey);
  await page.goto(explore);
  await expect(page.getByText("1/7 dibuka")).toBeVisible();
  await expect.poll(async () => JSON.parse((await saved(page, electricKey))!).selected).toBeNull();
  await expect.poll(async () => JSON.parse((await saved(page, electricKey))!).explored).toEqual(["motor"]);
  await expect(page.locator("#electric-detail")).toHaveCount(0);
  await expect(page.getByText("Pilih titik pada model untuk mempelajari komponen dan fungsinya.", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: /Eksplorasi selesai/ })).toHaveCount(0);
  await pickSupplyInScene(page);
  await expect(page.locator("#electric-detail h3")).toHaveText("Pasokan listrik");
});

test("DOM fallback with WebGL blocked still teaches and records all seven parts", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind.startsWith("webgl")) return null;
      return Reflect.apply(original, this, [kind, ...args]);
    } as typeof original;
  });
  await openExplore(page);
  await expect(page.getByText(/Tampilan 3D tidak tersedia/)).toBeVisible();
  await expect(page.locator(".electric-canvas canvas")).toHaveCount(0);
  for (const part of PARTS) await partButton(page, part.name).click();
  await expect(page.getByRole("region", { name: "Eksplorasi selesai · 7/7 komponen" })).toBeVisible();
});

test.describe("touch controls", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("tap the 3D model and DOM controls and toggle all three path views", async ({ page }) => {
    await openExplore(page);
    await expect(page.getByText("Geser daftar untuk melihat semua komponen")).toBeVisible();
    await pickSupplyInScene(page, true);
    await page.locator(".electric-parts").getByRole("button", { name: "Panel distribusi" }).tap();
    await expect(page.locator("#electric-detail h3")).toHaveText("Panel distribusi");
    await expect(page.getByText("2/7 dibuka")).toBeVisible();
    for (const [name, label] of [["Listrik", "Pasokan → panel → motor"], ["Mekanis", "Motor → poros → sabuk → rol konveyor"], ["Material", "Benda kerja → pemasangan → pemeriksaan"]]) {
      const toggle = page.getByRole("button", { name, exact: true });
      await toggle.tap();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expectFullscreen(page);
  });
});

for (const [width, height] of [[1440, 900], [1366, 768], [1280, 720], [390, 844], [320, 568]]) {
  test(`Industry 2.0 briefing and exploration fit ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await mkdir(screenshots, { recursive: true });
    await page.goto(briefing);
    const start = page.getByRole("link", { name: "Mulai Eksplorasi" });
    await expect(start).toBeInViewport({ ratio: 1 });
    await expectFullscreen(page);
    await page.screenshot({ path: `${screenshots}/${width}-briefing.png`, animations: "disabled" });
    await page.getByRole("button", { name: "Lihat tujuan lengkap" }).click();
    const lastObjective = page.getByRole("dialog").locator(".revo-learning-objectives li").last();
    // Center within the reading panel to avoid subpixel clipping at its edge.
    await lastObjective.evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(lastObjective).toBeInViewport({ ratio: 1 });
    await page.keyboard.press("Escape");
    await start.click();
    await expect(page.locator(".electric-canvas canvas")).toBeInViewport({ ratio: 1 });
    await partButton(page, "Motor listrik").click();
    await expect(page.locator("#electric-detail h3")).toHaveText("Motor listrik");
    await expect(page.getByRole("button", { name: "Atur ulang kamera" })).toBeInViewport({ ratio: 1 });
    await expectFullscreen(page);
    await page.screenshot({ path: `${screenshots}/${width}-explore.png`, animations: "disabled" });
  });
}

async function seedElectric(page: Page, snapshot: object) {
  await page.goto("/revo-lab");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: electricKey, value: snapshot });
}

const allPartIds = PARTS.map(part => part.id);

async function openAssembly(page: Page) {
  await seedElectric(page, { version: 2, stage: "explore", explored: allPartIds, selected: "stations" });
  await page.goto(assembly);
  await expect(page.getByRole("heading", { name: "Rakit penggerak konveyor" })).toBeVisible();
}

const source = (page: Page) => page.getByRole("combobox", { name: "Sumber" });
const destination = (page: Page) => page.getByRole("combobox", { name: "Tujuan" });
const connect = (page: Page) => page.getByRole("button", { name: "Hubungkan", exact: true });
const checking = (page: Page) => page.getByRole("button", { name: "Periksa jawaban" });

async function installLink(page: Page, from: typeof allPartIds[number], to: typeof allPartIds[number]) {
  await source(page).selectOption(from);
  await destination(page).selectOption(to);
  await connect(page).click();
}

async function viewportShot(page: Page, name: string) {
  await mkdir(assemblyShots, { recursive: true });
  await page.screenshot({ path: `${assemblyShots}/${name}.png`, animations: "disabled" });
}

test("rejects wrong and duplicate pairs; retains links and accepted checks after reload", async ({ page }) => {
  await openAssembly(page);
  await expect(connect(page)).toBeDisabled();
  await installLink(page, "supply", "conveyor");
  await expect(page.getByText("Sambungan belum tepat.")).toBeVisible();
  await expect(page.getByText("0/5 sambungan · 0/3 cek konsep")).toBeVisible();
  expect(JSON.parse((await saved(page, electricKey))!).connections).toEqual([]);

  await installLink(page, "supply", "panel");
  await expect(page.getByText(/Pasokan membawa energi listrik ke panel/)).toBeVisible();
  await connect(page).click();
  await expect(page.getByText("Sudah terpasang.")).toBeVisible();
  await expect(page.getByText("1/5 sambungan · 0/3 cek konsep")).toBeVisible();
  await page.reload();
  await expect(page.getByText("1/5 sambungan · 0/3 cek konsep")).toBeVisible();

  for (const link of CONNECTIONS.slice(1)) {
    await installLink(page, link.from, link.to);
    await expect(page.getByText(link.explanation, { exact: false })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Perakitan selesai" })).toHaveCount(0);
  await page.getByRole("button", { name: "Mulai Cek Konsep" }).click();
  await expect(page.getByRole("heading", { name: CONCEPTS[0].question })).toBeFocused();
  await page.getByRole("radio", { name: CONCEPTS[0].options[0].text }).check();
  await checking(page).click();
  await expect(page.getByText("Belum tepat. Coba lagi.")).toBeVisible();
  await expect(page.getByText(CONCEPTS[0].options[0].explanation, { exact: false })).toBeVisible();
  expect(JSON.parse((await saved(page, electricKey))!).conceptAnswers).toEqual({});
  await page.getByRole("radio", { name: CONCEPTS[0].options[1].text }).check();
  await checking(page).click();
  await expect(page.getByText("Jawaban benar.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("5/5 sambungan · 1/3 cek konsep")).toBeVisible();
  await page.getByRole("button", { name: "Lanjutkan Cek Konsep" }).click();
  await expect(page.getByRole("heading", { name: CONCEPTS[1].question })).toBeFocused();
  for (const concept of CONCEPTS.slice(1)) {
    const correct = concept.options.find(option => option.id === concept.correct)!;
    await page.getByRole("radio", { name: correct.text }).check();
    await checking(page).click();
    if (concept.id === "C2") await page.getByRole("button", { name: "Cek berikutnya" }).click();
  }
  await expect(page.getByRole("heading", { name: "Perakitan selesai" })).toBeVisible();
  await expect(page.getByText("5/5 sambungan · 3/3 cek konsep")).toBeVisible();
  await expect(page.getByRole("link", { name: "Eksperimen", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Uji Penggerak" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refleksi belum tersedia" })).toBeDisabled();
  await expect(page.locator(".electric-canvas canvas")).toBeVisible();
  await viewportShot(page, "desktop-selesai");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Perakitan selesai" })).toBeVisible();
  expect(JSON.parse((await saved(page, electricKey))!).conceptAnswers).toEqual({ C1: "rotate", C2: "no-drive", C3: "chain" });

  const otherEra = await saved(page, steamKey);
  const retry = page.getByRole("button", { name: "Ulangi Perakitan" });
  const retryDialog = page.getByRole("dialog", { name: "Ulangi Perakitan" });
  await retry.click();
  await retryDialog.getByRole("button", { name: "Batal" }).click();
  await expect(retry).toBeFocused();
  await expect(page.getByText("5/5 sambungan · 3/3 cek konsep")).toBeVisible();
  await retry.click();
  await retryDialog.getByRole("button", { name: "Hapus hasil perakitan" }).click();
  await expect(page.getByRole("heading", { name: "Susun sambungan" })).toBeFocused();
  await expect(page.getByText("0/5 sambungan · 0/3 cek konsep")).toBeVisible();
  expect(JSON.parse((await saved(page, electricKey))!)).toMatchObject({
    stage: "assembly", explored: expect.arrayContaining(allPartIds), exploreComplete: true,
    connections: [], conceptAnswers: {}, assemblyComplete: false,
  });
  expect(await saved(page, steamKey)).toBe(otherEra);
  await page.reload();
  await expect(page.getByText("0/5 sambungan · 0/3 cek konsep")).toBeVisible();
});

test("direct route denies forged V2 exploration; repairs malformed assembly evidence", async ({ page }) => {
  const connections = ["E1", "E1", "boiler", "M3", {}, 3];
  const forged = { version: 2, stage: "assembly", explored: allPartIds.slice(0, -1), connections,
    conceptAnswers: { C1: "rotate", C2: "no-drive", C3: "chain" }, exploreComplete: true, assemblyComplete: true };
  await seedElectric(page, forged);
  await page.goto(assembly);
  await expect(page.getByText("Buka semua 7 komponen sebelum merakit. Progres saat ini: 6/7.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Hubungkan" })).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  await seedElectric(page, { ...forged, explored: allPartIds });
  await page.goto(assembly);
  await expect(page.getByText("2/5 sambungan · 0/3 cek konsep")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Perakitan selesai" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mulai Cek Konsep" })).toHaveCount(0);
});

test("migrates V1 with seven explored IDs and creates no Assembly evidence", async ({ page }) => {
  await seedElectric(page, { version: 1, stage: "explore", explored: allPartIds, selected: "belt", exploreComplete: true });
  await page.goto(explore);
  await expect(page.locator(".revo-explore-count")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Eksplorasi selesai · 7/7 komponen" })).toBeVisible();
  await expect(page.locator("#electric-detail")).toHaveCount(0);
  await expect(partButton(page, "Sabuk transmisi")).toHaveAttribute("aria-pressed", "true");
  await partButton(page, "Sabuk transmisi").click();
  await expect(page.locator("#electric-detail h3")).toHaveText("Sabuk transmisi");
  expect(JSON.parse((await saved(page, electricKey))!)).toMatchObject({
    version: 3, stage: "explore", explored: allPartIds, selected: "belt", connections: [], conceptAnswers: {}, assemblyComplete: false,
  });
  await page.goto(assembly);
  await expect(page.getByText("0/5 sambungan · 0/3 cek konsep")).toBeVisible();
  await page.getByRole("link", { name: "Eksplorasi", exact: true }).click();
  await expect(page.getByRole("link", { name: "Lanjutkan Perakitan" })).toBeVisible();
});

test("keyboard completes Assembly without WebGL and shows the connection diagram with reduced motion", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind.startsWith("webgl")) return null;
      return Reflect.apply(original, this, [kind, ...args]);
    } as typeof original;
  });
  await openAssembly(page);
  await expect(page.getByText("3D tidak tersedia. Gunakan kontrol sambungan.")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  const pairs = page.locator(".electric-pair-choices summary");
  await pairs.press("Enter");
  await pairs.press("Tab");
  await expect(page.getByRole("button", { name: "Pasokan listrik", exact: true })).toBeFocused();
  for (const [index, link] of CONNECTIONS.entries()) {
    await page.getByRole("button", { name: partName(link.from), exact: true }).press("Enter");
    await page.getByRole("button", { name: `${partName(link.from)} → ${targetName(link.to)}`, exact: true }).press("Enter");
    await expect(source(page)).toHaveValue(link.from);
    await expect(destination(page)).toHaveValue(link.to);
    await connect(page).press("Enter");
    await expect(page.getByText(`${index + 1}/5 sambungan · 0/3 cek konsep`)).toBeVisible();
  }
  await expect(page.getByRole("img", { name: /5 dari 5 sambungan/ })).toBeVisible();
  await expect(page.locator("svg [data-connection]")).toHaveCount(5);
  await page.getByRole("button", { name: "Mulai Cek Konsep" }).press("Enter");
  for (const concept of CONCEPTS) {
    const correct = concept.options.find(option => option.id === concept.correct)!;
    await page.getByRole("radio", { name: correct.text }).press("Space");
    await checking(page).press("Enter");
    if (concept.id !== "C3") await page.getByRole("button", { name: "Cek berikutnya" }).press("Enter");
  }
  await expect(page.getByRole("heading", { name: "Perakitan selesai" })).toBeVisible();
  await viewportShot(page, "fallback-selesai");
});

test.describe("mobile assembly", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("touch finishes all five connections and checks using the structured list", async ({ page }) => {
    await openAssembly(page);
    await page.locator(".electric-pair-choices summary").tap();
    for (const link of CONNECTIONS) {
      await page.getByRole("button", { name: partName(link.from), exact: true }).tap();
      await page.getByRole("button", { name: `${partName(link.from)} → ${targetName(link.to)}`, exact: true }).tap();
      await connect(page).tap();
    }
    await expect(page.getByText("5/5 sambungan · 0/3 cek konsep")).toBeVisible();
    await page.getByRole("button", { name: "Mulai Cek Konsep" }).tap();
    await viewportShot(page, "390-cek-konsep");
    for (const concept of CONCEPTS) {
      const correct = concept.options.find(option => option.id === concept.correct)!;
      await page.getByRole("radio", { name: correct.text }).tap();
      await checking(page).tap();
      if (concept.id !== "C3") await page.getByRole("button", { name: "Cek berikutnya" }).tap();
    }
    await expect(page.getByRole("heading", { name: "Perakitan selesai" })).toBeVisible();
    await expectFullscreen(page);
    await viewportShot(page, "390-selesai");
  });
});

for (const [width, height] of [[1440, 900], [1366, 768], [1280, 720], [390, 844], [320, 568]]) {
  test(`Industry 2.0 assembly fits ${width}×${height} with reachable controls and visible keyboard focus`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openAssembly(page);
    await expect(page.locator(".electric-canvas canvas")).toBeInViewport({ ratio: 1 });
    await expect(connect(page)).toBeInViewport({ ratio: 1 });
    expect((await connect(page).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await source(page).press("Tab");
    await expect(destination(page)).toBeFocused();
    expect(await destination(page).evaluate(element => getComputedStyle(element).outlineStyle)).toBe("solid");
    await installLink(page, "supply", "panel");
    await installLink(page, "panel", "motor");
    await installLink(page, "motor", "shaft");
    await expect(page.getByText("3/5 sambungan · 0/3 cek konsep")).toBeVisible();
    await expect(connect(page)).toBeInViewport({ ratio: 1 });
    await expectFullscreen(page);
    await viewportShot(page, `${width}-perakitan`);
  });
}
