import { db } from "@/server/db";
import { assertOrigin, requireUser, ApiError } from "@/server/auth";
import { errorResponse } from "@/server/http";
import { storage } from "@/storage";
const allowed=["image/png","image/jpeg","image/webp","application/pdf","text/plain","text/markdown","text/csv"];
export async function POST(request:Request) {
  let key:string|undefined;
  try {assertOrigin(request);const user=await requireUser();if(Number(request.headers.get("content-length") || 0)>11000000)throw new ApiError(413,"Files must be under 10 MB.");const form=await request.formData();const file=form.get("file");const conversationId=String(form.get("conversationId") || "");if(!(file instanceof File) || file.size>10000000 || !file.size)throw new ApiError(400,"Choose a file under 10 MB.");if(!allowed.includes(file.type))throw new ApiError(400,"Supported: PNG, JPEG, WebP, PDF, TXT, Markdown, and CSV.");if(!await db.aIConversation.findFirst({where:{id:conversationId,userId:user.id}}))throw new ApiError(404,"Conversation not found.");key=await storage.put(Buffer.from(await file.arrayBuffer()));const attachment=await db.aIAttachment.create({data:{conversationId,name:file.name.replace(/[\r\n]/g,"").slice(0,200),mimeType:file.type,size:file.size,key}});return Response.json({id:attachment.id,name:attachment.name,mimeType:attachment.mimeType,size:attachment.size});}catch(error){if(key)await storage.remove(key).catch(()=>{});return errorResponse(error);}
}
export async function GET(request:Request) {
  try{const user=await requireUser();const id=new URL(request.url).searchParams.get("id") || "";const file=await db.aIAttachment.findFirst({where:{id,conversation:{userId:user.id}}});if(!file)throw new ApiError(404,"Attachment not found.");const buffer=await storage.get(file.key);return new Response(new Uint8Array(buffer),{headers:{"Content-Type":file.mimeType,"Content-Disposition":`attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,"Cache-Control":"private, no-store"}});}catch(error){return errorResponse(error);}
}
