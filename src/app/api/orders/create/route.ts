import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { ActivityLogger } from "@/lib/activity-logger";

const prisma = new PrismaClient();

// 날짜별 순차 주문번호 생성 함수
async function generateOrderNumber(
  type: "sales" | "purchase",
  orderDate: string
): Promise<string> {
  const date = new Date(orderDate);
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD 형식

  // 해당 날짜의 주문 개수 조회
  const count =
    type === "sales"
      ? await prisma.salesOrder.count({
          where: {
            orderDate: {
              gte: new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
              ),
              lt: new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate() + 1
              ),
            },
          },
        })
      : await prisma.purchaseOrder.count({
          where: {
            orderDate: {
              gte: new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
              ),
              lt: new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate() + 1
              ),
            },
          },
        });

  const sequence = String(count + 1).padStart(4, "0");
  return `${dateStr}-${sequence}`;
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Received order data:", JSON.stringify(body, null, 2));
    const { type, orderData } = body;

    if (type === "sales") {
      const { customerId, orderDate, status, totalAmount, notes, lines } =
        orderData;

      // totalAmount를 안전하게 숫자로 변환
      const safeTotalAmount = Number(totalAmount) || 0;
      console.log("Total amount conversion:", {
        original: totalAmount,
        converted: safeTotalAmount,
        type: typeof totalAmount,
      });

      // 순차 주문번호 생성
      const orderNo = await generateOrderNumber("sales", orderDate);

      // Create sales order
      const salesOrder = await prisma.salesOrder.create({
        data: {
          orderNo,
          customerId,
          salespersonId: sessionUser.id,
          orderDate: new Date(orderDate),
          status: status || "pending",
          totalAmount: safeTotalAmount,
          notes,
        },
      });

      // 디버깅을 위한 로그
      console.log("Created sales order:", {
        id: salesOrder.id,
        orderNo: salesOrder.orderNo,
        salespersonId: salesOrder.salespersonId,
        sessionUserId: sessionUser.id,
        sessionUserName: sessionUser.name,
      });

      // Create order lines
      if (lines && lines.length > 0) {
        await prisma.salesOrderLine.createMany({
          data: lines.map((line: any) => ({
            salesOrderId: salesOrder.id,
            itemId: line.itemId,
            qty: line.qty,
            unitPrice: line.unitPrice,
            amount: line.amount,
          })),
        });
      }

      // 고객 정보 가져오기
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { name: true },
      });

      // 활동 로그 기록
      await prisma.activityLog.create({
        data: {
          userId: sessionUser.id,
          action: "CREATE",
          entityType: "SALES_ORDER",
          entityId: salesOrder.id,
          description: `새 판매 주문을 생성했습니다${
            customer?.name ? ` (${customer.name})` : ""
          }`,
          metadata: JSON.stringify({
            orderType: "sales",
            customerName: customer?.name,
            orderNo: salesOrder.orderNo,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        order: salesOrder,
        message: "판매주문이 성공적으로 생성되었습니다.",
      });
    } else {
      const { vendorId, orderDate, status, totalAmount, notes, lines } =
        orderData;

      // totalAmount를 안전하게 숫자로 변환
      const safeTotalAmount = Number(totalAmount) || 0;
      console.log("Purchase order total amount conversion:", {
        original: totalAmount,
        converted: safeTotalAmount,
        type: typeof totalAmount,
      });

      // 순차 주문번호 생성
      const poNo = await generateOrderNumber("purchase", orderDate);

      // Create purchase order
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNo,
          vendorId,
          buyerId: sessionUser.id,
          orderDate: new Date(orderDate),
          status: status || "pending",
          totalAmount: safeTotalAmount,
          notes,
        },
      });

      // Create order lines
      if (lines && lines.length > 0) {
        await prisma.purchaseOrderLine.createMany({
          data: lines.map((line: any) => ({
            purchaseOrderId: purchaseOrder.id,
            itemId: line.itemId,
            qty: line.qty,
            unitCost: line.unitPrice, // unitPrice를 unitCost로 매핑
            amount: line.amount,
          })),
        });
      }

      // 공급업체 정보 가져오기
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { name: true },
      });

      // 활동 로그 기록
      await prisma.activityLog.create({
        data: {
          userId: sessionUser.id,
          action: "CREATE",
          entityType: "PURCHASE_ORDER",
          entityId: purchaseOrder.id,
          description: `새 구매 주문을 생성했습니다${
            vendor?.name ? ` (${vendor.name})` : ""
          }`,
          metadata: JSON.stringify({
            orderType: "purchase",
            vendorName: vendor?.name,
            orderNo: purchaseOrder.orderNo,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        order: purchaseOrder,
        message: "구매주문이 성공적으로 생성되었습니다.",
      });
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
