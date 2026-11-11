import { expect, type Page } from "@playwright/test";

export const assemblyParts = [
  ["boiler", "Ketel uap"], ["pipe", "Pipa uap"], ["piston", "Mekanisme piston"], ["flywheel", "Roda gila"], ["textile", "Mesin tekstil"],
] as const;
export const correctAssemblyAnswers = [
  "Ketel memanaskan air dengan panas pembakaran.",
  "Batang penghubung meneruskan gerakan piston ke engkol yang mengubahnya menjadi gerak putar, sedangkan roda gila membantu menjaga kestabilan putaran.",
  "Mesin dapat digerakkan tanpa bergantung sepenuhnya pada tenaga aliran sungai.",
];
export async function openAssembly(page: Page) {
  await page.goto("/revo-lab/industry-1");
  await expect(page.locator(".revo-scene canvas")).toBeVisible();
  const list = page.getByLabel("Pilih komponen mesin", { exact: true });
  for (const name of ["Ketel uap", "Roda gila", "Piston", "Pipa uap", "Mesin tekstil"]) await list.getByRole("button", { name: new RegExp(name) }).click();
  await page.getByRole("button", { name: "Lanjut ke Perakitan", exact: true }).click();
  await expect(page.getByRole("tab", { name: /Perakitan/ })).toHaveAttribute("aria-selected", "true");
  await settleAssemblyView(page);
}
export async function settleAssemblyView(page: Page) {
  // Projected labels are pointer-transparent. Wait for their coordinates to
  // settle after the canvas resize before measuring a real 3D drag anchor.
  let previous = "", stable = 0;
  await expect.poll(async () => {
    const next = await page.locator('[data-tray="boiler"]').getAttribute("style") ?? "";
    stable = next && next === previous ? stable + 1 : 0;
    previous = next;
    return stable;
  }, { intervals: [100, 100, 100] }).toBeGreaterThanOrEqual(2);
}
export async function placeAssemblyPart(page: Page, id: string, name: string) {
  await page.getByRole("button", { name: `Pilih ${name}`, exact: true }).click();
  await page.getByLabel("Sambungan tujuan", { exact: true }).selectOption(id);
  await page.getByRole("button", { name: "Pasang komponen", exact: true }).click();
}
export async function finishAssembly(page: Page) {
  await page.getByRole("button", { name: "Lanjut ke Perakitan", exact: true }).click();
  for (const [id, name] of assemblyParts) await placeAssemblyPart(page, id, name);
  for (const answer of correctAssemblyAnswers) await page.getByRole("button", { name: answer, exact: true }).click();
  await expect(page.getByRole("heading", { name: "PERAKITAN SELESAI", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "UJI MESIN", exact: true }).click();
  await expect(page.getByRole("button", { name: "Nyalakan mesin", exact: true })).toBeEnabled();
}
