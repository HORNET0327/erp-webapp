import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivityLogger } from "@/lib/activity-logger";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      name,
      uom,
      brandId,
      categoryId,
      model,
      spec,
      hasSerial,
      minStock,
      basePrice,
      leadTime,
      initialStock,
      unitCost,
    } = body;

    // 필수 필드 검증
    if (!code || !name) {
      return NextResponse.json(
        { error: "제품코드와 제품명은 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    // 중복 코드 확인
    const existingItem = await prisma.item.findUnique({
      where: { code },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: "이미 존재하는 제품코드입니다." },
        { status: 400 }
      );
    }

    // 브랜드 처리 (기존 브랜드 찾기 또는 새로 생성)
    let brand = null;
    if (brandId && brandId.trim()) {
      brand = await prisma.brand.findFirst({
        where: { name: brandId.trim() },
      });
      if (!brand) {
        brand = await prisma.brand.create({
          data: {
            code: brandId.trim().toUpperCase().replace(/\s+/g, "_"),
            name: brandId.trim(),
          },
        });
      }
    }

    // 카테고리 처리 (기존 카테고리 찾기 또는 새로 생성)
    let category = null;
    if (categoryId && categoryId.trim()) {
      category = await prisma.category.findFirst({
        where: { name: categoryId.trim() },
      });
      if (!category) {
        category = await prisma.category.create({
          data: {
            code: categoryId.trim().toUpperCase().replace(/\s+/g, "_"),
            name: categoryId.trim(),
          },
        });
      }
    }

    // 트랜잭션으로 아이템 생성과 초기 재고 설정
    const result = await prisma.$transaction(async (tx) => {
      // 기본 판매단가 계산 (10% 마진 적용)
      let calculatedBasePrice = null;
      if (basePrice && basePrice > 0) {
        calculatedBasePrice = parseFloat(basePrice.toString());
      } else if (unitCost && unitCost > 0) {
        // 기본 판매단가가 없고 단가가 있으면 10% 마진 적용
        calculatedBasePrice = Math.round(parseFloat(unitCost.toString()) * 1.1);
      }

      // 아이템 생성
      const newItem = await tx.item.create({
        data: {
          code,
          name,
          uom: uom || null,
          brandId: brand?.id || null,
          categoryId: category?.id || null,
          model: model || null,
          spec: spec || null,
          hasSerial: hasSerial || false,
          minStock: minStock ? parseFloat(minStock.toString()) : null,
          basePrice: calculatedBasePrice,
          leadTime: leadTime ? parseInt(leadTime.toString()) : null,
        },
      });

      // 초기 재고가 있는 경우 재고 트랜잭션 생성
      if (initialStock && initialStock > 0) {
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

        // 초기 재고 트랜잭션 생성
        await tx.inventoryTransaction.create({
          data: {
            itemId: newItem.id,
            warehouseId: warehouse.id,
            txDate: new Date(),
            txType: "RECEIPT",
            qty: parseFloat(initialStock.toString()),
            unitCost: unitCost ? parseFloat(unitCost.toString()) : 0,
            serialNo: null,
            lotNo: null,
            expiryDate: null,
            reference: "INITIAL_STOCK",
            notes: null,
          },
        });
      }

      return newItem;
    });

    // 생성된 아이템 정보 반환
    const createdItem = await prisma.item.findUnique({
      where: { id: result.id },
      include: {
        brand: true,
        category: true,
      },
    });

    // 활동 로그 기록
    await ActivityLogger.createItem(createdItem.id, createdItem.name);

    return NextResponse.json({
      success: true,
      message: "새 제품이 성공적으로 추가되었습니다.",
      data: createdItem,
    });
  } catch (error) {
    console.error("Error creating new item:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "제품 추가 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
