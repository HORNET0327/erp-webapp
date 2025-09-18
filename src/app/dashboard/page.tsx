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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
    fetchDashboardData();
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

            {/* Quick Actions */}
            <div
              style={{
                marginTop: "32px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#000000",
                  marginBottom: "20px",
                }}
              >
                빠른 작업
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <button
                  onClick={() => (window.location.href = "/inventory")}
                  style={{
                    padding: "16px",
                    background: "#f0f9ff",
                    border: "1px solid #0ea5e9",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#000000",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  📦 재고 관리
                </button>
                <button
                  onClick={() => (window.location.href = "/orders")}
                  style={{
                    padding: "16px",
                    background: "#f0fdf4",
                    border: "1px solid #22c55e",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#000000",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  📋 주문 관리
                </button>
                <button
                  onClick={() => (window.location.href = "/customers")}
                  style={{
                    padding: "16px",
                    background: "#fef7ff",
                    border: "1px solid #a855f7",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#000000",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  👥 거래처 관리
                </button>
                <button
                  onClick={() => (window.location.href = "/reports")}
                  style={{
                    padding: "16px",
                    background: "#fffbeb",
                    border: "1px solid #f59e0b",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#000000",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  📈 보고서
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
