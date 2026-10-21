import { REVO_ROUTES } from "./routes";

// A non-null briefing route is the single availability flag. Unfinished eras
// have stable IDs for presentation, but no navigation destination or gameplay.
export const ERAS = [
  { id: "industry-1", number: "01", label: "INDUSTRY 1.0", title: "THE AGE OF STEAM", description: "Era mekanisasi dan perkembangan tenaga uap.", theme: "Tenaga uap · Mekanisasi", briefingHref: REVO_ROUTES.briefing },
  { id: "industry-2", number: "02", label: "INDUSTRY 2.0", title: "THE AGE OF ELECTRICITY", description: "Era tenaga listrik dan produksi massal.", theme: "Tenaga listrik · Produksi massal", briefingHref: null },
  { id: "industry-3", number: "03", label: "INDUSTRY 3.0", title: "THE AGE OF AUTOMATION", description: "Era komputer dan otomatisasi industri.", theme: "Komputer · Otomatisasi", briefingHref: null },
  { id: "industry-4", number: "04", label: "INDUSTRY 4.0", title: "THE AGE OF INTELLIGENCE", description: "Era konektivitas, data, dan sistem cerdas.", theme: "Konektivitas · Sistem cerdas", briefingHref: null },
] as const;

export type EraId = typeof ERAS[number]["id"];

export const STEAM_LEARNING_OBJECTIVES = [
  "Mengenal komponen utama mesin uap.",
  "Memahami mekanisasi dalam perkembangan industri.",
  "Mengoperasikan simulasi mesin uap.",
  "Menjelaskan dampak perkembangan teknologi terhadap produksi dan masyarakat.",
] as const;
