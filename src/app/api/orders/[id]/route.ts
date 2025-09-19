import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      return NextResponse.json({ success: true, order: salesOrder });
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
      return NextResponse.json({ success: true, order: purchaseOrder });
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
