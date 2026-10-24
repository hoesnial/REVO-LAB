import { expect, test as base, type Page } from "@playwright/test";
import { openAssembly, placeAssemblyPart } from "./helpers/revo-assembly";

const storageKey = "revo:industry-1:progress";
const parts = ["boiler", "pipe", "piston", "flywheel", "textile"];
const checks = ["steam", "rotation", "factory"];

function savedProgress(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    selectedEra: "industry-1",
    explored: parts,
    assembly: { placed: parts, checks },
    completedStages: ["exploration", "assembly", "experiment"],
    experimentComplete: false,
    reflection: { answers: [], draftAnswer: null, checked: false, resultAnswers: null, retaking: false },
    levelComplete: false,
    checkpoint: 2,
    preferences: { soundEnabled: false },
    ...overrides,
  };
}

async function seedProgress(page: Page, value: unknown) {
  await page.addInitScript(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key: storageKey, data: value });
}

async function waitForSavedProgress(page: Page, predicate: (value: unknown) => boolean) {
  await expect.poll(async () => {
    const raw = await page.evaluate(key => localStorage.getItem(key), storageKey);
    return raw ? predicate(JSON.parse(raw) as unknown) : false;
  }).toBe(true);
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

test("fresh menu hides Continue and real exploration progress survives menu navigation and reload", async ({ page }) => {
  await page.goto("/revo-lab");
  await expect(page.getByRole("link", { name: "Mulai Jelajah", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lanjutkan", exact: true })).toHaveCount(0);
  await page.goto("/revo-lab/industry-1");
  await expect(page.getByRole("button", { name: "Jelajahi Ketel uap", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Jelajahi Ketel uap", exact: true }).click();
  await waitForSavedProgress(page, value => {
    const save = value as { explored?: string[] };
    return save.explored?.length === 1 && save.explored[0] === "boiler";
  });
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(page.getByRole("link", { name: "Lanjutkan", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Lanjutkan", exact: true }).click();
  await expect(page.getByText("1/5 komponen dijelajahi")).toBeVisible();
  await page.reload();
  await expect(page.getByText("1/5 komponen dijelajahi")).toBeVisible();
  await expect(page.getByTestId("production")).toHaveText("0");
  await expect(page.getByRole("button", { name: "Nyalakan mesin", exact: true })).toBeDisabled();
});

test("partial assembly and completed knowledge checks reconstruct their visual and stage state after reload", async ({ page }) => {
  await openAssembly(page);
  await placeAssemblyPart(page, "boiler", "Ketel uap");
  await placeAssemblyPart(page, "pipe", "Pipa uap");
  await page.getByRole("button", { name: "Ketel memanaskan air dengan panas pembakaran.", exact: true }).click();
  await waitForSavedProgress(page, value => {
    const save = value as { assembly?: { placed?: string[]; checks?: string[] } };
    return save.assembly?.placed?.length === 2 && save.assembly?.checks?.includes("steam") === true;
  });
  await page.reload();
  await expect(page.getByRole("tab", { name: /Perakitan/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("2/5 terpasang", { exact: true })).toBeVisible();
  await expect(page.getByText(/1\/3 cek pemahaman/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Pilih Ketel uap", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Pilih Pipa uap", exact: true })).toBeDisabled();
});

test("incomplete experiment reload starts stopped with safe default resources and no unfinished filling", async ({ page }) => {
  await seedProgress(page, savedProgress());
  await page.goto("/revo-lab/industry-1");
  await expect(page.getByRole("tab", { name: /Eksperimen/ })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Nyalakan mesin", exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId("production").textContent())).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Tambah bahan bakar", exact: true }).click();
  await expect(page.getByRole("progressbar", { name: "Pengisian bahan bakar", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("tab", { name: /Eksperimen/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Nyalakan mesin", exact: true })).toBeVisible();
  await expect(page.getByTestId("production")).toHaveText("0");
  await expect(page.getByRole("meter", { name: "Bahan bakar", exact: true })).toHaveAttribute("aria-valuenow", "35");
  await expect(page.getByRole("meter", { name: "Persediaan air", exact: true })).toHaveAttribute("aria-valuenow", "65");
  await expect(page.getByRole("progressbar", { name: "Pengisian bahan bakar", exact: true })).toHaveCount(0);
  await page.waitForTimeout(1200);
  await expect(page.getByTestId("production")).toHaveText("0");
});

test("completed experiment restores safely and reopens a saved checked reflection answer", async ({ page }) => {
  const draft = { answers: [], draftAnswer: 1, checked: true, resultAnswers: null, retaking: false };
  await seedProgress(page, savedProgress({ experimentComplete: true, completedStages: ["exploration", "assembly", "experiment"], checkpoint: 3,
    reflection: draft }));
  await page.goto("/revo-lab");
  await expect(page.getByRole("link", { name: "Lanjutkan", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Lanjutkan", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Refleksi dan evaluasi", exact: true })).toBeVisible();
  await expect(page.getByTestId("production")).toHaveText("100");
  await expect(page.getByRole("button", { name: "Pertanyaan berikutnya", exact: true })).toBeEnabled();
  await expect(page.getByRole("radio", { name: "Pabrik lebih sedikit bergantung pada arus sungai sebagai sumber tenaga." })).toBeChecked();
  await expect(page.getByText("Tepat!", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Jeda simulasi", exact: true })).toBeDisabled();
});

test("completed result survives reload, permits imperfect scores, and confirms whole-level replay", async ({ page }) => {
  const answers = [0, 0, 0];
  await seedProgress(page, savedProgress({ experimentComplete: true, levelComplete: true,
    completedStages: ["exploration", "assembly", "experiment", "reflection", "level"],
    reflection: { answers, draftAnswer: null, checked: false, resultAnswers: answers, retaking: false }, checkpoint: 4 }));
  await page.goto("/revo-lab");
  await expect(page.getByRole("link", { name: "Lihat Hasil", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Lihat Hasil", exact: true }).click();
  await expect(page.getByRole("heading", { name: "LEVEL COMPLETED", exact: true })).toBeVisible();
  await expect(page.locator(".revo-completion-results").getByText("5/5", { exact: true })).toHaveCount(2);
  await expect(page.getByText("3/3 cek pemahaman", { exact: true })).toBeVisible();
  await expect(page.getByText("1/3", { exact: true })).toBeVisible();
  await expect(page.getByText("100/100 unit", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "LEVEL COMPLETED", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ulangi Level", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "Ulangi Industry 1.0", exact: true });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Pertahankan hasil", exact: true }).click();
  await expect(page.getByRole("heading", { name: "LEVEL COMPLETED", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ulangi Level", exact: true }).click();
  await page.getByRole("dialog", { name: "Ulangi Industry 1.0", exact: true }).getByRole("button", { name: "Ulangi Level", exact: true }).click();
  await expect(page.getByText("0/5 komponen dijelajahi")).toBeVisible();
  await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
  await expect(page.getByRole("link", { name: "Lanjutkan", exact: true })).toHaveCount(0);
  await expect(page.evaluate(key => localStorage.getItem(key), storageKey)).resolves.toBeNull();
});

test("level-completion screen stays fullscreen without document scrolling at compact and wide sizes", async ({ page }) => {
  const answers = [1, 0, 2];
  await seedProgress(page, savedProgress({ experimentComplete: true, levelComplete: true,
    completedStages: ["exploration", "assembly", "experiment", "reflection", "level"],
    reflection: { answers, draftAnswer: null, checked: false, resultAnswers: answers, retaking: false }, checkpoint: 4 }));
  await page.goto("/revo-lab/industry-1");
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1440, 900], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await expect(page.getByRole("heading", { name: "LEVEL COMPLETED", exact: true })).toBeVisible();
    const geometry = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, screenHeight: document.querySelector<HTMLElement>(".revo-completion-screen")?.getBoundingClientRect().height }));
    expect(geometry.scrollWidth, `${width}x${height} horizontal page overflow`).toBeLessThanOrEqual(width);
    expect(geometry.scrollHeight, `${width}x${height} document scrolling`).toBeLessThanOrEqual(height);
    expect(geometry.screenHeight).toBe(height);
    await page.getByRole("link", { name: "Menu Utama", exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("link", { name: "Menu Utama", exact: true })).toBeVisible();
  }
});
