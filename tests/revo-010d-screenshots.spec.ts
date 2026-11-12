/**
 * REVO-010D Visual Evidence — Screenshot Capture
 * Run: npx playwright test tests/revo-010d-screenshots.spec.ts --config playwright.revo.config.ts
 *
 * Captures screenshots for all required viewport × stage combinations.
 * Also measures document overflow at each state.
 */
import { test, expect, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const BASE = "http://127.0.0.1:3001";
const OUT = path.resolve("docs/revo-010d-media");

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900, mobile: false },
  { name: "desktop-1280x720", width: 1280, height: 720, mobile: false },
  { name: "desktop-1024x768", width: 1024, height: 768, mobile: false },
  { name: "mobile-390x844",   width: 390,  height: 844, mobile: true },
  { name: "mobile-320x568",   width: 320,  height: 568, mobile: true },
];

async function capture(page: Page, name: string) {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
}

async function checkOverflow(page: Page): Promise<{ ok: boolean; detail: string }> {
  const data = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth,
    docH: document.documentElement.scrollHeight,
    viewW: window.innerWidth,
    viewH: window.innerHeight,
  }));
  const ok = data.docW <= data.viewW && data.docH <= data.viewH;
  return {
    ok,
    detail: `doc=${data.docW}×${data.docH} view=${data.viewW}×${data.viewH}`,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Industry 1.0 — Assembly
// ─────────────────────────────────────────────────────────────────────────────
for (const vp of VIEWPORTS) {
  test(`[1.0 Assembly] ${vp.name}`, async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/revo-lab/industry-1`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const parts = ["boiler", "pipe", "piston", "flywheel", "textile"];
      localStorage.setItem("revo:industry-1:progress", JSON.stringify({
        version: 2, selectedEra: "industry-1", explored: parts,
        assembly: { placed: [], checks: [] },
        completedStages: ["exploration"],
        observations: { operated: false, motionObserved: false, transmissionInspected: false, production: 0, peakPressure: 0, unsafeCount: 0, elapsed: 0, legacyCompleted: false },
        experimentComplete: false,
        reflection: { answers: [], draftAnswer: null, checked: false, resultAnswers: null, retaking: false },
        levelComplete: false, checkpoint: 1, preferences: { soundEnabled: false },
      }));
    });
    await page.reload({ waitUntil: "networkidle" });

    // Navigate to Assembly tab
    const tab = page.getByRole("tab", { name: /Perakitan/i });
    await expect(tab).toBeEnabled();
    await tab.click();
    await page.waitForTimeout(1500);

    await capture(page, `industry-1-assembly--${vp.name}`);
    const { ok, detail } = await checkOverflow(page);
    expect(ok, `Overflow at ${vp.name}: ${detail}`).toBe(true);

    // Mobile: capture both model and task modes
    if (vp.mobile) {
      const modelBtn = page.getByRole("button", { name: /Model/i });
      const taskBtn  = page.getByRole("button", { name: /Tugas/i });
      if (await modelBtn.isVisible()) {
        await modelBtn.click();
        await capture(page, `industry-1-assembly--${vp.name}--model`);
        await taskBtn.click();
        await capture(page, `industry-1-assembly--${vp.name}--task`);
      }
    }
    await ctx.close();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Industry 1.0 — Experiment (assembly must be complete to unlock)
// ─────────────────────────────────────────────────────────────────────────────
for (const vp of VIEWPORTS) {
  test(`[1.0 Experiment] ${vp.name}`, async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    const page = await ctx.newPage();
    // Seed localStorage so experiment is unlocked
    await page.goto(`${BASE}/revo-lab/industry-1`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const prog = {
        version: 2,
        selectedEra: "industry-1",
        explored: ["boiler","pipe","piston","flywheel","textile"],
        assembly: { placed: ["boiler","pipe","piston","flywheel","textile"], checks: ["steam","rotation","factory"] },
        completedStages: ["exploration","assembly"],
        observations: { operated: false, motionObserved: false, transmissionInspected: false, production: 0, peakPressure: 0, unsafeCount: 0, elapsed: 0, legacyCompleted: false },
        experimentComplete: false,
        reflection: { answers: [], draftAnswer: null, checked: false, resultAnswers: null, retaking: false },
        levelComplete: false,
        checkpoint: 2,
        preferences: { soundEnabled: false },
      };
      localStorage.setItem("revo:industry-1:progress", JSON.stringify(prog));
    });
    await page.reload({ waitUntil: "networkidle" });

    const expTab = page.getByRole("tab", { name: /Eksperimen/i });
    if (await expTab.isVisible()) await expTab.click();
    await page.waitForTimeout(1500);

    await capture(page, `industry-1-experiment--${vp.name}`);
    const { ok, detail } = await checkOverflow(page);
    expect(ok, `Overflow at ${vp.name}: ${detail}`).toBe(true);

    if (vp.mobile) {
      const modelBtn = page.getByRole("button", { name: /Model/i });
      const taskBtn  = page.getByRole("button", { name: /Tugas/i });
      if (await modelBtn.isVisible()) {
        await modelBtn.click();
        await capture(page, `industry-1-experiment--${vp.name}--model`);
        await taskBtn.click();
        await capture(page, `industry-1-experiment--${vp.name}--task`);
      }
    }
    await ctx.close();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Industry 1.0 — Level Completed
// ─────────────────────────────────────────────────────────────────────────────
for (const vp of VIEWPORTS) {
  test(`[1.0 Completed] ${vp.name}`, async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/revo-lab/industry-1`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const parts = ["boiler", "pipe", "piston", "flywheel", "textile"];
      const prog = {
        version: 2,
        selectedEra: "industry-1",
        explored: parts,
        assembly: { placed: parts, checks: ["steam", "rotation", "factory"] },
        completedStages: ["exploration", "assembly", "experiment", "reflection"],
        observations: { operated: true, motionObserved: true, transmissionInspected: true, production: 12, peakPressure: 64, unsafeCount: 0, elapsed: 42, legacyCompleted: false },
        experimentComplete: true,
        reflection: { answers: [1, 0, 2], draftAnswer: null, checked: true, resultAnswers: [1, 0, 2], retaking: false },
        levelComplete: true,
        checkpoint: 4,
        preferences: { soundEnabled: false },
      };
      localStorage.setItem("revo:industry-1:progress", JSON.stringify(prog));
    });
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("navigation", { name: "Pilihan setelah menyelesaikan level" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pilih Era", exact: true })).toHaveCount(0);
    await capture(page, `industry-1-completed--${vp.name}`);
    const { ok, detail } = await checkOverflow(page);
    expect(ok, `Overflow at ${vp.name}: ${detail}`).toBe(true);
    await ctx.close();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Industry 2.0 — Assembly
// ─────────────────────────────────────────────────────────────────────────────
for (const vp of VIEWPORTS) {
  test(`[2.0 Assembly] ${vp.name}`, async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    const page = await ctx.newPage();
    // Seed progress so assembly is accessible
    await page.goto(`${BASE}/revo-lab/industry-2/assembly`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const prog = {
        version: 3,
        stage: "assembly",
        explored: ["supply","panel","motor","shaft","belt","conveyor","stations"],
        selected: null,
        connections: [],
        conceptAnswers: {},
        observations: {},
      };
      localStorage.setItem("revo:industry-2:progress", JSON.stringify(prog));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    await capture(page, `industry-2-assembly--${vp.name}`);
    const { ok, detail } = await checkOverflow(page);
    expect(ok, `Overflow at ${vp.name}: ${detail}`).toBe(true);

    if (vp.mobile) {
      const modelBtn = page.getByRole("button", { name: /Model/i });
      const taskBtn  = page.getByRole("button", { name: /Tugas/i });
      if (await modelBtn.isVisible()) {
        await modelBtn.click();
        await capture(page, `industry-2-assembly--${vp.name}--model`);
        await taskBtn.click();
        await capture(page, `industry-2-assembly--${vp.name}--task`);
      }
    }
    await ctx.close();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Industry 2.0 — Experiment
// ─────────────────────────────────────────────────────────────────────────────
for (const vp of VIEWPORTS) {
  test(`[2.0 Experiment] ${vp.name}`, async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/revo-lab/industry-2/experiment`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const prog = {
        version: 3,
        stage: "experiment",
        explored: ["supply","panel","motor","shaft","belt","conveyor","stations"],
        selected: null,
        connections: ["E1","E2","M1","M2","M3"],
        conceptAnswers: { C1: "rotate", C2: "no-drive", C3: "chain" },
        observations: {},
      };
      localStorage.setItem("revo:industry-2:progress", JSON.stringify(prog));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    await capture(page, `industry-2-experiment--${vp.name}`);
    const { ok, detail } = await checkOverflow(page);
    expect(ok, `Overflow at ${vp.name}: ${detail}`).toBe(true);

    if (vp.mobile) {
      const modelBtn = page.getByRole("button", { name: /Model/i });
      const taskBtn  = page.getByRole("button", { name: /Tugas/i });
      if (await modelBtn.isVisible()) {
        await modelBtn.click();
        await capture(page, `industry-2-experiment--${vp.name}--model`);
        await taskBtn.click();
        await capture(page, `industry-2-experiment--${vp.name}--task`);
      }
    }
    await ctx.close();
  });
}
