import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // 임시로 인증 체크 비활성화 (디버깅용)
    // const sessionUser = await getSessionUser();
    // if (!sessionUser) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        contactPerson: true,
        email: true,
        phone: true,
        address: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

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
      contactPerson,
      email,
      phone,
      address,
      notes,
      isActive = true,
    } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: "코드와 이름은 필수입니다." },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { code },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "이미 존재하는 고객 코드입니다." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
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
      message: "고객이 성공적으로 생성되었습니다.",
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
