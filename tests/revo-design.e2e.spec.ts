import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { PARTS } from "../src/lib/revo/industry-2/content";
import { CONNECTIONS, CONCEPTS } from "../src/lib/revo/industry-2/assembly";
import { initialObservations } from "../src/lib/revo/experiment";
const root = "/revo-lab";
const sizes = [[1920,1080],[1440,900],[1366,768],[1280,720],[390,844],[320,568]];
const output = process.env.REVO_VISUAL_DIR || "test-results/revo/009b3r-after";
const steamParts = ["boiler","pipe","piston","flywheel","textile"];
const steamSave = (checkpoint: number) => ({version:2,selectedEra:"industry-1", checkpoint,
  explored: checkpoint ? steamParts : [], assembly:{placed:checkpoint===2?steamParts:[],checks:checkpoint===2?["steam","rotation","factory"]:[]},
  observations:initialObservations(),completedStages:[],experimentComplete:false,levelComplete:false,
  reflection:{answers:[],draftAnswer:null,checked:false,resultAnswers:null,retaking:false},preferences:{soundEnabled:false}});
const electricSave = {version:3,stage:"experiment",explored:PARTS.map(p=>p.id),selected:null,
  connections:CONNECTIONS.map(c=>c.id),conceptAnswers:Object.fromEntries(CONCEPTS.map(c=>[c.id,c.correct])),observations:{}};
