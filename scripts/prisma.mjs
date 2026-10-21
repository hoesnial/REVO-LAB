import { existsSync, mkdirSync, closeSync, openSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
try { process.loadEnvFile(); } catch (error) { if(error.code !== "ENOENT") throw error; }
const provider=process.env.DATABASE_PROVIDER || "sqlite";
if(!["sqlite","postgresql"].includes(provider))throw new Error("DATABASE_PROVIDER must be sqlite or postgresql");
const schema=provider==="postgresql" ? "prisma/postgresql/schema.prisma" : "prisma/schema.prisma";
if(provider==="sqlite") {
  process.env.DATABASE_URL ||= "file:./studio.db";
  if(process.env.DATABASE_URL.startsWith("file:")) {
    const filename=process.env.DATABASE_URL.slice(5);
    const location=path.isAbsolute(filename) ? filename : path.resolve("prisma",filename);
    if(!existsSync(location)){mkdirSync(path.dirname(location),{recursive:true});closeSync(openSync(location,"a"));}
  }
}
execFileSync(path.resolve("node_modules/.bin/prisma"),[...process.argv.slice(2),"--schema",schema],{stdio:"inherit",env:process.env});
