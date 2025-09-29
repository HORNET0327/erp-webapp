import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLeadUserOrAbove } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "sales";

    // Get user roles to check permissions
    const userWithRoles = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const userRoles = userWithRoles?.userRoles.map((ur) => ur.role.name) || [];
    const canViewAllStats = isLeadUserOrAbove(userRoles);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let whereClause: any = {};

    if (type === "sales") {
      whereClause = {
        // LEAD_USER 이상이면 모든 통계, 아니면 자신의 통계만
        ...(canViewAllStats ? {} : { salespersonId: sessionUser.id }),
      };
    } else {
      whereClause = {
        // LEAD_USER 이상이면 모든 통계, 아니면 자신의 통계만
        ...(canViewAllStats ? {} : { buyerId: sessionUser.id }),
      };
    }

    const model = type === "sales" ? "salesOrder" : "purchaseOrder";

    // Get total orders
    const totalOrders = await prisma[model].count({
      where: whereClause,
    });

    // Get pending orders
    const pendingOrders = await prisma[model].count({
      where: {
        ...whereClause,
        status: "pending",
      },
    });

    // Get confirmed orders (수주확정)
    const confirmedOrders = await prisma[model].count({
      where: {
        ...whereClause,
        status: "confirmed",
      },
    });

    // Get ready to ship orders (출고대기)
    const readyToShipOrders = await prisma[model].count({
      where: {
        ...whereClause,
        status: "ready_to_ship",
      },
    });

    // Get shipping orders (배송중)
    const shippingOrders = await prisma[model].count({
      where: {
        ...whereClause,
        status: "shipping",
      },
    });

    // Get shipped orders (배송완료)
    const shippedOrders = await prisma[model].count({
      where: {
        ...whereClause,
        status: "shipped",
      },
    });

    // Get payment pending orders (수금대기)
    const paymentPendingOrders = await prisma[model].count({
      where: {
        ...whereClause,
        status: "payment_pending",
      },
    });

    // Get completed orders (수금완료)
    const completedOrders = await prisma[model].count({
      where: {
        ...whereClause,
        status: "completed",
      },
    });

    // Get cancelled orders
    const cancelledOrders = await prisma[model].count({
      where: {
        ...whereClause,
        status: "cancelled",
      },
    });

    // Get total value
    const totalValueResult = await prisma[model].aggregate({
      where: whereClause,
      _sum: {
        totalAmount: true,
      },
    });

    // Get monthly orders
    const monthlyOrders = await prisma[model].count({
      where: {
        ...whereClause,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Get monthly value
    const monthlyValueResult = await prisma[model].aggregate({
      where: {
        ...whereClause,
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const stats = {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      readyToShipOrders,
      shippingOrders,
      shippedOrders,
      paymentPendingOrders,
      completedOrders,
      cancelledOrders,
      totalValue: Number(totalValueResult._sum.totalAmount || 0),
      monthlyOrders,
      monthlyValue: Number(monthlyValueResult._sum.totalAmount || 0),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch order stats" },
      { status: 500 }
    );
  }
}
