import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      code,
      name,
      contactPerson,
      email,
      phone,
      address,
      notes,
      isActive,
    } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: "코드와 이름은 필수입니다." },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: "공급업체를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check if code is being changed and if new code already exists
    if (code !== existingVendor.code) {
      const codeExists = await prisma.vendor.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "이미 존재하는 공급업체 코드입니다." },
          { status: 400 }
        );
      }
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        code,
        name,
        contactPerson,
        email,
        phone,
        address,
        notes,
        isActive,
      },
    });

    return NextResponse.json({
      success: true,
      vendor,
      message: "공급업체가 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        purchaseOrders: true,
      },
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: "공급업체를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check if vendor has related purchase orders
    if (existingVendor.purchaseOrders.length > 0) {
      return NextResponse.json(
        {
          error:
            "관련된 구매주문이 있어 삭제할 수 없습니다. 비활성화를 사용하세요.",
        },
        { status: 400 }
      );
    }

    await prisma.vendor.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "공급업체가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
