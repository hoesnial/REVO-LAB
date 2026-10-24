import { expect, type Page } from "@playwright/test";

export const assemblyParts = [
  ["boiler", "Ketel uap"], ["pipe", "Pipa uap"], ["piston", "Mekanisme piston"], ["flywheel", "Roda gila"], ["textile", "Mesin tekstil"],
] as const;
export const correctAssemblyAnswers = [
  "Ketel memanaskan air dengan panas pembakaran.",
  "Batang penghubung dan engkol mengubah gerak bolak-balik; roda gila membantu menjaga putaran.",
  "Mesin dapat digerakkan tanpa bergantung sepenuhnya pada tenaga aliran sungai.",
];
export async function openAssembly(page: Page) {
  await page.goto("/revo-lab/industry-1");
  await expect(page.locator(".revo-scene canvas")).toBeVisible();
  const list = page.getByLabel("Pilih komponen mesin", { exact: true });
  for (const name of ["Ketel uap", "Roda gila", "Piston", "Pipa uap", "Mesin tekstil"]) await list.getByRole("button", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "Lanjut ke perakitan", exact: true }).click();
  await expect(page.getByRole("tab", { name: /Perakitan/ })).toHaveAttribute("aria-selected", "true");
}
export async function placeAssemblyPart(page: Page, id: string, name: string) {
  await page.getByRole("button", { name: `Pilih ${name}`, exact: true }).click();
  await page.getByLabel("Sambungan tujuan", { exact: true }).selectOption(id);
  await page.getByRole("button", { name: "Pasang komponen", exact: true }).click();
}
export async function finishAssembly(page: Page) {
  await page.getByRole("button", { name: "Lanjut ke perakitan", exact: true }).click();
  for (const [id, name] of assemblyParts) await placeAssemblyPart(page, id, name);
  for (const answer of correctAssemblyAnswers) await page.getByRole("button", { name: answer, exact: true }).click();
  await expect(page.getByRole("heading", { name: "PERAKITAN SELESAI", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "UJI MESIN", exact: true }).click();
  await expect(page.getByRole("button", { name: "Nyalakan mesin", exact: true })).toBeEnabled();
}
