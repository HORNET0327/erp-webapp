import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 주문 정보 조회 (판매 주문 또는 구매 주문)
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        salesperson: {
          select: {
            name: true,
          },
        },
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        buyer: {
          select: {
            name: true,
          },
        },
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    const order = salesOrder || purchaseOrder;
    const orderType = salesOrder ? "sales" : "purchase";

    if (!order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 디버깅을 위한 로그
    console.log("Order data:", {
      id: order.id,
      salespersonId: order.salespersonId || order.buyerId,
      salesperson: order.salesperson,
      buyer: order.buyer,
      orderType,
    });

    // 활동 로그 조회
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        entityType: orderType === "sales" ? "SALES_ORDER" : "PURCHASE_ORDER",
        entityId: id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    // 견적서 관련 활동 조회 (판매 주문에만)
    let quotations = [];
    if (orderType === "sales") {
      quotations = await prisma.quotation.findMany({
        where: {
          orderId: id,
        },
        include: {
          authorUser: {
            select: {
              name: true,
            },
          },
          versions: {
            include: {
              createdByUser: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          emails: {
            orderBy: {
              sentAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // 히스토리 아이템 생성
    const historyItems = [];

    // 주문 생성 기록
    if (orderType === "sales") {
      // salesperson 정보가 없으면 현재 사용자 정보로 대체
      const userName = order.salesperson?.name || user.name || "시스템";

      historyItems.push({
        id: `order-created-${order.id}`,
        action: "ORDER_CREATED",
        description: `새 판매 주문이 생성되었습니다.`,
        timestamp: order.createdAt.toISOString(),
        user: userName,
        details: {
          orderNo: order.orderNo,
          customer: order.customer?.name,
          totalAmount: order.totalAmount,
          status: order.status,
        },
      });
    } else {
      // buyer 정보가 없으면 현재 사용자 정보로 대체
      const userName = order.buyer?.name || user.name || "시스템";

      historyItems.push({
        id: `order-created-${order.id}`,
        action: "ORDER_CREATED",
        description: `새 구매 주문이 생성되었습니다.`,
        timestamp: order.createdAt.toISOString(),
        user: userName,
        details: {
          orderNo: order.poNo,
          vendor: order.vendor?.name,
          totalAmount: order.totalAmount,
          status: order.status,
        },
      });
    }

    // 견적서 관련 기록들 (판매 주문에만)
    if (orderType === "sales") {
      for (const quotation of quotations) {
        // 견적서 생성
        historyItems.push({
          id: `quotation-created-${quotation.id}`,
          action: "QUOTATION_CREATED",
          description: `견적서가 저장되었습니다. (견적번호: ${quotation.quotationNo})`,
          timestamp: quotation.createdAt.toISOString(),
          user:
            quotation.authorUser?.name === "MASTER"
              ? "SND"
              : quotation.authorUser?.name || quotation.author || "시스템",
          details: {
            quotationId: quotation.id,
            quotationNo: quotation.quotationNo,
            quotationName: quotation.quotationName,
            subtotal: quotation.subtotal,
            totalAmount: quotation.totalAmount,
          },
        });

        // 견적서 수정 기록들
        for (const version of quotation.versions) {
          if (version.version > 1) {
            historyItems.push({
              id: `quotation-updated-${quotation.id}-v${version.version}`,
              action: "QUOTATION_UPDATED",
              description: `견적서가 수정되었습니다. (버전: ${version.version})`,
              timestamp: version.createdAt.toISOString(),
              user:
                version.createdByUser?.name === "MASTER"
                  ? "SND"
                  : version.createdByUser?.name || "시스템",
              details: {
                quotationId: quotation.id,
                quotationNo: quotation.quotationNo,
                version: version.version,
                changes: version.changes,
              },
            });
          }
        }

        // 견적서 전송 기록들
        for (const email of quotation.emails) {
          historyItems.push({
            id: `quotation-sent-${quotation.id}-${email.id}`,
            action: "QUOTATION_SENT",
            description: `견적서가 전송되었습니다. (수신자: ${email.sentTo})`,
            timestamp: email.sentAt.toISOString(),
            user: "시스템",
            details: {
              quotationNo: quotation.quotationNo,
              sentTo: email.sentTo,
              sentToName: email.sentToName,
              subject: email.subject,
              status: email.status,
            },
          });
        }
      }
    }

    // 활동 로그 기록들
    for (const log of activityLogs) {
      let action = "OTHER";
      let description = log.description;

      // 활동 유형에 따른 액션 매핑
      if (log.description.includes("수주등록")) {
        action = "ORDER_REGISTERED";
      } else if (log.description.includes("출고지시")) {
        action = "SHIPMENT_CREATED";
      } else if (log.description.includes("출고처리")) {
        action = "SHIPMENT_PROCESSED";
      } else if (log.description.includes("세금계산서")) {
        action = "TAX_INVOICE_ISSUED";
      } else if (log.description.includes("수금등록")) {
        action = "PAYMENT_REGISTERED";
      }

      historyItems.push({
        id: `activity-${log.id}`,
        action,
        description,
        timestamp: log.timestamp.toISOString(),
        user: log.user?.name || "시스템",
        details: log.details,
      });
    }

    // 시간순으로 정렬 (최신순)
    historyItems.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      history: historyItems,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        customer: order.customer?.name,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("히스토리 조회 오류:", error);
    return NextResponse.json(
      { error: "히스토리 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
