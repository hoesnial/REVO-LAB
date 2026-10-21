import type { Metadata } from "next";
import RevoEraSelection from "@/components/revo/RevoEraSelection";

export const metadata: Metadata = { title: "Pilih Era — REVO", description: "Jelajahi empat revolusi industri, dari tenaga uap hingga sistem cerdas. Industry 1.0 kini tersedia." };

export default function EraSelectionPage() {
  return <RevoEraSelection />;
}
