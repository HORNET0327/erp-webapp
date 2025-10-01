import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("Fetching history for purchase request ID:", id);

    // 구매요청 존재 확인
    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
      select: { id: true, requestNo: true },
    });

    if (!purchaseRequest) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
    }

    // 구매요청 히스토리 조회
    const history = await prisma.activityLog.findMany({
      where: {
        entityType: "PurchaseRequest",
        entityId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error("Error fetching purchase request history:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase request history", details: error.message },
      { status: 500 }
    );
  }
}
