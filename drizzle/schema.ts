import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const streamingApps = mysqlTable("streaming_apps", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  shortDescription: varchar("shortDescription", { length: 320 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["smart-tv", "android-mobile", "live-iptv", "free-codes"]).notNull(),
  iconUrl: text("iconUrl"),
  iconKey: text("iconKey"),
  coverUrl: text("coverUrl"),
  coverKey: text("coverKey"),
  apkUrl: text("apkUrl"),
  mirrorUrl: text("mirrorUrl"),
  activationCodes: text("activationCodes").notNull(),
  compatibility: text("compatibility").notNull(),
  version: varchar("version", { length: 32 }).notNull(),
  fileSize: varchar("fileSize", { length: 32 }).notNull(),
  installationSteps: text("installationSteps").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StreamingApp = typeof streamingApps.$inferSelect;
export type InsertStreamingApp = typeof streamingApps.$inferInsert;
