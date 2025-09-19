// 활동 로그 생성 유틸리티 함수
export interface ActivityLogData {
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: any;
}

export async function logActivity(data: ActivityLogData) {
  try {
    const response = await fetch("/api/activity-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error("Failed to log activity:", await response.text());
    }
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

// 일반적인 활동 로그 생성 함수들
export const ActivityLogger = {
  // 주문 관련
  createOrder: (
    orderType: "sales" | "purchase",
    orderId: string,
    customerName?: string
  ) =>
    logActivity({
      action: "CREATE",
      entityType: orderType === "sales" ? "SALES_ORDER" : "PURCHASE_ORDER",
      entityId: orderId,
      description: `${
        orderType === "sales" ? "판매" : "구매"
      } 주문을 생성했습니다${customerName ? ` (${customerName})` : ""}`,
      metadata: { orderType, customerName },
    }),

  updateOrder: (
    orderType: "sales" | "purchase",
    orderId: string,
    status: string
  ) =>
    logActivity({
      action: "UPDATE",
      entityType: orderType === "sales" ? "SALES_ORDER" : "PURCHASE_ORDER",
      entityId: orderId,
      description: `${
        orderType === "sales" ? "판매" : "구매"
      } 주문 상태를 ${status}로 변경했습니다`,
      metadata: { orderType, status },
    }),

  // 재고 관련
  createItem: (itemId: string, itemName: string) =>
    logActivity({
      action: "CREATE",
      entityType: "ITEM",
      entityId: itemId,
      description: `새 제품을 등록했습니다: ${itemName}`,
      metadata: { itemName },
    }),

  updateItem: (itemId: string, itemName: string, field: string) =>
    logActivity({
      action: "UPDATE",
      entityType: "ITEM",
      entityId: itemId,
      description: `제품 정보를 수정했습니다: ${itemName} (${field})`,
      metadata: { itemName, field },
    }),

  addStock: (itemId: string, itemName: string, quantity: number) =>
    logActivity({
      action: "STOCK_ADD",
      entityType: "ITEM",
      entityId: itemId,
      description: `재고를 추가했습니다: ${itemName} (${quantity}개)`,
      metadata: { itemName, quantity },
    }),

  // 고객/공급업체 관련
  createCustomer: (customerId: string, customerName: string) =>
    logActivity({
      action: "CREATE",
      entityType: "CUSTOMER",
      entityId: customerId,
      description: `새 고객을 등록했습니다: ${customerName}`,
      metadata: { customerName },
    }),

  createVendor: (vendorId: string, vendorName: string) =>
    logActivity({
      action: "CREATE",
      entityType: "VENDOR",
      entityId: vendorId,
      description: `새 공급업체를 등록했습니다: ${vendorName}`,
      metadata: { vendorName },
    }),

  // 사용자 관련
  login: (username: string) =>
    logActivity({
      action: "LOGIN",
      entityType: "USER",
      description: `로그인했습니다: ${username}`,
      metadata: { username },
    }),

  logout: (username: string) =>
    logActivity({
      action: "LOGOUT",
      entityType: "USER",
      description: `로그아웃했습니다: ${username}`,
      metadata: { username },
    }),

  // 견적서 관련
  createQuotation: (orderId: string, customerName: string) =>
    logActivity({
      action: "CREATE",
      entityType: "QUOTATION",
      entityId: orderId,
      description: `견적서를 생성했습니다: ${customerName}`,
      metadata: { customerName },
    }),
};
