import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, phone, currentPassword, newPassword } = body;

    // 현재 사용자 정보 가져오기
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { userInfo: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};

    // 이메일 업데이트
    if (email && email !== currentUser.email) {
      // 이메일 중복 확인
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: "이미 사용 중인 이메일입니다." },
          { status: 400 }
        );
      }
      updateData.email = email;
    }

    // 비밀번호 업데이트
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "현재 비밀번호를 입력해주세요." },
          { status: 400 }
        );
      }

      // 현재 비밀번호 확인
      const hashedCurrentPassword = hashPassword(currentPassword);
      if (hashedCurrentPassword !== currentUser.passwordHash) {
        return NextResponse.json(
          { error: "현재 비밀번호가 올바르지 않습니다." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "새 비밀번호는 최소 6자 이상이어야 합니다." },
          { status: 400 }
        );
      }

      updateData.passwordHash = hashPassword(newPassword);
    }

    // 사용자 기본 정보 업데이트
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    // 전화번호 업데이트 (UserInfo 테이블)
    if (phone !== undefined) {
      if (currentUser.userInfo) {
        // 기존 UserInfo 업데이트
        await prisma.userInfo.update({
          where: { userId: user.id },
          data: { phone },
        });
      } else {
        // 새 UserInfo 생성
        await prisma.userInfo.create({
          data: {
            userId: user.id,
            phone,
          },
        });
      }
    }

    // 업데이트된 사용자 정보 반환
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userInfo: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "프로필이 성공적으로 업데이트되었습니다.",
      user: {
        id: updatedUser?.id,
        username: updatedUser?.username,
        name: updatedUser?.username,
        email: updatedUser?.email,
        phone: updatedUser?.userInfo?.phone,
        roles: updatedUser?.userRoles.map((ur) => ur.role) || [],
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "프로필 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}







