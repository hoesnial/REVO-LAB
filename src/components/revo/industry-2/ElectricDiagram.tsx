import type { ElectricPartId, PathKind } from "@/lib/revo/industry-2/content";
import { PARTS, PATHS } from "@/lib/revo/industry-2/content";
import { CONNECTIONS, type ConnectionId } from "@/lib/revo/industry-2/assembly";
import type { ElectricOutcome, ElectricRun } from "@/lib/revo/industry-2/experiment";

const nodes: Record<ElectricPartId, [number, number]> = {
  supply: [92, 114], panel: [194, 86], motor: [164, 251], shaft: [232, 257], belt: [304, 272], conveyor: [441, 185], stations: [478, 96],
};

const assemblyPaths: Record<ConnectionId, string> = {
  E1: "M117 154 170 145 m-10 -4 10 4 -8 7",
  E2: "M172 151 165 189 154 207 m1 -11 -1 11 10 -6",
  M1: "M185 232 233 225 m-9 -4 9 4 -8 6",
  M2: "M239 228 301 228 m-9 -5 9 5 -9 5",
  M3: "M304 228 325 210 m-11 2 11 -2 -4 10",
};

export default function ElectricDiagram({ selected = null, target = null, path = null, connections, experiment }: {
  selected?: ElectricPartId | null; target?: ElectricPartId | null; path?: PathKind | null; connections?: readonly ConnectionId[];
  experiment?: { run: ElectricRun; outcome: ElectricOutcome };
}) {
  return <svg className="electric-diagram" viewBox="0 0 640 350" role="img" aria-label={experiment
    ? "Skema percobaan penggerak konveyor. Status listrik, motor, transmisi, konveyor, dan produksi tersedia di bawah skema."
    : connections
    ? `Skema perakitan: ${connections.length} dari 5 sambungan terpasang.`
    : "Skema pabrik: listrik masuk melalui panel ke motor; poros dan sabuk memutar konveyor; benda kerja berpindah dari pemasangan ke pemeriksaan."}>
    <path d="M37 67 527 36 603 259 141 314 37 264Z" fill="#c5cebf" stroke="#f2f1e5" strokeWidth="3" />
    <path d="M37 67 527 36 527 106 37 139Z" fill="#334d49" />
    {[55, 151, 247, 343, 439].map(x => <path key={x} d={`M${x} 82 l68 -4 v36 l-68 4Z`} fill="#b3d0cf" stroke="#203d3c" strokeWidth="4" />)}
    <path d="M57 138 118 132 118 184 57 191Z" fill="#61756d" stroke="#293f3e" strokeWidth="3" />
    <path d="M64 151 108 146 M64 164 108 159 M64 177 108 172" stroke="#233d3c" strokeWidth="4" />
    <path d="M173 111 215 107 215 149 173 154Z" fill="#e4bc68" stroke="#374b42" strokeWidth="3" />
    <path d="M190 121 v19" stroke="#324641" strokeWidth="5" />
    <path d="M127 211 q-21 3 -16 23 l23 20 54 -8 2 -36Z" fill="#587c77" stroke="#28413f" strokeWidth="3" />
    <path d="M132 217 l10 20 m1 -23 10 20 m1 -22 10 20 m1 -22 10 20" stroke="#99b0a2" strokeWidth="4" />
    <path d={experiment?.run.transmission === false ? "M184 226l15 -2m21 -2 18 -2" : "m184 226 54 -6"} stroke="#59665c" strokeWidth="9" />
    <path d="M236 208 L314 213 L318 231 L240 231Z" fill="#9b653a" stroke="#664b36" strokeWidth="3" />
    <circle cx="238" cy="220" r="12" fill="#ac794c" stroke="#664b36" strokeWidth="3" />
    <circle cx="315" cy="221" r="10" fill="#ac794c" stroke="#664b36" strokeWidth="3" />
    <path d="M281 177 545 146 577 196 306 229Z" fill="#304643" stroke="#e6ddbd" strokeWidth="5" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <path key={i} d={`M${291+i*27} ${176-i*3} l29 47`} stroke="#748d82" strokeWidth="2" />)}
    <path d="M345 141 399 134 415 155 361 161Z M460 128 514 121 530 142 476 149Z" fill="#b88750" stroke="#584b3b" strokeWidth="3" />
    <path d="M359 164 v22 m50 -28 v15 m65 -22 v20 m50 -25 v16" stroke="#586458" strokeWidth="5" />
    <path d="M354 180 l26 -3 9 12 -27 4Z M478 163 l24 -3 8 12 -24 3Z" fill="#d7ad57" />
    {experiment ? <g fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {CONNECTIONS.filter(link => experiment.run.transmission || link.id !== "M1").map(link => <path key={link.id}
        d={assemblyPaths[link.id]} stroke={link.kind === "electrical" ? experiment.run.power && (link.id === "E1" || experiment.run.running) ? PATHS.electrical.color : "#6b756d"
          : experiment.outcome.driveMoving ? PATHS.mechanical.color : "#6b756d"} strokeDasharray={link.kind === "electrical" ? "8 4" : undefined} />)}
      {experiment.outcome.motor === "turning" && <path d="M126 246a24 24 0 1 1 31 21m-9 -6 9 6 -3 8" stroke="#d7a64b" />}
      {experiment.outcome.conveyor === "moving" && <path d="M322 216l221 -26m-13 -5 13 5 -11 7" stroke="#8ce4a9" />}
      {experiment.run.obstruction && <path d="M411 156l29 54m-9 -20 10 -7" stroke="#a53924" strokeWidth="11" />}
    </g> : connections ? <g fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      {CONNECTIONS.filter(link => connections.includes(link.id)).map(link => <path key={link.id} data-connection={link.id}
        d={assemblyPaths[link.id]} stroke={PATHS[link.kind].color} strokeDasharray={link.kind === "electrical" ? "8 4" : undefined} />)}
    </g> : <g fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path opacity={!path || path === "electrical" ? 1 : .2} d="M117 154 166 148 166 189 153 206 M158 195 l-5 11 -4 -9" stroke={PATHS.electrical.color} strokeDasharray="6 5" />
      <path opacity={!path || path === "mechanical" ? 1 : .2} d="M190 239 307 229 324 211 m-10 4 10 -4 -3 10" stroke={PATHS.mechanical.color} />
      <path opacity={!path || path === "material" ? 1 : .2} d="M317 218 543 190 m-13 -5 13 5 -11 7" stroke="#8ce4a9" />
    </g>}
    {!experiment && PARTS.map((part, index) => <g key={part.id} transform={`translate(${nodes[part.id].join(" ")})`}>
      <circle r="14" fill={selected === part.id || target === part.id ? "#ffe234" : "#f8f4dc"} stroke="#27433c" strokeWidth="2" />
      <text y="4.5" fill="#263a34" textAnchor="middle" fontSize="13" fontWeight="800">{index + 1}</text>
    </g>)}
  </svg>;
}
