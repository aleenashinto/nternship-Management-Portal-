import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logActivity(
  userId: string | null,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata?: Prisma.InputJsonValue,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await tx.activityLog.create({
    data: { userId, action, entityType, entityId: entityId ?? null, metadata },
  });
}
