import type { Metadata } from "next";
import RevoMainMenu from "@/components/revo/RevoMainMenu";

export const metadata: Metadata = {
  title: "REVO — Jelajah Revolusi Industri",
  description: "Jelajahi sejarah. Hidupkan teknologi. Rasakan perubahannya. Pengalaman belajar interaktif Revolusi Industri.",
};

export default function RevoMenuPage() {
  return <RevoMainMenu />;
}
