import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");

// Admin may only create HR Managers and Mentors (never interns).
export const createStaffSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("HR"),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
  }),
  z.object({
    role: z.literal("MENTOR"),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().min(5).max(30),
    workStartTime: time,
    workEndTime: time,
  }),
]);

export const updateStaffSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().min(5).max(30),
    workStartTime: time,
    workEndTime: time,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const statusSchema = z.object({ isActive: z.boolean() });

export const listUsersQuery = z.object({ role: z.enum(["HR", "MENTOR"]).optional() });
