import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const parts = ["boiler", "pipe", "piston", "flywheel", "textile"];
const save = (overrides: Record<string, unknown> = {}) => ({ version: 2, selectedEra: "industry-1", explored: parts,
  assembly: { placed: parts, checks: ["steam", "rotation", "factory"] }, completedStages: ["exploration", "assembly"],
  experimentComplete: false, observations: { operated: false, motionObserved: false, transmissionInspected: false, production: 0, peakPressure: 0, unsafeCount: 0, elapsed: 0, legacyCompleted: false },
  reflection: { answers: [], draftAnswer: null, checked: false, resultAnswers: null, retaking: false }, levelComplete: false, checkpoint: 2, preferences: { soundEnabled: false }, ...overrides });
async function seed(page: Page, data: unknown) {
  await page.goto("/revo-lab");
  await page.evaluate(data => localStorage.setItem("revo:industry-1:progress", JSON.stringify(data)), data);
  await page.goto("/revo-lab/industry-1");
}
async function noScroll(page: Page) {
  const layout = await page.evaluate(() => ({ w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, y: scrollY }));
  expect(layout.sw).toBeLessThanOrEqual(layout.w); expect(layout.sh).toBeLessThanOrEqual(layout.h); expect(layout.y).toBe(0);
}
function contrast(a: string, b: string) {
  const luminance = (color: string) => {
    const [r,g,b] = color.match(/[\d.]+/g)!.slice(0,3).map(Number).map(n => { const s=n/255; return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4; });
    return .2126*r+.7152*g+.0722*b;
  };
  const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}

test("objectives use readable green cards in briefing and a keyboard accessible pausing dialog", async ({ page }) => {
  await page.goto("/revo-lab/industry-1/briefing");
  const card=page.getByRole("region",{name:"Tujuan Pembelajaran",exact:true});
  await expect(card.getByRole("heading",{name:"TUJUAN PEMBELAJARAN",exact:true})).toBeVisible();
  await expect(card.locator("li")).toHaveCount(4);
  const styles=await card.evaluate(el=>({background:getComputedStyle(el).backgroundColor, text:getComputedStyle(el.querySelector("li")!).color, highlight:getComputedStyle(el.querySelector("strong")!).color, size:parseFloat(getComputedStyle(el.querySelector("li")!).fontSize)}));
  expect(styles.background).toBe("rgb(32, 62, 50)"); expect(styles.size).toBeGreaterThanOrEqual(16);
  expect(contrast(styles.background,styles.text)).toBeGreaterThanOrEqual(4.5); expect(contrast(styles.background,styles.highlight)).toBeGreaterThanOrEqual(4.5);
  await expect(page.getByText(/MISIMU|100 unit/)).toHaveCount(0);
  await seed(page,save());
  await page.getByRole("button",{name:"Nyalakan mesin",exact:true}).click();
  await expect.poll(()=>page.getByRole("meter",{name:"Kecepatan",exact:true}).getAttribute("aria-valuenow")).not.toBe("0");
  const button=page.getByRole("button",{name:"Tujuan Pembelajaran",exact:true}); await button.focus(); await page.keyboard.press("Enter");
  const dialog=page.getByRole("dialog",{name:"Tujuan Pembelajaran",exact:true}); await expect(dialog).toBeVisible();
  const before=await page.getByRole("meter",{name:"Bahan bakar",exact:true}).getAttribute("aria-valuenow"); await page.waitForTimeout(1000);
  await expect(page.getByRole("meter",{name:"Bahan bakar",exact:true})).toHaveAttribute("aria-valuenow",before!);
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(button).toBeFocused();
});

