import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { db } from "@/server/db";
import { saveRecord, deleteRecord } from "@/server/records";
import { executeTool, toolDefinitions } from "@/server/tools";
import { runAgent } from "@/server/ai/run";
import { draftProvider, saveProvider, providerConfig, providerSummary, removeProvider, testProvider, listProviderModels, normalizeBaseURL } from "@/server/ai/provider";
let user:{id:string;name:string;timezone:string;careerTarget:string};let otherId:string;
const task={kind:"task",title:"Read database context",status:"Planned",priority:"P1",data:{}};
beforeAll(async()=>{mkdirSync(".data",{recursive:true});rmSync(".data/unit-test.db",{force:true});for(const directory of readdirSync("prisma/migrations").filter(name=>/^\d/.test(name)).sort()){const migration=readFileSync(path.join("prisma/migrations",directory,"migration.sql"),"utf8");for(const statement of migration.split(";").filter(s=>s.trim()))await db.$executeRawUnsafe(statement);}const a=await db.user.create({data:{name:"Test Founder",email:"unit@test.invalid",passwordHash:"test-only"}});user={id:a.id,name:a.name,timezone:a.timezone,careerTarget:a.careerTarget};otherId=(await db.user.create({data:{name:"Other",email:"other@test.invalid",passwordHash:"test-only"}})).id;});
beforeEach(async()=>{vi.restoreAllMocks();await db.aIProviderSetting.deleteMany();await db.auditLog.deleteMany();await db.aITask.deleteMany();await db.aIConversation.deleteMany();await db.record.deleteMany();});
afterAll(async()=>{await db.$disconnect();rmSync(".data/unit-test.db",{force:true});});
const context=(mode:"ASK"|"DRAFT"|"ACTION"="ASK",agent:"chief"|"engineer"|"research"|"growth"="chief")=>({userId:user.id,agent,mode,conversationId:"test",timezone:user.timezone});
describe("persistent database and audit",()=>{
  it("atomically creates linked tasks and audit records",async()=>{const project=await saveRecord(user.id,{kind:"project",title:"Actual project",status:"Building",data:{}});const saved=await saveRecord(user.id,{...task,projectId:project.id});expect(saved.projectId).toBe(project.id);expect(await db.auditLog.count({where:{target:saved.id,result:"SUCCESS"}})).toBe(1);});
  it("rejects cross-user links and updates without writing",async()=>{const other=await saveRecord(otherId,{kind:"goal",title:"Private",status:"Active",data:{}});await expect(saveRecord(user.id,{...task,goalId:other.id})).rejects.toThrow("Invalid goalId");await expect(saveRecord(user.id,task,other.id)).rejects.toThrow("Record not found");expect(await db.record.count({where:{userId:user.id}})).toBe(0);});
  it("keeps child records when a project is deleted",async()=>{const project=await saveRecord(user.id,{kind:"project",title:"App",status:"Building",data:{}});const saved=await saveRecord(user.id,{...task,projectId:project.id});await deleteRecord(user.id,project.id);expect((await db.record.findUnique({where:{id:saved.id}}))?.projectId).toBeNull();});
});
describe("agent permission boundaries",()=>{
  it("rejects writes in ASK and DRAFT even if a model invents a tool call",async()=>{for(const mode of ["ASK","DRAFT"] as const)await expect(executeTool("createTask",task,context(mode))).rejects.toThrow("read only");expect(await db.record.count()).toBe(0);expect(toolDefinitions("chief","ASK").some(t=>t.function.name==="createTask")).toBe(false);});
  it("denies financial data to Engineer",async()=>{await expect(executeTool("getFinanceSummary",{},context("ASK","engineer"))).rejects.toThrow("does not have access");});
  it("only returns records owned by the founder",async()=>{await saveRecord(otherId,task);const records=await executeTool("getRecords",{kind:"task"},context());expect(records).toEqual([]);});
});
function mockResponse(content:string,tool?:{name:string;args:unknown}) {return new Response(JSON.stringify({choices:[{message:tool ? {content:null,tool_calls:[{id:"call_1",type:"function",function:{name:tool.name,arguments:JSON.stringify(tool.args)}}]} : {content}}]}),{status:200,headers:{"Content-Type":"application/json"}});}
describe("actual agent run lifecycle with a mock provider",()=>{
  it("persists read conversations and finishes an actual run",async()=>{vi.spyOn(globalThis,"fetch").mockResolvedValue(mockResponse("You have no tasks yet."));const result=await runAgent(user,{action:"run",agent:"chief",text:"What should I do today?",mode:"ASK"});expect((await db.aITask.findUnique({where:{id:result.runId}}))?.status).toBe("DONE");expect(await db.aIMessage.count({where:{conversationId:result.conversationId}})).toBe(2);expect(await db.record.count()).toBe(0);});
  it("saves a validated ACTION and its agent audit",async()=>{vi.spyOn(globalThis,"fetch").mockResolvedValueOnce(mockResponse("",{name:"createTask",args:{title:"Requested task",status:"Planned",data:{}}})).mockResolvedValueOnce(mockResponse("The task was saved."));const result=await runAgent(user,{action:"run",agent:"chief",text:"Save a task called Requested task",mode:"ACTION"});expect(result.toolFailed).toBe(false);expect(await db.record.count()).toBe(1);expect(await db.auditLog.count({where:{source:"AI_CHIEF",action:"CREATE"}})).toBe(1);});
  it("never marks a failed tool as DONE",async()=>{vi.spyOn(globalThis,"fetch").mockResolvedValueOnce(mockResponse("",{name:"createTask",args:{title:"",status:"Planned",data:{}}})).mockResolvedValueOnce(mockResponse("The task was not saved because validation failed."));const result=await runAgent(user,{action:"run",agent:"chief",text:"Save the task",mode:"ACTION"});expect(result.toolFailed).toBe(true);expect(await db.record.count()).toBe(0);expect((await db.aITask.findUnique({where:{id:result.runId}}))?.status).toBe("ERROR");expect(await db.auditLog.count({where:{result:"FAILED"}})).toBe(1);});
  it("sets ERROR when the provider fails",async()=>{vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response("unavailable",{status:503}));await expect(runAgent(user,{action:"run",agent:"research",text:"Draft a learning roadmap",mode:"DRAFT"})).rejects.toThrow("503");expect((await db.aITask.findFirst())?.status).toBe("ERROR");expect(await db.record.count()).toBe(0);});
});

