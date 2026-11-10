import { STEAM_LEARNING_OBJECTIVES } from "@/lib/revo/eras";

export default function RevoLearningObjectives({ objectives = STEAM_LEARNING_OBJECTIVES, className = "" }: {
  objectives?: readonly (readonly [string, string])[]; className?: string;
} = {}) {
  return <section className={`revo-learning-objectives ${className}`} aria-label="Tujuan Pembelajaran">
    <h2>TUJUAN PEMBELAJARAN</h2>
    <p>Setelah menggunakan media REVO, siswa diharapkan mampu:</p>
    <ol>{objectives.map(([verb, text]) => <li key={text}><strong>{verb}</strong>{text}</li>)}</ol>
    <small>Rumusan tujuan untuk validasi guru.</small>
  </section>;
}
