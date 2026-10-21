import { notFound } from "next/navigation";

// Keep unfinished/unknown REVO URLs out of the unrelated Studio catch-all.
export default function UnavailableRevoPage() {
  notFound();
}
