import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function ctx(): TrpcContext {
  const cookies: Array<{ name: string; value: string }> = [];
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { cookie: (name: string, value: string) => cookies.push({ name, value }) } as TrpcContext["res"] };
}

describe("admin credential login", () => {
  it("accepts the configured credentials and rejects invalid ones", async () => {
    const caller = appRouter.createCaller(ctx());
    const success = await caller.admin.login({ username: process.env.ADMIN_USERNAME!, password: process.env.ADMIN_PASSWORD! });
    expect(success.success).toBe(true);
    await expect(caller.admin.login({ username: "wrong", password: "wrong" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
