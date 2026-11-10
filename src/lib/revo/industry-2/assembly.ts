import { PARTS, type ElectricPartId } from "./content";

export const CONNECTIONS = [
  { id: "E1", from: "supply", to: "panel", kind: "electrical", explanation: "Pasokan membawa energi listrik ke panel, tempat jalurnya dapat diatur dengan sakelar." },
  { id: "E2", from: "panel", to: "motor", kind: "electrical", explanation: "Panel menyalurkan listrik ke motor. Di motor, energi listrik diubah menjadi putaran." },
  { id: "M1", from: "motor", to: "shaft", kind: "mechanical", explanation: "Motor menghasilkan putaran. Poros dan kopling meneruskan putaran itu ke puli penggerak." },
  { id: "M2", from: "shaft", to: "belt", kind: "mechanical", explanation: "Poros memutar puli penggerak, lalu sabuk transmisi memindahkan putaran ke puli berikutnya." },
  { id: "M3", from: "belt", to: "conveyor", kind: "mechanical", explanation: "Sabuk transmisi memindahkan putaran ke rol penggerak. Rol memutar sabuk konveyor yang membawa benda kerja." },
] as const satisfies readonly { id: string; from: ElectricPartId; to: ElectricPartId; kind: "electrical" | "mechanical"; explanation: string }[];

export type ConnectionId = (typeof CONNECTIONS)[number]["id"];
export const partName = (id: ElectricPartId) => PARTS.find(part => part.id === id)!.name;
export const targetName = (id: ElectricPartId) => id === "conveyor" ? "Rol penggerak konveyor" : partName(id);

export function isConnectionId(id: unknown): id is ConnectionId {
  return CONNECTIONS.some(connection => connection.id === id);
}

// Mixed candidates offer a structured alternative without revealing the solution.
export const PAIR_CHOICES: Partial<Record<ElectricPartId, readonly ElectricPartId[]>> = {
  supply: ["motor", "panel", "conveyor"],
  panel: ["conveyor", "shaft", "motor"],
  motor: ["belt", "shaft", "panel"],
  shaft: ["belt", "motor", "stations"],
  belt: ["panel", "conveyor", "shaft"],
};

export function assessConnection(from: ElectricPartId, to: ElectricPartId, installed: readonly ConnectionId[]) {
  const connection = CONNECTIONS.find(link => link.from === from && link.to === to);
  if (connection) return { kind: installed.includes(connection.id) ? "duplicate" as const : "correct" as const, connection };
  const reversed = CONNECTIONS.some(link => link.to === from && link.from === to);
  const explanation = from === to ? "Satu komponen tidak dapat meneruskan energi ke dirinya sendiri. Pilih komponen tujuan lain."
    : from === "stations" || to === "stations" ? "Stasiun kerja menerima benda kerja, bukan sambungan daya. Bedakan aliran barang dari aliran energi."
      : reversed ? "Arah hubungan terbalik. Tentukan komponen yang memberi energi atau putaran, lalu yang menerimanya."
        : from === "supply" || from === "panel" ? "Jalur listrik belum sama dengan jalur gerak. Cari komponen berikutnya yang menerima pasokan pada model ini."
          : from === "conveyor" ? "Rol konveyor menerima putaran untuk membawa benda kerja. Mulailah dari komponen yang meneruskan tenaga ke arah rol."
            : "Hubungan ini tidak meneruskan putaran ke bagian berikutnya pada model. Periksa penghubung di antara dua komponen yang kamu pilih.";
  return { kind: "wrong" as const, explanation };
}

export const CONCEPTS = [
  { id: "C1", question: "Mengapa motor listrik diperlukan setelah panel distribusi?", options: [
    { id: "regulate", text: "Motor membagi listrik ke seluruh stasiun.", explanation: "Pembagian pasokan adalah fungsi panel. Perhatikan apa yang keluar dari poros motor." },
    { id: "rotate", text: "Motor mengubah energi listrik menjadi putaran.", explanation: "Panel menyalurkan listrik; motor mengubahnya menjadi putaran yang bisa diteruskan poros." },
    { id: "carry", text: "Motor langsung membawa benda kerja antarstasiun.", explanation: "Benda kerja dibawa oleh permukaan konveyor. Pikirkan bagaimana gerak sampai ke permukaan itu." },
  ], correct: "rotate" },
  { id: "C2", question: "Apa yang terjadi jika motor berputar, tetapi transmisi mekanis tidak tersambung?", options: [
    { id: "follows", text: "Konveyor ikut bergerak lebih lambat.", explanation: "Gerak yang lebih lambat tetap membutuhkan tenaga yang sampai ke rol. Apa yang putus di sini?" },
    { id: "cuts-power", text: "Pasokan listrik ke motor langsung terputus.", explanation: "Sambungan mekanis terpisah dari jalur listrik. Motor masih bisa menerima daya." },
    { id: "no-drive", text: "Motor tetap berputar, tetapi rol konveyor tidak menerima putaran.", explanation: "Tanpa poros, kopling, dan sabuk yang terhubung, putaran motor tidak sampai ke rol." },
  ], correct: "no-drive" },
  { id: "C3", question: "Mengapa konveyor tidak langsung bergerak hanya karena pasokan listrik tersedia?", options: [
    { id: "chain", text: "Daya harus sampai ke motor, lalu putaran harus sampai ke rol.", explanation: "Panel menyalurkan daya, motor menghasilkan putaran, dan transmisi meneruskannya ke rol. Sabuk konveyor lalu membawa benda kerja." },
    { id: "material", text: "Benda kerja harus diletakkan dulu agar listrik bisa menggerakkan rol.", explanation: "Keberadaan benda kerja tidak meneruskan tenaga. Telusuri jalur daya dan jalur putaran secara terpisah." },
    { id: "panel-drives", text: "Panel distribusi harus memutar rol secara langsung.", explanation: "Panel mengatur aliran listrik. Rol memerlukan gerak mekanis dari penggerak." },
  ], correct: "chain" },
] as const;

type Concept = (typeof CONCEPTS)[number];
export type ConceptId = Concept["id"];
export type ConceptAnswerId = Concept["options"][number]["id"];
export type ConceptAnswers = Readonly<Partial<Record<ConceptId, ConceptAnswerId>>>;

export function isCorrectAnswer(id: unknown, answer: unknown): boolean {
  return CONCEPTS.some(concept => concept.id === id && concept.correct === answer);
}
