"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import OrderModal from "@/components/OrderModal";
import OrderDetailModal from "@/components/OrderDetailModal";
import QuotationModal from "@/components/QuotationModal";
import EmailModal from "@/components/EmailModal";

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
  completedOrders: number;
  totalValue: number;
  monthlyOrders: number;
  monthlyValue: number;
}

function OrderCard({
  title,
  value,
  delta,
  accent,
}: {
  title: string;
  value: string;
  delta?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "12px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
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
        return { background: "#fef3c7", color: "#92400e", border: "#f59e0b" };
      case "approved":
        return { background: "#dbeafe", color: "#1e40af", border: "#3b82f6" };
      case "in_progress":
        return { background: "#f0fdf4", color: "#166534", border: "#22c55e" };
      case "completed":
        return { background: "#f0f9ff", color: "#1e40af", border: "#0ea5e9" };
      case "cancelled":
        return { background: "#fef2f2", color: "#dc2626", border: "#ef4444" };
      default:
        return { background: "#f3f4f6", color: "#000000", border: "#d1d5db" };
    }
  };

  const style = getStatusStyle(status);
  const statusText =
    {
      pending: "대기",
      approved: "승인",
      in_progress: "진행중",
      completed: "완료",
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

  const handleCreateQuotation = (order: any) => {
    setSelectedOrder(order);
    setIsQuotationModalOpen(true);
  };

  const handleQuotationModalClose = () => {
    setIsQuotationModalOpen(false);
    setSelectedOrder(null);
  };

  const handleSendQuotationEmail = (order: any) => {
    setSelectedOrder(order);
    setIsEmailModalOpen(true);
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
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "8px",
              }}
            >
              <OrderCard
                title="전체 주문"
                value={`${stats.totalOrders}건`}
                accent="#3b82f6"
              />
              <OrderCard
                title="대기중"
                value={`${stats.pendingOrders}건`}
                accent="#f59e0b"
              />
              <OrderCard
                title="완료"
                value={`${stats.completedOrders}건`}
                accent="#22c55e"
              />
              <OrderCard
                title="총 금액"
                value={`₩${stats.totalValue.toLocaleString()}`}
                accent="#8b5cf6"
              />
              <OrderCard
                title="이번 달 주문"
                value={`${stats.monthlyOrders}건`}
                delta={`₩${stats.monthlyValue.toLocaleString()}`}
                accent="#ef4444"
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
            <option value="pending">대기</option>
            <option value="approved">승인</option>
            <option value="in_progress">진행중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
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
                          }}
                        >
                          <button
                            onClick={() => handleViewDetails(order)}
                            style={{
                              padding: "6px 12px",
                              background: "#3b82f6",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            상세보기
                          </button>
                          {activeTab === "sales" && (
                            <>
                              <button
                                onClick={() => handleCreateQuotation(order)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#10b981",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                견적서
                              </button>
                              <button
                                onClick={() => handleSendQuotationEmail(order)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#8b5cf6",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                견적서 보내기
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
        />

        {/* Quotation Modal */}
        <QuotationModal
          isOpen={isQuotationModalOpen}
          onClose={handleQuotationModalClose}
          order={selectedOrder}
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
      </div>
    </div>
  );
}
