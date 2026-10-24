import type { ComponentId } from "./content";

export const ASSEMBLY_PARTS = [
  { id: "boiler", name: "Ketel uap", function: "Panas pembakaran mengubah air menjadi uap.", relationship: "Keluaran ketel dihubungkan ke pipa menuju silinder piston.", history: "Ketel memasok tenaga untuk mesin uap industri; air dan bahan bakar tetap diperlukan.", socket: "Sumber uap", hint: "Tempat air menerima panas sebelum uap dialirkan." },
  { id: "pipe", name: "Pipa uap", function: "Menyalurkan uap; katup mengatur alirannya.", relationship: "Menghubungkan ketel dengan silinder piston, bukan dengan mesin tekstil.", history: "Pipa, katup, dan pengawasan tekanan mendukung pengoperasian mesin uap.", socket: "Jalur ketel → silinder", hint: "Hubungkan sumber uap dengan pengubah tekanan menjadi gerak." },
  { id: "piston", name: "Mekanisme piston", function: "Perbedaan tekanan menghasilkan gerak bolak-balik piston.", relationship: "Batang penghubung dan engkol mengubah gerak piston menjadi putaran poros roda gila.", history: "Mesin uap putar memungkinkan tenaga diteruskan ke beragam peralatan pabrik.", socket: "Pengubah tekanan → gerak", hint: "Terima uap dari pipa, lalu hubungkan batang ke engkol roda gila." },
  { id: "flywheel", name: "Roda gila", function: "Menyimpan energi gerak dan meratakan perubahan kecepatan putaran.", relationship: "Bekerja bersama engkol piston; poros dan sabuk meneruskan putaran ke mesin tekstil.", history: "Putaran yang lebih teratur membantu menggerakkan mesin industri. Roda gila tidak menciptakan energi.", socket: "Penstabil putaran & poros", hint: "Bantu putaran engkol tetap teratur sebelum tenaga diteruskan." },
  { id: "textile", name: "Mesin tekstil", function: "Menggunakan kerja mekanis untuk menggerakkan mekanisme penenunan.", relationship: "Menerima putaran melalui poros, puli, dan sabuk; tidak menerima uap langsung.", history: "Pabrik tekstil memakai tenaga air dan kemudian tenaga uap, dengan perubahan besar pada produksi dan kerja buruh.", socket: "Penerima tenaga produksi", hint: "Tempat putaran dari sistem penggerak digunakan untuk membuat kain." },
] as const satisfies ReadonlyArray<{ id: ComponentId; name: string; function: string; relationship: string; history: string; socket: string; hint: string }>;

export const ASSEMBLY_CHECKS = [
  { id: "steam", requires: ["boiler", "pipe"], question: "Apa yang menghasilkan uap dalam sistem ini?", options: ["Ketel memanaskan air dengan panas pembakaran.", "Pipa menghasilkan uap saat roda berputar.", "Roda gila mengubah putarannya menjadi uap."], answer: 0, explanation: "Ketel menghasilkan uap dari air yang dipanaskan. Pipa menyalurkan uap, sedangkan roda gila menyimpan energi gerak." },
  { id: "rotation", requires: ["piston", "flywheel"], question: "Bagaimana gerak piston menjadi putaran?", options: ["Roda gila menciptakan energi dan menarik piston tanpa penghubung.", "Batang penghubung dan engkol mengubah gerak bolak-balik; roda gila membantu menjaga putaran.", "Uap langsung memutar mesin tekstil tanpa mekanisme penggerak."], answer: 1, explanation: "Batang penghubung dan engkol mengubah gerak bolak-balik piston menjadi putaran. Roda gila membantu meratakan kecepatan; ia tidak menghasilkan energi baru." },
  { id: "factory", requires: ["boiler", "pipe", "piston", "flywheel", "textile"], question: "Mengapa tenaga uap penting bagi lokasi pabrik?", options: ["Pabrik tidak lagi memerlukan air atau bahan bakar.", "Semua pabrik bertenaga air langsung berhenti digunakan.", "Mesin dapat digerakkan tanpa bergantung sepenuhnya pada tenaga aliran sungai."], answer: 2, explanation: "Tenaga uap mengurangi ketergantungan pada tenaga air setempat. Pasokan air, batu bara, dan transportasi tetap penting; tenaga air juga tetap digunakan." },
] as const;
export type AssemblyCheckId = typeof ASSEMBLY_CHECKS[number]["id"];
export type AssemblyState = {
  placed: ComponentId[];
  checks: AssemblyCheckId[];
  selected: ComponentId | null;
  socket: ComponentId | null;
  feedback: string;
  checkFeedback: Partial<Record<AssemblyCheckId, { correct: boolean; message: string }>>;
};
export type AssemblyAction =
  | { type: "select"; id: ComponentId }
  | { type: "socket"; id: ComponentId }
  | { type: "place"; id: ComponentId; socket: ComponentId | null }
  | { type: "answer"; id: AssemblyCheckId; answer: number }
  | { type: "reset" };

