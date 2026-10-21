import { z } from "zod";
import { assertOrigin, requireUser } from "@/server/auth";
import { errorResponse } from "@/server/http";
import { saveRecord, deleteRecord } from "@/server/records";
export async function POST(request:Request) {
  try {assertOrigin(request); const user = await requireUser(); return Response.json(await saveRecord(user.id,await request.json()),{status:201});} catch(error) {return errorResponse(error);}
}
export async function PATCH(request:Request) {
  try {assertOrigin(request);const user = await requireUser();const {id,...input} = await request.json();return Response.json(await saveRecord(user.id,input,z.string().min(1).parse(id)));} catch(error) {return errorResponse(error);}
}
export async function DELETE(request:Request) {
  try {assertOrigin(request);const user = await requireUser();const {id} = z.object({id:z.string().min(1)}).parse(await request.json());await deleteRecord(user.id,id);return Response.json({ok:true});} catch(error) {return errorResponse(error);}
}
