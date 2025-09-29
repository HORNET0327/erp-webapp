import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, quantity, unitCost, reference, notes } = body;

    // 입력값 검증
    if (!itemId || !quantity || !unitCost) {
      return NextResponse.json(
        { error: "필수 항목이 누락되었습니다." },
        { status: 400 }
      );
    }

    if (quantity <= 0 || unitCost < 0) {
      return NextResponse.json(
        { error: "수량과 단가는 0보다 커야 합니다." },
        { status: 400 }
      );
    }

    // 아이템 존재 확인
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: "해당 품목을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 기본 창고 가져오기 (첫 번째 창고 사용)
    let warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) {
      // 기본 창고가 없으면 생성
      warehouse = await prisma.warehouse.create({
        data: {
          code: "MAIN",
          name: "메인 창고",
          address: "기본 창고",
        },
      });
    }

    // 트랜잭션으로 재고 추가
    const result = await prisma.$transaction(async (tx) => {
      // 재고 트랜잭션 생성
      const inventoryTransaction = await tx.inventoryTransaction.create({
        data: {
          itemId,
          warehouseId: warehouse.id,
          txDate: new Date(),
          txType: "RECEIPT",
          qty: quantity,
          unitCost: unitCost,
          serialNo: null,
          lotNo: null,
          expiryDate: null,
          reference: reference || "MANUAL_ADD",
          notes: notes || null,
        },
      });

      // 현재 재고 계산
      const currentStock = await tx.inventoryTransaction.aggregate({
        where: {
          itemId,
          warehouseId: warehouse.id,
          txType: "RECEIPT",
        },
        _sum: {
          qty: true,
        },
      });

      const outboundStock = await tx.inventoryTransaction.aggregate({
        where: {
          itemId,
          warehouseId: warehouse.id,
          txType: "ISSUE",
        },
        _sum: {
          qty: true,
        },
      });

      const totalStock =
        (Number(currentStock._sum.qty) || 0) -
        (Number(outboundStock._sum.qty) || 0);

      // 활동 로그는 현재 스키마에 없으므로 제거

      return {
        inventoryTransaction,
        totalStock,
      };
    });

    return NextResponse.json({
      success: true,
      message: "재고가 성공적으로 추가되었습니다.",
      data: {
        transactionId: result.inventoryTransaction.id,
        totalStock: result.totalStock,
      },
    });
  } catch (error) {
    console.error("Error adding stock:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "재고 추가 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
