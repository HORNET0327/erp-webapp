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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let whereClause: any = {};

    if (type === "sales") {
      whereClause = {
        salespersonId: sessionUser.id,
      };
    } else {
      whereClause = {
        buyerId: sessionUser.id,
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

    // Get completed orders
    const completedOrders = await prisma[model].count({
      where: {
        ...whereClause,
        status: "completed",
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
      completedOrders,
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
  } finally {
    await prisma.$disconnect();
  }
}

