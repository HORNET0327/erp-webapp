import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isLeadUserOrAbove } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    console.log("Personal stats API called");
    const user = await getSessionUser();
    console.log(
      "Session user:",
      user ? { id: user.id, username: user.username } : "null"
    );

    if (!user) {
      console.log("No user found in session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user roles to check permissions
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
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

    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // Get sales orders (all if LEAD_USER+, own if regular user)
    const [
      monthlySalesOrders,
      yearlySalesOrders,
      monthlyPurchaseOrders,
      yearlyPurchaseOrders,
    ] = await Promise.all([
      // Monthly sales orders
      prisma.salesOrder.findMany({
        where: {
          ...(canViewAllStats ? {} : { salespersonId: user.id }),
          orderDate: {
            gte: startOfMonth,
            lte: currentDate,
          },
        },
        include: {
          lines: true,
        },
      }),
      // Yearly sales orders
      prisma.salesOrder.findMany({
        where: {
          ...(canViewAllStats ? {} : { salespersonId: user.id }),
          orderDate: {
            gte: startOfYear,
            lte: currentDate,
          },
        },
        include: {
          lines: true,
        },
      }),
      // Monthly purchase orders
      prisma.purchaseOrder.findMany({
        where: {
          ...(canViewAllStats ? {} : { buyerId: user.id }),
          orderDate: {
            gte: startOfMonth,
            lte: currentDate,
          },
        },
        include: {
          lines: true,
        },
      }),
      // Yearly purchase orders
      prisma.purchaseOrder.findMany({
        where: {
          ...(canViewAllStats ? {} : { buyerId: user.id }),
          orderDate: {
            gte: startOfYear,
            lte: currentDate,
          },
        },
        include: {
          lines: true,
        },
      }),
    ]);

    // Calculate sales statistics
    const monthlySalesValue = monthlySalesOrders.reduce((sum, order) => {
      return (
        sum +
        order.lines.reduce((lineSum, line) => {
          return lineSum + Number(line.qty) * Number(line.unitPrice);
        }, 0)
      );
    }, 0);

    const yearlySalesValue = yearlySalesOrders.reduce((sum, order) => {
      return (
        sum +
        order.lines.reduce((lineSum, line) => {
          return lineSum + Number(line.qty) * Number(line.unitPrice);
        }, 0)
      );
    }, 0);

    // Calculate purchase statistics
    const monthlyPurchaseValue = monthlyPurchaseOrders.reduce((sum, order) => {
      return (
        sum +
        order.lines.reduce((lineSum, line) => {
          return lineSum + Number(line.qty) * Number(line.unitCost);
        }, 0)
      );
    }, 0);

    const yearlyPurchaseValue = yearlyPurchaseOrders.reduce((sum, order) => {
      return (
        sum +
        order.lines.reduce((lineSum, line) => {
          return lineSum + Number(line.qty) * Number(line.unitCost);
        }, 0)
      );
    }, 0);

    // Count orders
    const monthlySalesCount = monthlySalesOrders.length;
    const yearlySalesCount = yearlySalesOrders.length;
    const monthlyPurchaseCount = monthlyPurchaseOrders.length;
    const yearlyPurchaseCount = yearlyPurchaseOrders.length;

    // Pending orders (not completed)
    const pendingSalesOrders = monthlySalesOrders.filter(
      (order) => order.status !== "COMPLETED"
    ).length;
    const pendingPurchaseOrders = monthlyPurchaseOrders.filter(
      (order) => order.status !== "COMPLETED"
    ).length;

    return NextResponse.json({
      sales: {
        monthly: {
          count: monthlySalesCount,
          value: monthlySalesValue,
        },
        yearly: {
          count: yearlySalesCount,
          value: yearlySalesValue,
        },
        pending: pendingSalesOrders,
      },
      purchases: {
        monthly: {
          count: monthlyPurchaseCount,
          value: monthlyPurchaseValue,
        },
        yearly: {
          count: yearlyPurchaseCount,
          value: yearlyPurchaseValue,
        },
        pending: pendingPurchaseOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching personal stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch personal statistics" },
      { status: 500 }
    );
  }
}
