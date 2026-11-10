"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CircleHelp, Cog, Factory, Hand, MousePointer2, ScanSearch, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { electricResumeRoute, REVO_ROUTES } from "@/lib/revo/routes";
import { hasSavedProgress } from "@/lib/revo/progress";
import { electricResumeLabel } from "@/lib/revo/industry-2/progress";
import factoryPreview from "../../../public/revo/factory-preview.png";
import RevoDialog from "./RevoDialog";
import { useRevoProgress } from "./RevoProgressProvider";
import { useElectricProgress } from "./industry-2/ElectricProgressProvider";

const instructions = [
  { icon: Hand, title: "Putar sudut pandang", text: "Klik dan geser diorama untuk memutar kamera. Di layar sentuh, geser dengan satu jari." },
  { icon: MousePointer2, title: "Lihat lebih dekat", text: "Gulir roda tetikus atau cubit dengan dua jari untuk memperbesar dan memperkecil. Tombol +, −, dan Reset kamera juga tersedia." },
  { icon: ScanSearch, title: "Kenali setiap komponen", text: "Klik penanda bernomor pada mesin atau pilih tombol komponen untuk membaca fungsi dan perannya. Semua tombol dapat dijangkau dengan Tab. Setelah 5/5, buka Perakitan: seret bagian dari baki 3D atau pilih komponen, sambungan, lalu Pasang komponen. Selesaikan tiga cek pemahaman sebelum memilih UJI MESIN." },
  { icon: SlidersHorizontal, title: "Hidupkan mesin uap", text: "Tekan Nyalakan mesin. Tambahkan air saat menipis, atur bahan bakar, dan lepaskan tekanan bila perlu. Perhatikan perubahan panas, tekanan, dan kecepatan." },
  { icon: ShieldCheck, title: "Amati dan refleksikan", text: "Amati gerak dan hasil produksi dengan tekanan model ≤75. Periksa transmisi tenaga T, lalu hubungkan pengamatanmu dengan perubahan industri." },
];

export default function RevoMainMenu() {
  const [helpOpen, setHelpOpen] = useState(false);
  const { hydrated, progress, storageStatus } = useRevoProgress();
  const { progress: electric, status: electricStatus } = useElectricProgress();
  const resumeElectric = electric && electric.stage !== "briefing" ? electric : null;
  const canResumeSteam = hydrated && hasSavedProgress(progress) ? progress : null;
  const saveWarning = storageStatus === "unavailable" || electricStatus === "unavailable"
    ? "Penyimpanan perangkat tidak tersedia. Progres sesi dapat hilang saat halaman dimuat ulang."
    : storageStatus === "malformed" || storageStatus === "unsupported" || electricStatus === "invalid"
      ? "Ada simpanan era yang tidak dapat dibuka. Mulai perjalanan baru di era tersebut."
      : "";

  return <main className="revo-menu" lang="id" aria-label="Menu utama REVO">
    <div className="revo-menu-left">
      <div className="revo-menu-brand" aria-label="REVO"><span><Cog size={23} strokeWidth={2.2} /></span><strong>REVO<sup>®</sup></strong></div>
      <div className="revo-menu-copy">
        <p className="revo-menu-eyebrow">REVO — INTERACTIVE LEARNING EXPERIENCE</p>
        <h1 aria-label="REVO — Jelajah Revolusi Industri"><span className="revo-menu-wordmark">REVO<span aria-hidden="true">●</span></span><span className="revo-menu-jelajah">JELAJAH</span><span className="revo-menu-title">REVOLUSI<br /> INDUSTRI</span></h1>
        <p className="revo-menu-description">Jelajahi sejarah. Hidupkan teknologi.<br />Rasakan perubahannya.</p>
        <div className="revo-menu-actions">
          <Link href={REVO_ROUTES.eraSelect} className="revo-menu-start">Mulai Jelajah<ArrowRight size={20} /></Link>
          <button className="revo-menu-help" onClick={() => setHelpOpen(true)}><CircleHelp size={16} />Cara Bermain</button>
        </div>
        {(canResumeSteam || resumeElectric) && <nav className="revo-menu-resume" aria-label="Lanjutkan progres per era">
          {canResumeSteam && <Link href={REVO_ROUTES.simulator} className="revo-menu-continue" aria-label={canResumeSteam.levelComplete && canResumeSteam.checkpoint === 4 ? "Lihat Hasil" : "Lanjutkan"} aria-describedby="revo-resume-steam">
            <span id="revo-resume-steam">Industry 1.0</span>{canResumeSteam.levelComplete && canResumeSteam.checkpoint === 4 ? "Lihat Hasil" : "Lanjutkan"}<ArrowRight size={16} aria-hidden="true" />
          </Link>}
          {resumeElectric && <Link href={electricResumeRoute(resumeElectric.stage)} className="revo-menu-continue">
            <span>Industry 2.0</span>{electricResumeLabel(resumeElectric)}<ArrowRight size={16} aria-hidden="true" />
          </Link>}
        </nav>}
        <p className="revo-menu-session-note" role={saveWarning ? "status" : undefined}>
          {saveWarning || (canResumeSteam || resumeElectric ? "Progres setiap era tersimpan secara terpisah." : "Pilih satu era untuk memulai perjalanan.")}
        </p>
      </div>
    </div>
    <figure className="revo-menu-visual">
      <div className="revo-menu-visual-top"><span><i />SEBUAH PERJALANAN MENEMBUS WAKTU</span><ArrowUpRight size={19} /></div>
      <div className="revo-menu-factory">
        <Image src={factoryPreview} alt="Diorama pabrik Revolusi Industri pertama dengan ketel uap hijau, roda gila, cerobong bata, dan mesin tenun." fill sizes="(max-width: 730px) 100vw, 60vw" loading="eager" />
      </div>
      <figcaption className="revo-menu-caption"><div><span className="revo-menu-caption-label">DARI TENAGA UAP, DUNIA BERUBAH.</span><strong>Awal sebuah revolusi<span>1760 — 1840</span></strong></div><span className="revo-menu-factory-icon"><Factory size={26} strokeWidth={1.3} /></span></figcaption>
      <div className="revo-menu-ruler" aria-hidden="true"><span>01</span><i /><span>REVO / INDUSTRY 1.0</span></div>
    </figure>
    <footer className="revo-menu-footer"><span />Informatika Terapan — SMAN 16 Bandung</footer>
    {helpOpen && <RevoDialog title="Cara Bermain" onClose={() => setHelpOpen(false)} wide>
      <span className="revo-kicker">PANDUAN PENJELAJAH</span>
      <h2>Sejarah bisa<br />kamu gerakkan.</h2>
      <div className="revo-menu-instructions">{instructions.map(({ icon: Icon, title, text }, index) => <div key={title}><span className="revo-menu-step"><Icon size={20} strokeWidth={1.5} /><small>0{index + 1}</small></span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>
      <p className="revo-guide-note"><strong>Industry 2.0:</strong> Kenali tujuh komponen, susun lima sambungan, lalu jawab tiga cek konsep. Dalam Eksperimen, jalankan mesin dan catat pengaruh listrik, transmisi, dan hambatan pada konveyor.</p>
      <p className="revo-guide-note">Kembali ke menu akan menjeda mesin. Progres belajar tersimpan di perangkat ini dan dapat dilanjutkan setelah halaman dimuat ulang. Simulasi mesin tidak berjalan di latar belakang.</p>
      <button className="revo-primary-button" onClick={() => setHelpOpen(false)}>Siap menjelajah<ArrowRight size={16} /></button>
    </RevoDialog>}
  </main>;
}
