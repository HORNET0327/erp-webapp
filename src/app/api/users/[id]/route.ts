import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import crypto from "crypto";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      roleId,
    } = body;

    const updateData: any = {
      username,
      email,
    };

    // Hash password if provided
    if (password) {
      updateData.passwordHash = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    // Update user info
    await prisma.userInfo.upsert({
      where: { userId: params.id },
      update: {
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
      create: {
        userId: params.id,
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
    });

    // Update role
    if (roleId !== undefined) {
      // Remove existing roles
      await prisma.userRole.deleteMany({
        where: { userId: params.id },
      });

      // Add new role
      if (roleId) {
        await prisma.userRole.create({
          data: {
            userId: params.id,
            roleId,
          },
        });
      }
    }

    // Fetch updated user with roles
    const userWithDetails = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        userInfo: true,
      },
    });

    return NextResponse.json(userWithDetails);
  } catch (error) {
    console.error("Error updating user:", error);

    let errorMessage = "사용자 수정 중 오류가 발생했습니다.";
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Prevent deleting self
    if (params.id === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);

    let errorMessage = "사용자 삭제 중 오류가 발생했습니다.";
    let details = error instanceof Error ? error.message : "알 수 없는 오류";

    // Prisma 오류에 대한 구체적인 메시지
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        errorMessage = "사용자를 삭제할 수 없습니다.";
        details =
          "이 사용자와 연결된 데이터가 있어 삭제할 수 없습니다. 먼저 관련 데이터를 정리해주세요.";
      } else if (error.message.includes("Record to delete does not exist")) {
        errorMessage = "사용자를 찾을 수 없습니다.";
        details = "삭제하려는 사용자가 이미 존재하지 않습니다.";
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
