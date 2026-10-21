import { ArrowUpRight, BookOpen, Factory, MoveRight, Waves } from "lucide-react";

export default function HistoricalInfoPanel({ onHistory }: { onHistory: () => void }) {
  return <section className="revo-history" aria-labelledby="revo-history-title">
    <div className="revo-history-intro"><span className="revo-kicker">LEBIH DARI SEBUAH MESIN</span><h2 id="revo-history-title">Tenaga kecil.<br />Perubahan besar.</h2><button onClick={onHistory}>Baca cerita di baliknya<ArrowUpRight size={15} /></button></div>
    <article><div className="revo-history-symbol"><Waves size={23} strokeWidth={1.4} /><MoveRight size={15} /><Factory size={26} strokeWidth={1.4} /></div><h3>Dari sungai ke pabrik</h3><p>Tenaga uap mengurangi ketergantungan pada aliran sungai. Pabrik dapat tumbuh dekat kota, tenaga kerja, dan bahan bakar.</p></article>
    <article><div className="revo-history-date">1769<span>SEBUAH TITIK BALIK</span></div><h3>Ide yang menggerakkan zaman</h3><p>Kondensor terpisah James Watt menghemat bahan bakar. Pengembangan mesin putar kemudian memperluas pemakaian di industri.</p></article>
    <div className="revo-history-quote"><BookOpen size={20} strokeWidth={1.4} /><p>“Bagaimana kehidupanmu berubah jika semua barang masih dibuat dengan tangan?”</p><span>PIKIRKAN SAMBIL MENJELAJAH</span></div>
  </section>;
}
