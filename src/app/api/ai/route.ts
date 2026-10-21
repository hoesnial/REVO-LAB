import { z } from "zod";
import { assertOrigin, requireUser } from "@/server/auth";
import { errorResponse } from "@/server/http";
import { createConversation, runAgent } from "@/server/ai/run";
export const maxDuration=150;
export async function POST(request:Request) {try{assertOrigin(request);const user=await requireUser();const input=await request.json();if(input.action==="conversation"){const {agent}=z.object({action:z.literal("conversation"),agent:z.enum(["chief","engineer","research","growth"])}).strict().parse(input);return Response.json(await createConversation(user.id,agent));}return Response.json(await runAgent(user,input));}catch(error){return errorResponse(error);}}
