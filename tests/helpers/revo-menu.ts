import { expect, type Page } from "@playwright/test";

export async function openEraSelection(page: Page) {
  await page.getByRole("button", { name: "Progres Saya", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Progres Saya" });
  const selectEra = dialog.getByRole("link", { name: "Pilih Era", exact: true });
  await expect(selectEra).toHaveAttribute("href", "/revo-lab");
  await selectEra.click();
  await expect(page).toHaveURL(/\/revo-lab$/);
  // The canonical destination is the current page, so navigation retains the dialog.
  await dialog.getByRole("button", { name: "Tutup dialog" }).click();
  await expect(dialog).toHaveCount(0);
}
