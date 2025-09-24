import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;
    const { lines } = await request.json();

    if (!lines || !Array.isArray(lines)) {
      return NextResponse.json(
        { error: "Lines array is required" },
        { status: 400 }
      );
    }

    // 판매주문과 구매주문을 모두 확인
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: orderId },
    });

    if (salesOrder) {
      // 기존 주문 항목 삭제
      await prisma.salesOrderLine.deleteMany({
        where: { salesOrderId: orderId },
      });

      // 새로운 주문 항목 생성 (itemId가 있는 항목만)
      const validLines = lines.filter(
        (line: any) => line.itemId && line.itemId.trim() !== ""
      );

      if (validLines.length > 0) {
        console.log("Creating sales order lines:", validLines);
        await prisma.salesOrderLine.createMany({
          data: validLines.map((line: any) => ({
            salesOrderId: orderId,
            itemId: line.itemId,
            qty: Number(line.qty) || 0,
            unitPrice: Number(line.unitPrice) || 0,
            amount: Number(line.amount) || 0,
          })),
        });
      }

      // 총 금액 재계산 (유효한 항목들만)
      const totalAmount = validLines.reduce(
        (sum: number, line: any) => sum + (Number(line.amount) || 0),
        0
      );

      console.log("Updating sales order total amount:", {
        validLines: validLines.map((line: any) => ({
          qty: line.qty,
          unitPrice: line.unitPrice,
          amount: line.amount,
          calculation: `${line.qty} * ${line.unitPrice} = ${line.amount}`,
        })),
        totalAmount,
        calculation:
          validLines.map((line: any) => line.amount || 0).join(" + ") +
          " = " +
          totalAmount,
      });

      await prisma.salesOrder.update({
        where: { id: orderId },
        data: { totalAmount },
      });

      return NextResponse.json({ success: true });
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
    });

    if (purchaseOrder) {
      // 기존 주문 항목 삭제
      await prisma.purchaseOrderLine.deleteMany({
        where: { purchaseOrderId: orderId },
      });

      // 새로운 주문 항목 생성
      if (lines.length > 0) {
        await prisma.purchaseOrderLine.createMany({
          data: lines.map((line: any) => ({
            purchaseOrderId: orderId,
            itemId: line.itemId || "",
            qty: line.qty || 0,
            unitPrice: line.unitPrice || 0,
            amount: line.amount || 0,
          })),
        });
      }

      // 총 금액 재계산
      const totalAmount = lines.reduce(
        (sum: number, line: any) => sum + (line.amount || 0),
        0
      );

      await prisma.purchaseOrder.update({
        where: { id: orderId },
        data: { totalAmount },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    console.error("Error updating order lines:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      orderId,
      linesCount: lines?.length,
    });
    return NextResponse.json(
      { error: "Failed to update order lines", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
