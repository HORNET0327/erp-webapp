import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const brand = searchParams.get("brand") || "";
    const category = searchParams.get("category") || "";

    // where 조건을 단계별로 구성
    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { spec: { contains: search, mode: "insensitive" } },
      ];
    }

    if (brand) {
      whereConditions.brand = {
        name: { contains: brand, mode: "insensitive" },
      };
    }

    if (category) {
      whereConditions.category = {
        name: { contains: category, mode: "insensitive" },
      };
    }

    // Optimized database query with server-side filtering
    const items = await prisma.item.findMany({
      where: whereConditions,
      select: {
        id: true,
        code: true,
        name: true,
        model: true,
        spec: true,
        uom: true,
        minStock: true,
        basePrice: true,
        leadTime: true,
        hasSerial: true,
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Optimized batch stock calculation
    const itemIds = items.map((item) => item.id);

    // Get all stock transactions for all items in one query
    const stockTransactions = await prisma.inventoryTransaction.groupBy({
      by: ["itemId", "txType"],
      where: {
        itemId: { in: itemIds },
      },
      _sum: { qty: true },
      _avg: { unitCost: true },
    });

    // Get recent transactions for all items
    const recentTransactions = await prisma.inventoryTransaction.findMany({
      where: {
        itemId: { in: itemIds },
      },
      select: {
        itemId: true,
        reference: true,
        notes: true,
        txDate: true,
      },
      orderBy: {
        txDate: "desc",
      },
    });

    // Get last purchase transactions for all items
    const lastPurchaseTransactions = await prisma.inventoryTransaction.findMany(
      {
        where: {
          itemId: { in: itemIds },
          txType: "RECEIPT",
        },
        select: {
          itemId: true,
          unitCost: true,
          txDate: true,
        },
        orderBy: {
          txDate: "desc",
        },
      }
    );

    // Process stock data efficiently
    const stockData = new Map();
    stockTransactions.forEach((tx) => {
      const key = tx.itemId;
      if (!stockData.has(key)) {
        stockData.set(key, { receipts: 0, issues: 0, avgCost: 0 });
      }

      if (tx.txType === "RECEIPT") {
        stockData.get(key).receipts = Number(tx._sum.qty || 0);
        stockData.get(key).avgCost = Number(tx._avg.unitCost || 0);
      } else {
        stockData.get(key).issues = Number(tx._sum.qty || 0);
      }
    });

    // Get most recent transaction per item
    const recentTxMap = new Map();
    recentTransactions.forEach((tx) => {
      if (!recentTxMap.has(tx.itemId)) {
        recentTxMap.set(tx.itemId, tx);
      }
    });

    // Get last purchase per item
    const lastPurchaseMap = new Map();
    lastPurchaseTransactions.forEach((tx) => {
      if (!lastPurchaseMap.has(tx.itemId)) {
        lastPurchaseMap.set(tx.itemId, tx);
      }
    });

    // Build final inventory data
    const inventoryWithStock = items.map((item) => {
      const stock = stockData.get(item.id) || {
        receipts: 0,
        issues: 0,
        avgCost: 0,
      };
      const currentStock = stock.receipts - stock.issues;
      const recentTx = recentTxMap.get(item.id);
      const lastPurchase = lastPurchaseMap.get(item.id);

      const lastCost = Number(lastPurchase?.unitCost || 0);
      const avgPurchasePrice_value = stock.avgCost;
      let basePrice = Number(item.basePrice || 0);

      // 기본 판매단가가 0원이고 최근 구매단가가 있으면 10% 마진을 적용
      if (basePrice === 0 && lastCost > 0) {
        basePrice = Math.round(lastCost * 1.1); // 10% 마진
      }

      const stockValue = currentStock * lastCost;

      return {
        ...item,
        currentStock,
        stockValue,
        recentUnitCost: lastCost,
        avgPurchasePrice: avgPurchasePrice_value,
        basePrice,
        minStock: Number(item.minStock || 0),
        leadTime: Number(item.leadTime || 0),
        isLowStock: currentStock < Number(item.minStock || 0),
        reference: recentTx?.reference || null,
        notes: recentTx?.notes || null,
      };
    });

    // Returning optimized inventory data
    return NextResponse.json(inventoryWithStock);
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return NextResponse.json(
      {
        error: "Failed to fetch inventory data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
