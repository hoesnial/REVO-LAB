import type { Page } from "@playwright/test";

export async function openEraSelection(page: Page) {
  await page.getByRole("button", { name: "Progres Saya", exact: true }).click();
  await page.getByRole("dialog", { name: "Progres Saya" }).getByRole("link", { name: "Pilih Era", exact: true }).click();
}
