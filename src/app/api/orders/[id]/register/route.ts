import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { requiredDate, orderMemo } = body;

    // 주문 존재 확인
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 주문 상태가 견적대기가 아닌 경우 처리 중단
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending orders can be registered" },
        { status: 400 }
      );
    }

    // 주문 상태를 수주확정으로 변경하고 납기일과 메모 업데이트
    const updatedOrder = await prisma.salesOrder.update({
      where: { id },
      data: {
        status: "confirmed",
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        orderMemo: orderMemo || null,
      },
    });

    // 활동 로그 기록
    await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/orders/${id}/log-activity`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "ORDER_REGISTER",
          description: `수주등록을 완료했습니다: ${order.orderNo}`,
          metadata: {
            orderNo: order.orderNo,
            requiredDate: requiredDate,
            customerName: order.customer.name,
            orderMemo: orderMemo,
          },
        }),
      }
    );

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNo: updatedOrder.orderNo,
        status: updatedOrder.status,
        requiredDate: updatedOrder.requiredDate,
        orderMemo: updatedOrder.orderMemo,
      },
    });
  } catch (error) {
    console.error("Error registering order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
