import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with roles and userInfo
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        userInfo: true,
      },
    });

    if (!userWithRoles) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: userWithRoles.id,
        username: userWithRoles.username,
        name: userWithRoles.username, // username을 name으로도 사용
        email: userWithRoles.email,
        phone: userWithRoles.userInfo?.phone || "",
        roles: userWithRoles.userRoles.map((ur) => ur.role),
      },
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    return NextResponse.json(
      { error: "Failed to get current user" },
      { status: 500 }
    );
  }
}
