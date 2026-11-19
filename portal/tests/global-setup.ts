import "dotenv/config";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const TEST_URL = "postgresql://postgres:postgres@localhost:5433/portal_test?schema=public";

export default async function setup() {
  const admin = new PrismaClient({ datasources: { db: { url: "postgresql://postgres:postgres@localhost:5433/postgres" } } });
  const exists = await admin.$queryRawUnsafe<{ n: number }[]>(`SELECT 1 AS n FROM pg_database WHERE datname='portal_test'`);
  if (exists.length === 0) await admin.$executeRawUnsafe(`CREATE DATABASE portal_test`);
  await admin.$disconnect();
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: TEST_URL }, stdio: "ignore" });
  process.env.DATABASE_URL = TEST_URL;
}
