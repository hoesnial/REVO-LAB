"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Bookmark, ChartNoAxesColumnIncreasing, CheckCircle2, CircleHelp, Cog, Hand, Info, LockKeyhole, MousePointer2, ScanSearch, Settings, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { electricResumeRoute, LEARNING_STAGES, REVO_ROUTES } from "@/lib/revo/routes";
import { hasSavedProgress } from "@/lib/revo/progress";
import { electricResumeLabel } from "@/lib/revo/industry-2/progress";
import { PARTS } from "@/lib/revo/industry-2/content";
import { components } from "@/lib/revo/content";
import { ERAS } from "@/lib/revo/eras";
import RevoEraPreview from "./RevoEraPreview";
import RevoDialog from "./RevoDialog";
import { useRevoInterfaceMotion } from "./RevoExperience";
import { useRevoProgress } from "./RevoProgressProvider";
import { useElectricProgress } from "./industry-2/ElectricProgressProvider";

const menuThemes = {
  "industry-1": "Mesin Uap & Mekanisasi",
  "industry-2": "Listrik & Produksi Massal",
  "industry-3": "Otomasi",
  "industry-4": "Sistem Cerdas",
} as const;

const instructions = [
  { icon: Hand, title: "Putar sudut pandang", text: "Klik dan geser diorama untuk memutar kamera. Di layar sentuh, geser dengan satu jari." },
  { icon: MousePointer2, title: "Lihat lebih dekat", text: "Gulir roda tetikus atau cubit dengan dua jari untuk memperbesar dan memperkecil. Tombol +, −, dan Reset kamera juga tersedia." },
  { icon: ScanSearch, title: "Kenali setiap komponen", text: "Klik penanda bernomor pada mesin atau pilih tombol komponen untuk membaca fungsi dan perannya. Semua tombol dapat dijangkau dengan Tab. Setelah 5/5, buka Perakitan: seret bagian dari baki 3D atau pilih komponen, sambungan, lalu Pasang komponen. Selesaikan tiga cek pemahaman sebelum memilih UJI MESIN." },
  { icon: SlidersHorizontal, title: "Hidupkan mesin uap", text: "Tekan Nyalakan mesin. Tambahkan air saat menipis, atur bahan bakar, dan lepaskan tekanan bila perlu. Perhatikan perubahan panas, tekanan, dan kecepatan." },
  { icon: ShieldCheck, title: "Amati dan refleksikan", text: "Amati gerak dan hasil produksi dengan tekanan model ≤75. Periksa transmisi tenaga T, lalu hubungkan pengamatanmu dengan perubahan industri." },
];

