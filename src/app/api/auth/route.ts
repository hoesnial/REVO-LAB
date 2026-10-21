import { z } from "zod";
import { db } from "@/server/db";
import { assertOrigin, ApiError, createSession, hashPassword, logout, requireUser, verifyPassword } from "@/server/auth";
import { errorResponse } from "@/server/http";
import { profileInput } from "@/server/validation";
const attempts = new Map<string,{count:number;expires:number}>();
export async function POST(request:Request) {
  try {
    assertOrigin(request);
    const body = await request.json();
    if (body.action === "logout") { await logout(); return Response.json({ok:true}); }
    if (body.action === "profile") { const user = await requireUser(); const profile = profileInput.parse(body.profile); await db.user.update({where:{id:user.id},data:profile}); return Response.json({ok:true}); }
    const input = z.object({action:z.enum(["setup","login"]),name:z.string().trim().min(1).max(80).optional(),email:z.email().max(200),password:z.string().min(10,"Use at least 10 characters").max(200)}).parse(body);
    const email = input.email.toLowerCase();
    const attempt = attempts.get(email);
    if (attempt && attempt.expires > Date.now() && attempt.count >= 8) throw new ApiError(429,"Too many attempts. Try again in 15 minutes.");
    const user = input.action === "setup" ? await db.$transaction(async tx => {
      if (await tx.user.count()) throw new ApiError(409,"This studio already has a Founder. Please sign in.");
      return tx.user.create({data:{name:input.name || "Founder",email,passwordHash:hashPassword(input.password)}});
    }) : await db.user.findUnique({where:{email}});
    if (!user || input.action === "login" && !verifyPassword(input.password,user.passwordHash)) {
      attempts.set(email,{count:attempt && attempt.expires > Date.now() ? attempt.count + 1 : 1,expires:Date.now()+900000});
      throw new ApiError(401,"Email or password is incorrect.");
    }
    attempts.delete(email);
    await createSession(user.id);
    return Response.json({ok:true});
  } catch(error) {return errorResponse(error);}
}
