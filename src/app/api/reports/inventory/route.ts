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

    // Get inventory summary
    const totalItems = await prisma.item.count();

    const lowStockItems = await prisma.item.count({
      where: {
        minStock: {
          gt: 0,
        },
        invTx: {
          some: {
            qty: {
              lte: prisma.item.fields.minStock,
            },
          },
        },
      },
    });

    // Calculate total inventory value
    const itemsWithStock = await prisma.item.findMany({
      include: {
        invTx: {
          select: {
            qty: true,
            unitCost: true,
          },
        },
      },
    });

    const totalValue = itemsWithStock.reduce((sum, item) => {
      const currentStock = item.invTx.reduce(
        (stockSum, tx) => stockSum + Number(tx.qty),
        0
      );
      const avgCost =
        item.invTx.length > 0
          ? item.invTx.reduce(
              (costSum, tx) => costSum + Number(tx.unitCost),
              0
            ) / item.invTx.length
          : 0;
      return sum + currentStock * avgCost;
    }, 0);

    // Inventory by brand
    const inventoryByBrand = await prisma.item.groupBy({
      by: ["brandId"],
      _count: {
        id: true,
      },
      include: {
        brand: true,
      },
    });

    const brandData = await Promise.all(
      inventoryByBrand.map(async (brand) => {
        const brandDetails = await prisma.brand.findUnique({
          where: { id: brand.brandId },
        });

        // Calculate total value for this brand
        const brandItems = await prisma.item.findMany({
          where: { brandId: brand.brandId },
          include: {
            invTx: {
              select: {
                qty: true,
                unitCost: true,
              },
            },
          },
        });

        const brandValue = brandItems.reduce((sum, item) => {
          const currentStock = item.invTx.reduce(
            (stockSum, tx) => stockSum + Number(tx.qty),
            0
          );
          const avgCost =
            item.invTx.length > 0
              ? item.invTx.reduce(
                  (costSum, tx) => costSum + Number(tx.unitCost),
                  0
                ) / item.invTx.length
              : 0;
          return sum + currentStock * avgCost;
        }, 0);

        return {
          brand: brandDetails?.name || "Unknown",
          count: brand._count.id,
          value: brandValue,
        };
      })
    );

    // Inventory by category
    const inventoryByCategory = await prisma.item.groupBy({
      by: ["categoryId"],
      _count: {
        id: true,
      },
    });

    const categoryData = await Promise.all(
      inventoryByCategory.map(async (category) => {
        const categoryDetails = await prisma.category.findUnique({
          where: { id: category.categoryId },
        });

        // Calculate total value for this category
        const categoryItems = await prisma.item.findMany({
          where: { categoryId: category.categoryId },
          include: {
            invTx: {
              select: {
                qty: true,
                unitCost: true,
              },
            },
          },
        });

        const categoryValue = categoryItems.reduce((sum, item) => {
          const currentStock = item.invTx.reduce(
            (stockSum, tx) => stockSum + Number(tx.qty),
            0
          );
          const avgCost =
            item.invTx.length > 0
              ? item.invTx.reduce(
                  (costSum, tx) => costSum + Number(tx.unitCost),
                  0
                ) / item.invTx.length
              : 0;
          return sum + currentStock * avgCost;
        }, 0);

        return {
          category: categoryDetails?.name || "Unknown",
          count: category._count.id,
          value: categoryValue,
        };
      })
    );

    // Calculate turnover rate (simplified)
    const recentSales = await prisma.salesOrderLine.aggregate({
      where: {
        salesOrder: {
          orderDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      },
      _sum: {
        qty: true,
      },
    });

    const recentPurchases = await prisma.purchaseOrderLine.aggregate({
      where: {
        purchaseOrder: {
          orderDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      },
      _sum: {
        qty: true,
      },
    });

    const totalSalesQty = Number(recentSales._sum.qty || 0);
    const totalPurchasesQty = Number(recentPurchases._sum.qty || 0);
    const averageInventory = (totalSalesQty + totalPurchasesQty) / 2;
    const turnoverRate =
      averageInventory > 0 ? totalSalesQty / averageInventory : 0;

    return NextResponse.json({
      summary: {
        totalItems,
        lowStockItems,
        totalValue,
        turnoverRate: Number(turnoverRate.toFixed(2)),
      },
      inventoryByBrand: brandData.sort((a, b) => b.value - a.value),
      inventoryByCategory: categoryData.sort((a, b) => b.value - a.value),
    });
  } catch (error) {
    console.error("Error fetching inventory report:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory report" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}





































