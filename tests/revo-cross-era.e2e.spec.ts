import { test as base, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { initialObservations } from "../src/lib/revo/experiment";
import { PARTS } from "../src/lib/revo/industry-2/content";
import { CONCEPTS, CONNECTIONS } from "../src/lib/revo/industry-2/assembly";

const menu = "/revo-lab";
const steam = `${menu}/industry-1`;
const electric = `${menu}/industry-2`;
const steamKey = "revo:industry-1:progress";
const electricKey = "revo:industry-2:progress";
const steamParts = ["boiler", "pipe", "piston", "flywheel", "textile"];
const electricParts = PARTS.map(part => part.id);
const viewports = [[1920, 1080], [1440, 900], [1366, 768], [1280, 720], [390, 844], [320, 568]];
const output = "test-results/revo/009b21-visual";
const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await use(errors);
    expect(errors).toEqual([]);
  }, { auto: true }],
});

const steamSave = (checkpoint = 0) => ({
  version: 2, selectedEra: "industry-1", checkpoint, explored: checkpoint ? steamParts : ["boiler"],
  assembly: { placed: checkpoint ? steamParts.slice(0, 2) : [], checks: [] },
  observations: initialObservations(), completedStages: [], experimentComplete: false, levelComplete: false,
  reflection: { answers: [], draftAnswer: null, checked: false, resultAnswers: null, retaking: false },
  preferences: { soundEnabled: false },
});
const electricSave = (stage: "explore" | "assembly", connections: string[] = []) => ({
  version: 2, stage, explored: stage === "explore" ? ["motor"] : electricParts, selected: "motor", connections, conceptAnswers: {},
});

async function seed(page: Page, data: Record<string, object>) {
  await page.goto(menu);
  await page.evaluate(saves => {
    for (const [key, value] of Object.entries(saves)) localStorage.setItem(key, JSON.stringify(value));
  }, data);
}

const saved = (page: Page, key: string) => page.evaluate(key => localStorage.getItem(key), key);

async function fits(page: Page) {
  const size = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight, docWidth: document.documentElement.scrollWidth, docHeight: document.documentElement.scrollHeight, y: scrollY,
  }));
  expect(size.docWidth).toBeLessThanOrEqual(size.width);
  expect(size.docHeight).toBeLessThanOrEqual(size.height);
  expect(size.y).toBe(0);
}

