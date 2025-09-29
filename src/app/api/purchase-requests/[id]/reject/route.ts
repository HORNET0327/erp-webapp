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

    const body = await request.json();
    const { reason } = body;

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id: params.id },
    });

    if (!purchaseRequest) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
    }

    if (purchaseRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending requests can be rejected" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.purchaseRequest.update({
      where: { id: params.id },
      data: {
        status: "rejected",
        approverId: session.user.id,
        rejectedAt: new Date(),
        notes: reason ? `거부 사유: ${reason}` : purchaseRequest.notes,
      },
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "REJECT_PURCHASE_REQUEST",
        entityType: "PURCHASE_REQUEST",
        entityId: purchaseRequest.id,
        description: `구매요청을 거부했습니다: ${purchaseRequest.requestNo}`,
        metadata: JSON.stringify({
          requestNo: purchaseRequest.requestNo,
          previousStatus: "pending",
          newStatus: "rejected",
          reason,
        }),
      },
    });

    return NextResponse.json({ purchaseRequest: updatedRequest });
  } catch (error) {
    console.error("Error rejecting purchase request:", error);
    return NextResponse.json(
      { error: "Failed to reject purchase request" },
      { status: 500 }
    );
  }
}
