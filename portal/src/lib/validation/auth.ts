import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
});

export const strongPassword = z
  .string()
  .min(10, "At least 10 characters")
  .max(200)
  .regex(/[a-z]/, "Needs a lowercase letter")
  .regex(/[A-Z]/, "Needs an uppercase letter")
  .regex(/[0-9]/, "Needs a digit");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: strongPassword,
});
