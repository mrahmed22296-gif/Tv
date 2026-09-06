import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context = (role: "admin" | "user"): TrpcContext => ({
  user: { id: 1, openId: `${role}-test`, email: `${role}@example.com`, name: role, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("streaming apps procedures", () => {
  it("allows public app discovery without authentication", async () => {
    const result = await appRouter.createCaller({ ...context("user"), user: undefined }).apps.publicList();
    expect(Array.isArray(result)).toBe(true);
  });
  it("rejects management access for non-admin users", async () => {
    await expect(appRouter.createCaller(context("user")).apps.adminList()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("allows admin statistics access", async () => {
    const result = await appRouter.createCaller(context("admin")).apps.stats();
    expect(result).toHaveProperty("totalApps");
    expect(result).toHaveProperty("activeCodes");
  });
});
