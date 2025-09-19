"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  totalVendors: number;
  recentOrders: number;
  totalRevenue: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

interface Order {
  id: string;
  orderNo?: string;
  poNo?: string;
  status: string;
  orderDate: string;
  customer?: { name: string };
  vendor?: { name: string };
  totalAmount: number;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    totalVendors: 0,
    recentOrders: 0,
    totalRevenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [inProgressOrders, setInProgressOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
    fetchDashboardData();
    fetchOrdersData();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.username || data.email || "Unknown");
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/personal-stats", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setRecentActivities(data.recentActivities || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersData = async () => {
    try {
      // 승인 대기중인 주문 (PENDING)
      const pendingResponse = await fetch("/api/orders?status=PENDING", {
        credentials: "include",
      });
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        // API 응답이 배열인지 확인하고 안전하게 처리
        const orders = Array.isArray(pendingData)
          ? pendingData
          : pendingData.orders || [];
        setPendingOrders(orders.slice(0, 5)); // 최대 5개만 표시
      }

      // 진행중인 주문 (IN_PROGRESS)
      const inProgressResponse = await fetch("/api/orders?status=IN_PROGRESS", {
        credentials: "include",
      });
      if (inProgressResponse.ok) {
        const inProgressData = await inProgressResponse.json();
        // API 응답이 배열인지 확인하고 안전하게 처리
        const orders = Array.isArray(inProgressData)
          ? inProgressData
          : inProgressData.orders || [];
        setInProgressOrders(orders.slice(0, 5)); // 최대 5개만 표시
      }
    } catch (error) {
      console.error("Error fetching orders data:", error);
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
  }) => (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: "14px",
              color: "#000000",
              marginBottom: "4px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#000000",
            }}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navigation currentUser={currentUser} />

      <div style={{ padding: "20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#000000",
              marginBottom: "8px",
            }}
          >
            대시보드
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#000000",
              margin: 0,
            }}
          >
            안녕하세요, {currentUser}님! 오늘의 현황을 확인해보세요.
          </p>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              color: "#000000",
            }}
          >
            데이터를 불러오는 중...
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                marginBottom: "32px",
              }}
            >
              <StatCard
                title="전체 제품 수"
                value={stats.totalProducts.toLocaleString()}
                icon="📦"
                color="#dbeafe"
              />
              <StatCard
                title="재고 부족 제품"
                value={stats.lowStockProducts.toLocaleString()}
                icon="⚠️"
                color="#fef3c7"
              />
              <StatCard
                title="총 고객 수"
                value={stats.totalCustomers.toLocaleString()}
                icon="👥"
                color="#dcfce7"
              />
              <StatCard
                title="총 공급업체 수"
                value={stats.totalVendors.toLocaleString()}
                icon="🏢"
                color="#f3e8ff"
              />
              <StatCard
                title="최근 주문"
                value={stats.recentOrders.toLocaleString()}
                icon="📋"
                color="#fce7f3"
              />
              <StatCard
                title="총 매출"
                value={`₩${stats.totalRevenue.toLocaleString()}`}
                icon="💰"
                color="#ecfdf5"
              />
            </div>

            {/* Recent Activities */}
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
                  padding: "20px",
                  borderBottom: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#000000",
                    margin: 0,
                  }}
                >
                  최근 활동
                </h2>
              </div>
              <div style={{ padding: "20px" }}>
                {recentActivities.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#000000",
                      padding: "40px",
                    }}
                  >
                    최근 활동이 없습니다.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#3b82f6",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#000000",
                              marginBottom: "4px",
                            }}
                          >
                            {activity.description}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#000000",
                            }}
                          >
                            {activity.user} •{" "}
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Orders */}
            <div
              style={{
                marginTop: "32px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  borderBottom: "1px solid #e5e7eb",
                  background: "#fef3c7",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#000000",
                    margin: 0,
                  }}
                >
                  ⏳ 승인 대기중인 주문
                </h2>
              </div>
              <div style={{ padding: "20px" }}>
                {pendingOrders.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#000000",
                      padding: "40px",
                    }}
                  >
                    승인 대기중인 주문이 없습니다.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {pendingOrders.map((order) => (
                      <div
                        key={order.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#000000",
                              marginBottom: "4px",
                            }}
                          >
                            {order.orderNo || order.poNo}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#000000",
                            }}
                          >
                            {order.customer?.name || order.vendor?.name} •{" "}
                            {new Date(order.orderDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#000000",
                          }}
                        >
                          ₩{order.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* In Progress Orders */}
            <div
              style={{
                marginTop: "20px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  borderBottom: "1px solid #e5e7eb",
                  background: "#dbeafe",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#000000",
                    margin: 0,
                  }}
                >
                  🔄 진행중인 주문
                </h2>
              </div>
              <div style={{ padding: "20px" }}>
                {inProgressOrders.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#000000",
                      padding: "40px",
                    }}
                  >
                    진행중인 주문이 없습니다.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {inProgressOrders.map((order) => (
                      <div
                        key={order.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#000000",
                              marginBottom: "4px",
                            }}
                          >
                            {order.orderNo || order.poNo}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#000000",
                            }}
                          >
                            {order.customer?.name || order.vendor?.name} •{" "}
                            {new Date(order.orderDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#000000",
                          }}
                        >
                          ₩{order.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
