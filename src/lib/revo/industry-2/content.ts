export const PARTS = [
  { id: "supply", name: "Pasokan listrik", kind: "electrical", function: "Mewakili listrik yang masuk ke pabrik, dari pembangkit setempat atau jaringan.", relationship: "Daya diteruskan melalui panel sebelum mencapai motor." },
  { id: "panel", name: "Panel distribusi", kind: "electrical", function: "Membagi pasokan ke rangkaian pabrik. Sakelar membuka atau menutup jalur ke motor.", relationship: "Panel menyalurkan listrik; panel tidak memutar konveyor." },
  { id: "motor", name: "Motor listrik", kind: "electrical", function: "Mengubah energi listrik menjadi gerak putar pada poros.", relationship: "Di sini jalur listrik berakhir dan jalur mekanis dimulai. Putaran keluar melalui poros dan kopling." },
  { id: "shaft", name: "Poros dan kopling", kind: "mechanical", function: "Meneruskan putaran motor ke puli penggerak.", relationship: "Poros dan kopling membawa gerak putar, bukan listrik." },
  { id: "belt", name: "Sabuk transmisi", kind: "mechanical", function: "Menghubungkan dua puli sehingga putaran berpindah ke rol penggerak.", relationship: "Sabuk transmisi membawa gerak. Permukaan konveyor yang terpisah membawa barang." },
  { id: "conveyor", name: "Konveyor", kind: "material", function: "Membawa benda kerja ke stasiun berikutnya saat rol penggerak memutar sabuk konveyor.", relationship: "Barang bergerak karena tenaga mekanis dari motor. Konveyor tidak melakukan pekerjaan perakitan." },
  { id: "stations", name: "Stasiun kerja", kind: "material", function: "Membagi pekerjaan menjadi langkah berulang: pemasangan bagian, lalu pemeriksaan.", relationship: "Pembagian tugas dan komponen standar membantu produksi massal. Ritme lini juga dapat membuat pekerjaan lebih berulang." },
] as const;

export type ElectricPartId = (typeof PARTS)[number]["id"];

export const PATHS = {
  electrical: { name: "Listrik", flow: "Pasokan → panel → motor", color: "#147b9a", symbol: "ϟ" },
  mechanical: { name: "Mekanis", flow: "Motor → poros → sabuk → rol konveyor", color: "#a65519", symbol: "↻" },
  material: { name: "Material", flow: "Benda kerja → pemasangan → pemeriksaan", color: "#237256", symbol: "→" },
} as const;

export type PathKind = keyof typeof PATHS;

export const ELECTRIC_OBJECTIVES = [
  ["Menjelaskan", " penggunaan tenaga listrik pada sistem industri."],
  ["Menjelaskan", " bagaimana motor mengubah energi listrik menjadi gerak putar."],
  ["Membedakan", " jalur listrik dari transmisi mekanis."],
  ["Menelusuri", " aliran benda kerja melalui stasiun kerja."],
  ["Menghubungkan", " lini perakitan, pembagian tugas, dan komponen standar dengan produksi massal."],
  ["Mengidentifikasi", " dampak sosial dan perubahan ritme kerja akibat industrialisasi."],
] as const;
