import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-logger";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (status && status !== "all") {
      whereClause.status = status;
    }

    const purchaseRequests = await prisma.purchaseRequest.findMany({
      where: whereClause,
      include: {
        vendor: true,
        requester: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        lines: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        requestDate: "desc",
      },
    });

    // Order 인터페이스에 맞게 변환
    const orders = purchaseRequests.map((request) => ({
      id: request.id,
      orderNo: request.requestNo,
      vendorName: request.vendor.name,
      orderDate: request.requestDate.toISOString(),
      status: request.status,
      totalAmount: Number(request.totalAmount),
      requesterName: request.requester.name || request.requester.username,
      approverName: request.approver?.name || request.approver?.username,
      orderType: "purchaseRequest" as const,
    }));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching purchase requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Purchase request body:", JSON.stringify(body, null, 2));
    const {
      vendorId,
      requiredDate,
      notes,
      reason,
      lines,
    } = body;

    // 공급업체 존재 확인
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 400 }
      );
    }

    // 요청번호 생성 (PR + YYYYMMDD + 4자리 숫자)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.purchaseRequest.count({
      where: {
        requestNo: {
          startsWith: `PR${dateStr}`,
        },
      },
    });
    const requestNo = `PR${dateStr}${String(count + 1).padStart(4, "0")}`;

    // 품목들 존재 확인
    const itemIds = lines.map((line: any) => line.itemId);
    const existingItems = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true },
    });
    
    if (existingItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: "Some items not found" },
        { status: 400 }
      );
    }

    // 총 금액 계산
    const totalAmount = lines.reduce((sum: number, line: any) => {
      return sum + Number(line.qty) * Number(line.estimatedCost || 0);
    }, 0);

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        requestNo,
        vendorId,
        requesterId: user.id,
        approverId: null, // 명시적으로 null 설정
        requestDate: new Date(),
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        status: "pending",
        totalAmount,
        notes: notes || null,
        reason: reason || null,
        lines: {
          create: lines.map((line: any) => ({
            itemId: line.itemId,
            qty: Number(line.qty),
            estimatedCost: Number(line.estimatedCost || 0),
            amount: Number(line.qty) * Number(line.estimatedCost || 0),
            reason: line.reason || null,
          })),
        },
      },
      include: {
        vendor: true,
        requester: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "created",
        entityType: "PurchaseRequest",
        entityId: purchaseRequest.id,
        description: `구매요청 ${purchaseRequest.requestNo}이 생성되었습니다.`,
        metadata: JSON.stringify({
          requestNo: purchaseRequest.requestNo,
          vendorName: vendor.name,
          totalAmount: purchaseRequest.totalAmount,
          itemCount: lines.length,
        }),
      },
    });

    return NextResponse.json({ purchaseRequest });
  } catch (error) {
    console.error("Error creating purchase request:", error);
    console.error("Request body:", JSON.stringify(body, null, 2));
    console.error("Vendor ID:", vendorId);
    console.error("User ID:", user.id);
    return NextResponse.json(
      { error: "Failed to create purchase request", details: error.message },
      { status: 500 }
    );
  }
}

