import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id: params.id },
      include: {
        vendor: {
          select: {
            name: true,
            code: true,
          },
        },
        requester: {
          select: {
            name: true,
            username: true,
          },
        },
        lines: {
          include: {
            item: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!purchaseRequest) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
    }

    if (purchaseRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending requests can be approved" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.purchaseRequest.update({
      where: { id: params.id },
      data: {
        status: "approved",
        approverId: user.id,
        approvedAt: new Date(),
      },
    });

    // 활동 로그 기록 - 상세 변경 내역 포함
    const changes = [
      {
        field: "상태",
        oldValue: "요청대기",
        newValue: "승인됨",
      },
      {
        field: "승인자",
        oldValue: purchaseRequest.approverId ? "이전 승인자" : "없음",
        newValue: user.name || user.username,
      },
      {
        field: "승인일시",
        oldValue: purchaseRequest.approvedAt ? purchaseRequest.approvedAt.toISOString() : "없음",
        newValue: new Date().toISOString(),
      },
    ];

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "approved",
        entityType: "PurchaseRequest",
        entityId: purchaseRequest.id,
        description: `구매요청 ${purchaseRequest.requestNo}이 승인되었습니다.`,
        metadata: JSON.stringify({
          requestNo: purchaseRequest.requestNo,
          vendorName: purchaseRequest.vendor?.name,
          requesterName: purchaseRequest.requester?.name || purchaseRequest.requester?.username,
          totalAmount: purchaseRequest.totalAmount,
          itemCount: purchaseRequest.lines?.length || 0,
          changes: changes,
          approver: user.name || user.username,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({ purchaseRequest: updatedRequest });
  } catch (error) {
    console.error("Error approving purchase request:", error);
    return NextResponse.json(
      { error: "Failed to approve purchase request" },
      { status: 500 }
    );
  }
}

