import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id: params.id },
      include: {
        vendor: true,
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!purchaseRequest) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
    }

    if (purchaseRequest.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved requests can be converted" },
        { status: 400 }
      );
    }

    // 구매주문 번호 생성 (PO + YYYYMMDD + 4자리 숫자)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.purchaseOrder.count({
      where: {
        poNo: {
          startsWith: `PO${dateStr}`,
        },
      },
    });
    const poNo = `PO${dateStr}${String(count + 1).padStart(4, "0")}`;

    // 구매주문 생성
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNo,
        vendorId: purchaseRequest.vendorId,
        buyerId: session.user.id,
        orderDate: new Date(),
        requiredDate: purchaseRequest.requiredDate,
        status: "pending",
        totalAmount: purchaseRequest.totalAmount,
        notes: `구매요청에서 변환: ${purchaseRequest.requestNo}`,
        lines: {
          create: purchaseRequest.lines.map((line) => ({
            itemId: line.itemId,
            qty: line.qty,
            unitCost: line.estimatedCost || 0,
            amount: line.amount,
          })),
        },
      },
    });

    // 구매요청 상태를 변환됨으로 업데이트
    const updatedRequest = await prisma.purchaseRequest.update({
      where: { id: params.id },
      data: {
        status: "converted",
        convertedAt: new Date(),
      },
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CONVERT_PURCHASE_REQUEST",
        entityType: "PURCHASE_REQUEST",
        entityId: purchaseRequest.id,
        description: `구매요청을 구매주문으로 변환했습니다: ${purchaseRequest.requestNo} → ${poNo}`,
        metadata: JSON.stringify({
          requestNo: purchaseRequest.requestNo,
          poNo,
          previousStatus: "approved",
          newStatus: "converted",
        }),
      },
    });

    return NextResponse.json({ 
      purchaseRequest: updatedRequest,
      purchaseOrder 
    });
  } catch (error) {
    console.error("Error converting purchase request:", error);
    return NextResponse.json(
      { error: "Failed to convert purchase request" },
      { status: 500 }
    );
  }
}
