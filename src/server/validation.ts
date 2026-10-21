import { z } from "zod";
import { modules, type Kind, type ModuleConfig } from "@/shared/domain";
export const kindSchema = z.enum(Object.keys(modules) as [Kind, ...Kind[]]);
export const recordInput = z.object({
  kind: kindSchema,
  title: z.string().trim().min(1,"A title is required").max(200),
  description: z.string().max(30000).default(""),
  status: z.string().min(1),
  priority: z.enum(["P0","P1","P2","P3"]).default("P2"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  data: z.record(z.string(),z.union([z.string().max(30000),z.number().finite(),z.boolean()])).default({}),
  goalId: z.string().nullable().optional(), projectId:z.string().nullable().optional(), parentId:z.string().nullable().optional()
}).strict().superRefine((input,ctx) => {
  const config: ModuleConfig = modules[input.kind];
  if (!config.statuses.includes(input.status)) ctx.addIssue({code:"custom",path:["status"],message:"Invalid status for this module"});
  for (const key of Object.keys(input.data)) if (!config.fields.some(f => f.key === key)) ctx.addIssue({code:"custom",path:["data",key],message:"Unknown field"});
  for (const field of config.fields) {
    const value = input.data[field.key];
    if (field.required && (value === undefined || value === "")) ctx.addIssue({code:"custom",path:["data",field.key],message:`${field.label} is required`});
    if (value === undefined || value === "") continue;
    if (field.type === "number" && (typeof value !== "number" || field.min !== undefined && value < field.min || field.max !== undefined && value > field.max)) ctx.addIssue({code:"custom",path:["data",field.key],message:"Invalid numeric value"});
    if (field.options && !field.options.includes(String(value))) ctx.addIssue({code:"custom",path:["data",field.key],message:"Invalid selection"});
    if (field.type === "url" && !z.url({protocol:/^https?$/}).safeParse(value).success) ctx.addIssue({code:"custom",path:["data",field.key],message:"Use an http or https URL"});
    if (field.type === "date" && (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)))) ctx.addIssue({code:"custom",path:["data",field.key],message:"Invalid date"});
  }
  if (input.kind === "budget" && !/^\d{4}-(0[1-9]|1[0-2])$/.test(String(input.data.month))) ctx.addIssue({code:"custom",path:["data","month"],message:"Use YYYY-MM"});
  if (input.kind === "transaction" && input.status === "Transfer" && !input.data.destination) ctx.addIssue({code:"custom",path:["data","destination"],message:"A destination account is required for transfers"});
});
export type RecordInput = z.infer<typeof recordInput>;
export const profileInput = z.object({name:z.string().trim().min(1).max(80),careerTarget:z.string().trim().max(120),timezone:z.string().refine(v => {try {new Intl.DateTimeFormat("en",{timeZone:v});return true;} catch{return false;}},"Invalid timezone")}).strict();