const customProvider = {name:"My custom provider",baseURL:"http://127.0.0.1:11434/v1/",model:"vendor/arbitrary-model:latest",apiKey:"private-test-key",keyless:false,tokenParameter:"max_tokens" as const,embeddingModel:"",transcriptionModel:""};
describe("custom AI provider settings",()=>{
  it("encrypts keys at rest and excludes secrets from the safe summary",async()=>{
    const summary=await saveProvider(user.id,customProvider);
    const row=await db.aIProviderSetting.findUniqueOrThrow({where:{userId:user.id}});
    expect(row.encryptedApiKey).toMatch(/^v1\./);expect(row.encryptedApiKey).not.toContain(customProvider.apiKey);
    expect(JSON.stringify(summary)).not.toContain(customProvider.apiKey);expect(summary).not.toHaveProperty("encryptedApiKey");expect(summary).not.toHaveProperty("apiKey");
    expect((await providerConfig(user.id)).key).toBe(customProvider.apiKey);
    expect((await providerSummary(otherId)).source).toBe("environment");
  });
  it("retains a blank saved key only for the same endpoint and supports replacing it",async()=>{
    await saveProvider(user.id,customProvider);
    await saveProvider(user.id,{...customProvider,model:"a-new-model",apiKey:""});
    expect((await providerConfig(user.id)).key).toBe(customProvider.apiKey);
    await expect(saveProvider(user.id,{...customProvider,baseURL:"https://other.invalid/v1",apiKey:""})).rejects.toThrow("Enter an API key");
    expect((await providerConfig(user.id)).model).toBe("a-new-model");
    await saveProvider(user.id,{...customProvider,apiKey:"replacement-private-key"});
    expect((await providerConfig(user.id)).key).toBe("replacement-private-key");
  });
  it("immediately uses arbitrary model IDs and the configured token parameter in agent requests",async()=>{
    await saveProvider(user.id,customProvider);
    const fetchMock=vi.spyOn(globalThis,"fetch").mockImplementation(async()=>mockResponse("Custom model connected."));
    for(const agent of ["chief","engineer","research","growth"]){await runAgent(user,{action:"run",agent,text:"What should I do?",mode:"ASK"});}
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const [url,options]=fetchMock.mock.calls[0];expect(url).toBe("http://127.0.0.1:11434/v1/chat/completions");
    const body=JSON.parse(String(options?.body));expect(body.model).toBe(customProvider.model);expect(body.max_tokens).toBe(2500);expect(body).not.toHaveProperty("max_completion_tokens");expect(body.tools.length).toBeGreaterThan(0);
    await saveProvider(user.id,{...customProvider,model:"reasoning-model",tokenParameter:"max_completion_tokens",apiKey:""});
    await runAgent(user,{action:"run",agent:"chief",text:"Next step?",mode:"ASK"});
    expect(JSON.parse(String(fetchMock.mock.calls[4][1]?.body))).toMatchObject({model:"reasoning-model",max_completion_tokens:2500});
  });
  it("supports local keyless servers without borrowing environment credentials",async()=>{
    await saveProvider(user.id,{...customProvider,keyless:true,apiKey:""});
    const fetchMock=vi.spyOn(globalThis,"fetch").mockResolvedValue(mockResponse("Local model reply."));
    await runAgent(user,{action:"run",agent:"chief",text:"Hello",mode:"ASK"});
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty("Authorization");
    expect((await db.aIProviderSetting.findUniqueOrThrow({where:{userId:user.id}})).encryptedApiKey).toBeNull();
  });
  it("loads actual model IDs without requiring a chosen model or saving settings",async()=>{
    const config=await draftProvider(user.id,{...customProvider,model:""},false);
    vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(JSON.stringify({data:[{id:"custom-b"},{id:"custom-a"},{id:"custom-b"},{name:"ignore"}]})));
    expect(await listProviderModels(config)).toEqual(["custom-a","custom-b"]);
    expect(await db.aIProviderSetting.count()).toBe(0);expect(await db.aITask.count()).toBe(0);
  });
  it("tests real responses and tool support without saving or creating runs",async()=>{
    const config=await draftProvider(user.id,customProvider);
    const mock=vi.spyOn(globalThis,"fetch").mockResolvedValueOnce(mockResponse("",{name:"studio_connection_check",args:{}})).mockResolvedValueOnce(mockResponse("Hello"));
    expect((await testProvider(config)).supportsTools).toBe(true);
    expect((await testProvider(config)).supportsTools).toBe(false);
    expect(mock).toHaveBeenCalledTimes(2);expect(await db.aIProviderSetting.count()).toBe(0);expect(await db.aITask.count()).toBe(0);expect(await db.record.count()).toBe(0);
  });
  it("keeps saved settings after a failed test and hides upstream error bodies",async()=>{
    await saveProvider(user.id,customProvider);
    vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response("upstream-sensitive-body",{status:401}));
    await expect(testProvider(await draftProvider(user.id,{...customProvider,apiKey:"bad-key"}))).rejects.toThrow("Check your API key");
    expect((await providerConfig(user.id)).key).toBe(customProvider.apiKey);
  });
  it("invalidates cached embeddings after provider changes and restores environment fallback on removal",async()=>{
    const record=await saveRecord(user.id,{kind:"knowledge",title:"A note",status:"Saved",data:{}});
    await db.record.update({where:{id:record.id},data:{embedding:[1,2,3]}});
    await saveProvider(user.id,customProvider);expect((await db.record.findUniqueOrThrow({where:{id:record.id}})).embedding).toBeNull();
    await removeProvider(user.id);expect((await providerSummary(user.id)).source).toBe("environment");expect((await providerConfig(user.id)).key).toBe(process.env.AI_API_KEY);
  });
  it("rejects invalid URLs, embedded credentials, full endpoint paths, and missing models",async()=>{
    for(const url of ["file:///etc/passwd","https://name:secret@provider.invalid/v1","https://provider.invalid/v1?api_key=secret","https://provider.invalid/v1/chat/completions"]){expect(()=>normalizeBaseURL(url)).toThrow();}
    await expect(saveProvider(user.id,{...customProvider,model:""})).rejects.toThrow("Enter a model ID");expect(await db.aIProviderSetting.count()).toBe(0);
  });
});
