import { redirect } from "next/navigation";
import { REVO_ROUTES } from "@/lib/revo/routes";

export default function LegacyEraSelectionPage(): never {
  redirect(REVO_ROUTES.menu);
}
