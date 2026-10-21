import { ZodError } from "zod";
import { ApiError } from "./auth";
export function errorResponse(error:unknown) {
  if (error instanceof ZodError) return Response.json({error:error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(" · ")},{status:400});
  if (error instanceof ApiError) return Response.json({error:error.message},{status:error.status});
  console.error("Studio request failed", error instanceof Error ? error.message : "Unknown error");
  return Response.json({error:"The request could not be completed. Your changes were not saved."},{status:500});
}
