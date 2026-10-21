import type { Metadata } from "next";
import RevoLevelBriefing from "@/components/revo/RevoLevelBriefing";

export const metadata: Metadata = { title: "The Age of Steam — Persiapan | REVO", description: "Kenali tujuan pembelajaran dan misi di era mekanisasi sebelum memasuki laboratorium mesin uap." };

export default function SteamBriefingPage() {
  return <RevoLevelBriefing />;
}
