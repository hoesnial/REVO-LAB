import { describe, expect, it } from "vitest";
import { dateKey, progress, todayGroups, type StudioRecord } from "@/shared/domain";
import { recordInput } from "@/server/validation";
import { assertOrigin, hashPassword, verifyPassword } from "@/server/auth";
const record=(overrides:Partial<StudioRecord>):StudioRecord=>({id:"r1",kind:"task",title:"A real task",description:"",status:"Planned",priority:"P2",dueDate:null,data:{},projectId:null,goalId:null,parentId:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...overrides});
describe("meaningful priorities and progress",()=>{
  it("uses the founder timezone at the UTC date boundary",()=>{expect(dateKey(new Date("2026-10-05T20:00:00Z"),"Asia/Jakarta")).toBe("2026-10-06");});
  it("keeps dependency tasks in Waiting even when critical",()=>{const groups=todayGroups([record({status:"Waiting",priority:"P0"})]);expect(groups.Waiting).toHaveLength(1);expect(groups["Must do"]).toHaveLength(0);});
  it("derives priority from actual due dates, excludes completed tasks",()=>{const groups=todayGroups([record({id:"overdue",dueDate:"2020-01-01T12:00:00Z"}),record({id:"done",status:"Done",priority:"P0"}),record({id:"high",priority:"P1"}),record({id:"normal"})]);expect(groups["Must do"].map(t=>t.id)).toEqual(["overdue"]);expect(groups["Should do"].map(t=>t.id)).toEqual(["high"]);expect(groups.Optional.map(t=>t.id)).toEqual(["normal"]);});
  it("does not invent goal progress and excludes cancelled work",()=>{const goal=record({id:"goal",kind:"goal",status:"Active"});expect(progress(goal,[])).toBe(0);expect(progress(goal,[record({id:"a",status:"Done",goalId:"goal"}),record({id:"b",status:"Planned",goalId:"goal"}),record({id:"c",status:"Cancelled",goalId:"goal"})])).toBe(50);});
  it("connects a project’s completed tasks to its parent goal",()=>{const goal=record({id:"goal",kind:"goal",status:"Active"});const project=record({id:"project",kind:"project",status:"Building",goalId:"goal"});expect(progress(goal,[project,record({id:"done",projectId:"project",status:"Done"})])).toBe(100);});
});
describe("validated mutations",()=>{
  it("accepts the public request host while rejecting cross-site origins",()=>{expect(()=>assertOrigin(new Request("http://localhost:3000/api/auth",{headers:{host:"127.0.0.1:3000",origin:"http://127.0.0.1:3000"}}))).not.toThrow();expect(()=>assertOrigin(new Request("http://localhost:3000/api/auth",{headers:{host:"localhost:3000",origin:"https://untrusted.invalid"}}))).toThrow("Cross-origin");});
  it("rejects fabricated skill scores and unknown fields",()=>{expect(recordInput.safeParse({kind:"skill",title:"AI",status:"Learning",data:{level:97}}).success).toBe(false);});
  it("rejects negative transactions and invalid transfer destinations",()=>{expect(recordInput.safeParse({kind:"transaction",title:"Expense",status:"Expense",data:{amount:-5,category:"Food",account:"Cash",date:"2026-10-06"}}).success).toBe(false);expect(recordInput.safeParse({kind:"transaction",title:"Transfer",status:"Transfer",data:{amount:500,category:"Transfer",account:"Cash",date:"2026-10-06"}}).success).toBe(false);});
  it("rejects script URLs and statuses from another module",()=>{expect(recordInput.safeParse({kind:"project",title:"App",status:"Building",data:{demo:"javascript:alert(1)"}}).success).toBe(false);expect(recordInput.safeParse({kind:"task",title:"Work",status:"Shipped",data:{}}).success).toBe(false);});
  it("hashes passwords with unique salts and verifies without a plaintext store",()=>{const a=hashPassword("a-safe-founder-password");const b=hashPassword("a-safe-founder-password");expect(a).not.toBe(b);expect(verifyPassword("a-safe-founder-password",a)).toBe(true);expect(verifyPassword("wrong-password",a)).toBe(false);});
});
