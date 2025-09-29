import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 전체 제품 수
    const totalProducts = await prisma.item.count();

    // 재고부족 제품 수 (minStock > currentStock)
    // 모든 제품을 가져와서 재고를 계산
    const allItems = await prisma.item.findMany({
      select: {
        id: true,
        minStock: true,
        invTx: {
          select: {
            qty: true,
            txType: true,
          },
        },
      },
    });

    const lowStockProducts = allItems.filter((item) => {
      if (!item.minStock) return false;

      // 재고 계산 (RECEIPT는 +, ISSUE는 -)
      const currentStock = item.invTx.reduce((sum, tx) => {
        const qty = Number(tx.qty);
        return tx.txType === "RECEIPT" ? sum + qty : sum - qty;
      }, 0);

      return Number(item.minStock) > currentStock;
    }).length;

    // 총 고객 수
    const totalCustomers = await prisma.customer.count({
      where: { isActive: true },
    });

    // 총 공급업체 수
    const totalVendors = await prisma.vendor.count({
      where: { isActive: true },
    });

    // 최근 주문 수 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await prisma.salesOrder.count({
      where: {
        orderDate: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // 총 매출 (판매 주문의 총 금액)
    const salesOrders = await prisma.salesOrder.findMany({
      select: {
        totalAmount: true,
      },
    });

    const totalRevenue = salesOrders.reduce((sum, order) => {
      return sum + Number(order.totalAmount || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts,
        lowStockProducts,
        totalCustomers,
        totalVendors,
        recentOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