test("menu resumes each validated era and resets only the explicitly confirmed era", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await seed(page, { [steamKey]: steamSave(), [electricKey]: electricSave("assembly", ["E1"]) });
  await page.reload();
  const resume = page.getByRole("navigation", { name: "Lanjutkan progres per era" });
  await expect(resume.getByRole("link", { name: "Lanjutkan", exact: true })).toHaveAccessibleDescription("Industry 1.0");
  const electricLink = resume.getByRole("link", { name: /Industry 2.0 Lanjutkan Perakitan/ });
  await expect(electricLink).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("article", { name: "Industri 2.0" })).toBeInViewport({ ratio: 1 });
  await page.getByRole("button", { name: "Era berikutnya" }).click();
  await expect(page.getByRole("article", { name: "Industri 4.0" })).toBeInViewport({ ratio: 1 });
  await expect(electricLink).toBeInViewport({ ratio: 1 });
  await page.getByRole("button", { name: "Progres Saya" }).click();
  const progress = page.getByRole("dialog", { name: "Progres Saya" });
  await expect(progress.getByText("Eksplorasi · 1/5 komponen")).toBeVisible();
  await expect(progress.getByText("Perakitan · 7/7 komponen")).toBeVisible();
  await page.keyboard.press("Escape");
  await fits(page);
  await electricLink.press("Enter");
  await expect(page).toHaveURL(`${electric}/assembly`);
  await expect(page.getByText("1/5 sambungan · 0/3 cek konsep")).toBeVisible();
  const beforeElectric = await saved(page, electricKey);
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await resume.getByRole("link", { name: "Lanjutkan", exact: true }).click();
  await expect(page.getByText("1/5 komponen dijelajahi", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(page).toHaveURL(menu);
  await resume.getByRole("link", { name: "Lanjutkan", exact: true }).click();
  await page.getByRole("button", { name: "Ulangi seluruh level" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Ulangi Level", exact: true }).click();
  await expect.poll(() => saved(page, steamKey)).toBeNull();
  expect(await saved(page, electricKey)).toBe(beforeElectric);
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(resume.getByRole("link", { name: "Lanjutkan", exact: true })).toHaveCount(0);
  await electricLink.click();
  await page.getByRole("button", { name: "Reset progres 2.0" }).click();
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  expect(await saved(page, electricKey)).toBe(beforeElectric);
  await page.getByRole("button", { name: "Reset progres 2.0" }).click();
  await page.getByRole("button", { name: "Hapus progres 2.0" }).click();
  await expect(page).toHaveURL(`${electric}/briefing`);
  expect(await saved(page, electricKey)).toBeNull();
  expect(await saved(page, steamKey)).toBeNull();
});

test("both HUDs expose keyboard objectives, truthful stage status, and safe return navigation", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await seed(page, { [steamKey]: steamSave(), [electricKey]: electricSave("explore") });
  for (const [route, count, assemblyRole] of [[steam, 4, "tab"], [electric, 6, "button"]] as const) {
    await page.goto(route);
    await expect(page.locator("canvas")).toBeVisible();
    const objectives = page.getByRole("button", { name: "Tujuan Pembelajaran" });
    await objectives.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Tujuan Pembelajaran" });
    await expect(dialog.getByRole("listitem")).toHaveCount(count);
    await page.keyboard.press("Escape");
    await expect(objectives).toBeFocused();
    await expect(page.getByRole(assemblyRole, { name: /Perakitan/ })).toBeDisabled();
    const experiment = page.getByRole(assemblyRole, { name: /Eksperimen/ });
    await expect(experiment).toBeDisabled();
    if (route === electric) {
      await expect(experiment).toHaveAccessibleName("Eksperimen terkunci");
      await expect(page.getByRole("button", { name: "Refleksi belum tersedia" })).toBeDisabled();
    }
    const reflection = page.getByRole(assemblyRole, { name: /Refleksi/ });
    await expect(reflection).toBeInViewport({ ratio: 1 });
    expect((await reflection.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).press("Enter");
    await expect(page).toHaveURL(menu);
    await expect(page.locator("canvas")).toHaveCount(0);
  }
});

async function capture(page: Page, state: string, era: string, before?: () => Promise<unknown>) {
  await mkdir(output, { recursive: true });
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await before?.();
    // Let Chrome paint the resized page and 3D canvas before reading pixels.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await fits(page);
    await page.screenshot({ path: `${output}/${width}-${state}-${era}.png`, animations: "disabled" });
  }
}

test("visual comparison of both eras at six desktop and mobile viewports", async ({ page }) => {
  test.setTimeout(240_000);
  await seed(page, { [steamKey]: steamSave(), [electricKey]: electricSave("explore") });
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Lanjutkan progres per era" }).getByRole("link")).toHaveCount(2);
  await capture(page, "menu", "shared", async () => {
    for (const link of await page.getByRole("navigation", { name: "Lanjutkan progres per era" }).getByRole("link").all()) {
      await expect(link).toBeInViewport({ ratio: 1 });
    }
  });

  for (const [route, era, canvas] of [[steam, "steam", ".revo-scene canvas"], [electric, "electric", ".electric-canvas canvas"]] as const) {
    await page.goto(`${route}/briefing`);
    await expect(page.getByRole("region", { name: "Tujuan Pembelajaran", exact: true })).toBeVisible();
    await capture(page, "briefing", era);
    await page.goto(route);
    await expect(page.locator(canvas)).toBeVisible();
    await capture(page, "explore", era);
    await page.getByRole("button", { name: "Tujuan Pembelajaran", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await capture(page, "objectives", era);
    await page.keyboard.press("Escape");
  }

  await seed(page, { [steamKey]: steamSave(1), [electricKey]: electricSave("assembly", ["E1", "E2"]) });
  await page.goto(steam);
  await expect(page.locator(".revo-scene canvas")).toBeVisible();
  await expect(page.getByText("2/5 terpasang", { exact: true })).toBeVisible();
  await capture(page, "assembly", "steam");
  await page.getByRole("button", { name: "Pipa menghasilkan uap saat roda berputar.", exact: true }).click();
  await capture(page, "check", "steam", async () => {
    await page.locator(".revo-assembly-check .is-incorrect").first().evaluate(el => el.scrollIntoView({ block: "center" }));
  });

  await page.goto(`${electric}/assembly`);
  await expect(page.locator(".electric-canvas canvas")).toBeVisible();
  await expect(page.getByText("2/5 sambungan · 0/3 cek konsep")).toBeVisible();
  await capture(page, "assembly", "electric");
  for (const link of CONNECTIONS.slice(2)) {
    await page.getByRole("combobox", { name: "Sumber" }).selectOption(link.from);
    await page.getByRole("combobox", { name: "Tujuan" }).selectOption(link.to);
    await page.getByRole("button", { name: "Hubungkan", exact: true }).click();
  }
  await page.getByRole("button", { name: "Mulai Cek Konsep" }).click();
  await page.getByRole("radio", { name: CONCEPTS[0].options[0].text }).check();
  await page.getByRole("button", { name: "Periksa jawaban" }).click();
  await expect(page.getByRole("radio", { name: CONCEPTS[0].options[0].text })).toHaveAccessibleDescription("Jawabanmu · belum tepat");
  await capture(page, "check", "electric", async () => {
    await page.locator(".electric-concept-options .is-incorrect").evaluate(el => el.scrollIntoView({ block: "center" }));
  });
});
