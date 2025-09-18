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

    const vendors = await prisma.vendor.findMany({
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

    return NextResponse.json({ vendors });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
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
    const existingVendor = await prisma.vendor.findUnique({
      where: { code },
    });

    if (existingVendor) {
      return NextResponse.json(
        { error: "이미 존재하는 공급업체 코드입니다." },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.create({
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
      message: "공급업체가 성공적으로 생성되었습니다.",
    });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
