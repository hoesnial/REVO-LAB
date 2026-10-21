import { db } from "@/server/db";
import { currentUser } from "@/server/auth";
import { emptyState } from "@/shared/domain";
import { errorResponse } from "@/server/http";
import { providerSummary } from "@/server/ai/provider";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) { const exists = !!await db.user.count(); return Response.json({...emptyState,setupRequired:!exists,loginRequired:exists},{headers:{"Cache-Control":"no-store"}}); }
    const aiProvider = await providerSummary(user.id);
    const configured = !!aiProvider.model && (aiProvider.hasApiKey || aiProvider.keyless);
    await db.aITask.updateMany({where:{userId:user.id,status:{in:["WORKING","THINKING"]},startedAt:{lt:new Date(Date.now()-180000)}},data:{status:"ERROR",error:"This run was interrupted or timed out. Please try again.",finishedAt:new Date()}});
    const [records,conversations,runs,audit] = await Promise.all([
      db.record.findMany({where:{userId:user.id},orderBy:{updatedAt:"desc"},select:{id:true,kind:true,title:true,description:true,status:true,priority:true,dueDate:true,data:true,goalId:true,projectId:true,parentId:true,createdAt:true,updatedAt:true}}),
      db.aIConversation.findMany({where:{userId:user.id},orderBy:{updatedAt:"desc"},include:{messages:{orderBy:{createdAt:"asc"}},attachments:{select:{id:true,name:true,mimeType:true,size:true}}}}),
      db.aITask.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:50}),
      db.auditLog.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:100,select:{id:true,source:true,action:true,target:true,result:true,createdAt:true}})
    ]);
    return Response.json({user:{id:user.id,name:user.name,email:user.email,careerTarget:user.careerTarget,timezone:user.timezone},records,conversations,runs,audit,setupRequired:false,loginRequired:false,aiConfigured:configured,aiProvider,storage:"local"},{headers:{"Cache-Control":"no-store"}});
  } catch(error) {return errorResponse(error);}
}
