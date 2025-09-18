import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "sales";
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let whereClause: any = {};

    if (type === "sales") {
      whereClause = {
        salespersonId: sessionUser.id,
        ...(status && status !== "all" ? { status } : {}),
        ...(search
          ? {
              OR: [
                { orderNo: { contains: search, mode: "insensitive" } },
                {
                  customer: { name: { contains: search, mode: "insensitive" } },
                },
              ],
            }
          : {}),
      };
    } else {
      whereClause = {
        buyerId: sessionUser.id,
        ...(status && status !== "all" ? { status } : {}),
        ...(search
          ? {
              OR: [
                { poNo: { contains: search, mode: "insensitive" } },
                { vendor: { name: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      };
    }

    let orders;
    if (type === "sales") {
      orders = await prisma.salesOrder.findMany({
        where: whereClause,
        include: {
          customer: { select: { name: true } },
          salesperson: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } else {
      orders = await prisma.purchaseOrder.findMany({
        where: whereClause,
        include: {
          vendor: { select: { name: true } },
          buyer: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }

    // Transform the data to match the frontend interface
    const transformedOrders = orders.map((order: any) => ({
      id: order.id,
      orderNo: order.orderNo || order.poNo,
      customerName: order.customer?.name,
      vendorName: order.vendor?.name,
      orderDate: order.orderDate || order.poDate,
      status: order.status,
      totalAmount: Number(order.totalAmount || 0),
      salespersonName: order.salesperson?.username,
      buyerName: order.buyer?.username,
      orderType: type,
    }));

    return NextResponse.json({ orders: transformedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
