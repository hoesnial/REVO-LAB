import { expect, test as base, type Locator, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const parts = ["boiler", "pipe", "piston", "flywheel", "textile"];
const baseSave = {
  version: 2, selectedEra: "industry-1", explored: parts,
  assembly: { placed: parts, checks: ["steam", "rotation", "factory"] }, completedStages: [],
  experimentComplete: false, levelComplete: false, checkpoint: 2, preferences: { soundEnabled: false },
  observations: { operated: false, motionObserved: false, transmissionInspected: false, production: 0, peakPressure: 0, unsafeCount: 0, elapsed: 0, legacyCompleted: false },
  reflection: { answers: [], draftAnswer: null, checked: false, resultAnswers: null, retaking: false },
};
const readySave = { ...baseSave, experimentComplete: true, checkpoint: 3,
  observations: { ...baseSave.observations, operated: true, motionObserved: true, transmissionInspected: true, production: 12, peakPressure: 35, elapsed: 25 } };
const summarySave = { ...readySave, checkpoint: 4, levelComplete: true, reflection: { ...baseSave.reflection, resultAnswers: [0, 0, 2] } };
async function seed(page: Page, save: unknown) {
  await page.goto("/revo-lab");
  await page.evaluate(save => localStorage.setItem("revo:industry-1:progress", JSON.stringify(save)), save);
  await page.goto("/revo-lab/industry-1");
}
function ratio(a: string, b: string) {
  const lum = (s: string) => {
    const v = s.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(n => n / 255 <= .04045 ? n / 255 / 12.92 : ((n / 255 + .055) / 1.055) ** 2.4);
    return .2126 * v[0] + .7152 * v[1] + .0722 * v[2];
  };
  return (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
}
async function colors(locator: Locator) {
  return locator.evaluate(el => {
    const cs = getComputedStyle(el);
    let background = cs.backgroundColor;
    let parent = el.parentElement;
    while (parent && (background === "rgba(0, 0, 0, 0)" || background === "transparent")) {
      background = getComputedStyle(parent).backgroundColor; parent = parent.parentElement;
    }
    return { text: cs.color, background, border: cs.borderTopColor, size: parseFloat(cs.fontSize), outline: cs.outlineStyle };
  });
}
async function readable(locator: Locator) {
  const skin = await colors(locator);
  expect(ratio(skin.text, skin.background), JSON.stringify(skin)).toBeGreaterThanOrEqual(4.5);
  return skin;
}
async function target(locator: Locator) {
  const box = await locator.boundingBox(); expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
}
async function fits(page: Page) {
  const overflow = await page.evaluate(() => ({ w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight,
    panels: [...document.querySelectorAll<HTMLElement>("dialog[open],.revo-hud-sidebar,.revo-assembly-panel,.revo-component-info,.revo-lab-grid,.revo-learning-note,.revo-briefing-actions")].filter(el => el.getClientRects().length).map(el => ({ name: el.className, extra: el.scrollWidth - el.clientWidth, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right })) }));
  expect(overflow.sw).toBeLessThanOrEqual(overflow.w); expect(overflow.sh).toBeLessThanOrEqual(overflow.h);
  for (const panel of overflow.panels) {
    expect(panel.extra, panel.name).toBeLessThanOrEqual(1);
    expect(panel.left, panel.name).toBeGreaterThanOrEqual(-1);
    expect(panel.right, panel.name).toBeLessThanOrEqual(overflow.w + 1);
  }
}
const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await use(errors); expect(errors).toEqual([]);
  }, { auto: true }],
});

test("resource colors, focus, disabled states and feedback remain readable through real filling", async ({ page }) => {
  await seed(page, baseSave);
  const fuel = page.getByRole("button", { name: "Tambah bahan bakar", exact: true });
  const water = page.getByRole("button", { name: "Tambah air", exact: true });
  const reduce = page.getByRole("button", { name: "Kurangi bahan bakar", exact: true });
  const skins = [];
  for (const button of [fuel, water, reduce]) {
    await button.scrollIntoViewIfNeeded(); await target(button); skins.push(await readable(button));
    await button.hover(); await readable(button);
    await button.focus(); expect((await colors(button)).outline).toBe("solid");
  }
  expect(new Set(skins.map(s => s.background)).size).toBe(3);
  await water.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("progressbar", { name: "Pengisian air", exact: true })).toBeVisible();
  await expect(fuel).toBeDisabled(); await readable(fuel);
  await expect(page.getByRole("meter", { name: "Persediaan air", exact: true })).toHaveAttribute("aria-valuenow", "80");
  await expect(water).toBeEnabled();
  await expect(page.locator(".revo-control-feedback")).toContainText("Air ditambahkan");
  await fuel.click(); await expect(page.getByRole("meter", { name: "Bahan bakar", exact: true })).toHaveAttribute("aria-valuenow", "50");
  await reduce.click(); await expect(page.getByRole("meter", { name: "Bahan bakar", exact: true })).toHaveAttribute("aria-valuenow", "40");
  await fits(page);
});

