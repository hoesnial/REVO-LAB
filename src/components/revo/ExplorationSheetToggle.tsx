export default function ExplorationSheetToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return <button type="button" className="revo-explore-sheet-toggle" aria-expanded={expanded}
    aria-label={expanded ? "Ringkas informasi komponen" : "Perluas informasi komponen"} onClick={onToggle}>
    <span aria-hidden="true" />{expanded ? "Kembali ke model" : "Baca selengkapnya"}
  </button>;
}
