import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // On Vercel / AWS Lambda serverless runtime, copy seeded database to writable /tmp
  if (process.env.VERCEL) {
    const tmpDbPath = path.join("/tmp", "dev.db");
    const bundledDbPath = path.join(process.cwd(), "prisma", "dev.db");

    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(bundledDbPath)) {
        try {
          fs.copyFileSync(bundledDbPath, tmpDbPath);
        } catch (e) {
          console.error("Failed to copy bundled db to /tmp:", e);
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  return "file:./dev.db";
}

const dbUrl = getDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
