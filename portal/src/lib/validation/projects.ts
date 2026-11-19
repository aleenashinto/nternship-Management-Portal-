import { z } from "zod";

export const toolEnum = z.enum(["EXCEL", "SQL", "POWER_BI", "TABLEAU", "PYTHON", "OTHER"]);

export const createProjectSchema = z.object({
  title: z.string().trim().min(3).max(200),
  toolsUsed: z.array(toolEnum).min(1, "Select at least one tool"),
  instructions: z.string().trim().min(5).max(5000),
  dataSourceText: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const updateProjectSchema = createProjectSchema.partial().refine((v) => Object.keys(v).length > 0);

export const createAssignmentSchema = z.object({
  projectId: z.string().min(1),
  internId: z.string().min(1),
  assignedDate: z.string().optional(),
  dueDate: z.string().min(1),
});

export const evaluateAssignmentSchema = z.object({
  submissionId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  feedback: z.string().trim().min(2).max(2000),
  decision: z.enum(["COMPLETED", "REVISION_REQUIRED"]),
  correctionInstructions: z.string().trim().max(2000).optional(),
});

export const createExtensionSchema = z.object({
  assignmentId: z.string().min(1),
  reason: z.string().trim().min(5).max(1500),
  requestedDate: z.string().min(1),
});

export const decideExtensionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  approvedDate: z.string().optional(),
});
