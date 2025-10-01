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

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        lines: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                code: true,
                uom: true,
                brand: {
                  select: {
                    name: true,
                  },
                },
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!purchaseRequest) {
      return NextResponse.json({ error: "Purchase request not found" }, { status: 404 });
    }

    console.log("Purchase request data:", JSON.stringify(purchaseRequest, null, 2));
    return NextResponse.json(purchaseRequest);
  } catch (error: any) {
    console.error("Error fetching purchase request:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase request", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 구매요청 업데이트 로직
    const updatedPurchaseRequest = await prisma.purchaseRequest.update({
      where: { id },
      data: {
        notes: body.notes,
        reason: body.reason,
        requiredDate: body.requiredDate ? new Date(body.requiredDate) : null,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        lines: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                code: true,
                uom: true,
                brand: {
                  select: {
                    name: true,
                  },
                },
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedPurchaseRequest);
  } catch (error: any) {
    console.error("Error updating purchase request:", error);
    return NextResponse.json(
      { error: "Failed to update purchase request", details: error.message },
      { status: 500 }
    );
  }
}
