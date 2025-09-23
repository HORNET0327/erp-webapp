import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("Inventory API called");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const brand = searchParams.get("brand") || "";
    const category = searchParams.get("category") || "";

    console.log("Search parameters:", { search, brand, category });

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

    console.log("Where conditions:", whereConditions);

    // 먼저 기본 쿼리로 테스트
    const items = await prisma.item.findMany({
      include: {
        brand: true,
        category: true,
        invTx: {
          where: { txType: "RECEIPT" },
          orderBy: { txDate: "desc" },
          take: 1,
        },
      },
    });

    // 클라이언트 사이드에서 필터링 (임시)
    let filteredItems = items;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.code.toLowerCase().includes(searchLower) ||
          item.name.toLowerCase().includes(searchLower) ||
          (item.model && item.model.toLowerCase().includes(searchLower)) ||
          (item.spec && item.spec.toLowerCase().includes(searchLower))
      );
    }

    if (brand) {
      const brandLower = brand.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.brand && item.brand.name.toLowerCase().includes(brandLower)
      );
    }

    if (category) {
      const categoryLower = category.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.category &&
          item.category.name.toLowerCase().includes(categoryLower)
      );
    }

    console.log("Filtered items:", filteredItems.length);

    // Calculate current stock levels
    const inventoryWithStock = await Promise.all(
      filteredItems.map(async (item) => {
        const receipts = await prisma.inventoryTransaction.aggregate({
          where: {
            itemId: item.id,
            txType: "RECEIPT",
          },
          _sum: { qty: true },
        });

        const issues = await prisma.inventoryTransaction.aggregate({
          where: {
            itemId: item.id,
            txType: "ISSUE",
          },
          _sum: { qty: true },
        });

        // 평균 구매단가 계산 (모든 구매 거래의 평균)
        const avgPurchasePrice = await prisma.inventoryTransaction.aggregate({
          where: {
            itemId: item.id,
            txType: "RECEIPT",
          },
          _avg: { unitCost: true },
        });

        // 최근 재고 트랜잭션 정보 가져오기 (참조와 메모를 위해)
        const recentTransaction = await prisma.inventoryTransaction.findFirst({
          where: {
            itemId: item.id,
          },
          orderBy: {
            txDate: "desc",
          },
          select: {
            reference: true,
            notes: true,
          },
        });

        const currentStock =
          Number(receipts._sum.qty || 0) - Number(issues._sum.qty || 0);

        // 최근 구매 단가 (마지막 구매의 단가)
        const lastPurchaseTransaction =
          await prisma.inventoryTransaction.findFirst({
            where: {
              itemId: item.id,
              txType: "RECEIPT",
            },
            orderBy: {
              txDate: "desc",
            },
            select: {
              unitCost: true,
            },
          });

        const lastCost = Number(lastPurchaseTransaction?.unitCost || 0);
        const avgPurchasePrice_value = Number(
          avgPurchasePrice._avg.unitCost || 0
        );
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
          reference: recentTransaction?.reference || null,
          notes: recentTransaction?.notes || null,
        };
      })
    );

    console.log(
      "Returning inventory data:",
      inventoryWithStock.length,
      "items"
    );
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