test("reflection distinguishes selection from evaluation, retains contrast and preserves scoring", async ({ page }) => {
  await seed(page, readySave);
  const cards = page.locator(".revo-quiz-option");
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) { await readable(card); await readable(card.locator('.revo-quiz-letter')); }
  await expect(page.locator(".is-correct,.is-incorrect")).toHaveCount(0);
  await page.getByRole("radio").first().focus(); await page.keyboard.press("Space");
  await expect(cards.first()).toContainText("Dipilih · belum diperiksa");
  const selected = await readable(cards.first()); expect(ratio(selected.border, selected.background)).toBeGreaterThanOrEqual(3);
  await expect(page.locator(".revo-quiz-feedback")).toBeEmpty();
  await page.getByRole("button", { name: "Periksa jawaban", exact: true }).click();
  await expect(cards.first()).toContainText("Jawabanmu · belum tepat");
  await expect(cards.nth(1)).toContainText("Jawaban benar");
  for (const card of await cards.all()) { await readable(card); await readable(card.locator('.revo-quiz-letter')); }
  await readable(page.locator('.revo-quiz-feedback'));
  await expect(page.getByRole("radio").first()).toBeDisabled();
  for (let i = 1; i < 3; i++) {
    await page.getByRole("button", { name: "Pertanyaan berikutnya", exact: true }).click();
    await page.getByRole("radio").nth(i === 1 ? 0 : 2).check();
    await page.getByRole("button", { name: "Periksa jawaban", exact: true }).click();
    await expect(page.locator(".revo-answer-state").filter({ hasText: "Jawabanmu · benar" })).toHaveCount(1);
    await readable(page.locator(".revo-quiz-option.is-correct"));
  }
  await page.getByRole("button", { name: "Lihat hasil", exact: true }).click();
  await expect(page.locator(".revo-quiz-score")).toHaveText("2 / 3");
  await page.getByRole("button", { name: "Ulangi evaluasi", exact: true }).click();
  await expect(page.locator(".is-selected,.is-correct,.is-incorrect")).toHaveCount(0);
  await fits(page);
});

test("assembly immediate checks explain mistakes, keep readable cards and move keyboard focus on success", async ({ page }) => {
  await seed(page, { ...baseSave, checkpoint: 1, assembly: { placed: parts, checks: [] } });
  const region = page.getByRole("region", { name: "Cek pemahaman perakitan", exact: true });
  for (const button of await region.locator("button").all()) { await readable(button); await target(button); }
  const wrong = region.getByRole("button", { name: "Pipa menghasilkan uap saat roda berputar.", exact: true });
  await wrong.focus(); await page.keyboard.press("Enter");
  await expect(wrong).toContainText("Jawabanmu · belum tepat"); await readable(wrong);
  await expect(region.getByRole("status")).toContainText("Pipa menyalurkan uap");
  await region.getByRole("button", { name: "Ketel memanaskan air dengan panas pembakaran.", exact: true }).press("Enter");
  await expect(region.locator("h3")).toBeFocused();
  await expect(page.locator(".revo-check-confirmation")).toContainText("1/3 cek pemahaman benar");
  await expect(page.getByRole("progressbar", { name: "Progres perakitan", exact: true })).toHaveAttribute("aria-valuenow", "75");
  await fits(page);
});