async function seed(page:Page, checkpoint:number) {
  await page.goto(root);
  await page.evaluate(({steam,electric})=>{localStorage.setItem("revo:industry-1:progress",JSON.stringify(steam));localStorage.setItem("revo:industry-2:progress",JSON.stringify(electric));},{steam:steamSave(checkpoint),electric:electricSave});
}
async function shots(page:Page,name:string) {
  await mkdir(output,{recursive:true});
  for (const [width,height] of sizes) {
    await page.setViewportSize({width,height});
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
    expect(await page.evaluate(()=>[document.documentElement.scrollWidth<=innerWidth,document.documentElement.scrollHeight<=innerHeight,scrollY===0])).toEqual([true,true,true]);
    if (name === "explore-2") {
      const overlap = await page.locator(".electric-paths button").evaluateAll(buttons => {
        const camera = document.querySelector(".electric-camera-controls")?.getBoundingClientRect();
        return camera && buttons.some(button => {
          const path = button.getBoundingClientRect();
          return path.right > camera.left && path.left < camera.right && path.bottom > camera.top && path.top < camera.bottom;
        });
      });
      expect(overlap, `Path and camera controls overlap at ${width} × ${height}`).toBe(false);
    }
    if (name === "info-1") {
      const layout = await page.getByRole("region", { name: "Informasi komponen" }).evaluate(card => {
        const bounds = card.getBoundingClientRect();
        const scene = document.querySelector(".revo-scene")!.getBoundingClientRect();
        const camera = document.querySelector(".revo-camera-tools")!.getBoundingClientRect();
        const components = document.querySelector(".revo-component-list")!.getBoundingClientRect();
        return { position: getComputedStyle(card).position, top: bounds.top, right: bounds.right, scene, camera, components };
      });
      if (width <= 720) {
        expect(layout.position).toBe("absolute");
        expect(layout.top).toBeGreaterThanOrEqual(Math.max(layout.scene.bottom, layout.camera.bottom, layout.components.bottom));
        expect(layout.scene.height).toBeGreaterThan(95);
      } else {
        expect(layout.position).toBe("absolute");
        expect(layout.top).toBeLessThan(layout.scene.bottom);
        expect(layout.scene.right).toBeLessThanOrEqual(layout.right);
      }
    }
    if(name.startsWith("info-2")) await page.locator("#electric-detail").evaluate(el=>el.scrollIntoView({block:"start"}));
    await page.screenshot({path:`${output}/${width}-${name}.png`,animations:"disabled"});
  }
}
test("canonical visual reference captures information and the three laboratory stages", async ({page})=>{
  test.setTimeout(240000);
  await seed(page,0);
  for(const era of [1,2]) {
    await page.goto(`${root}/industry-${era}`);
    await expect(page.locator("canvas")).toBeVisible();
    await shots(page,`explore-${era}`);
    await page.setViewportSize({width:1440,height:900});
    await page.getByRole("button",{name:era===1?/^Jelajahi Ketel uap$/:/^Motor listrik/}).press("Enter");
    await expect(page.locator(era===1?".revo-component-info":"#electric-detail")).toBeVisible();
    await shots(page,`info-${era}`);
  }
  await seed(page,1); await page.goto(`${root}/industry-1`); await expect(page.locator("canvas")).toBeVisible(); await shots(page,"assembly-1");
  await page.goto(`${root}/industry-2/assembly`); await expect(page.locator("canvas")).toBeVisible(); await shots(page,"assembly-2");
  await seed(page,2); await page.goto(`${root}/industry-1`); await expect(page.getByRole("button",{name:"Nyalakan mesin",exact:true})).toBeEnabled(); await shots(page,"experiment-1");
  await page.goto(`${root}/industry-2/experiment`); await expect(page.locator("canvas")).toBeVisible(); await page.getByRole("button",{name:"Mulai",exact:true}).click(); await shots(page,"experiment-2");
});
test("camera focus is keyboard accessible, reversible, and never changes learning evidence", async ({page})=>{
  const errors:string[]=[]; page.on("pageerror",e=>errors.push(e.message));
  await seed(page,0); await page.goto(`${root}/industry-2/experiment`);
  const canvas=page.locator(".electric-canvas canvas");await expect(canvas).toBeVisible();
  const before=await page.evaluate(()=>localStorage.getItem("revo:industry-2:progress"));
  await page.getByRole("button",{name:"Pilih sudut pandang"}).press("Enter");
  const control=page.getByRole("combobox",{name:"Sudut pandang"});
  for(const [w,h] of [[1440,900],[390,844],[320,568]]){
    await page.setViewportSize({width:w,height:h});
    const initial=await canvas.screenshot();
    await control.focus();await expect(control).toBeFocused();await control.press("m");await control.press("Enter");
    await expect(control).toHaveValue("motor");
    expect((await canvas.screenshot()).equals(initial)).toBe(false);
    await expect(page.getByRole("button",{name:"Mulai",exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Atur ulang kamera"}).press("Enter");await expect(control).toHaveValue("overview");
  }
  expect(await page.evaluate(()=>localStorage.getItem("revo:industry-2:progress"))).toBe(before);expect(errors).toEqual([]);
});

test.describe("compact component inspectors", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 320, height: 568 } });

  test("touch and keyboard can read, navigate and close the inspector without covering the scene", async ({ page }) => {
    await page.goto(`${root}/industry-1`);
    const picker = page.getByLabel("Pilih komponen mesin", { exact: true });
    const boiler = picker.getByRole("button", { name: /Ketel uap/ });
    const wheel = picker.getByRole("button", { name: /Roda gila/ });
    const inspector = page.getByRole("region", { name: "Informasi komponen" });
    const scrollPanel = inspector;
    const next = inspector.getByRole("button", { name: "Jelajahi komponen berikutnya" });
    const close = inspector.getByRole("button", { name: "Tutup informasi komponen" });
    const saved = () => page.evaluate(() => localStorage.getItem("revo:industry-1:progress"));

    await boiler.tap();
    await expect(inspector).toBeFocused();
    await expect(inspector.getByRole("heading", { name: "Ketel uap" })).toBeInViewport();
    await expect(inspector.locator(".revo-component-description")).toHaveCSS("font-size", "15px");
    const initialProgress = await saved();

    await page.keyboard.press("PageDown");
    await expect.poll(() => scrollPanel.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Perluas informasi komponen" }).tap();
    await inspector.locator(".revo-component-role p").scrollIntoViewIfNeeded();
    await expect(inspector.locator(".revo-component-role p")).toBeInViewport({ ratio: 1 });
    await page.keyboard.press("Home");
    await expect.poll(() => scrollPanel.evaluate(el => el.scrollTop)).toBe(0);

    await page.getByRole("button", { name: "Perkecil tampilan" }).tap();
    await expect(inspector).toBeVisible();
    await close.tap();
    await expect(inspector).toHaveCount(0);
    await expect(boiler).toBeFocused();
    expect(await saved()).toBe(initialProgress);

    await page.setViewportSize({ width: 390, height: 844 });
    await boiler.press("Enter");
    await expect(inspector).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Perluas informasi komponen" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(next).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(inspector.getByRole("heading", { name: "Roda gila" })).toBeInViewport();
    await expect(wheel).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(inspector).toHaveCount(0);
    await expect(wheel).toBeFocused();
    await expect(picker.getByRole("button", { name: /Roda gila/ })).toBeInViewport();
    expect(JSON.parse((await saved())!).explored).toEqual(["boiler", "flywheel"]);
    expect(await page.evaluate(() => [scrollX, scrollY, document.documentElement.scrollWidth, document.documentElement.scrollHeight]))
      .toEqual([0, 0, 390, 844]);
  });
  test("electrical inspector returns focus to the part list and keeps the inspection saved", async ({ page }) => {
    await seed(page, 0);
    await page.goto(`${root}/industry-2`);
    const motor = page.getByRole("button", { name: /^Motor listrik/ });
    const detail = page.getByRole("region", { name: "Informasi komponen" });
    await motor.tap();
    await expect(detail).toBeFocused();
    await expect(detail.getByRole("heading", { name: "Motor listrik" })).toBeInViewport();
    await page.getByRole("button", { name: "Tutup informasi komponen" }).tap();
    await expect(motor).toBeFocused();
    await expect(motor).toBeInViewport();
    await expect(motor).toHaveAttribute("aria-pressed", "true");
    await motor.press("Enter");
    await expect(detail).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(motor).toBeFocused();
    await expect(page.getByRole("button", { name: "Atur ulang kamera" })).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => [scrollX, scrollY, document.documentElement.scrollWidth, document.documentElement.scrollHeight]))
      .toEqual([0, 0, 320, 568]);
  });
});
