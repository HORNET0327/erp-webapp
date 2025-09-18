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

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "고객을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check if code is being changed and if new code already exists
    if (code !== existingCustomer.code) {
      const codeExists = await prisma.customer.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "이미 존재하는 고객 코드입니다." },
          { status: 400 }
        );
      }
    }

    const customer = await prisma.customer.update({
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
      customer,
      message: "고객이 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer", details: error.message },
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

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        salesOrders: true,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "고객을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check if customer has related sales orders
    if (existingCustomer.salesOrders.length > 0) {
      return NextResponse.json(
        {
          error:
            "관련된 판매주문이 있어 삭제할 수 없습니다. 비활성화를 사용하세요.",
        },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "고객이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
