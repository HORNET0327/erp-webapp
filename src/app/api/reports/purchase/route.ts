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
    const period = searchParams.get("period") || "month";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range based on period
    let dateFilter: any = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        orderDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    } else {
      switch (period) {
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { orderDate: { gte: weekAgo } };
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = { orderDate: { gte: monthAgo } };
          break;
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          dateFilter = { orderDate: { gte: quarterAgo } };
          break;
        case "year":
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          dateFilter = { orderDate: { gte: yearAgo } };
          break;
      }
    }

    // Get purchase data
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        ...dateFilter,
        status: { not: "CANCELLED" },
      },
      include: {
        purchaseOrderLines: {
          include: {
            item: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
        },
        vendor: true,
      },
    });

    // Calculate metrics
    const totalCost = purchaseOrders.reduce((sum, order) => {
      return (
        sum +
        Number(
          order.purchaseOrderLines.reduce(
            (lineSum, line) => lineSum + Number(line.amount),
            0
          )
        )
      );
    }, 0);

    const totalOrders = purchaseOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalCost / totalOrders : 0;

    // Get previous period for growth calculation
    const previousPeriodStart = new Date();
    const currentPeriodStart = new Date();

    switch (period) {
      case "week":
        previousPeriodStart.setDate(now.getDate() - 14);
        currentPeriodStart.setDate(now.getDate() - 7);
        break;
      case "month":
        previousPeriodStart.setMonth(now.getMonth() - 2);
        currentPeriodStart.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        previousPeriodStart.setMonth(now.getMonth() - 6);
        currentPeriodStart.setMonth(now.getMonth() - 3);
        break;
      case "year":
        previousPeriodStart.setFullYear(now.getFullYear() - 2);
        currentPeriodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    const previousPeriodPurchases = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: {
          gte: previousPeriodStart,
          lt: currentPeriodStart,
        },
        status: { not: "CANCELLED" },
      },
      include: {
        purchaseOrderLines: true,
      },
    });

    const previousCost = previousPeriodPurchases.reduce((sum, order) => {
      return (
        sum +
        Number(
          order.purchaseOrderLines.reduce(
            (lineSum, line) => lineSum + Number(line.amount),
            0
          )
        )
      );
    }, 0);

    const growthRate =
      previousCost > 0 ? ((totalCost - previousCost) / previousCost) * 100 : 0;

    // Purchases by category
    const purchasesByCategory = await prisma.purchaseOrderLine.groupBy({
      by: ["itemId"],
      where: {
        purchaseOrder: dateFilter,
      },
      _sum: {
        amount: true,
        qty: true,
      },
    });

    const categoryData = await Promise.all(
      purchasesByCategory.map(async (item) => {
        const itemDetails = await prisma.item.findUnique({
          where: { id: item.itemId },
          include: { category: true },
        });
        return {
          category: itemDetails?.category?.name || "기타",
          amount: Number(item._sum.amount || 0),
          qty: Number(item._sum.qty || 0),
        };
      })
    );

    const categorySummary = categoryData.reduce((acc, item) => {
      if (acc[item.category]) {
        acc[item.category].amount += item.amount;
        acc[item.category].qty += item.qty;
      } else {
        acc[item.category] = { amount: item.amount, qty: item.qty };
      }
      return acc;
    }, {} as Record<string, { amount: number; qty: number }>);

    // Top vendors
    const topVendors = await prisma.purchaseOrder.groupBy({
      by: ["vendorId"],
      where: dateFilter,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalAmount: "desc",
        },
      },
      take: 5,
    });

    const topVendorsData = await Promise.all(
      topVendors.map(async (vendor) => {
        const vendorDetails = await prisma.vendor.findUnique({
          where: { id: vendor.vendorId },
        });
        return {
          name: vendorDetails?.name || "Unknown",
          amount: Number(vendor._sum.totalAmount || 0),
          orders: vendor._count.id,
        };
      })
    );

    return NextResponse.json({
      summary: {
        totalCost,
        totalOrders,
        averageOrderValue,
        growthRate,
      },
      purchasesByCategory: Object.entries(categorySummary).map(
        ([category, data]) => ({
          category,
          amount: data.amount,
          qty: data.qty,
          percentage: totalCost > 0 ? (data.amount / totalCost) * 100 : 0,
        })
      ),
      topVendors: topVendorsData,
      period,
      dateRange: {
        start: dateFilter.orderDate?.gte,
        end: dateFilter.orderDate?.lte || now,
      },
    });
  } catch (error) {
    console.error("Error fetching purchase report:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase report" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}




































