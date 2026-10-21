export type ComponentId = "boiler" | "flywheel" | "piston" | "pipe" | "textile";

export interface MachineComponent {
  id: ComponentId;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  role: string;
}

export const historicalIntroduction =
  "Britania Raya, akhir abad ke-18. Tenaga uap mulai menggerakkan pabrik, mengurangi ketergantungan pada aliran sungai, dan mengubah cara manusia bekerja. Jelajahi mesin yang ikut mengubah dunia.";

export const components: MachineComponent[] = [
  {
    id: "boiler",
    number: "01",
    name: "Ketel uap",
    subtitle: "Tempat energi bermula",
    description:
      "Pembakaran batu bara memanaskan air di dalam ketel hingga menghasilkan uap. Pada masa industrialisasi, pasokan bahan bakar dan air memungkinkan mesin bekerja tanpa bergantung langsung pada arus sungai.",
    role: "Mengubah panas pembakaran menjadi energi pada uap bertekanan. Air dan tekanan perlu diawasi agar mesin aman.",
  },
  {
    id: "flywheel",
    number: "02",
    name: "Roda gila",
    subtitle: "Penjaga irama mesin",
    description:
      "Roda berat ini menyimpan energi gerak dan membantu menjaga putaran tetap teratur di antara langkah piston. Poros dan sabuk menyalurkan putaran ke mesin-mesin pabrik.",
    role: "Meratakan perubahan kecepatan dan meneruskan gerak putar. Roda gila tidak menghasilkan energi baru.",
  },
  {
    id: "piston",
    number: "03",
    name: "Piston & batang penghubung",
    subtitle: "Dari tekanan menjadi gerakan",
    description:
      "Perbedaan tekanan menggerakkan piston di dalam silinder. Batang penghubung dan engkol mengubah gerak bolak-baliknya menjadi putaran yang dapat menggerakkan peralatan pabrik.",
    role: "Mengubah energi uap menjadi kerja mekanis. Susunan pada model ini merupakan penyederhanaan mesin uap putar.",
  },
  {
    id: "pipe",
    number: "04",
    name: "Pipa & katup uap",
    subtitle: "Jalur tenaga yang terkendali",
    description:
      "Pipa membawa uap dari ketel ke silinder. Katup mengatur alirannya, sementara katup pengaman membantu membatasi tekanan. Perawatan dan pengawasan operator penting dalam penggunaan mesin uap.",
    role: "Menyalurkan serta mengendalikan aliran uap. Pelepasan uap pada simulasi menurunkan tekanan ketel.",
  },
  {
    id: "textile",
    number: "05",
    name: "Mesin tekstil",
    subtitle: "Tenaga uap menjadi produksi",
    description:
      "Industri tekstil lebih dahulu memakai tenaga air, kemudian semakin banyak memanfaatkan tenaga uap. Mekanisasi meningkatkan produksi, tetapi juga mengubah keterampilan, ritme kerja, dan kehidupan buruh pabrik.",
    role: "Menerima gerak dari poros dan sabuk untuk menggerakkan mekanisme tekstil. Unit produksi pada model ini adalah ukuran pembelajaran.",
  },
];

export const narrationText =
  "Selamat datang di REVO LAB. Pada akhir abad kedelapan belas, perkembangan mesin uap ikut mempercepat industrialisasi di Britania Raya. Panas pembakaran batu bara mengubah air menjadi uap. Tekanan menggerakkan piston, lalu batang penghubung memutar roda gila. Putaran diteruskan ke mesin tekstil. Pabrik menjadi kurang bergantung pada aliran sungai, tetapi tetap membutuhkan air dan bahan bakar. Produksi meningkat, sementara jam kerja panjang, risiko kecelakaan, dan polusi menjadi tantangan. Jelajahi lima komponen, lalu jaga keseimbangan bahan bakar, air, dan tekanan untuk menjalankan mesin dengan aman. Simulasi ini menyederhanakan cara kerja mesin untuk pembelajaran.";

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const quizQuestions: QuizQuestion[] = [
  {
    question: "Mengapa tenaga uap memberi lebih banyak pilihan lokasi bagi pabrik?",
    options: [
      "Mesin uap dapat bekerja tanpa air maupun bahan bakar.",
      "Pabrik lebih sedikit bergantung pada arus sungai sebagai sumber tenaga.",
      "Mesin uap hanya dapat dipasang di tepi sungai yang deras.",
    ],
    answer: 1,
    explanation:
      "Tenaga uap mengurangi ketergantungan pada arus sungai yang menggerakkan kincir air. Lokasi pabrik menjadi lebih fleksibel, walaupun pasokan air, batu bara, tenaga kerja, dan transportasi tetap penting.",
  },
  {
    question: "Urutan perubahan energi mana yang paling tepat pada mesin ini?",
    options: [
      "Energi kimia bahan bakar → panas → energi pada uap → gerak mekanis.",
      "Gerak roda gila → air → batu bara → panas.",
      "Energi listrik → cahaya → tekanan → bahan bakar.",
    ],
    answer: 0,
    explanation:
      "Pembakaran melepaskan energi kimia sebagai panas. Air dipanaskan menjadi uap yang melakukan kerja pada piston. Mekanisme engkol meneruskan geraknya ke mesin pabrik; sebagian energi terlepas sebagai panas.",
  },
  {
    question: "Pernyataan mana yang paling tepat menjelaskan dampak industrialisasi?",
    options: [
      "Peningkatan produksi langsung membuat kondisi semua pekerja menjadi baik.",
      "Mesin uap menghapus kebutuhan akan tenaga manusia dan bahan bakar.",
      "Produksi meningkat, tetapi ritme kerja, risiko bagi buruh, dan lingkungan juga berubah.",
    ],
    answer: 2,
    explanation:
      "Mekanisasi mendukung produksi dalam skala besar dan pertumbuhan kota industri. Manfaatnya tidak terbagi merata: buruh menghadapi disiplin kerja pabrik, jam kerja panjang, serta risiko kecelakaan, sementara pembakaran batu bara menambah polusi.",
  },
];
