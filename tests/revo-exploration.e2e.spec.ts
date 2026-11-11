import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

async function enter(page: Page, era: number) {
  await page.goto(`/revo-lab/industry-${era}/briefing`);
  await page.getByRole("link", { name: "Mulai Eksplorasi", exact: true }).click();
}
const factory = (page: Page) => page.locator(".revo-exploration");
const canvas = (page: Page) => factory(page).locator("canvas");
const parts = (page: Page, era: number) => page.locator(era === 1 ? ".revo-component-list" : ".electric-parts").getByRole("button");
const card = (page: Page) => factory(page).getByRole("region", { name: "Informasi komponen" });
async function completeExploration(page: Page, era: number) {
  const total = era === 1 ? 5 : 7;
  await expect(parts(page, era)).toHaveCount(total);
  for (let index = 0; index < total; index += 1) await parts(page, era).nth(index).click();
}
async function fits(page: Page) {
  expect(await page.evaluate(() => [document.documentElement.scrollWidth - innerWidth, document.documentElement.scrollHeight - innerHeight])).toEqual([0, 0]);
}
async function separated(page: Page, mobile: boolean) {
  await expect(async () => {
    const scene = (await canvas(page).boundingBox())!;
    const host = (await factory(page).locator(".revo-scene, .electric-canvas").boundingBox())!;
    expect(Math.abs(scene.width - host.width)).toBeLessThan(1);
    expect(Math.abs(scene.height - host.height)).toBeLessThan(1);
    const inspector = (await card(page).boundingBox())!;
    if (mobile) expect(scene.y + scene.height).toBeLessThanOrEqual(inspector.y + 1);
    else expect(scene.x + scene.width).toBeLessThanOrEqual(inspector.x + 1);
    expect(scene.height).toBeGreaterThan(80);
  }).toPass();

}
for (const era of [1, 2]) {
  test(`era ${era}: floating card, responsive sheet, progress, resize and keyboard`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await enter(page, era);
    await expect(canvas(page)).toBeVisible();
    await page.getByRole("link", { name: "Langsung ke daftar komponen" }).press("Enter");
    await expect(page.locator(era === 1 ? "#revo-explore-parts" : "#electric-controls")).toBeFocused();
    await expect(page.getByRole("heading", { name: "Kendali Mesin", exact: true })).not.toBeVisible();
    for (const [width, height] of [[1440,900], [1280,720], [390,844], [320,568]]) {
      await page.setViewportSize({ width, height });
      await parts(page, era).first().press("Enter");
      await expect(card(page)).toBeVisible();
      await separated(page, width < 721);
      if (width === 1280 && height === 720) {
        const controls = page.locator(era === 1 ? ".revo-camera-tools" : ".electric-camera-controls");
        const cardBounds = (await card(page).boundingBox())!;
        const controlBounds = (await controls.boundingBox())!;
        const overlaps = controlBounds.x < cardBounds.x + cardBounds.width && controlBounds.x + controlBounds.width > cardBounds.x && controlBounds.y < cardBounds.y + cardBounds.height && controlBounds.y + controlBounds.height > cardBounds.y;
        expect(overlaps).toBe(false);
      }
      if (era === 2) {
        for (const name of ["Listrik", "Mekanis", "Material"]) {
          const path = page.getByRole("button", { name, exact: true });
          await path.click();
          await expect(path).toHaveAttribute("aria-pressed", "true");
          await expect(page.locator(".electric-flow-caption")).toBeVisible();
          await separated(page, width < 721);
          await expect(page.getByRole("button", { name: "Atur ulang kamera" })).toBeInViewport();
        }
        await page.getByRole("button", { name: "Material", exact: true }).click();
      }
      await expect(page.getByRole("button", { name: "Reset kamera", exact: true }).or(page.getByRole("button", { name: "Atur ulang kamera", exact: true }))).toBeInViewport();
      if (width < 721) {
        await page.getByRole("button", { name: "Perluas informasi komponen" }).click();
        if (width <= 360 && height <= 620) {
          await expect(canvas(page)).toBeHidden();
          await expect(page.getByRole("button", { name: "Ringkas informasi komponen" })).toContainText("Kembali ke model");
        } else {
          await separated(page, true);
        }
        await card(page).evaluate(el => el.scrollTop = el.scrollHeight);
        await parts(page, era).first().click();
        await expect.poll(() => card(page).evaluate(el => el.scrollTop)).toBe(0);
        await expect(card(page).getByRole("heading")).toBeInViewport();
        if (width <= 360 && height <= 620) {
          await expect(canvas(page)).toBeVisible();
          await expect(async () => expect((await canvas(page).boundingBox())!.height).toBeGreaterThan(100)).toPass();
        }
        await page.getByRole("button", { name: "Perluas informasi komponen" }).click();
        await page.getByRole("button", { name: "Ringkas informasi komponen" }).click();
      }
      await page.getByRole("button", { name: "Jelajahi komponen berikutnya" }).click();
      await expect(parts(page, era).nth(1)).toHaveAttribute("aria-pressed", "true");
      await card(page).focus(); await page.keyboard.press("Escape");
      await expect(card(page)).toHaveCount(0);
      await expect(parts(page, era).nth(1)).toBeFocused();
      await fits(page);
    }
    for (const button of await parts(page, era).all()) await button.click();
    if (era === 1) await expect(page.getByRole("tab", { name: /Perakitan/ })).toBeEnabled();
    else await expect(page.getByRole("link", { name: "Mulai Perakitan" })).toBeVisible();
    const key = `revo:industry-${era}:progress`;
    await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? "{}").explored?.length, key)).toBe(era === 1 ? 5 : 7);
    await page.getByRole("link", { name: "Kembali ke Menu", exact: true }).click();
    await expect(page).toHaveURL("/revo-lab");
    expect(errors).toEqual([]);
  });

  test(`era ${era}: real orbit, zoom and reset preserve image composition`, async ({ page }) => {
    await enter(page, era); await expect(canvas(page)).toBeVisible();
    const image = async () => sharp(await canvas(page).screenshot()).resize(160,100).removeAlpha().raw().toBuffer();
    await expect.poll(async () => { const stats = await sharp(await canvas(page).screenshot()).stats(); return Math.max(...stats.channels.map(channel => channel.stdev)); }).toBeGreaterThan(15);
    await page.getByRole("button", { name: era === 1 ? "Reset kamera" : "Atur ulang kamera", exact: true }).click();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const original = await image();
    const diff = async () => (await image()).reduce((total, c, i) => total + Math.abs(c-original[i]), 0) / original.length;
    const box = (await canvas(page).boundingBox())!;
    await page.mouse.move(box.x+box.width*.7, box.y+box.height*.7); await page.mouse.down();
    await page.mouse.move(box.x+box.width*.7+70, box.y+box.height*.7, {steps:6}); await page.mouse.up();
    await expect.poll(diff).toBeGreaterThan(1);
    await parts(page, era).first().click();
    await page.getByRole("button", { name: "Tutup informasi komponen" }).click();
    await expect.poll(diff).toBeGreaterThan(1); // closing the card preserves orbit
    await page.getByRole("button", { name: era === 1 ? "Reset kamera" : "Atur ulang kamera", exact: true }).click();
    await expect.poll(diff).toBeLessThan(.5);
    await page.getByRole("button", { name: "Perkecil tampilan" }).click();
    await expect.poll(diff).toBeGreaterThan(1);
  });

  for (const [width, height] of [[1440,900], [1280,720], [390,844], [320,568]]) {
    test(`era ${era}: completion dock and Assembly navigation fit ${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await enter(page, era);
      await expect(page.getByRole("heading", { name: era === 1 ? "Kenali Mesin Uap" : "Kenali Pabrik Listrik", exact: true })).toBeVisible();
      await expect(page.getByText("Pilih titik pada model untuk mempelajari komponen dan fungsinya.", { exact: true })).toBeVisible();
      await expect(page.locator(era === 1 ? ".revo-location" : ".revo-explore-count")).toContainText(`0/${era === 1 ? 5 : 7}`);

      await completeExploration(page, era);
      const total = era === 1 ? 5 : 7;
      const label = `Eksplorasi selesai · ${total}/${total} komponen`;
      const dock = page.getByRole("region", { name: label, exact: true });
      await expect(page.locator(era === 1 ? ".revo-location" : ".revo-explore-count")).toHaveCount(0);
      await expect(dock).toBeVisible();
      await expect(dock).toBeInViewport({ ratio: 1 });
      await expect(dock.getByText(label, { exact: true })).toHaveCount(1);
      const action = dock.getByRole(era === 1 ? "button" : "link", { name: "Lanjut ke Perakitan", exact: true });
      await expect(action).toBeVisible();
      await expect(action).toBeInViewport({ ratio: 1 });

      if (width < 721) {
        await page.getByRole("button", { name: "Perluas informasi komponen" }).click();
        await expect(action).toBeInViewport({ ratio: 1 });
        if (width <= 360 && height <= 620) {
          await expect(canvas(page)).toBeHidden();
          await page.getByRole("button", { name: "Ringkas informasi komponen" }).click();
          await expect(canvas(page)).toBeVisible();
        }
      }
      await expect(async () => {
        const dockBox = (await dock.boundingBox())!;
        const protectedUi = era === 1
          ? page.locator(".revo-scene-bottom, .revo-component-list, .revo-component-info")
          : page.locator(".electric-scene-tools, .electric-parts, .electric-detail");
        for (let index = 0; index < await protectedUi.count(); index += 1) {
          const item = protectedUi.nth(index);
          if (!await item.isVisible()) continue;
          const box = await item.boundingBox();
          if (box) expect(box.y + box.height).toBeLessThanOrEqual(dockBox.y + 1);
        }
      }).toPass();
      await fits(page);

      await action.click();
      if (era === 1) {
        await expect(page).toHaveURL("/revo-lab/industry-1");
        await expect(page.getByRole("tab", { name: /Perakitan/ })).toHaveAttribute("aria-selected", "true");
      } else {
        await expect(page).toHaveURL("/revo-lab/industry-2/assembly");
        await expect(page.getByRole("heading", { name: "Rakit penggerak konveyor" })).toBeVisible();
      }
    });
  }
}
test.describe("touch and WebGL fallback", () => {
 test.use({ viewport: {width:320,height:568}, hasTouch:true, isMobile:true });
 test("both eras retain touch sheet controls and keyboard content without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      return type.startsWith("webgl") ? null : Reflect.apply(getContext, this, [type,...args]);
    } as typeof getContext;
  });
  for (const era of [1,2]) {
    await enter(page, era);
    await parts(page, era).first().tap();
    await expect(card(page)).toBeVisible();
    await page.getByRole("button", {name:"Perluas informasi komponen"}).tap();
    await page.getByRole("button", {name:"Tutup informasi komponen"}).tap();
    await expect(card(page)).toHaveCount(0);
    await fits(page);
  }
 });
});

test.describe("real touch picking", () => {
 test.use({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true });
 test("uap: hotspot tap opens information; hovering alone does not inspect", async ({ page }) => {
   await enter(page,1);
   const hotspot = page.getByRole("button",{name:"Jelajahi Ketel uap",exact:true});
   await hotspot.hover();
   await expect(card(page)).toHaveCount(0);
   await hotspot.tap();
   await expect(card(page).getByRole("heading",{name:"Ketel uap",exact:true})).toBeVisible();
   await page.getByRole("button",{name:"Tutup informasi komponen"}).tap();
   await expect(card(page)).toHaveCount(0);
 });
 test("listrik: geometry can be selected directly on the touch canvas", async ({ page }) => {
   await enter(page,2);
   await expect(canvas(page)).toBeVisible();
   const { OrthographicCamera, Vector3 } = await import("three");
   await expect(async () => {
     const box = (await canvas(page).boundingBox())!;
     const view = new OrthographicCamera(-box.width/2,box.width/2,box.height/2,-box.height/2,.1,70);
     view.position.set(11,11,14); view.lookAt(0,2,0);
     view.updateMatrixWorld();
     const right = new Vector3(1,0,0).applyQuaternion(view.quaternion);
     const up = new Vector3(0,1,0).applyQuaternion(view.quaternion);
     const span = (v: InstanceType<typeof Vector3>) => Math.abs(v.x)*6+Math.abs(v.y)*2.8+Math.abs(v.z)*3.65;
     view.zoom = Math.min(box.width/(2*span(right)),box.height/(2*span(up)))*.92*.94;
     view.updateProjectionMatrix();
     const point = new Vector3(-4.15,.96,-1.08).project(view);
     await page.touchscreen.tap(box.x+(point.x+1)*box.width/2,box.y+(1-point.y)*box.height/2);
     await expect(card(page).getByRole("heading",{name:"Pasokan listrik"})).toBeVisible({timeout:700});
   }).toPass();
 });
});
