import { mkdirSync, rmSync, closeSync, openSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
mkdirSync(".data",{recursive:true});
const database=path.resolve(".data/e2e-test.db");rmSync(database,{force:true});closeSync(openSync(database,"a"));
execFileSync("./node_modules/.bin/prisma",["migrate","deploy"],{stdio:"inherit",env:{...process.env,DATABASE_URL:`file:${database}`}});
