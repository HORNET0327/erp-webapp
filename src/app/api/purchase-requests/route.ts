import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      vendorId,
      requiredDate,
      notes,
      reason,
      lines,
    } = body;

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

    // 총 금액 계산
    const totalAmount = lines.reduce((sum: number, line: any) => {
      return sum + Number(line.qty) * Number(line.estimatedCost || 0);
    }, 0);

    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        requestNo,
        vendorId,
        requesterId: session.user.id,
        requestDate: new Date(),
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        status: "pending",
        totalAmount,
        notes,
        reason,
        lines: {
          create: lines.map((line: any) => ({
            itemId: line.itemId,
            qty: Number(line.qty),
            estimatedCost: line.estimatedCost ? Number(line.estimatedCost) : null,
            amount: Number(line.qty) * Number(line.estimatedCost || 0),
            reason: line.reason,
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

    return NextResponse.json({ purchaseRequest });
  } catch (error) {
    console.error("Error creating purchase request:", error);
    return NextResponse.json(
      { error: "Failed to create purchase request" },
      { status: 500 }
    );
  }
}
