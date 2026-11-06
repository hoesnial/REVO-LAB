import { STEAM_LEARNING_OBJECTIVES } from "@/lib/revo/eras";

export default function RevoLearningObjectives() {
  return <section className="revo-learning-objectives" aria-label="Tujuan Pembelajaran">
    <h2>TUJUAN PEMBELAJARAN</h2>
    <p>Setelah menggunakan media REVO, siswa diharapkan mampu:</p>
    <ol>{STEAM_LEARNING_OBJECTIVES.map(([verb, text]) => <li key={verb}><strong>{verb}</strong>{text}</li>)}</ol>
    <small>Rumusan tujuan untuk validasi guru.</small>
  </section>;
}
