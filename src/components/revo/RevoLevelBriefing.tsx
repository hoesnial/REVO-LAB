import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Flag, ScanSearch } from "lucide-react";
import { STEAM_LEARNING_OBJECTIVES } from "@/lib/revo/eras";
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
          <h1 aria-label="THE AGE OF STEAM">THE AGE<br />OF STEAM<span aria-hidden="true">.</span></h1>
          <p className="revo-briefing-subtitle">Era Mekanisasi</p>
          <p className="revo-briefing-intro">Masuki era ketika tenaga uap membantu mengubah cara manusia memproduksi barang.</p>
          <div className="revo-briefing-objectives"><h2><ScanSearch size={15} />TUJUAN PEMBELAJARAN</h2><ol>{STEAM_LEARNING_OBJECTIVES.map((objective, index) => <li key={objective}><span aria-hidden="true">0{index + 1}</span>{objective}</li>)}</ol></div>
          <section className="revo-briefing-mission" aria-labelledby="revo-briefing-mission-title"><span className="revo-briefing-flag"><Flag size={19} /></span><div><h2 id="revo-briefing-mission-title">MISIMU DI ERA INI</h2><p>Kenali lima komponen mesin, lalu hasilkan 100 unit produksi tanpa melewati batas tekanan aman.</p><span>100 UNIT KAIN <i />TEKANAN ≤ 75</span></div></section>
        </section>
        <div className="revo-briefing-actions"><Link href={REVO_ROUTES.simulator} className="revo-menu-start">Mulai Simulasi<ArrowRight size={19} /></Link><Link href={REVO_ROUTES.eraSelect} className="revo-flow-back"><ArrowLeft size={14} />Kembali ke Pilih Era</Link></div>
        <p className="revo-briefing-session-note">Sudah memulai percobaan? Progresmu akan dilanjutkan.</p>
      </div>
      <figure className="revo-briefing-visual"><div className="revo-briefing-visual-label"><span>ERA 01</span><span>1760 — 1840</span></div><div className="revo-briefing-factory"><Image src={factoryPreview} alt="Mesin uap dan mesin tekstil dalam diorama pabrik Revolusi Industri pertama." fill sizes="(max-width: 760px) 100vw, 52vw" loading="eager" /></div><figcaption><span>DARI PANAS MENJADI GERAK</span><strong>Sebuah mesin.<br />Awal jutaan perubahan.</strong><p>Jelajahi komponen, hidupkan pabrik,<br />lalu pikirkan dampaknya bagi masyarakat.</p></figcaption><span className="revo-briefing-visual-index" aria-hidden="true">01</span></figure>
    </div>
    <footer className="revo-flow-footer revo-briefing-footer"><span>Simulasi edukasi sederhana. Skala 0–100, bukan ukuran termodinamika nyata.</span><span className="revo-flow-school">REVO — JELAJAH REVOLUSI INDUSTRI</span></footer>
  </main>;
}
