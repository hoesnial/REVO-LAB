import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { db } from "./db";
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
export function verifyPassword(password:string, hash:string) { const [salt,key] = hash.split(":"); if (!salt || !key) return false; const computed = scryptSync(password,salt,64); const expected = Buffer.from(key,"hex"); return expected.length === computed.length && timingSafeEqual(computed,expected); }
const tokenHash = (token:string) => createHash("sha256").update(token).digest("hex");
export async function currentUser() {
  const token = (await cookies()).get("studio-session")?.value;
  if (!token) return null;
  const session = await db.session.findUnique({where:{id:tokenHash(token)},include:{user:true}});
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function requireUser() { const user = await currentUser(); if (!user) throw new ApiError(401,"Sign in to your studio first."); return user; }
export async function createSession(userId:string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now()+30*86400000);
  await db.session.create({data:{id:tokenHash(token),userId,expiresAt}});
  (await cookies()).set("studio-session",token,{httpOnly:true,sameSite:"strict",secure:process.env.COOKIE_SECURE === "true",expires:expiresAt,path:"/"});
}
export async function logout() { const jar = await cookies(); const token = jar.get("studio-session")?.value; if (token) await db.session.deleteMany({where:{id:tokenHash(token)}}); jar.delete("studio-session"); }
export function assertOrigin(request:Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") || new URL(request.url).host;
  const configuredOrigin = process.env.APP_ORIGIN;
  if (request.headers.get("sec-fetch-site") === "cross-site" || origin && (configuredOrigin ? origin !== new URL(configuredOrigin).origin : new URL(origin).host !== host)) throw new ApiError(403,"Cross-origin requests are not allowed.");
}
