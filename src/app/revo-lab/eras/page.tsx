import type { Metadata } from "next";
import RevoEraSelection from "@/components/revo/RevoEraSelection";

export const metadata: Metadata = { title: "Pilih Era — REVO", description: "Mainkan Industry 1.0 atau buka briefing dan eksplorasi Industry 2.0." };

export default function EraSelectionPage() {
  return <RevoEraSelection />;
}