test("real output and T inspection unlock reflection below 100, then summary displays measured evidence and actual score",async({page})=>{
  const errors:string[]=[]; page.on("pageerror",e=>errors.push(e.message)); page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
  await seed(page,save());
  const next=page.getByRole("button",{name:"Lanjut ke Refleksi",exact:true}); await expect(next).toBeDisabled();
  await expect(page.locator('.revo-mission')).toHaveCount(0);
  await page.getByRole("button",{name:"Nyalakan mesin",exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('revo:industry-1:progress')!).observations.production)).toBeGreaterThan(0);
  await expect(next).toBeDisabled();
  await page.getByRole("button",{name:"Informasi Transmisi Tenaga",exact:true}).focus(); await page.keyboard.press("Enter");
  await page.getByRole("button",{name:"Kembali ke mesin",exact:true}).click(); await expect(next).toBeEnabled();
  await next.click();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Lanjut ke Refleksi',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Refleksi dan evaluasi',exact:true})).toBeVisible();
  const measured=await page.evaluate(()=>JSON.parse(localStorage.getItem('revo:industry-1:progress')!).observations);
  expect(measured.production).toBeGreaterThan(0); expect(measured.production).toBeLessThan(100); expect(measured.transmissionInspected).toBe(true);
  const dialog=page.getByRole("dialog",{name:"Refleksi dan evaluasi",exact:true});
  for(let i=0;i<3;i++){
    await dialog.getByRole("radio").first().check(); await dialog.getByRole("button",{name:"Periksa jawaban",exact:true}).click();
    await dialog.getByRole("button",{name:i===2?"Lihat hasil":"Pertanyaan berikutnya",exact:true}).click();
  }
  await expect(dialog.locator('.revo-quiz-score')).toHaveText('1 / 3'); await dialog.getByRole("button",{name:"Kembali ke laboratorium",exact:true}).click();
  await expect(page.getByRole("heading",{name:"PEMBELAJARAN SELESAI",exact:true})).toBeVisible();
  await expect(page.locator('.revo-completion-results')).toContainText(`${measured.production.toFixed(2)} unit diamati`);
  await expect(page.getByRole('region',{name:'Hasil pengamatan eksperimen',exact:true})).toContainText('transmisi T diperiksa');
  await page.reload(); await expect(page.getByRole("heading",{name:"PEMBELAJARAN SELESAI",exact:true})).toBeVisible(); expect(errors).toEqual([]);
});

test("unsafe history survives reload and machine reset; explicit experiment retry keeps exploration and assembly",async({page})=>{
  await seed(page,save({ observations: { operated:true,motionObserved:true,transmissionInspected:true,production:4,peakPressure:78,unsafeCount:1,elapsed:7,legacyCompleted:false } }));
  await expect(page.getByRole('tab',{name:/Refleksi/})).toBeDisabled();
  await page.getByRole('button',{name:'Reset mesin',exact:true}).click(); await expect(page.getByRole('button',{name:'Lanjut ke Refleksi',exact:true})).toBeDisabled();
  await page.reload(); await expect(page.getByRole('button',{name:'Lanjut ke Refleksi',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Ulangi eksperimen',exact:true}).click();
  await expect(page.getByText('Eksplorasi selesai · 5/5 komponen', { exact: true })).toBeVisible();
  await expect(page.getByRole('button',{name:'Nyalakan mesin',exact:true})).toBeEnabled();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('revo:industry-1:progress')!).observations.unsafeCount)).toBe(0);
});

test("six lecturer viewports preserve readable objectives and fullscreen workspace with internal scrolling",async({page})=>{
  test.setTimeout(120_000); const folder='test-results/revo/revo-008r1/after';await mkdir(folder,{recursive:true});
  for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1280,720],[390,844],[320,568]]){
    await page.setViewportSize({width,height});await page.goto('/revo-lab/industry-1/briefing'); await noScroll(page);
    const objectives=page.getByRole('heading',{name:'TUJUAN PEMBELAJARAN',exact:true});await objectives.scrollIntoViewIfNeeded();await expect(objectives).toBeInViewport();
    await page.screenshot({path:`${folder}/${width}-briefing.png`});
    await seed(page,save()); await expect(page.locator('.revo-scene canvas')).toBeVisible(); await expect(page.getByRole('button',{name:'Jelajahi Ketel uap',exact:true})).toBeVisible(); await page.waitForTimeout(300); await noScroll(page);
    const scene=await page.locator('.revo-scene canvas').boundingBox();expect(scene!.height).toBeGreaterThan(110);
    await page.screenshot({path:`${folder}/${width}-lab.png`});
    await page.getByRole('button',{name:'Tujuan Pembelajaran',exact:true}).click();await noScroll(page);await page.screenshot({path:`${folder}/${width}-objectives.png`});await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Nyalakan mesin',exact:true}).click();await expect(page.getByRole('button',{name:'Hentikan mesin',exact:true})).toBeVisible();await noScroll(page);
  }
});


test("transmission learning remains reachable when WebGL is lost",async({page})=>{
  await seed(page,save());
  await expect(page.getByRole('button',{name:'Jelajahi Ketel uap',exact:true})).toBeVisible();
  await page.locator('.revo-scene canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  await expect(page.getByText('Tampilan 3D belum tersedia', {exact:true})).toBeVisible();
  const transmission=page.getByRole('button',{name:'Pelajari transmisi tenaga (T)',exact:true});
  await transmission.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'Transmisi Tenaga',exact:true})).toContainText('sabuk, dan poros transmisi');
  await page.getByRole('button',{name:'Kembali ke mesin',exact:true}).click();
  await page.getByRole('button',{name:'Nyalakan mesin',exact:true}).click();
  await expect(page.getByRole('button',{name:'Lanjut ke Refleksi',exact:true})).toBeEnabled();
  await noScroll(page);
});
