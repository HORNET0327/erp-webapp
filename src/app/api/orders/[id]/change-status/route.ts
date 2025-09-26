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

    const { id: orderId } = await params;
    const { action, description, metadata } = await request.json();

    // 판매주문과 구매주문을 모두 확인
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: orderId },
    });

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
    });

    if (!salesOrder && !purchaseOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let newStatus: string;
    let orderType: string;

    // 액션에 따른 상태 변경 로직
    switch (action) {
      case "CONFIRM_ORDER":
        newStatus = "confirmed";
        orderType = salesOrder ? "sales" : "purchase";
        break;
      case "CREATE_SHIPMENT":
        newStatus = "ready_to_ship";
        orderType = salesOrder ? "sales" : "purchase";
        break;
      case "PROCESS_SHIPMENT":
        newStatus = "shipping";
        orderType = salesOrder ? "sales" : "purchase";
        break;
      case "COMPLETE_SHIPPING":
        newStatus = "payment_pending"; // 배송완료 시 자동으로 수금대기로 변경
        orderType = salesOrder ? "sales" : "purchase";
        break;
      case "REGISTER_PAYMENT":
        newStatus = "completed";
        orderType = salesOrder ? "sales" : "purchase";
        break;
      case "CANCEL_ORDER":
        newStatus = "cancelled";
        orderType = salesOrder ? "sales" : "purchase";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // 상태 변경 전 유효성 검사
    const currentOrder = salesOrder || purchaseOrder;
    if (!isValidStatusTransition(currentOrder!.status, newStatus)) {
      return NextResponse.json(
        { error: "Invalid status transition" },
        { status: 400 }
      );
    }

    // 주문 상태 업데이트
    let updatedOrder;
    if (salesOrder) {
      updatedOrder = await prisma.salesOrder.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: {
          customer: true,
          salesperson: true,
          lines: {
            include: {
              item: {
                include: {
                  brand: true,
                  category: true,
                },
              },
            },
          },
        },
      });
    } else {
      updatedOrder = await prisma.purchaseOrder.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: {
          vendor: true,
          buyer: true,
          lines: {
            include: {
              item: {
                include: {
                  brand: true,
                  category: true,
                },
              },
            },
          },
        },
      });
    }

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: sessionUser.id,
        action,
        entityType: "ORDER",
        entityId: orderId,
        description: description || `Order status changed to ${newStatus}`,
        metadata: JSON.stringify({
          orderId,
          orderType,
          oldStatus: currentOrder!.status,
          newStatus,
          ...(metadata && typeof metadata === "object" ? metadata : {}),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      statusChange: {
        from: currentOrder!.status,
        to: newStatus,
      },
    });
  } catch (error) {
    console.error("Error changing order status:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      orderId: params ? (params as any).id : "unknown",
    });
    return NextResponse.json(
      {
        error: "Failed to change order status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 상태 전환 유효성 검사 함수
function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["ready_to_ship", "cancelled"],
    ready_to_ship: ["shipping", "cancelled"],
    shipping: ["payment_pending", "cancelled"], // 배송완료 시 자동으로 수금대기로
    payment_pending: ["completed", "cancelled"],
    completed: [], // 완료된 주문은 더 이상 변경 불가
    cancelled: [], // 취소된 주문은 더 이상 변경 불가
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}
