import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, LockKeyhole } from "lucide-react";
import { ERAS } from "@/lib/revo/eras";
import { REVO_ROUTES } from "@/lib/revo/routes";
import factoryPreview from "../../../public/revo/factory-preview.png";
import EraIllustration from "./EraIllustration";
import EraGridKeyboard from "./EraGridKeyboard";
import RevoScreenHeader from "./RevoScreenHeader";

export default function RevoEraSelection() {
  return <main className="revo-flow-screen revo-era-screen" lang="id" aria-label="Pilih era REVO">
    <RevoScreenHeader step="01 / PILIH ERA" back={{ href: REVO_ROUTES.menu, label: "Kembali ke Menu" }} />
    <div className="revo-era-intro revo-flow-entrance">
      <div><p className="revo-flow-eyebrow">REVO — PILIH ERA PERJALANANMU</p><h1 aria-label="JELAJAHI EMPAT REVOLUSI INDUSTRI">JELAJAHI EMPAT<br /><span>REVOLUSI INDUSTRI</span></h1></div>
      <p>Dari kekuatan mesin uap hingga lahirnya industri cerdas. Pilih era dan mulailah perjalananmu.</p>
    </div>
    <EraGridKeyboard>
      {ERAS.map(era => <article key={era.id} className={`revo-era-card ${era.briefingHref ? "is-playable" : "is-upcoming"}`} aria-labelledby={`${era.id}-title`} data-era={era.id}>
        <div className="revo-era-card-top"><div><span className="revo-era-label">{era.label}</span><span className="revo-era-availability">{era.briefingHref ? <><i />TERSEDIA</> : <><LockKeyhole size={10} />SEGERA HADIR</>}</span></div><span className="revo-era-number" aria-hidden="true">{era.number}</span></div>
        <h2 id={`${era.id}-title`}>{era.title}</h2>
        <div className="revo-era-art">{era.id === "industry-1" ? <Image src={factoryPreview} alt="Pabrik tekstil dengan ketel uap dan roda gila." fill sizes="(max-width: 600px) 130px, (max-width: 1000px) 45vw, 23vw" loading="eager" /> : <EraIllustration era={era.id} />}</div>
        <p className="revo-era-description">{era.description}</p>
        <div className="revo-era-card-bottom">{era.briefingHref ? <Link href={era.briefingHref} className="revo-era-enter">Jelajahi Era<ArrowRight size={17} /></Link> : <><button className="revo-era-locked" disabled aria-describedby={`${era.id}-availability`}><LockKeyhole size={13} />Dalam Pengembangan</button><span id={`${era.id}-availability`} className="revo-sr-only">{era.label} belum dapat dimainkan. Saat ini hanya Industry 1.0 yang tersedia.</span></>}</div>
      </article>)}
    </EraGridKeyboard>
    <footer className="revo-flow-footer"><span>SATU ERA TERBUKA. RASA INGIN TAHU TANPA BATAS.</span><span className="revo-era-scroll-hint"><ArrowDown size={12} />Gulir daftar untuk melihat semua era</span><span className="revo-flow-school">Informatika Terapan — SMAN 16 Bandung</span></footer>
  </main>;
}
