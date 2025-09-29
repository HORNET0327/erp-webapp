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

    const { id: orderId } = await params;

    // 판매주문과 구매주문을 모두 확인
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: orderId },
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

    if (salesOrder) {
      // totalAmount를 안전하게 숫자로 변환
      let correctedTotalAmount = Number(salesOrder.totalAmount);

      // totalAmount가 비정상적으로 큰 값이면 주문 항목의 합계로 재계산
      if (correctedTotalAmount > 1000000000 || isNaN(correctedTotalAmount)) {
        // Abnormal totalAmount detected, recalculating from lines

        correctedTotalAmount =
          salesOrder.lines?.reduce(
            (sum: number, line: any) => sum + (Number(line.amount) || 0),
            0
          ) || 0;

        // 데이터베이스의 totalAmount도 수정
        await prisma.salesOrder.update({
          where: { id: orderId },
          data: { totalAmount: correctedTotalAmount },
        });

        // Corrected totalAmount calculated
      }

      // Sales order details processed

      // 수정된 totalAmount를 포함한 주문 정보 반환
      const correctedOrder = {
        ...salesOrder,
        totalAmount: correctedTotalAmount,
        // BigInt 값들을 Number로 변환
        lines: salesOrder.lines?.map((line: any) => ({
          ...line,
          qty: Number(line.qty) || 0,
          unitPrice: Number(line.unitPrice) || 0,
          amount: Number(line.amount) || 0,
        })),
      };

      return NextResponse.json({ success: true, order: correctedOrder });
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
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

    if (purchaseOrder) {
      // BigInt 값들을 Number로 변환
      const correctedPurchaseOrder = {
        ...purchaseOrder,
        totalAmount: Number(purchaseOrder.totalAmount) || 0,
        lines: purchaseOrder.lines?.map((line: any) => ({
          ...line,
          qty: Number(line.qty) || 0,
          unitCost: Number(line.unitCost) || 0,
          amount: Number(line.amount) || 0,
        })),
      };
      return NextResponse.json({
        success: true,
        order: correctedPurchaseOrder,
      });
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;
    const { status, remarks } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // 판매주문과 구매주문을 모두 확인하고 업데이트
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: orderId },
    });

    if (salesOrder) {
      const updatedOrder = await prisma.salesOrder.update({
        where: { id: orderId },
        data: {
          status,
          ...(remarks !== undefined && { notes: remarks }),
        },
        include: {
          customer: true,
          salesperson: true,
        },
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
    });

    if (purchaseOrder) {
      const updatedOrder = await prisma.purchaseOrder.update({
        where: { id: orderId },
        data: {
          status,
          ...(remarks !== undefined && { notes: remarks }),
        },
        include: {
          vendor: true,
          buyer: true,
        },
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
