import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, orderData } = body;

    if (type === "sales") {
      const {
        orderNo,
        customerId,
        orderDate,
        status,
        totalAmount,
        notes,
        lines,
      } = orderData;

      // Create sales order
      const salesOrder = await prisma.salesOrder.create({
        data: {
          orderNo,
          customerId,
          salespersonId: sessionUser.id,
          orderDate: new Date(orderDate),
          status: status || "pending",
          totalAmount,
          notes,
        },
      });

      // Create order lines
      if (lines && lines.length > 0) {
        await prisma.salesOrderLine.createMany({
          data: lines.map((line: any) => ({
            salesOrderId: salesOrder.id,
            itemId: line.itemId,
            qty: line.qty,
            unitPrice: line.unitPrice,
            amount: line.amount,
          })),
        });
      }

      return NextResponse.json({
        success: true,
        order: salesOrder,
        message: "판매주문이 성공적으로 생성되었습니다.",
      });
    } else {
      const { poNo, vendorId, orderDate, status, totalAmount, notes, lines } =
        orderData;

      // Create purchase order
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNo,
          vendorId,
          buyerId: sessionUser.id,
          orderDate: new Date(orderDate),
          status: status || "pending",
          totalAmount,
          notes,
        },
      });

      // Create order lines
      if (lines && lines.length > 0) {
        await prisma.purchaseOrderLine.createMany({
          data: lines.map((line: any) => ({
            purchaseOrderId: purchaseOrder.id,
            itemId: line.itemId,
            qty: line.qty,
            unitCost: line.unitCost,
            amount: line.amount,
          })),
        });
      }

      return NextResponse.json({
        success: true,
        order: purchaseOrder,
        message: "구매주문이 성공적으로 생성되었습니다.",
      });
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

