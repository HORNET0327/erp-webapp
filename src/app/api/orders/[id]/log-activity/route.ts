import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { action, description, metadata } = await request.json();

    if (!action || !description) {
      return NextResponse.json(
        { error: "action과 description은 필수입니다." },
        { status: 400 }
      );
    }

    // 주문 정보 조회
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      select: { orderNo: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 활동 로그 기록
    const activityLog = await prisma.activityLog.create({
      data: {
        userId: user.id,
        action,
        entityType: "SALES_ORDER",
        entityId: id,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ success: true, activityLog });
  } catch (error) {
    console.error("활동 로그 기록 오류:", error);
    return NextResponse.json(
      { error: "활동 로그 기록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
