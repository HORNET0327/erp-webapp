import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 주문 상세 정보 가져오기
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        salesperson: {
          select: {
            name: true,
            email: true,
          },
        },
        lines: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                uom: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 출고지시서 번호 생성 (SH + YYYYMMDD + 3자리 시퀀스)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    // 오늘 날짜의 출고지시서 개수 확인
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const existingShipments = await prisma.activityLog.count({
      where: {
        action: "SHIPMENT_DOCUMENT_CREATE",
        timestamp: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const sequence = String(existingShipments + 1).padStart(3, "0");
    const shipmentNo = `SH${dateStr}${sequence}`;

    // 저장된 배송정보 파싱
    let shippingInfo = {
      shippingMethod: "",
      carrier: "",
      paymentType: "선불",
      packagingMethod: "",
    };

    if (order.notes) {
      try {
        const parsedNotes = JSON.parse(order.notes);
        if (parsedNotes.shippingInfo) {
          shippingInfo = { ...shippingInfo, ...parsedNotes.shippingInfo };
        }
      } catch (e) {
        // JSON 파싱 실패시 기본값 사용 (일반 텍스트인 경우)
      }
    }

    // 출고지시서 데이터 생성
    const shipmentData = {
      shipmentNo,
      orderId: order.id,
      orderNo: order.orderNo,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      customerAddress: order.customer.address,
      salespersonName: order.salesperson?.name,
      salespersonEmail: order.salesperson?.email,
      orderDate: order.orderDate,
      requiredDate: order.requiredDate,
      totalAmount: Number(order.totalAmount),
      notes: order.orderMemo || null,
      shippingMethod: shippingInfo.shippingMethod,
      carrier: shippingInfo.carrier,
      paymentType: shippingInfo.paymentType,
      packagingMethod: shippingInfo.packagingMethod,
      items: order.lines.map((line) => ({
        itemCode: line.item.code,
        itemName: line.item.name,
        qty: Number(line.qty),
        uom: line.item.uom,
        unitPrice: Number(line.unitPrice),
        amount: Number(line.amount),
      })),
      createdAt: new Date(),
    };

    // 활동 로그에 출고지시서 생성 기록
    await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/orders/${id}/log-activity`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "SHIPMENT_DOCUMENT_CREATE",
          description: `출고지시서를 생성했습니다: ${shipmentNo}`,
          metadata: {
            shipmentNo,
            orderNo: order.orderNo,
            customerName: order.customer.name,
          },
        }),
      }
    );

    return NextResponse.json({
      success: true,
      shipmentData,
      message: "출고지시서가 생성되었습니다.",
    });
  } catch (error) {
    console.error("Error creating shipment document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
