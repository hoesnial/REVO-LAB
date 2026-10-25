import { notFound } from "next/navigation";

// Keep unfinished and unknown URLs inside the REVO fallback route.
export default function UnavailableRevoPage() {
  notFound();
}
