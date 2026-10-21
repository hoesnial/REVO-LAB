import type { EraId } from "@/lib/revo/eras";

// Small, static SVG diagrams share the factory's olive/cream palette. These are
// illustrative era motifs, not additional simulations or historical replicas.
export default function EraIllustration({ era }: { era: Exclude<EraId, "industry-1"> }) {
  const label = {
    "industry-2": "Ilustrasi generator listrik, lampu pabrik, dan lini perakitan.",
    "industry-3": "Ilustrasi lengan robot, pengendali elektronik, dan konveyor otomatis.",
    "industry-4": "Ilustrasi pabrik cerdas, sensor terhubung, dan grafik data industri.",
  }[era];
  return <svg className="revo-era-illustration" viewBox="0 0 320 210" role="img" aria-label={label} fill="none">
    <path d="M25 168 157 117 300 166 168 204Z" fill="#d8d8c8" />
    <path d="m25 168 143 36v5L25 174Z" fill="#c5c8b6" />
    <path d="m168 204 132-38v6l-132 37Z" fill="#b8beaa" />
    <path d="M42 175 173 127M78 185l130-47M115 194l129-46M75 149l142 41M114 134l141 42" stroke="#b9c0a8" strokeWidth="1" />
    {era === "industry-2" && <>
      <path d="M55 150V48l204 40v67M55 48l204 40" stroke="#65745b" strokeWidth="5" />
      <path d="M105 58v20m93-1v20" stroke="#58644e" strokeWidth="2" />
      <path d="m94 83 11-7 12 11-23-4Zm92 19 12-6 12 11-24-5Z" fill="#818a66" />
      <path d="m99 85 12 2m80 17 13 3" stroke="#d4be70" strokeWidth="3" strokeLinecap="round" />
      <path d="m75 143 34-14 72 20-35 18Z" fill="#899277" />
      <path d="m75 143 71 24v10l-71-24Zm71 24 35-18v10l-35 18Z" fill="#637455" />
      <path d="M97 144v-28m58 44v-28" stroke="#58694f" strokeWidth="6" />
      <path d="m103 110 35-14 27 9-35 15Z" fill="#bbc1a3" />
      <path d="m103 110 27 10v34l-27-10Z" fill="#7b8b69" />
      <path d="m130 120 35-15v34l-35 15Z" fill="#4b6350" />
      <ellipse cx="109" cy="128" rx="14" ry="20" transform="rotate(-17 109 128)" fill="#3c5345" stroke="#a4aa7f" strokeWidth="3" />
      <ellipse cx="109" cy="128" rx="6" ry="10" transform="rotate(-17 109 128)" fill="#b3ad77" />
      <path d="m96 123 26 9M106 110l6 36" stroke="#c3bb8b" strokeWidth="2" />
      <path d="m186 158 55-22 39 12-54 24Z" fill="#909b7b" />
      <path d="m186 158 40 14v8l-40-14Zm40 14 54-24v8l-54 24Z" fill="#5f725b" />
      <path d="m192 157 36 12m-25-17 36 12m-25-17 36 12m-25-17 36 12" stroke="#bec4a8" strokeWidth="3" />
      <path d="M197 169v16m68-24v15" stroke="#65745b" strokeWidth="4" />
      <path d="m213 145 11-5 13 5-11 5Z" fill="#c7b685" /><path d="m213 145 13 5v11l-13-4Zm13 5 11-5v11l-11 5Z" fill="#ab9f72" />
    </>}
    {era === "industry-3" && <>
      <path d="m58 112 36-15 35 11-35 17Z" fill="#bcc2a6" />
      <path d="m58 112 36 13v53l-36-13Z" fill="#899678" /><path d="m94 125 35-17v53l-35 17Z" fill="#5c7158" />
      <path d="m65 121 22 8v22l-22-8Z" fill="#3b5143" /><path d="m70 130 11 4m-11 3 8 3" stroke="#c4c8a3" strokeWidth="2" />
      <circle cx="74" cy="156" r="3" fill="#c9b979" /><circle cx="84" cy="160" r="3" fill="#c4caaf" />
      <path d="m141 158 85-35 57 19-86 38Z" fill="#9ca68a" /><path d="m141 158 56 22v10l-56-22Zm56 22 86-38v10l-86 38Z" fill="#65795e" />
      <path d="m152 155 52 19m-36-25 52 19m-36-26 52 20m-36-27 52 20m-36-26 52 19" stroke="#c7cbb4" strokeWidth="4" />
      <path d="M153 171v16m115-31v18" stroke="#63745c" strokeWidth="5" />
      <ellipse cx="153" cy="142" rx="21" ry="10" fill="#4c6452" />
      <path d="m145 141-8-47 13-3 10 51" fill="#b4a778" /><circle cx="144" cy="92" r="11" fill="#5d7255" stroke="#c3bc90" strokeWidth="3" />
      <path d="m145 82 35-28 9 11-37 29" fill="#a4ac82" /><circle cx="184" cy="60" r="10" fill="#5a7053" stroke="#c3bc90" strokeWidth="3" />
      <path d="m191 58 39 35-7 10-42-34" fill="#b4a778" /><circle cx="228" cy="98" r="7" fill="#64765a" />
      <path d="m228 105 3 10-10 13m10-13 9 7" stroke="#435c4a" strokeWidth="4" strokeLinecap="round" />
      <path d="m204 142 13-5 17 6-13 6Z" fill="#c3b587" /><path d="m204 142 17 7v14l-17-7Zm17 7 13-6v14l-13 6Z" fill="#9a9b78" />
    </>}
    {era === "industry-4" && <>
      <path d="m75 126 77-29 80 27-77 31Z" fill="#a7b194" /><path d="m75 126 80 29v36l-80-29Z" fill="#7f9478" /><path d="m155 155 77-31v36l-77 31Z" fill="#506e58" />
      <path d="m75 126 19-29 23 9 17-27 25 8 17-23 56 60-77 31Z" fill="#b7c0a3" />
      <path d="m84 139 11 4v12l-11-4Zm19 7 11 4v12l-11-4Zm20 7 11 4v12l-11-4Z" fill="#dce0c9" />
      <path d="m168 160 16-7v21l-16 6Zm26-11 16-6v21l-16 7Z" fill="#9aad8b" />
      <path d="M112 105V60l41-17 63 21v45M153 43V28M112 60l-38-8M216 64l42-15" stroke="#849778" strokeWidth="1.7" strokeDasharray="4 4" />
      <path d="M117 62h75v48h-75Z" fill="#e5e7d8" stroke="#8b9b7e" strokeWidth="1.5" />
      <path d="M127 99V89m11 10V81m11 18V85m11 14V73" stroke="#a4b28c" strokeWidth="5" />
      <path d="m126 82 12-8 11 4 17-10" stroke="#566f54" strokeWidth="2" />
      <path d="M174 74h10m-10 8h10m-10 8h7" stroke="#a5ad90" strokeWidth="2" />
      <path d="M146 110v9h18v-9" stroke="#8b9b7e" strokeWidth="2" />
      {[ [74,52], [153,28], [258,49], [112,105], [216,109] ].map(([x,y]) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="8" fill="#e5e7d8" stroke="#8c9c78" strokeWidth="1.5" /><circle cx={x} cy={y} r="3" fill="#859a70" /></g>)}
      <path d="M78 46q-7 6 0 12m176-15q7 6 0 12" stroke="#9ba98b" strokeWidth="1.3" />
    </>}
  </svg>;
}
