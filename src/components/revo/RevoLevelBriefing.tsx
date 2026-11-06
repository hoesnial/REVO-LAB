import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import RevoLearningObjectives from "./RevoLearningObjectives";
import { REVO_ROUTES } from "@/lib/revo/routes";
import factoryPreview from "../../../public/revo/factory-preview.png";
import RevoScreenHeader from "./RevoScreenHeader";

export default function RevoLevelBriefing() {
  return <main className="revo-flow-screen revo-briefing-screen" lang="id" aria-label="Briefing Revolusi Industri 1.0">
    <RevoScreenHeader step="02 / PERSIAPAN PENJELAJAH" />
    <div className="revo-briefing-body revo-flow-entrance">
      <div className="revo-briefing-copy">
        <section className="revo-briefing-reading" aria-label="Ringkasan level dan tujuan pembelajaran" tabIndex={0}>
          <p className="revo-flow-eyebrow">INDUSTRY 1.0 — REVOLUSI INDUSTRI PERTAMA</p>
          <h1 aria-label="THE AGE OF STEAM">THE AGE OF STEAM<span aria-hidden="true">.</span></h1>
          <p className="revo-briefing-subtitle">Era Mekanisasi</p>
          <p className="revo-briefing-intro">Masuki era ketika tenaga uap membantu mengubah cara manusia memproduksi barang.</p>
          <RevoLearningObjectives />
          <p className="revo-briefing-path">Alur belajar: Eksplorasi → Perakitan → Eksperimen → Refleksi → Rangkuman.</p>
        </section>
        <div className="revo-briefing-actions"><Link href={REVO_ROUTES.simulator} className="revo-menu-start">Mulai Simulasi<ArrowRight size={19} /></Link><Link href={REVO_ROUTES.eraSelect} className="revo-flow-back"><ArrowLeft size={14} />Kembali ke Pilih Era</Link></div>
        <p className="revo-briefing-session-note">Sudah memulai percobaan? Progresmu akan dilanjutkan.</p>
      </div>
      <figure className="revo-briefing-visual"><div className="revo-briefing-visual-label"><span>ERA 01</span><span>1760 — 1840</span></div><div className="revo-briefing-factory"><Image src={factoryPreview} alt="Mesin uap dan mesin tekstil dalam diorama pabrik Revolusi Industri pertama." fill sizes="(max-width: 760px) 100vw, 52vw" loading="eager" /></div><figcaption><span>DARI PANAS MENJADI GERAK</span><strong>Sebuah mesin.<br />Awal jutaan perubahan.</strong><p>Jelajahi komponen, hidupkan pabrik,<br />lalu pikirkan dampaknya bagi masyarakat.</p></figcaption><span className="revo-briefing-visual-index" aria-hidden="true">01</span></figure>
    </div>
    <footer className="revo-flow-footer revo-briefing-footer"><span>Simulasi edukasi sederhana. Skala 0–100, bukan ukuran termodinamika nyata.</span><span className="revo-flow-school">REVO — JELAJAH REVOLUSI INDUSTRI</span></footer>
  </main>;
}
