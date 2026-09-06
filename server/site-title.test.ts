import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("site title configuration", () => {
  it("uses the configured Arabic site title", () => {
    expect(process.env.VITE_APP_TITLE).toBe("برامج مشاهدة التلفاز مجانية");
    expect(ENV.appId).toBeTypeOf("string");
  });
});
