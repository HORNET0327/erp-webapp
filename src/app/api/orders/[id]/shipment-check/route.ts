import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 주문 상세 정보 가져오기
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        lines: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                uom: true,
                minStock: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 각 주문 라인에 대해 재고 확인
    const shipmentCheck = await Promise.all(
      order.lines.map(async (line) => {
        // 현재 재고 계산
        const receipts = await prisma.inventoryTransaction.aggregate({
          where: {
            itemId: line.itemId,
            txType: "RECEIPT",
          },
          _sum: { qty: true },
        });

        const issues = await prisma.inventoryTransaction.aggregate({
          where: {
            itemId: line.itemId,
            txType: "ISSUE",
          },
          _sum: { qty: true },
        });

        const currentStock =
          Number(receipts._sum.qty || 0) - Number(issues._sum.qty || 0);
        const orderedQty = Number(line.qty);
        const available = currentStock >= orderedQty;
        const shortage = available ? 0 : orderedQty - currentStock;

        return {
          itemId: line.item.id,
          itemCode: line.item.code,
          itemName: line.item.name,
          uom: line.item.uom,
          orderedQty,
          currentStock,
          available,
          shortage,
          minStock: Number(line.item.minStock || 0),
          unitPrice: Number(line.unitPrice),
          amount: Number(line.amount),
        };
      })
    );

    // 전체 출고 가능 여부
    const canShipAll = shipmentCheck.every((item) => item.available);
    const totalShortage = shipmentCheck.reduce(
      (sum, item) => sum + item.shortage,
      0
    );

    return NextResponse.json({
      order: {
        id: order.id,
        orderNo: order.orderNo,
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        orderDate: order.orderDate,
        requiredDate: order.requiredDate,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        notes: order.orderMemo || null,
      },
      items: shipmentCheck,
      canShipAll,
      totalShortage,
      summary: {
        totalItems: shipmentCheck.length,
        availableItems: shipmentCheck.filter((item) => item.available).length,
        unavailableItems: shipmentCheck.filter((item) => !item.available)
          .length,
      },
    });
  } catch (error) {
    console.error("Error checking shipment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
