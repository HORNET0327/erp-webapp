"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import OrderModal from "@/components/OrderModal";
import OrderDetailModal from "@/components/OrderDetailModal";
import QuotationModal from "@/components/QuotationModal";
import EmailModal from "@/components/EmailModal";
import HistoryModal from "@/components/HistoryModal";
import ShipmentCheckModal from "@/components/ShipmentCheckModal";
import OrderRegistrationModal from "@/components/OrderRegistrationModal";

interface Order {
  id: string;
  orderNo: string;
  customerName?: string;
  customerEmail?: string;
  vendorName?: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  salespersonName?: string;
  buyerName?: string;
  orderType: "sales" | "purchase";
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  readyToShipOrders: number;
  shippingOrders: number;
  shippedOrders: number;
  paymentPendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalValue: number;
  monthlyOrders: number;
  monthlyValue: number;
}

function OrderCard({
  title,
  value,
  delta,
  accent,
  onClick,
  clickable = false,
}: {
  title: string;
  value: string;
  delta?: string;
  accent?: string;
  onClick?: () => void;
  clickable?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "12px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        cursor: clickable ? "pointer" : "default",
        transition: clickable ? "all 0.2s ease" : "none",
        transform: clickable ? "scale(1)" : "none",
      }}
      onMouseEnter={(e) => {
        if (clickable) {
          e.currentTarget.style.transform = "scale(1.02)";
          e.currentTarget.style.boxShadow = "0 4px 12px 0 rgba(0, 0, 0, 0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (clickable) {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
        }
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#000000",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {accent && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: accent,
            }}
          />
        )}
        {title}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#000000",
          marginTop: 2,
        }}
      >
        {value}
      </div>
      {delta && (
        <div
          style={{
            fontSize: 10,
            color: delta.startsWith("+") ? "#10b981" : "#ef4444",
            marginTop: 1,
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { background: "#fef3c7", color: "#92400e", border: "#f59e0b" }; // 견적대기
      case "confirmed":
        return { background: "#e0e7ff", color: "#3730a3", border: "#6366f1" }; // 수주확정
      case "ready_to_ship":
        return { background: "#fef3c7", color: "#92400e", border: "#f59e0b" }; // 출고대기
      case "shipping":
        return { background: "#dbeafe", color: "#1e40af", border: "#3b82f6" }; // 배송중
      case "shipped":
        return { background: "#f0fdf4", color: "#166534", border: "#22c55e" }; // 배송완료
      case "payment_pending":
        return { background: "#fef3c7", color: "#92400e", border: "#f59e0b" }; // 수금대기
      case "completed":
        return { background: "#f0f9ff", color: "#1e40af", border: "#0ea5e9" }; // 수금완료
      case "cancelled":
        return { background: "#fef2f2", color: "#dc2626", border: "#ef4444" }; // 취소
      default:
        return { background: "#f3f4f6", color: "#000000", border: "#d1d5db" };
    }
  };

  const style = getStatusStyle(status);
  const statusText =
    {
      pending: "견적대기",
      confirmed: "수주확정",
      ready_to_ship: "출고대기",
      shipping: "배송중",
      shipped: "배송완료",
      payment_pending: "수금대기",
      completed: "수금완료",
      cancelled: "취소",
    }[status.toLowerCase()] || status;

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "500",
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {statusText}
    </span>
  );
}