for (const [width, height] of [[1920,1080],[1440,900],[1366,768],[1280,720],[390,844],[320,568]]) {
  test(`complete interface remains reachable at ${width}x${height}`, async ({ page }) => {
    test.setTimeout(180_000); await page.setViewportSize({ width, height });
    const folder = `test-results/revo/revo-008r1-1/${width}`; await mkdir(folder, { recursive: true });
    const measurements: unknown[] = [];
    async function shot(name: string) { await fits(page); await page.screenshot({ path: `${folder}/${name}.png` }); }
    await page.goto('/revo-lab'); await target(page.getByRole('link',{name:'Jelajahi Industri 1.0',exact:true}));
    const menuImage = page.locator('[data-era="industry-1"] .revo-menu-era-art img');
    await expect(menuImage).toBeVisible();
    await expect.poll(() => menuImage.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    expect((await menuImage.boundingBox())!.height).toBeGreaterThan(40);await shot('menu');
    await page.getByRole('button',{name:'Cara Bermain',exact:true}).click();await shot('help');
    await page.getByRole('button',{name:'Siap menjelajah',exact:true}).scrollIntoViewIfNeeded(); await expect(page.getByRole('button',{name:'Siap menjelajah',exact:true})).toBeInViewport(); await page.keyboard.press('Escape');
    await page.goto('/revo-lab/eras');await shot('eras');
    await page.goto('/revo-lab/industry-1/briefing');await shot('briefing');
    await seed(page,{...baseSave,explored:[],assembly:{placed:[],checks:[]},checkpoint:0});
    await page.getByLabel('Pilih komponen mesin',{exact:true}).getByRole('button',{name:/Ketel uap/}).click();
    await expect(page.locator('.revo-component-info')).toBeVisible();
    await target(page.getByRole('button',{name:'Tutup informasi komponen',exact:true}));
    await target(page.getByRole('button',{name:'Jelajahi komponen berikutnya',exact:true}));await shot('exploration');
    await page.getByRole('button',{name:'Tutup informasi komponen',exact:true}).click();
    await seed(page,baseSave);await expect(page.locator('.revo-scene canvas')).toBeVisible();
    expect((await page.locator('.revo-scene canvas').boundingBox())!.height).toBeGreaterThan(110);await shot('experiment');
    for(const name of ['Tambah bahan bakar','Kurangi bahan bakar','Tambah air','Nyalakan mesin','Lepaskan tekanan','Reset kamera']) {
      const button=page.getByRole('button',{name,exact:true});await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport();await target(button);measurements.push({name,...await colors(button)});
    }
    await page.getByRole('button',{name:'Tambah air',exact:true}).scrollIntoViewIfNeeded();await shot('controls');
    await page.getByRole('button',{name:'Tujuan Pembelajaran',exact:true}).click();await shot('objectives');await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Panduan belajar',exact:true}).click();await shot('guide');await page.keyboard.press('Escape');
    await seed(page,{...baseSave,checkpoint:1,assembly:{placed:parts,checks:[]}});
    const answer=page.getByRole('button',{name:'Ketel memanaskan air dengan panas pembakaran.',exact:true});await answer.scrollIntoViewIfNeeded();await shot('assembly');await readable(answer);
    await seed(page,readySave);await expect(page.getByRole('dialog')).toBeVisible();await shot('quiz-unselected');
    await page.getByRole('radio').first().check();await shot('quiz-selected');
    await page.getByRole('button',{name:'Periksa jawaban',exact:true}).click();await shot('quiz-incorrect');
    await page.getByRole('button',{name:'Pertanyaan berikutnya',exact:true}).click();await page.getByRole('radio').first().check();await page.getByRole('button',{name:'Periksa jawaban',exact:true}).click();await shot('quiz-correct');
    await seed(page,summarySave);await expect(page.getByRole('heading',{name:'PEMBELAJARAN SELESAI',exact:true})).toBeVisible();await shot('summary');
    const replay=page.getByRole('button',{name:'Ulangi Level',exact:true});await replay.scrollIntoViewIfNeeded();await replay.click();await shot('reset-confirmation');
    await target(page.getByRole('button',{name:'Tutup dialog',exact:true}));await page.keyboard.press('Escape');await expect(replay).toBeFocused();
    await page.goto('/revo-lab');
    await target(page.getByRole('link',{name:'Lihat Hasil',exact:true}));
    await target(page.getByRole('button',{name:'Cara Bermain',exact:true}));
    await expect(menuImage).toBeVisible();
    expect((await menuImage.boundingBox())!.height).toBeGreaterThan(40);await shot('menu-resume');
    await writeFile(`${folder}/controls.json`,JSON.stringify(measurements,null,2));
  });
}
