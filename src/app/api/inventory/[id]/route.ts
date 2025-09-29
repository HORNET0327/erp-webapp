import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Inventory update request:", { id: params.id });
    const body = await request.json();
    console.log("Request body:", body);
    const { basePrice, minStock, leadTime, currentStock } = body;

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

    // 트랜잭션으로 아이템 업데이트와 재고 조정 처리
    const result = await prisma.$transaction(async (tx) => {
      // 아이템 업데이트
      const updatedItem = await tx.item.update({
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

      // 현재 재고 조정이 필요한 경우
      if (currentStock !== undefined && currentStock !== "") {
        const newStock = Number(currentStock);

        // 현재 실제 재고 계산
        const receipts = await tx.inventoryTransaction.aggregate({
          where: {
            itemId: updatedItem.id,
            txType: "RECEIPT",
          },
          _sum: { qty: true },
        });

        const issues = await tx.inventoryTransaction.aggregate({
          where: {
            itemId: updatedItem.id,
            txType: "ISSUE",
          },
          _sum: { qty: true },
        });

        const actualStock =
          Number(receipts._sum.qty || 0) - Number(issues._sum.qty || 0);
        const stockDifference = newStock - actualStock;

        if (stockDifference !== 0) {
          // 기본 창고 가져오기
          let warehouse = await tx.warehouse.findFirst();
          if (!warehouse) {
            warehouse = await tx.warehouse.create({
              data: {
                code: "MAIN",
                name: "메인 창고",
                address: "기본 창고",
              },
            });
          }

          // 재고 조정 트랜잭션 생성
          await tx.inventoryTransaction.create({
            data: {
              itemId: updatedItem.id,
              warehouseId: warehouse.id,
              txDate: new Date(),
              txType: stockDifference > 0 ? "RECEIPT" : "ISSUE",
              qty: Math.abs(stockDifference),
              unitCost: updatedItem.invTx[0]?.unitCost || 0,
              serialNo: null,
              lotNo: null,
              expiryDate: null,
              reference: "STOCK_ADJUSTMENT",
              notes: null,
            },
          });
        }
      }

      // 재고 정보 재계산
      const receipts = await tx.inventoryTransaction.aggregate({
        where: {
          itemId: updatedItem.id,
          txType: "RECEIPT",
        },
        _sum: { qty: true },
      });

      const issues = await tx.inventoryTransaction.aggregate({
        where: {
          itemId: updatedItem.id,
          txType: "ISSUE",
        },
        _sum: { qty: true },
      });

      const avgPurchasePrice = await tx.inventoryTransaction.aggregate({
        where: {
          itemId: updatedItem.id,
          txType: "RECEIPT",
        },
        _avg: { unitCost: true },
      });

      const calculatedCurrentStock =
        Number(receipts._sum.qty || 0) - Number(issues._sum.qty || 0);
      const lastCost = Number(updatedItem.invTx[0]?.unitCost || 0);
      const avgPurchasePrice_value = Number(
        avgPurchasePrice._avg.unitCost || 0
      );
      const basePrice_value = Number(updatedItem.basePrice || 0);
      const stockValue = calculatedCurrentStock * lastCost;

      return {
        ...updatedItem,
        currentStock: calculatedCurrentStock,
        stockValue,
        lastCost,
        avgPurchasePrice: avgPurchasePrice_value,
        basePrice: basePrice_value,
        isLowStock: calculatedCurrentStock < Number(updatedItem.minStock || 0),
      };
    });

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
