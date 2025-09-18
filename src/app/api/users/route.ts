import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const isAdmin = userWithRoles?.userRoles.some(
      (userRole) => userRole.role.name === "ADMIN"
    );

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        userInfo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const isAdmin = userWithRoles?.userRoles.some(
      (userRole) => userRole.role.name === "ADMIN"
    );

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      username,
      email,
      password,
      employeeCode,
      departmentCode,
      jobTitle,
      phone,
      mobile,
      address,
      hireDate,
      birthDate,
      gender,
      roleIds,
    } = body;

    // Hash password
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        userInfo: {
          create: {
            employeeCode,
            departmentCode,
            jobTitle,
            phone,
            mobile,
            addressLine1: address,
            hireDate: hireDate ? new Date(hireDate) : null,
            birthDate: birthDate ? new Date(birthDate) : null,
            gender,
          },
        },
      },
    });

    // Assign roles
    if (roleIds && roleIds.length > 0) {
      await Promise.all(
        roleIds.map((roleId: string) =>
          prisma.userRole.create({
            data: {
              userId: newUser.id,
              roleId,
            },
          })
        )
      );
    }

    // Fetch created user with roles
    const createdUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        userInfo: true,
      },
    });

    return NextResponse.json(createdUser);
  } catch (error) {
    console.error("Error creating user:", error);

    let errorMessage = "사용자 생성 중 오류가 발생했습니다.";
    let details = error instanceof Error ? error.message : "알 수 없는 오류";

    // Prisma 오류에 대한 구체적인 메시지
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        if (error.message.includes("username")) {
          errorMessage = "사용자명이 이미 존재합니다.";
          details = "입력하신 사용자명은 이미 다른 사용자가 사용 중입니다.";
        } else if (error.message.includes("email")) {
          errorMessage = "이메일이 이미 존재합니다.";
          details = "입력하신 이메일 주소는 이미 다른 사용자가 사용 중입니다.";
        } else if (error.message.includes("employeeCode")) {
          errorMessage = "사번이 이미 존재합니다.";
          details = "입력하신 사번은 이미 다른 사용자가 사용 중입니다.";
        }
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "올바르지 않은 이메일 형식입니다.";
        details = "이메일 주소를 올바른 형식으로 입력해주세요.";
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: details,
      },
      { status: 500 }
    );
  }
}
