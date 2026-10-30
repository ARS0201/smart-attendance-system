import { cookies } from "next/headers";
import crypto from "crypto";
import prisma from "./prisma";

const SESSION_COOKIE_NAME = "smart_attend_session";
const COOKIE_SECRET = process.env.SESSION_SECRET || "smart-attend-super-secret-key-32chars!!";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "ADMIN";
  rollNumber?: string | null;
  department: string;
}

export function createToken(payload: SessionUser): string {
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", COOKIE_SECRET);
  hmac.update(data);
  const signature = hmac.digest("base64url");
  const encodedData = Buffer.from(data).toString("base64url");
  return `${encodedData}.${signature}`;
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encodedData, signature] = parts;
    const data = Buffer.from(encodedData, "base64url").toString("utf8");

    const hmac = crypto.createHmac("sha256", COOKIE_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    return JSON.parse(data) as SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }
  return verifyToken(sessionCookie.value);
}

export async function setSessionCookie(user: SessionUser) {
  const token = createToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

