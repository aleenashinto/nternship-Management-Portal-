import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { HttpError, visibleMentorIds, type Actor } from "@/lib/rbac/guard";
import type { z } from "zod";
import type { createProjectSchema, updateProjectSchema } from "@/lib/validation/projects";

export async function listProjects(actor: Actor) {
  let where = {};
  if (actor.role === "MENTOR") {
    const visible = await visibleMentorIds(actor);
    where = visible === "ALL" ? {} : { createdByMentorId: { in: visible } };
  } else if (actor.role === "INTERN") {
    where = { assignments: { some: { internId: actor.internId ?? "__none__" } } };
  }
  return prisma.project.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true } },
      files: true,
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProject(actor: Actor, input: z.infer<typeof createProjectSchema>, mentorIdOverride?: string) {
  let mentorId = actor.mentorId;
  if (actor.role === "ADMIN" && mentorIdOverride) mentorId = mentorIdOverride;
  if (!mentorId) throw new HttpError(403, "Only a Mentor can create reusable projects");

  const project = await prisma.project.create({
    data: {
      title: input.title,
      toolsUsed: input.toolsUsed,
      instructions: input.instructions,
      dataSourceText: input.dataSourceText || null,
      createdByMentorId: mentorId,
    },
    include: { files: true },
  });
  await logActivity(actor.userId, "PROJECT_CREATED", "Project", project.id, { title: project.title });
  return project;
}

export async function updateProject(actor: Actor, projectId: string, input: z.infer<typeof updateProjectSchema>) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new HttpError(404, "Project not found");

  // Mentors edit ONLY their own projects (Admin can also edit).
  if (actor.role !== "ADMIN" && project.createdByMentorId !== actor.mentorId) {
    throw new HttpError(403, "Mentors may edit only their own projects");
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      title: input.title,
      toolsUsed: input.toolsUsed,
      instructions: input.instructions,
      dataSourceText: input.dataSourceText !== undefined ? input.dataSourceText || null : undefined,
    },
  });
  await logActivity(actor.userId, "PROJECT_UPDATED", "Project", projectId, { fields: Object.keys(input) });
  return updated;
}