export default function RevoMainMenu() {
  const [dialog, setDialog] = useState<"help" | "progress" | "settings" | "about" | null>(null);
  const [cardPage, setCardPage] = useState(0);
  const { reduced, setReduced } = useRevoInterfaceMotion();
  const closeDialog = () => setDialog(null);
  const { hydrated, progress, storageStatus } = useRevoProgress();
  const { progress: electric, status: electricStatus } = useElectricProgress();
  const resumeElectric = electric && electric.stage !== "briefing" ? electric : null;
  const canResumeSteam = hydrated && hasSavedProgress(progress) ? progress : null;
  const steamStage = canResumeSteam ? (canResumeSteam.checkpoint === 4 ? "Selesai" : LEARNING_STAGES[canResumeSteam.checkpoint].label) : null;
  const electricStage = resumeElectric ? LEARNING_STAGES.find(stage => stage.id === resumeElectric.stage)?.label : null;
  const saveWarning = storageStatus === "unavailable" || electricStatus === "unavailable"
    ? "Penyimpanan perangkat tidak tersedia. Progres sesi dapat hilang saat halaman dimuat ulang."
    : storageStatus === "malformed" || storageStatus === "unsupported" || electricStatus === "invalid"
      ? "Ada simpanan era yang tidak dapat dibuka. Mulai perjalanan baru di era tersebut."
      : "";

  return <main className="revo-menu revo-menu-eras" lang="id" aria-label="Menu utama REVO">
    <div className="revo-menu-skyline" aria-hidden="true" />
    <div className="revo-menu-era-intro">
      <h1 aria-label="REVO — Jelajah Revolusi Industri">Jelajah Revolusi Industri</h1>
      <p>Pelajari perubahan teknologi melalui simulasi interaktif.</p>
    </div>
    <header className="revo-menu-era-header">
      <div className="revo-menu-brand" aria-label="REVO"><span><Cog size={24} strokeWidth={2.2} aria-hidden="true" /></span><strong>REVO</strong></div>
      <nav aria-label="Navigasi menu">
        <button className="revo-menu-chrome" onClick={() => setDialog("progress")}><ChartNoAxesColumnIncreasing size={20} aria-hidden="true" /><span>Progres Saya</span></button>
        <button className="revo-menu-chrome" onClick={() => setDialog("help")}><CircleHelp size={20} aria-hidden="true" /><span>Cara Bermain</span></button>
        <button className="revo-menu-chrome" onClick={() => setDialog("settings")}><Settings size={20} aria-hidden="true" /><span>Pengaturan</span></button>
      </nav>
    </header>
    <div className="revo-menu-era-deck">
      <section className="revo-menu-era-grid" id="revo-menu-era-cards" aria-label="Empat era revolusi industri" data-page={cardPage} tabIndex={0}>
        {ERAS.map(era => <article key={era.id} className="revo-menu-era-card" data-era={era.id}
          aria-labelledby={`menu-${era.id}-title`} data-playable={Boolean(era.briefingHref)}>
          <div className="revo-menu-era-status">{era.briefingHref ? <CheckCircle2 size={15} aria-hidden="true" /> : <LockKeyhole size={15} aria-hidden="true" />}
            {era.briefingHref ? "Tersedia" : "Belum tersedia"}
          </div>
          <div className="revo-menu-era-art">
            <RevoEraPreview era={era.id} sizes="(max-width: 700px) 46vw, 24vw" />
          </div>
          <div className="revo-menu-era-copy">
            <h2 id={`menu-${era.id}-title`}>Industri {Number(era.number)}.0</h2>
            <p>{menuThemes[era.id]}</p>
          </div>
          {era.briefingHref ? <Link href={era.briefingHref} prefetch={false} className="revo-primary-button" aria-label={`Jelajahi Industri ${Number(era.number)}.0`}>
            Jelajahi<ArrowRight size={16} aria-hidden="true" />
          </Link> : <p className="revo-menu-era-concept">Pratinjau konsep</p>}
        </article>)}
      </section>
      <nav className="revo-menu-pager" aria-label="Halaman kartu era">
        <button className="revo-menu-chrome" aria-label="Era sebelumnya" aria-controls="revo-menu-era-cards" aria-disabled={cardPage === 0} onClick={() => setCardPage(0)}><ArrowLeft size={17} aria-hidden="true" /><span>Sebelumnya</span></button>
        <span role="status">{cardPage === 0 ? "Era 1–2" : "Era 3–4"}</span>
        <button className="revo-menu-chrome" aria-label="Era berikutnya" aria-controls="revo-menu-era-cards" aria-disabled={cardPage === 1} onClick={() => setCardPage(1)}><span>Berikutnya</span><ArrowRight size={17} aria-hidden="true" /></button>
      </nav>
    </div>
    <footer className="revo-menu-footer revo-menu-era-footer">
      {(canResumeSteam || resumeElectric) && <nav className="revo-menu-resume" aria-label="Lanjutkan progres per era">
        <strong className="revo-menu-resume-label"><Bookmark size={17} aria-hidden="true" />Lanjutkan Belajar</strong>
        {canResumeSteam && <Link href={REVO_ROUTES.simulator} prefetch={false} className="revo-primary-button revo-menu-resume-link" aria-label={canResumeSteam.levelComplete && canResumeSteam.checkpoint === 4 ? "Lihat Hasil" : "Lanjutkan"} aria-describedby="revo-resume-steam" title={steamStage ?? undefined}>
          <span id="revo-resume-steam">Industry 1.0</span><span aria-hidden="true">{steamStage}</span><ArrowRight size={15} aria-hidden="true" />
        </Link>}
        {resumeElectric && <Link href={electricResumeRoute(resumeElectric.stage)} prefetch={false} className="revo-primary-button revo-menu-resume-link" aria-label={`Industry 2.0 ${electricResumeLabel(resumeElectric)}`}>
          <span>Industry 2.0</span><span aria-hidden="true">{electricStage}</span><ArrowRight size={15} aria-hidden="true" />
        </Link>}
      </nav>}
      {saveWarning && <p className="revo-menu-era-note" role="status">{saveWarning}</p>}
      <button className="revo-menu-chrome revo-menu-about" aria-label="Tentang REVO" onClick={() => setDialog("about")}><Info size={21} aria-hidden="true" /></button>
    </footer>
    {dialog === "progress" && <RevoDialog title="Progres Saya" onClose={closeDialog}>
      <h2>Progres Saya</h2>
      <p>{!hydrated || !electric ? "Memuat progres perangkat…" : canResumeSteam || resumeElectric ? "Progres belajar pada perangkat ini." : "Belum ada progres tersimpan. Pilih kartu era untuk mulai belajar."}</p>
      <ul className="revo-menu-progress-list">
        <li><strong>Industri 1.0</strong><span>{steamStage ?? "Belum dimulai"} · {canResumeSteam?.explored.length ?? 0}/{components.length} komponen</span></li>
        <li><strong>Industri 2.0</strong><span>{electricStage ?? "Belum dimulai"} · {resumeElectric?.explored.length ?? 0}/{PARTS.length} komponen</span></li>
      </ul>
      <Link href={REVO_ROUTES.menu} className="revo-primary-button">Pilih Era<ArrowRight size={16} aria-hidden="true" /></Link>
    </RevoDialog>}
    {dialog === "settings" && <RevoDialog title="Pengaturan" onClose={closeDialog}>
      <h2>Pengaturan</h2>
      <button className="revo-secondary-button revo-menu-motion" aria-pressed={reduced} onClick={() => setReduced(!reduced)}>Kurangi gerakan antarmuka</button>
      <p>Pengaturan ini berlaku selama sesi. Preferensi kurangi gerakan dari perangkat tetap dihormati. Kendali suara tersedia di simulator mesin uap.</p>
    </RevoDialog>}
    {dialog === "about" && <RevoDialog title="Tentang REVO" onClose={closeDialog}>
      <h2>Tentang REVO</h2>
      <p>REVO — Jelajah Revolusi Industri adalah pengalaman belajar dengan diorama dan simulasi interaktif.</p>
      <p>Informatika Terapan — SMAN 16 Bandung</p>
    </RevoDialog>}
    {dialog === "help" && <RevoDialog title="Cara Bermain" onClose={closeDialog} wide>
      <span className="revo-kicker">PANDUAN PENJELAJAH</span>
      <h2>Sejarah bisa<br />kamu gerakkan.</h2>
      <div className="revo-menu-instructions">{instructions.map(({ icon: Icon, title, text }, index) => <div key={title}><span className="revo-menu-step"><Icon size={20} strokeWidth={1.5} /><small>0{index + 1}</small></span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>
      <p className="revo-guide-note"><strong>Industry 2.0:</strong> Kenali tujuh komponen, susun lima sambungan, lalu jawab tiga cek konsep. Dalam Eksperimen, jalankan mesin dan catat pengaruh listrik, transmisi, dan hambatan pada konveyor.</p>
      <p className="revo-guide-note">Kembali ke menu akan menjeda mesin. Progres belajar tersimpan di perangkat ini dan dapat dilanjutkan setelah halaman dimuat ulang. Simulasi mesin tidak berjalan di latar belakang.</p>
      <button className="revo-primary-button" onClick={closeDialog}>Siap menjelajah<ArrowRight size={16} /></button>
    </RevoDialog>}
  </main>;
}
