import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { ActivityLogger } from "@/lib/activity-logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idOrEmail, email, username, password } = body ?? {};
    const loginId = (idOrEmail || username || email) as string;
    if (typeof loginId !== "string" || typeof password !== "string") {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: loginId }, { username: loginId }],
      },
    });
    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const inputHash = hashPassword(password);
    if (inputHash !== user.passwordHash) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    await createSession(user.id);

    // 활동 로그 기록
    await ActivityLogger.login(user.username);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
