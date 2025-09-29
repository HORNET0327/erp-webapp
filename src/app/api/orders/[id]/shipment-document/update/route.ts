import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { shippingMethod, carrier, paymentType, packagingMethod } = body;

    // 주문 존재 확인
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        salesperson: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 배송정보 업데이트 (notes 필드에만 배송정보 저장)
    const updatedOrder = await prisma.salesOrder.update({
      where: { id },
      data: {
        shippingMethod: shippingMethod || "",
        carrier: carrier || "",
        paymentType: paymentType || "선불",
        packagingMethod: packagingMethod || "",
      },
    });

    // 활동 로그 기록
    await logActivity({
      action: "update",
      entityType: "shipment_document",
      entityId: id,
      description: `출고지시서 배송정보 업데이트: ${
        shippingMethod || "미입력"
      }, ${carrier || "미입력"}, ${paymentType || "선불"}, ${
        packagingMethod || "미입력"
      }`,
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating shipment document:", error);
    return NextResponse.json(
      { error: "출고지시서 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
