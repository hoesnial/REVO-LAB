import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { REVO_ROUTES } from "@/lib/revo/routes";

export default function RevoNotFound() {
  return <main className="revo-flow-screen revo-unavailable" lang="id"><LockKeyhole size={34} /><p className="revo-flow-eyebrow">REVO — PERJALANAN BELUM TERBUKA</p><h1>Era ini belum tersedia.</h1><p>Saat ini kamu dapat menjelajahi Revolusi Industri 1.0.</p><Link href={REVO_ROUTES.eraSelect} className="revo-menu-start"><ArrowLeft size={16} />Kembali ke Pilih Era</Link></main>;
}
