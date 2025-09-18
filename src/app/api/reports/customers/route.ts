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

    // Get customer summary
    const totalCustomers = await prisma.customer.count();
    const activeCustomers = await prisma.customer.count({
      where: { isActive: true },
    });

    // New customers in the period
    const newCustomers = await prisma.customer.count({
      where: {
        createdAt: {
          gte:
            dateFilter.orderDate?.gte ||
            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Customer sales data
    const customerSales = await prisma.salesOrder.groupBy({
      by: ["customerId"],
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
    });

    const customerSalesData = await Promise.all(
      customerSales.map(async (customer) => {
        const customerDetails = await prisma.customer.findUnique({
          where: { id: customer.customerId },
        });
        return {
          id: customer.customerId,
          name: customerDetails?.name || "Unknown",
          totalAmount: Number(customer._sum.totalAmount || 0),
          orderCount: customer._count.id,
          averageOrderValue:
            customer._count.id > 0
              ? Number(customer._sum.totalAmount || 0) / customer._count.id
              : 0,
        };
      })
    );

    const totalRevenue = customerSalesData.reduce(
      (sum, customer) => sum + customer.totalAmount,
      0
    );
    const averageOrderValue =
      customerSalesData.length > 0
        ? totalRevenue /
          customerSalesData.reduce(
            (sum, customer) => sum + customer.orderCount,
            0
          )
        : 0;

    // Top customers by revenue
    const topCustomers = customerSalesData.slice(0, 10);

    // Customer activity analysis
    const customerActivity = await prisma.salesOrder.groupBy({
      by: ["customerId"],
      where: {
        orderDate: {
          gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      _count: {
        id: true,
      },
    });

    const activeCustomerCount = customerActivity.length;
    const inactiveCustomerCount = totalCustomers - activeCustomerCount;

    // Customer distribution by order count
    const orderCountDistribution = {
      highValue: customerSalesData.filter((c) => c.orderCount >= 10).length,
      mediumValue: customerSalesData.filter(
        (c) => c.orderCount >= 5 && c.orderCount < 10
      ).length,
      lowValue: customerSalesData.filter(
        (c) => c.orderCount > 0 && c.orderCount < 5
      ).length,
      noOrders: totalCustomers - customerSalesData.length,
    };

    return NextResponse.json({
      summary: {
        totalCustomers,
        activeCustomers,
        newCustomers,
        averageOrderValue,
        totalRevenue,
        activeCustomerCount,
        inactiveCustomerCount,
      },
      topCustomers,
      orderCountDistribution,
      customerSalesData,
      period,
      dateRange: {
        start: dateFilter.orderDate?.gte,
        end: dateFilter.orderDate?.lte || now,
      },
    });
  } catch (error) {
    console.error("Error fetching customers report:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers report" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

