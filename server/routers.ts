import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { countStats, createApp, deleteApp, listAdminApps, listPublicApps, updateApp } from "./db";
import { storagePut } from "./storage";
import { clearAdminCookie, createAdminToken, setAdminCookie } from "./adminAuth";
import { ENV } from "./_core/env";

const appInput = z.object({
  title: z.string().min(2), slug: z.string().min(2), shortDescription: z.string().min(2), description: z.string().min(2),
  category: z.enum(["smart-tv", "android-mobile", "live-iptv", "free-codes"]), iconUrl: z.string().optional().nullable(), iconKey: z.string().optional().nullable(), coverUrl: z.string().optional().nullable(), coverKey: z.string().optional().nullable(),
  apkUrl: z.string().optional().nullable(), mirrorUrl: z.string().optional().nullable(), activationCodes: z.array(z.object({ title: z.string(), value: z.string() })),
  compatibility: z.array(z.string()), version: z.string(), fileSize: z.string(), installationSteps: z.array(z.string()), isActive: z.boolean().default(true),
});
const adminOnly = protectedProcedure.use(({ ctx, next }) => { if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" }); return next(); });
const serialize = (input: z.infer<typeof appInput>) => ({ ...input, activationCodes: JSON.stringify(input.activationCodes), compatibility: JSON.stringify(input.compatibility), installationSteps: JSON.stringify(input.installationSteps), isActive: input.isActive ? 1 : 0 });

export const appRouter = router({
  system: systemRouter,
  admin: router({
    login: publicProcedure.input(z.object({ username: z.string(), password: z.string() })).mutation(async ({ input, ctx }) => { if (input.username !== ENV.adminUsername || input.password !== ENV.adminPassword) throw new TRPCError({ code: "UNAUTHORIZED", message: "بيانات الدخول غير صحيحة" }); const token = await createAdminToken(); setAdminCookie(ctx.res, token); return { success: true } as const; }),
    logout: publicProcedure.mutation(({ ctx }) => { clearAdminCookie(ctx.res); return { success: true } as const; }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  apps: router({
    publicList: publicProcedure.query(() => listPublicApps()),
    adminList: adminOnly.query(() => listAdminApps()),
    stats: adminOnly.query(() => countStats()),
    create: adminOnly.input(appInput).mutation(({ input }) => createApp(serialize(input))),
    update: adminOnly.input(appInput.extend({ id: z.number() })).mutation(({ input }) => { const { id, ...data } = input; return updateApp(id, serialize(data)); }),
    remove: adminOnly.input(z.object({ id: z.number() })).mutation(({ input }) => deleteApp(input.id)),
    toggle: adminOnly.input(z.object({ id: z.number(), isActive: z.boolean() })).mutation(({ input }) => updateApp(input.id, { isActive: input.isActive ? 1 : 0 })),
    upload: adminOnly.input(z.object({ filename: z.string(), contentType: z.string(), data: z.string() })).mutation(async ({ input }) => { const result = await storagePut(`streamvault/${Date.now()}-${input.filename}`, Buffer.from(input.data, "base64"), input.contentType); return result; }),
  }),
});
export type AppRouter = typeof appRouter;
