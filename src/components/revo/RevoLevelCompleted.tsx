"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Cog, Factory, RotateCcw, ShieldCheck, Trophy } from "lucide-react";
import { REVO_ROUTES } from "@/lib/revo/routes";
import RevoDialog from "./RevoDialog";

interface RevoLevelCompletedProps {
  explored: number;
  installed: number;
  checks: number;
  experimentComplete: boolean;
  quizScore: number;
  quizTotal: number;
  onReviewReflection: () => void;
  onReplay: () => void;
}

const conclusions = [
  { icon: Cog, title: "Uap dan mekanisasi", text: "Panas mengubah air menjadi uap. Tekanannya melakukan kerja pada piston dan membantu menjalankan mesin." },
  { icon: RotateCcw, title: "Tenaga diteruskan", text: "Engkol dan roda gila mengubah serta meratakan putaran. Poros dan sabuk membawa gerak menuju mesin pabrik." },
  { icon: Factory, title: "Produksi tekstil", text: "Mesin tekstil memakai tenaga mekanis untuk menenun lebih banyak kain, dengan ritme kerja yang berbeda dari produksi tangan." },
  { icon: BookOpen, title: "Dampak sejarah", text: "Industrialisasi mengubah produksi, pekerjaan, kota, dan lingkungan. Manfaat serta bebannya tidak terbagi merata." },
];

export default function RevoLevelCompleted({ explored, installed, checks, experimentComplete, quizScore, quizTotal, onReviewReflection, onReplay }: RevoLevelCompletedProps) {
  const [confirmReplay, setConfirmReplay] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => { title.current?.focus({ preventScroll: true }); }, []);

  return <main className="revo-completion-screen" lang="id" aria-label="Hasil Industry 1.0">
    <header className="revo-completion-header"><Link className="revo-completion-brand" href={REVO_ROUTES.menu} aria-label="Menu utama REVO"><span><Cog size={22} /></span><strong>REVO</strong></Link><span className="revo-completion-era">ERA 01 <i /> 1760—1840</span></header>
    <div className="revo-completion-body">
      <section className="revo-completion-intro"><div className="revo-completion-trophy"><Trophy size={25} /></div><span className="revo-kicker">REVO LAB — INDUSTRY 1.0</span><h1 ref={title} tabIndex={-1}>LEVEL COMPLETED</h1><p className="revo-completion-subtitle">THE AGE OF STEAM</p><p className="revo-completion-message">Selamat! Kamu berhasil menyelesaikan perjalanan Revolusi Industri pertama.</p></section>
      <section className="revo-completion-results" aria-label="Ringkasan hasil">
        <div><span>Eksplorasi</span><strong>{explored}/5</strong><small>komponen dipelajari</small></div>
        <div><span>Perakitan</span><strong>{installed}/5</strong><small>{checks}/3 cek pemahaman</small></div>
        <div><span>Misi produksi</span><strong className="revo-completion-status">{experimentComplete ? <><ShieldCheck size={17} /> Aman</> : "Belum selesai"}</strong><small>{experimentComplete ? "100/100 unit" : "Target 100 unit"}</small></div>
        <div><span>Kuis sejarah</span><strong>{quizScore}/{quizTotal}</strong><small>jawaban benar</small></div>
      </section>
      <section className="revo-completion-learning" aria-labelledby="revo-completion-learning-title"><div className="revo-completion-section-title"><span className="revo-kicker">YANG KAMU HUBUNGKAN</span><h2 id="revo-completion-learning-title">Dari tenaga uap<br />menjadi perubahan sosial.</h2></div><div className="revo-completion-conclusions">{conclusions.map(({ icon: Icon, title, text }, index) => <article key={title}><span className="revo-completion-card-index">0{index + 1}</span><Icon size={18} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <nav className="revo-completion-actions" aria-label="Pilihan setelah menyelesaikan level"><Link className="revo-secondary-button" href={REVO_ROUTES.eraSelect}>Pilih Era</Link><button className="revo-secondary-button" onClick={() => setConfirmReplay(true)}>Ulangi Level<RotateCcw size={15} /></button><button className="revo-secondary-button" onClick={onReviewReflection}>Lihat Refleksi</button><Link className="revo-primary-button" href={REVO_ROUTES.menu}>Menu Utama<ArrowRight size={16} /></Link></nav>
    </div>
    <footer className="revo-completion-footer"><span>REVO — JELAJAH REVOLUSI INDUSTRI</span><span>Model edukasi sederhana, bukan rekonstruksi satu pabrik.</span></footer>
    {confirmReplay && <RevoDialog title="Ulangi Industry 1.0" onClose={() => setConfirmReplay(false)}><div className="revo-dialog-emblem"><RotateCcw size={28} /></div><span className="revo-kicker">MULAI PERJALANAN BARU</span><h2>Mulai kembali<br />dari awal?</h2><p>Konfirmasi ini akan menghapus eksplorasi, perakitan, hasil misi, dan refleksi Industry 1.0 yang tersimpan di perangkat.</p><div className="revo-dialog-actions"><button className="revo-secondary-button" onClick={() => setConfirmReplay(false)}>Pertahankan hasil</button><button className="revo-primary-button" onClick={onReplay}>Ulangi Level<ArrowRight size={16} /></button></div></RevoDialog>}
  </main>;
}
