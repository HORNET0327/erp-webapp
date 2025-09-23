import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// 견적서 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      orderId,
      quotationName,
      paymentDeadline,
      validityPeriod,
      deliveryLocation,
      paymentTerms,
      author,
      remarks,
      subtotal,
      taxRate = 10,
    } = body;

    // 주문 정보 조회
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 견적서 번호 생성 (Q + 주문번호)
    const quotationNo = `Q${order.orderNo}`;

    // 기존 견적서가 있는지 확인
    const existingQuotation = await prisma.quotation.findFirst({
      where: { orderId },
      orderBy: { version: "desc" },
    });

    const version = existingQuotation ? existingQuotation.version + 1 : 1;

    // 금액 계산
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // 견적서 생성
    const quotation = await prisma.quotation.create({
      data: {
        quotationNo,
        orderId,
        customerId: order.customerId,
        authorId: user.id,
        version,
        status: "DRAFT",
        quotationName: quotationName || "견적 요청",
        paymentDeadline: paymentDeadline || "발주후 14일 이내",
        validityPeriod: validityPeriod || "견적일로 부터 10일",
        deliveryLocation:
          deliveryLocation || order.customer.address || "고객사 지정 장소",
        paymentTerms: paymentTerms || "계약금 30%, 잔금 70%",
        author: author || user.name || "차장 김제면",
        remarks: remarks || "",
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10일 후
      },
      include: {
        order: {
          include: {
            customer: true,
            lines: {
              include: {
                item: true,
              },
            },
          },
        },
        customer: true,
        authorUser: true,
      },
    });

    // 버전 이력 저장
    await prisma.quotationVersion.create({
      data: {
        quotationId: quotation.id,
        version,
        status: "DRAFT",
        changes: JSON.stringify({
          quotationName,
          paymentDeadline,
          validityPeriod,
          deliveryLocation,
          paymentTerms,
          author,
          remarks,
        }),
        createdBy: user.id,
      },
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    console.error("견적서 생성 오류:", error);
    return NextResponse.json(
      { error: "견적서 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 견적서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");

    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        customer: true,
        authorUser: true,
        emails: {
          orderBy: { sentAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quotations });
  } catch (error) {
    console.error("견적서 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "견적서 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
