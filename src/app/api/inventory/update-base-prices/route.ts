import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Updating base prices for items with 0 base price...");

    // 기본 판매단가가 0원인 모든 아이템을 가져오기
    const itemsWithZeroBasePrice = await prisma.item.findMany({
      where: {
        basePrice: 0,
      },
      include: {
        invTx: {
          where: { txType: "RECEIPT" },
          orderBy: { txDate: "desc" },
          take: 1,
        },
      },
    });

    console.log(
      `Found ${itemsWithZeroBasePrice.length} items with zero base price`
    );

    const updatedItems = [];

    // 각 아이템에 대해 기본 판매단가 업데이트
    for (const item of itemsWithZeroBasePrice) {
      // 최근 구매 단가 가져오기
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

      if (lastCost > 0) {
        // 10% 마진을 적용한 새로운 기본 판매단가 계산
        const newBasePrice = Math.round(lastCost * 1.1);

        // 아이템 업데이트
        const updatedItem = await prisma.item.update({
          where: { id: item.id },
          data: { basePrice: newBasePrice },
          include: {
            brand: true,
            category: true,
          },
        });

        updatedItems.push({
          id: updatedItem.id,
          code: updatedItem.code,
          name: updatedItem.name,
          oldBasePrice: 0,
          newBasePrice: newBasePrice,
          lastCost: lastCost,
          margin: Math.round(((newBasePrice - lastCost) / lastCost) * 100),
        });

        console.log(
          `Updated ${updatedItem.code}: ${updatedItem.name} - Base price: 0 → ${newBasePrice} (Last cost: ${lastCost})`
        );
      } else {
        console.log(
          `Skipped ${item.code}: ${item.name} - No purchase history found`
        );
      }
    }

    return NextResponse.json({
      message: `Successfully updated ${updatedItems.length} items`,
      updatedItems,
    });
  } catch (error) {
    console.error("Error updating base prices:", error);
    return NextResponse.json(
      {
        error: "Failed to update base prices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
