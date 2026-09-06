import { jwtVerify, SignJWT } from "jose";
import type { Request, Response } from "express";
import { ENV } from "./_core/env";

export const ADMIN_COOKIE = "streamvault_admin";
const secret = new TextEncoder().encode(ENV.cookieSecret || "development-only-secret");

export async function createAdminToken() {
  return new SignJWT({ role: "admin", name: "ahmed" }).setProtectedHeader({ alg: "HS256" }).setSubject("streamvault-admin").setIssuedAt().setExpirationTime("7d").sign(secret);
}
export async function isAdminRequest(req: Request) {
  const raw = req.headers.cookie?.split(";").map(v => v.trim()).find(v => v.startsWith(`${ADMIN_COOKIE}=`))?.split("=").slice(1).join("=");
  if (!raw) return false;
  try { const { payload } = await jwtVerify(raw, secret); return payload.role === "admin" && payload.sub === "streamvault-admin"; } catch { return false; }
}
export function setAdminCookie(res: Response, token: string) { res.cookie(ADMIN_COOKIE, token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" }); }
export function clearAdminCookie(res: Response) { res.clearCookie(ADMIN_COOKIE, { httpOnly: true, secure: true, sameSite: "none", maxAge: -1, path: "/" }); }
