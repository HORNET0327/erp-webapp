import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 전체 통계
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      convertedRequests,
      totalValue,
      monthlyRequests,
      monthlyValue,
    ] = await Promise.all([
      prisma.purchaseRequest.count(),
      prisma.purchaseRequest.count({ where: { status: "pending" } }),
      prisma.purchaseRequest.count({ where: { status: "approved" } }),
      prisma.purchaseRequest.count({ where: { status: "rejected" } }),
      prisma.purchaseRequest.count({ where: { status: "converted" } }),
      prisma.purchaseRequest.aggregate({
        _sum: { totalAmount: true },
      }),
      prisma.purchaseRequest.count({
        where: {
          requestDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.purchaseRequest.aggregate({
        where: {
          requestDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const stats = {
      totalOrders: totalRequests,
      pendingOrders: pendingRequests,
      confirmedOrders: approvedRequests, // 승인됨
      readyToShipOrders: 0, // 구매요청에는 해당 없음
      shippingOrders: 0, // 구매요청에는 해당 없음
      shippedOrders: 0, // 구매요청에는 해당 없음
      paymentPendingOrders: 0, // 구매요청에는 해당 없음
      completedOrders: convertedRequests, // 변환됨
      cancelledOrders: rejectedRequests, // 거부됨
      totalValue: Number(totalValue._sum.totalAmount || 0),
      monthlyOrders: monthlyRequests,
      monthlyValue: Number(monthlyValue._sum.totalAmount || 0),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching purchase request stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase request stats" },
      { status: 500 }
    );
  }
}
