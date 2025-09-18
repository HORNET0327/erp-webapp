import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Inventory update request:", { id: params.id });
    const body = await request.json();
    console.log("Request body:", body);
    const { basePrice, minStock, leadTime } = body;

    // 데이터 검증
    const updateData: any = {};
    if (basePrice !== undefined && basePrice !== "") {
      updateData.basePrice = parseFloat(basePrice);
    }
    if (minStock !== undefined && minStock !== "") {
      updateData.minStock = parseFloat(minStock);
    }
    if (leadTime !== undefined && leadTime !== "") {
      updateData.leadTime = parseInt(leadTime);
    }

    console.log("Update data:", updateData);

    // 아이템 업데이트
    const updatedItem = await prisma.item.update({
      where: { id: params.id },
      data: updateData,
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

    console.log("Updated item:", updatedItem);

    // 재고 정보 재계산
    const receipts = await prisma.inventoryTransaction.aggregate({
      where: {
        itemId: updatedItem.id,
        txType: "RECEIPT",
      },
      _sum: { qty: true },
    });

    const issues = await prisma.inventoryTransaction.aggregate({
      where: {
        itemId: updatedItem.id,
        txType: "ISSUE",
      },
      _sum: { qty: true },
    });

    const avgPurchasePrice = await prisma.inventoryTransaction.aggregate({
      where: {
        itemId: updatedItem.id,
        txType: "RECEIPT",
      },
      _avg: { unitCost: true },
    });

    const currentStock =
      Number(receipts._sum.qty || 0) - Number(issues._sum.qty || 0);
    const lastCost = Number(updatedItem.invTx[0]?.unitCost || 0);
    const avgPurchasePrice_value = Number(avgPurchasePrice._avg.unitCost || 0);
    const basePrice_value = Number(updatedItem.basePrice || 0);
    const stockValue = currentStock * lastCost;

    const result = {
      ...updatedItem,
      currentStock,
      stockValue,
      lastCost,
      avgPurchasePrice: avgPurchasePrice_value,
      basePrice: basePrice_value,
      isLowStock: currentStock < Number(updatedItem.minStock || 0),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to update inventory item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
