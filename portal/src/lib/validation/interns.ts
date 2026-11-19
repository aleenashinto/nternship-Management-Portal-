import { z } from "zod";

export const registerInternSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone1: z.string().trim().min(5).max(30),
  phone2: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().min(3).max(300),
  educationalQualification: z.string().trim().min(2).max(160),
  source: z.enum(["DIRECT", "OTHER"]).default("DIRECT"),
  mentorId: z.string().trim().optional().or(z.literal("")),
  startDate: z.string().optional(),
});

export const assignMentorSchema = z.object({
  mentorId: z.string().nullable(),
});
