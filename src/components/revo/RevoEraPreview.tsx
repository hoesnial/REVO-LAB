import Image from "next/image";
import type { EraId } from "@/lib/revo/eras";
import EraIllustration from "./EraIllustration";

const previews = {
  "industry-1": "Diorama pabrik Revolusi Industri pertama: ketel uap, roda gila, dan mesin tenun.",
  "industry-2": "Diorama pabrik Revolusi Industri kedua: motor listrik, transmisi, dan konveyor.",
} as const;

export default function RevoEraPreview({ era, sizes }: { era: EraId; sizes: string }) {
  if (era === "industry-3" || era === "industry-4") return <EraIllustration era={era} />;
  return <Image src={`/revo/${era}-preview.webp`} alt={previews[era]} fill sizes={sizes} loading="eager" />;
}
