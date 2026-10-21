import { z } from "zod";
import { assertOrigin, requireUser } from "@/server/auth";
import { errorResponse } from "@/server/http";
import { draftProvider, listProviderModels, providerSummary, removeProvider, saveProvider, testProvider } from "@/server/ai/provider";

export const dynamic = "force-dynamic";
const input = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["save", "test", "models"]), config: z.unknown() }).strict(),
  z.object({ action: z.literal("remove") }).strict(),
]);
export async function GET() {
  try { const user = await requireUser(); return Response.json(await providerSummary(user.id), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const user = await requireUser();
    const body = input.parse(await request.json());
    let result: unknown;
    if (body.action === "remove") result = await removeProvider(user.id);
    else if (body.action === "save") result = await saveProvider(user.id, body.config);
    else {
      const config = await draftProvider(user.id, body.config, body.action !== "models");
      result = body.action === "models" ? { models: await listProviderModels(config) } : await testProvider(config);
    }
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