export function initialAssemblyState(): AssemblyState {
  return { placed: [], checks: [], selected: null, socket: null, feedback: "Pilih komponen, pilih sambungan, lalu konfirmasi. Kamu juga dapat menyeret komponen di baki 3D ke dudukannya.", checkFeedback: {} };
}
export function assemblyComplete(state: AssemblyState) {
  return ASSEMBLY_PARTS.every(part => state.placed.includes(part.id)) && ASSEMBLY_CHECKS.every(check => state.checks.includes(check.id));
}
export function assemblyProgress(state: AssemblyState) {
  return Math.round((state.placed.length + state.checks.length) / (ASSEMBLY_PARTS.length + ASSEMBLY_CHECKS.length) * 100);
}
export function canEnterStage(stage: number, explored: number, assembly: AssemblyState, missionComplete: boolean) {
  if (stage === 0) return true;
  if (explored !== 5) return false;
  if (stage === 1) return true;
  if (!assemblyComplete(assembly)) return false;
  return stage === 2 || stage === 3 && missionComplete;
}
export function assemblyReducer(state: AssemblyState, action: AssemblyAction): AssemblyState {
  if (action.type === "reset") return initialAssemblyState();
  if (action.type === "answer") {
    const check = ASSEMBLY_CHECKS.find(check => check.id === action.id);
    if (!check || state.checks.includes(action.id) || !check.requires.every(id => state.placed.includes(id)) || !Number.isInteger(action.answer) || action.answer < 0 || action.answer >= check.options.length) return state;
    const correct = action.answer === check.answer;
    return { ...state, checks: correct ? [...state.checks, action.id] : state.checks, checkFeedback: { ...state.checkFeedback, [action.id]: { correct, message: `${correct ? "Tepat." : "Belum tepat. Coba lagi."} ${check.explanation}` } } };
  }
  const part = ASSEMBLY_PARTS.find(part => part.id === action.id);
  if (!part) return state;
  if (action.type === "socket") return { ...state, socket: action.id, feedback: `${part.socket}: ${part.hint}` };
  if (state.placed.includes(action.id)) return { ...state, feedback: `${part.name} sudah terpasang. Pilih komponen yang masih di inventaris.` };
  if (action.type === "select") return { ...state, selected: action.id, feedback: `${part.name}: ${part.relationship}` };
  if (action.socket !== action.id) {
    return { ...state, feedback: `Belum cocok. ${part.name}: ${part.relationship} Pilih sambungan lain dan coba lagi.` };
  }
  return { ...state, placed: [...state.placed, action.id], selected: null, socket: null, feedback: `${part.name} terpasang. ${part.relationship}` };
}

// Socket IDs are conceptual relationships. Fixed positions avoid physics and
// tolerances; render transforms never grant completion.
export const ASSEMBLY_SOCKETS: Record<ComponentId, [number, number, number]> = {
  boiler: [-2.85, 0.16, -0.3], pipe: [-1.9, 0.16, -1.15], piston: [-2.5, 0.16, 1.74], flywheel: [-0.43, 0.16, 0.71], textile: [2.55, 0.16, 0.05],
};
export function socketAtPoint(x: number, z: number): ComponentId | null {
  let closest: ComponentId | null = null;
  let distance = 0.8;
  for (const part of ASSEMBLY_PARTS) {
    const target = ASSEMBLY_SOCKETS[part.id];
    const next = Math.hypot(x - target[0], z - target[2]);
    if (next < distance) { closest = part.id; distance = next; }
  }
  return closest;
}
