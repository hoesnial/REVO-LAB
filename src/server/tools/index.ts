import { z } from "zod";
import { db } from "@/server/db";
import { ApiError } from "@/server/auth";
import { saveRecord } from "@/server/records";
import { kindSchema } from "@/server/validation";
import { dateKey, modules, type AgentId, type Kind, type ModuleConfig } from "@/shared/domain";
import { embed } from "@/server/ai/provider";
export const access:Record<AgentId,Kind[]> = {
  chief:Object.keys(modules) as Kind[],
  engineer:["project","task","milestone","decision","skill","knowledge","product","idea","goal"],
  research:["skill","session","knowledge","thesis","paper","dataset","experiment","course","assignment","task","goal","project","milestone"],
  growth:["product","idea","content","application","portfolio","project","task","goal","knowledge","milestone"]
};
type ToolContext={userId:string;agent:AgentId;mode:"ASK"|"DRAFT"|"ACTION";conversationId:string;timezone:string};
const writes:Record<string,Kind>={createTask:"task",createGoal:"goal",createProject:"project",createMilestone:"milestone",createStudySession:"session",createApplication:"application",addPaper:"paper",addExperiment:"experiment",createIdea:"idea",createContent:"content",createKnowledge:"knowledge",createSkill:"skill",createProduct:"product"};
function schemaFor(kind:Kind) {const config:ModuleConfig=modules[kind];return {type:"object",properties:{title:{type:"string"},description:{type:"string"},status:{type:"string",enum:config.statuses},priority:{type:"string",enum:["P0","P1","P2","P3"]},dueDate:{type:["string","null"],description:"YYYY-MM-DD"},goalId:{type:["string","null"]},projectId:{type:["string","null"]},parentId:{type:["string","null"]},data:{type:"object",properties:Object.fromEntries(config.fields.map(f=>[f.key,{type:f.type==="number" ? "number" : "string",description:f.label,...(f.options ? {enum:f.options} : {})}])),additionalProperties:false}},required:["title","status","data"],additionalProperties:false};}
const definition=(name:string,description:string,parameters:unknown)=>({type:"function",function:{name,description,parameters}});
export function toolDefinitions(agent:AgentId,mode:ToolContext["mode"]) {return [
  definition("getTodayTasks","Read real tasks prioritised for today. Never invent tasks.",{type:"object",properties:{},additionalProperties:false}),
  definition("getRecords","Read permitted studio records, optionally filter by text.",{type:"object",properties:{kind:{type:"string",enum:access[agent]},query:{type:"string"}},required:["kind"],additionalProperties:false}),
  definition("getProject","Read a real project and all permitted linked records, including tasks and decisions.",{type:"object",properties:{id:{type:"string"}},required:["id"],additionalProperties:false}),
  definition("getLearningProgress","Read logged sessions and self-assessed skills.",{type:"object",properties:{},additionalProperties:false}),
  definition("getThesisContext","Read actual thesis, paper, dataset and experiment notes.",{type:"object",properties:{},additionalProperties:false}),
  definition("getFinanceSummary","Read actual income, expenses, savings and transfers. Chief of Staff only.",{type:"object",properties:{},additionalProperties:false}),
  definition("searchKnowledge","Search the founder’s own knowledge. Semantic embeddings when configured; transparent keyword fallback otherwise.",{type:"object",properties:{query:{type:"string"}},required:["query"],additionalProperties:false}),
  ...(mode==="ACTION" ? Object.entries(writes).filter(([,kind])=>access[agent].includes(kind)).map(([name,kind])=>definition(name,`Create a validated ${kind}. Only use when explicitly requested. Use actual existing IDs for links.`,schemaFor(kind))) : []),
  ...(mode==="ACTION" ? [definition("updateRecord","Update an existing permitted record. Read first. Supply only changes requested by the Founder; disambiguate candidates before writing.",{type:"object",properties:{id:{type:"string"},changes:{type:"object",properties:{title:{type:"string"},description:{type:"string"},status:{type:"string"},priority:{type:"string"},dueDate:{type:["string","null"]},goalId:{type:["string","null"]},projectId:{type:["string","null"]},data:{type:"object"}},additionalProperties:false}},required:["id","changes"],additionalProperties:false})] : [])
];}
export async function executeTool(name:string,raw:unknown,context:ToolContext) {
  const allowed=access[context.agent];const {userId,conversationId}=context;
  const ensure=(kind:Kind)=>{if(!allowed.includes(kind))throw new ApiError(403,"This agent does not have access to that module.");};
  const read=async(kinds:Kind[])=>{kinds.forEach(ensure);return db.record.findMany({where:{userId,kind:{in:kinds}},select:{id:true,kind:true,title:true,description:true,status:true,priority:true,dueDate:true,data:true,goalId:true,projectId:true,parentId:true,updatedAt:true},take:100,orderBy:{updatedAt:"desc"}});};
  if(writes[name] || name==="updateRecord") {
    if(context.mode!=="ACTION")throw new ApiError(403,"ASK and DRAFT are read only. The Founder must explicitly select ACTION to save changes.");
    if(writes[name]) {const kind=writes[name];ensure(kind);const args=z.record(z.string(),z.unknown()).parse(raw);return saveRecord(userId,{...args,kind},undefined,`AI_${context.agent.toUpperCase()}`,conversationId);}
    const {id,changes}=z.object({id:z.string().min(1),changes:z.record(z.string(),z.unknown())}).strict().parse(raw);
    const old=await db.record.findFirst({where:{id,userId}});if(!old)throw new ApiError(404,"Record not found. No update was made.");ensure(old.kind as Kind);
    return saveRecord(userId,{kind:old.kind,title:old.title,description:old.description,status:old.status,priority:old.priority,dueDate:old.dueDate?.toISOString().slice(0,10) || null,goalId:old.goalId,projectId:old.projectId,parentId:old.parentId,...changes,data:{...(old.data as Record<string,unknown>),...(changes.data as Record<string,unknown> || {})}},id,`AI_${context.agent.toUpperCase()}`,conversationId);
  }
  let result:unknown;
  if(name==="getRecords") {const input=z.object({kind:kindSchema,query:z.string().max(300).optional()}).strict().parse(raw);const records=await read([input.kind]);result=input.query ? records.filter(r=>JSON.stringify(r).toLowerCase().includes(input.query!.toLowerCase())) : records;}
  else if(name==="getTodayTasks") {z.object({}).strict().parse(raw);const today=dateKey(new Date(),context.timezone);result=(await read(["task"])).filter(t=>!["Done","Cancelled"].includes(t.status)).map(t=>({...t,priorityReason:t.status==="Waiting" ? "Waiting for a dependency" : t.priority==="P0" || t.dueDate && dateKey(t.dueDate,context.timezone)<=today ? "Critical or due" : t.priority==="P1" || (t.data as Record<string,unknown>).scheduledDate===today ? "High priority or scheduled today" : "Optional"}));}
  else if(name==="getProject") {const {id}=z.object({id:z.string().min(1)}).strict().parse(raw);ensure("project");const project=await db.record.findFirst({where:{id,userId,kind:"project"}});if(!project)throw new ApiError(404,"Project not found.");const related=await db.record.findMany({where:{userId,projectId:id,kind:{in:allowed}},take:100});result={project,related};}
  else if(name==="getLearningProgress") {z.object({}).strict().parse(raw);result=await read(["skill","session"]);}
  else if(name==="getThesisContext") {z.object({}).strict().parse(raw);result=await read(["thesis","paper","dataset","experiment"]);}
  else if(name==="getFinanceSummary") {z.object({}).strict().parse(raw);const all=await read(["transaction"]);const month=dateKey(new Date(),context.timezone).slice(0,7);const current=all.filter(r=>String((r.data as Record<string,unknown>).date).startsWith(month));result={month,transactions:current,totals:Object.fromEntries(["Income","Expense","Saving","Transfer"].map(status=>[status,current.filter(r=>r.status===status).reduce((n,r)=>n+Number((r.data as Record<string,unknown>).amount || 0),0)]))};}
  else if(name==="searchKnowledge") {const {query}=z.object({query:z.string().min(1).max(500)}).strict().parse(raw);ensure("knowledge");result=await searchKnowledge(userId,query);}
  else throw new ApiError(400,"Unknown tool request.");
  await db.auditLog.create({data:{userId,source:`AI_${context.agent.toUpperCase()}`,action:name,target:"READ",conversationId,result:"SUCCESS"}});
  return result;
}
export function cosine(a:number[],b:number[]) {if(a.length!==b.length || !a.length)return 0;const dot=a.reduce((n,v,i)=>n+v*b[i],0);const norms=Math.sqrt(a.reduce((n,v)=>n+v*v,0)*b.reduce((n,v)=>n+v*v,0));return norms ? dot/norms : 0;}
export async function searchKnowledge(userId:string,query:string) {
  const records=await db.record.findMany({where:{userId,kind:"knowledge"},orderBy:{updatedAt:"desc"},take:100});
  if(!records.length)return {method:"empty",results:[]};
  try {const vector=await embed(userId,query);const candidates=await Promise.all(records.slice(0,30).map(async r=>{let embedding=Array.isArray(r.embedding) ? r.embedding as number[] : null;if(!embedding){embedding=await embed(userId,`${r.title}\n${r.description}\n${JSON.stringify(r.data)}`);await db.record.update({where:{id:r.id},data:{embedding}});}return {id:r.id,title:r.title,description:r.description,data:r.data,score:cosine(vector,embedding)};}));return {method:"semantic",results:candidates.sort((a,b)=>b.score-a.score).slice(0,5)};}
  catch {const words=query.toLowerCase().split(/\s+/).filter(Boolean);return {method:"keyword",notice:"Semantic provider unavailable; results use keyword matching.",results:records.map(r=>({id:r.id,title:r.title,description:r.description,data:r.data,score:words.filter(w=>`${r.title} ${r.description} ${JSON.stringify(r.data)}`.toLowerCase().includes(w)).length})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,5)};}
}
