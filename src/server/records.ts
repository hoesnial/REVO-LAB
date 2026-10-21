import { Prisma } from "@prisma/client";
import { db } from "./db";
import { ApiError } from "./auth";
import { recordInput } from "./validation";
const json = (value:unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export async function saveRecord(userId:string, raw:unknown, id?:string, source="MANUAL", conversationId?:string) {
  const input = recordInput.parse(raw);
  return db.$transaction(async tx => {
    const previous = id ? await tx.record.findFirst({where:{id,userId}}) : null;
    if (id && !previous) throw new ApiError(404,"Record not found.");
    if (previous && previous.kind !== input.kind) throw new ApiError(400,"The record’s module cannot be changed.");
    for (const [key,kind] of [["goalId","goal"],["projectId","project"],["parentId",null]] as const) {
      const link = input[key];
      if (link && (link === id || !await tx.record.findFirst({where:{id:link,userId,...(kind ? {kind} : {})}}))) throw new ApiError(400,`Invalid ${key} link.`);
    }
    for (const [key,kind] of [["skillId","skill"],["courseId","course"],["datasetId","dataset"]] as const) {
      const link = input.data[key];
      if (link && !await tx.record.findFirst({where:{id:String(link),userId,kind}})) throw new ApiError(400,`Choose an existing ${kind}.`);
    }
    const data = {...input,userId,dueDate:input.dueDate ? new Date(`${input.dueDate}T12:00:00Z`) : null,data:json(input.data),goalId:input.goalId || null,projectId:input.projectId || null,parentId:input.parentId || null,embedding:Prisma.DbNull};
    const record = id ? await tx.record.update({where:{id},data}) : await tx.record.create({data});
    await tx.auditLog.create({data:{userId,source,action:id ? "UPDATE" : "CREATE",target:record.id,previous:previous ? json(previous) : Prisma.DbNull,next:json(record),conversationId,result:"SUCCESS"}});
    return record;
  });
}
export async function deleteRecord(userId:string,id:string) {
  return db.$transaction(async tx => {
    const previous = await tx.record.findFirst({where:{id,userId}});
    if (!previous) throw new ApiError(404,"Record not found.");
    await tx.record.delete({where:{id}});
    await tx.auditLog.create({data:{userId,source:"MANUAL",action:"DELETE",target:id,previous:json(previous),result:"SUCCESS"}});
  });
}
