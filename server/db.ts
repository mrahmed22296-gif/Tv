import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertStreamingApp, InsertUser, streamingApps, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId, name: user.name, email: user.email, loginMethod: user.loginMethod, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { name: user.name, email: user.email, loginMethod: user.loginMethod, lastSignedIn: values.lastSignedIn };
  if (user.role || user.openId === ENV.ownerOpenId) { values.role = user.role ?? "admin"; updateSet.role = values.role; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return rows[0];
}

export async function listPublicApps() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(streamingApps).where(eq(streamingApps.isActive, 1)).orderBy(desc(streamingApps.updatedAt));
}

export async function listAdminApps() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(streamingApps).orderBy(desc(streamingApps.updatedAt));
}

export async function createApp(data: InsertStreamingApp) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(streamingApps).values(data); const rows = await db.select().from(streamingApps).where(eq(streamingApps.slug, data.slug)).limit(1); return rows[0];
}

export async function updateApp(id: number, data: Partial<InsertStreamingApp>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(streamingApps).set(data).where(eq(streamingApps.id, id)); const rows = await db.select().from(streamingApps).where(eq(streamingApps.id, id)).limit(1); return rows[0];
}

export async function deleteApp(id: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.delete(streamingApps).where(eq(streamingApps.id, id)); return { success: true }; }

export async function countStats() {
  const apps = await listAdminApps();
  return { totalApps: apps.length, activeApps: apps.filter(a => a.isActive === 1).length, activeCodes: apps.reduce((sum, a) => { try { return sum + (JSON.parse(a.activationCodes) as unknown[]).length; } catch { return sum; } }, 0) };
}
