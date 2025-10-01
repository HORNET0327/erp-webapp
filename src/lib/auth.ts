import { cookies } from "next/headers";
import { prisma } from "./prisma";
import crypto from "crypto";

export function hashPassword(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

export async function createSession(userId: string) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await prisma.session.create({
    data: { userId, sessionToken, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set("session", sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { sessionToken: token } });
  }
  cookieStore.set("session", "", { path: "/", expires: new Date(0) });
}



































