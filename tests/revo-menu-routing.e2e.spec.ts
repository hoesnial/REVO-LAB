import { expect, test } from "@playwright/test";

for (const era of ["industry-1", "industry-2"] as const) {
  test(`Main Menu → Briefing ${era} → Back returns to canonical menu`, async ({ page }) => {
    await page.goto("/revo-lab");
    await expect(page.getByRole("main", { name: "Menu utama REVO" })).toBeVisible();
    await page.getByRole("link", { name: era === "industry-1" ? "Jelajahi Industri 1.0" : "Jelajahi Industri 2.0" }).click();
    await expect(page).toHaveURL(`/revo-lab/${era}/briefing`);
    const original = `saved-${era}`;
    await page.evaluate(value => localStorage.setItem("revo:test-routing", value), original);
    await page.getByRole("link", { name: "Kembali ke Menu Utama" }).click();
    await expect(page).toHaveURL("/revo-lab");
    await expect(page.getByRole("main", { name: "Menu utama REVO" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Jelajah Revolusi Industri" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("revo:test-routing"))).toBe(original);
    await page.goBack();
    await expect(page).toHaveURL(`/revo-lab/${era}/briefing`);
    await page.goForward();
    await expect(page).toHaveURL("/revo-lab");
  });
}

test("legacy era route redirects to Main Menu and stays out of browser history", async ({ page }) => {
  await page.goto("/revo-lab/eras");
  await expect(page).toHaveURL("/revo-lab");
  await expect(page.getByRole("main", { name: "Menu utama REVO" })).toBeVisible();
  await page.goBack();
  await expect(page).not.toHaveURL(/\/revo-lab\/eras$/);
});

test("mobile Main Menu can enter a briefing and return to Main Menu", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/revo-lab");
  await page.getByRole("link", { name: "Jelajahi Industri 1.0" }).click();
  await expect(page).toHaveURL("/revo-lab/industry-1/briefing");
  await page.getByRole("link", { name: "Kembali ke Menu Utama" }).click();
  await expect(page).toHaveURL("/revo-lab");
  await expect(page.getByRole("main", { name: "Menu utama REVO" })).toBeVisible();
});