export default function OrdersPage() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sales" | "purchase">("sales");
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isShipmentCheckModalOpen, setIsShipmentCheckModalOpen] =
    useState(false);
  const [isOrderRegistrationModalOpen, setIsOrderRegistrationModalOpen] =
    useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchOrders();
    fetchStats();
  }, [activeTab]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(
          data.user?.username ||
            data.user?.name ||
            data.user?.email ||
            "Unknown"
        );
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?type=${activeTab}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/orders/stats?type=${activeTab}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching order stats:", error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName &&
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.vendorName &&
        order.vendorName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleNewOrder = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleOrderSuccess = () => {
    fetchOrders();
    fetchStats();
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const handleHistoryModalClose = () => {
    setIsHistoryModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCreateQuotation = (order: any) => {
    setSelectedOrder(order);
    setIsQuotationModalOpen(true);
  };

  const handleCreateShipment = async (order: any) => {
    // 수주확정 상태가 아닌 경우 처리 중단
    if (order.status !== "confirmed") {
      alert("수주확정 상태인 주문만 출고지시를 생성할 수 있습니다.");
      return;
    }

    // 출고 가능 여부 확인 모달 열기
    setSelectedOrder(order);
    setIsShipmentCheckModalOpen(true);
  };

  const handleConfirmShipment = async (orderId: string) => {
    try {
      // 주문 정보를 먼저 가져오기
      const orderResponse = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
      });

      if (!orderResponse.ok) {
        throw new Error("주문 정보를 가져올 수 없습니다.");
      }

      const orderData = await orderResponse.json();
      const order = orderData.order;

      // 출고지시 생성 및 상태 변경
      const response = await fetch(`/api/orders/${orderId}/change-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_SHIPMENT",
          description: `출고지시를 생성했습니다: ${order.orderNo}`,
          metadata: { orderNo: order.orderNo },
        }),
      });

      if (response.ok) {
        alert("출고지시가 생성되었습니다. 상태가 출고대기로 변경되었습니다.");
        fetchOrders(); // 주문 목록 새로고침
        setIsShipmentCheckModalOpen(false); // 모달 닫기
      } else {
        const error = await response.json();
        let errorMessage = `오류: ${error.error}`;
        if (error.details) {
          errorMessage += `\n상세: ${error.details}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("출고지시 생성 오류:", error);
      alert("출고지시 생성 중 오류가 발생했습니다.");
    }
  };

  const handleCreateOrder = async (order: any) => {
    // 견적대기가 아닌 경우 처리 중단
    if (order.status !== "pending") {
      alert("견적대기 상태인 주문만 수주등록을 할 수 있습니다.");
      return;
    }

    // 수주 등록 모달 열기
    setSelectedOrder(order);
    setIsOrderRegistrationModalOpen(true);
  };

  const handleProcessShipment = async (order: any) => {
    // 출고대기 상태가 아닌 경우 처리 중단
    if (order.status !== "ready_to_ship") {
      alert("출고대기 상태인 주문만 출고처리를 할 수 있습니다.");
      return;
    }

    // 출고 처리 기능 구현
    if (confirm(`주문 ${order.orderNo}에 대한 출고를 처리하시겠습니까?`)) {
      try {
        const response = await fetch(`/api/orders/${order.id}/change-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "PROCESS_SHIPMENT",
            description: `출고처리를 완료했습니다: ${order.orderNo}`,
            metadata: { orderNo: order.orderNo },
          }),
        });

        if (response.ok) {
          alert("출고가 처리되었습니다. 상태가 배송중으로 변경되었습니다.");
          fetchOrders(); // 주문 목록 새로고침
        } else {
          const error = await response.json();
          let errorMessage = `오류: ${error.error}`;
          if (error.details) {
            errorMessage += `\n상세: ${error.details}`;
          }
          alert(errorMessage);
        }
      } catch (error) {
        console.error("출고 처리 오류:", error);
        alert("출고 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const handleIssueTaxInvoice = async (order: any) => {
    // 견적대기 상태인 경우 처리 중단
    if (order.status === "pending") {
      alert("견적대기 상태인 주문은 세금계산서를 발행할 수 없습니다.");
      return;
    }
    // 취소 상태인 경우 처리 중단
    if (order.status === "cancelled") {
      alert("취소된 주문은 세금계산서를 발행할 수 없습니다.");
      return;
    }

    // 세금계산서 발행 기능 구현
    if (
      confirm(`주문 ${order.orderNo}에 대한 세금계산서를 발행하시겠습니까?`)
    ) {
      try {
        // TODO: 세금계산서 발행 API 호출
        console.log("세금계산서 발행:", order);

        // 활동 로그 기록
        await fetch(`/api/orders/${order.id}/log-activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "TAX_INVOICE_ISSUE",
            description: `세금계산서를 발행했습니다: ${order.orderNo}`,
            metadata: { orderNo: order.orderNo },
          }),
        });

        alert("세금계산서가 발행되었습니다.");
      } catch (error) {
        console.error("세금계산서 발행 오류:", error);
        alert("세금계산서 발행 중 오류가 발생했습니다.");
      }
    }
  };

  const handleCompleteShipping = async (order: any) => {
    // 배송중 상태가 아닌 경우 처리 중단
    if (order.status !== "shipping") {
      alert("배송중 상태인 주문만 배송완료 처리를 할 수 있습니다.");
      return;
    }

    // 배송완료 기능 구현
    if (confirm(`주문 ${order.orderNo}에 대한 배송을 완료하시겠습니까?`)) {
      try {
        const response = await fetch(`/api/orders/${order.id}/change-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "COMPLETE_SHIPPING",
            description: `배송을 완료했습니다: ${order.orderNo}`,
            metadata: { orderNo: order.orderNo },
          }),
        });

        if (response.ok) {
          alert("배송이 완료되었습니다. 상태가 수금대기로 변경되었습니다.");
          fetchOrders(); // 주문 목록 새로고침
        } else {
          const error = await response.json();
          let errorMessage = `오류: ${error.error}`;
          if (error.details) {
            errorMessage += `\n상세: ${error.details}`;
          }
          alert(errorMessage);
        }
      } catch (error) {
        console.error("배송완료 처리 오류:", error);
        alert("배송완료 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const handleRegisterPayment = async (order: any) => {
    // 수금대기 상태가 아닌 경우 처리 중단
    if (order.status !== "payment_pending") {
      alert("수금대기 상태인 주문만 수금등록을 할 수 있습니다.");
      return;
    }

    // 수금등록 기능 구현
    if (confirm(`주문 ${order.orderNo}에 대한 수금을 등록하시겠습니까?`)) {
      try {
        const response = await fetch(`/api/orders/${order.id}/change-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REGISTER_PAYMENT",
            description: `수금등록을 완료했습니다: ${order.orderNo}`,
            metadata: { orderNo: order.orderNo },
          }),
        });

        if (response.ok) {
          alert("수금이 등록되었습니다. 주문이 완료되었습니다.");
          fetchOrders(); // 주문 목록 새로고침
        } else {
          const error = await response.json();
          let errorMessage = `오류: ${error.error}`;
          if (error.details) {
            errorMessage += `\n상세: ${error.details}`;
          }
          alert(errorMessage);
        }
      } catch (error) {
        console.error("수금등록 오류:", error);
        alert("수금등록 중 오류가 발생했습니다.");
      }
    }
  };

  const handleViewHistory = (order: any) => {
    setSelectedOrder(order);
    setIsHistoryModalOpen(true);
  };

  // 상태별 필터링 함수
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    // 필터가 적용되면 검색어는 초기화
    setSearchTerm("");
  };

  // 전체 필터 초기화
  const handleClearFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
  };

  const handleQuotationModalClose = () => {
    setIsQuotationModalOpen(false);
    setSelectedOrder(null);
  };

  const handleEmailModalClose = () => {
    setIsEmailModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navigation currentUser={currentUser ?? undefined} />

      <div style={{ padding: "20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#000000",
              margin: 0,
            }}
          >
            주문 관리
          </h1>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "20px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={() => setActiveTab("sales")}
            style={{
              padding: "10px 20px",
              background: activeTab === "sales" ? "#3b82f6" : "transparent",
              color: activeTab === "sales" ? "#ffffff" : "#000000",
              border: "none",
              borderRadius: "6px 6px 0 0",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            판매주문
          </button>
          <button
            onClick={() => setActiveTab("purchase")}
            style={{
              padding: "10px 20px",
              background: activeTab === "purchase" ? "#3b82f6" : "transparent",
              color: activeTab === "purchase" ? "#ffffff" : "#000000",
              border: "none",
              borderRadius: "6px 6px 0 0",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            구매주문
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div
            style={{
              background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
              border: "2px solid #dbeafe",
              borderRadius: "12px",
              padding: "10px",
              marginBottom: "24px",
              boxShadow: "0 4px 6px rgba(14, 165, 233, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#000000",
                marginBottom: "8px",
                paddingBottom: "4px",
                borderBottom: "2px solid #f3f4f6",
              }}
            >
              이번 달 {activeTab === "sales" ? "판매주문" : "구매주문"} 현황
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(9, 1fr)",
                gap: "8px",
              }}
            >
              <OrderCard
                title="전체 주문"
                value={`${stats.totalOrders}건`}
                accent="#3b82f6"
                onClick={() => handleStatusFilter("all")}
                clickable={true}
              />
              <OrderCard
                title="견적대기"
                value={`${stats.pendingOrders}건`}
                accent="#f59e0b"
                onClick={() => handleStatusFilter("pending")}
                clickable={true}
              />
              <OrderCard
                title="수주확정"
                value={`${stats.confirmedOrders}건`}
                accent="#6366f1"
                onClick={() => handleStatusFilter("confirmed")}
                clickable={true}
              />
              <OrderCard
                title="출고대기"
                value={`${stats.readyToShipOrders}건`}
                accent="#f59e0b"
                onClick={() => handleStatusFilter("ready_to_ship")}
                clickable={true}
              />
              <OrderCard
                title="배송중"
                value={`${stats.shippingOrders}건`}
                accent="#3b82f6"
                onClick={() => handleStatusFilter("shipping")}
                clickable={true}
              />
              <OrderCard
                title="배송완료"
                value={`${stats.shippedOrders}건`}
                accent="#22c55e"
                onClick={() => handleStatusFilter("shipped")}
                clickable={true}
              />
              <OrderCard
                title="수금대기"
                value={`${stats.paymentPendingOrders}건`}
                accent="#f59e0b"
                onClick={() => handleStatusFilter("payment_pending")}
                clickable={true}
              />
              <OrderCard
                title="수금완료"
                value={`${stats.completedOrders}건`}
                accent="#0ea5e9"
                onClick={() => handleStatusFilter("completed")}
                clickable={true}
              />
              <OrderCard
                title="취소"
                value={`${stats.cancelledOrders}건`}
                accent="#ef4444"
                onClick={() => handleStatusFilter("cancelled")}
                clickable={true}
              />
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1", minWidth: "250px" }}>
            <input
              type="text"
              placeholder="주문번호, 고객명, 공급업체명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
                background: "#ffffff",
                color: "#000000",
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "13px",
              background: "#ffffff",
              minWidth: "120px",
              color: "#000000",
            }}
          >
            <option value="all">전체 상태</option>
            <option value="pending">견적대기</option>
            <option value="confirmed">수주확정</option>
            <option value="ready_to_ship">출고대기</option>
            <option value="shipping">배송중</option>
            <option value="shipped">배송완료</option>
            <option value="payment_pending">수금대기</option>
            <option value="completed">수금완료</option>
            <option value="cancelled">취소</option>
          </select>
          <button
            onClick={handleClearFilters}
            style={{
              padding: "8px 16px",
              background: "#6b7280",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            필터 초기화
          </button>
          <button
            onClick={handleNewOrder}
            style={{
              padding: "8px 16px",
              background: "#3b82f6",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            + 새 주문
          </button>
        </div>

        {/* Current Filter Status */}
        {(statusFilter !== "all" || searchTerm) && (
          <div
            style={{
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "#374151", fontWeight: "500" }}
            >
              현재 필터:
            </span>
            {statusFilter !== "all" && (
              <span
                style={{
                  background: "#3b82f6",
                  color: "#ffffff",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                상태:{" "}
                {{
                  pending: "견적대기",
                  confirmed: "수주확정",
                  ready_to_ship: "출고대기",
                  shipping: "배송중",
                  shipped: "배송완료",
                  payment_pending: "수금대기",
                  completed: "수금완료",
                  cancelled: "취소",
                }[statusFilter] || statusFilter}
              </span>
            )}
            {searchTerm && (
              <span
                style={{
                  background: "#10b981",
                  color: "#ffffff",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                검색: "{searchTerm}"
              </span>
            )}
            <button
              onClick={handleClearFilters}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              필터 초기화
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#000000",
                margin: 0,
              }}
            >
              {activeTab === "sales" ? "판매주문" : "구매주문"} 목록
            </h3>
          </div>

          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#000000",
              }}
            >
              로딩 중...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#000000",
              }}
            >
              주문이 없습니다.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        width: "150px",
                      }}
                    >
                      주문번호
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        width: "120px",
                      }}
                    >
                      {activeTab === "sales" ? "고객" : "공급업체"}
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        width: "100px",
                      }}
                    >
                      주문일
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        width: "80px",
                      }}
                    >
                      상태
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        width: "80px",
                      }}
                    >
                      담당자
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        width: "100px",
                      }}
                    >
                      금액
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        width: "500px",
                      }}
                    >
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        cursor: "pointer",
                      }}
                      onClick={() => handleViewDetails(order)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#000000",
                        }}
                      >
                        {order.orderNo}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "14px",
                          color: "#000000",
                        }}
                      >
                        {order.customerName || order.vendorName || "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "14px",
                          color: "#000000",
                        }}
                      >
                        {new Date(order.orderDate).toLocaleDateString("ko-KR")}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                        }}
                      >
                        <StatusBadge status={order.status} />
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "14px",
                          color: "#000000",
                        }}
                      >
                        {order.salespersonName || order.buyerName || "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#000000",
                          textAlign: "right",
                        }}
                      >
                        ₩{order.totalAmount.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {activeTab === "sales" && (
                            <>
                              <button
                                onClick={() => handleCreateQuotation(order)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#10b981",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                견적서
                              </button>
                              <button
                                onClick={() => handleCreateOrder(order)}
                                disabled={order.status !== "pending"}
                                style={{
                                  padding: "6px 12px",
                                  background:
                                    order.status !== "pending"
                                      ? "#d1d5db"
                                      : "#3b82f6",
                                  color:
                                    order.status !== "pending"
                                      ? "#9ca3af"
                                      : "#ffffff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor:
                                    order.status !== "pending"
                                      ? "not-allowed"
                                      : "pointer",
                                  whiteSpace: "nowrap",
                                  opacity: order.status !== "pending" ? 0.6 : 1,
                                }}
                              >
                                수주등록
                              </button>
                              <button
                                onClick={() => handleCreateShipment(order)}
                                disabled={order.status !== "confirmed"}
                                style={{
                                  padding: "6px 12px",
                                  background:
                                    order.status !== "confirmed"
                                      ? "#d1d5db"
                                      : "#f59e0b",
                                  color:
                                    order.status !== "confirmed"
                                      ? "#9ca3af"
                                      : "#ffffff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor:
                                    order.status !== "confirmed"
                                      ? "not-allowed"
                                      : "pointer",
                                  whiteSpace: "nowrap",
                                  opacity:
                                    order.status !== "confirmed" ? 0.6 : 1,
                                }}
                              >
                                출고지시
                              </button>
                              <button
                                onClick={() => handleProcessShipment(order)}
                                disabled={order.status !== "ready_to_ship"}
                                style={{
                                  padding: "6px 12px",
                                  background:
                                    order.status !== "ready_to_ship"
                                      ? "#d1d5db"
                                      : "#8b5cf6",
                                  color:
                                    order.status !== "ready_to_ship"
                                      ? "#9ca3af"
                                      : "#ffffff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor:
                                    order.status !== "ready_to_ship"
                                      ? "not-allowed"
                                      : "pointer",
                                  whiteSpace: "nowrap",
                                  opacity:
                                    order.status !== "ready_to_ship" ? 0.6 : 1,
                                }}
                              >
                                출고처리
                              </button>
                              <button
                                onClick={() => handleCompleteShipping(order)}
                                disabled={order.status !== "shipping"}
                                style={{
                                  padding: "6px 12px",
                                  background:
                                    order.status !== "shipping"
                                      ? "#d1d5db"
                                      : "#22c55e",
                                  color:
                                    order.status !== "shipping"
                                      ? "#9ca3af"
                                      : "#ffffff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor:
                                    order.status !== "shipping"
                                      ? "not-allowed"
                                      : "pointer",
                                  whiteSpace: "nowrap",
                                  opacity:
                                    order.status !== "shipping" ? 0.6 : 1,
                                }}
                              >
                                배송완료
                              </button>
                              <button
                                onClick={() => handleIssueTaxInvoice(order)}
                                disabled={
                                  order.status === "pending" ||
                                  order.status === "cancelled"
                                }
                                style={{
                                  padding: "6px 12px",
                                  background:
                                    order.status === "pending" ||
                                    order.status === "cancelled"
                                      ? "#d1d5db"
                                      : "#ef4444",
                                  color:
                                    order.status === "pending" ||
                                    order.status === "cancelled"
                                      ? "#9ca3af"
                                      : "#ffffff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor:
                                    order.status === "pending" ||
                                    order.status === "cancelled"
                                      ? "not-allowed"
                                      : "pointer",
                                  whiteSpace: "nowrap",
                                  opacity:
                                    order.status === "pending" ||
                                    order.status === "cancelled"
                                      ? 0.6
                                      : 1,
                                }}
                              >
                                세금계산서
                              </button>
                              <button
                                onClick={() => handleRegisterPayment(order)}
                                disabled={order.status !== "payment_pending"}
                                style={{
                                  padding: "6px 12px",
                                  background:
                                    order.status !== "payment_pending"
                                      ? "#d1d5db"
                                      : "#06b6d4",
                                  color:
                                    order.status !== "payment_pending"
                                      ? "#9ca3af"
                                      : "#ffffff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor:
                                    order.status !== "payment_pending"
                                      ? "not-allowed"
                                      : "pointer",
                                  whiteSpace: "nowrap",
                                  opacity:
                                    order.status !== "payment_pending"
                                      ? 0.6
                                      : 1,
                                }}
                              >
                                수금등록
                              </button>
                              <button
                                onClick={() => handleViewHistory(order)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#6b7280",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                                  marginLeft: "45px",
                                }}
                              >
                                📋 히스토리
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Modal */}
        <OrderModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          type={activeTab}
          onSuccess={handleOrderSuccess}
        />

        {/* Order Detail Modal */}
        <OrderDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleDetailModalClose}
          order={selectedOrder}
          type={activeTab}
          onOrderUpdated={fetchOrders}
        />

        {/* Quotation Modal */}
        <QuotationModal
          isOpen={isQuotationModalOpen}
          onClose={handleQuotationModalClose}
          order={selectedOrder}
          onOrderUpdated={fetchOrders}
        />

        {/* Email Modal */}
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={handleEmailModalClose}
          type="quotation"
          orderId={selectedOrder?.id}
          customerEmail={selectedOrder?.customerEmail}
          customerName={selectedOrder?.customerName}
        />
        <HistoryModal
          isOpen={isHistoryModalOpen}
          onClose={handleHistoryModalClose}
          orderId={selectedOrder?.id}
          orderNo={selectedOrder?.orderNo}
        />

        {/* Shipment Check Modal */}
        <ShipmentCheckModal
          isOpen={isShipmentCheckModalOpen}
          onClose={() => setIsShipmentCheckModalOpen(false)}
          orderId={selectedOrder?.id}
          onConfirmShipment={handleConfirmShipment}
        />

        {/* Order Registration Modal */}
        <OrderRegistrationModal
          isOpen={isOrderRegistrationModalOpen}
          onClose={() => setIsOrderRegistrationModalOpen(false)}
          order={selectedOrder}
          onOrderUpdated={fetchOrders}
        />
      </div>
    </div>
  );
}
