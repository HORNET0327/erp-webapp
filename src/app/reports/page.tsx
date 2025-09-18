"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";

interface ReportCardProps {
  title: string;
  value: string;
  change?: string;
  icon: string;
  color: string;
}

function ReportCard({ title, value, change, icon, color }: ReportCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {icon}
        </div>
        {change && (
          <div
            style={{
              fontSize: "12px",
              fontWeight: "500",
              color: change.startsWith("+") ? "#10b981" : "#ef4444",
              background: change.startsWith("+") ? "#ecfdf5" : "#fef2f2",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {change}
          </div>
        )}
      </div>
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
          fontSize: "24px",
          fontWeight: "700",
          color: "#000000",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
    fetchReportData();
  }, [activeTab]);

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

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      setReportData({
        overview: {
          totalRevenue: 125000000,
          totalOrders: 1250,
          totalCustomers: 89,
          inventoryValue: 45000000,
        },
        sales: {
          monthlyRevenue: 25000000,
          dailyAverage: 850000,
          topProducts: [],
          regionalSales: [],
        },
        inventory: {
          totalItems: 1200,
          lowStockItems: 45,
          outOfStockItems: 12,
          turnoverRate: 3.5,
        },
        financial: {
          profit: 18000000,
          expenses: 7000000,
          margin: 0.18,
          cashFlow: 12000000,
        },
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "개요", icon: "📊" },
    { id: "sales", label: "매출", icon: "💰" },
    { id: "inventory", label: "재고", icon: "📦" },
    { id: "financial", label: "재무", icon: "📈" },
  ];

  const renderOverviewTab = () => (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <ReportCard
          title="총 매출"
          value={`₩${reportData.overview.totalRevenue.toLocaleString()}`}
          change="+12.5%"
          icon="💰"
          color="#dbeafe"
        />
        <ReportCard
          title="총 주문 수"
          value={reportData.overview.totalOrders.toLocaleString()}
          change="+8.3%"
          icon="📋"
          color="#dcfce7"
        />
        <ReportCard
          title="총 고객 수"
          value={reportData.overview.totalCustomers.toLocaleString()}
          change="+5.7%"
          icon="👥"
          color="#fef3c7"
        />
        <ReportCard
          title="재고 가치"
          value={`₩${reportData.overview.inventoryValue.toLocaleString()}`}
          change="-2.1%"
          icon="📦"
          color="#f3e8ff"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#000000",
              marginBottom: "16px",
            }}
          >
            월별 매출 추이
          </h3>
          <div
            style={{
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f9fafb",
              borderRadius: "8px",
              color: "#000000",
            }}
          >
            차트 영역 (차트 라이브러리 연동 필요)
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#000000",
              marginBottom: "16px",
            }}
          >
            주요 지표
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                padding: "12px",
                background: "#f0f9ff",
                borderRadius: "8px",
                border: "1px solid #0ea5e9",
              }}
            >
              <div style={{ fontSize: "12px", color: "#000000" }}>
                평균 주문 금액
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                ₩
                {Math.round(
                  reportData.overview.totalRevenue /
                    reportData.overview.totalOrders
                ).toLocaleString()}
              </div>
            </div>
            <div
              style={{
                padding: "12px",
                background: "#f0fdf4",
                borderRadius: "8px",
                border: "1px solid #22c55e",
              }}
            >
              <div style={{ fontSize: "12px", color: "#000000" }}>
                고객당 평균 매출
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                ₩
                {Math.round(
                  reportData.overview.totalRevenue /
                    reportData.overview.totalCustomers
                ).toLocaleString()}
              </div>
            </div>
            <div
              style={{
                padding: "12px",
                background: "#fef7ff",
                borderRadius: "8px",
                border: "1px solid #a855f7",
              }}
            >
              <div style={{ fontSize: "12px", color: "#000000" }}>
                재고 회전율
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                3.2회
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSalesTab = () => (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <ReportCard
          title="이번 달 매출"
          value={`₩${reportData.sales.monthlyRevenue.toLocaleString()}`}
          change="+15.2%"
          icon="💰"
          color="#dbeafe"
        />
        <ReportCard
          title="일평균 매출"
          value={`₩${reportData.sales.dailyAverage.toLocaleString()}`}
          change="+8.7%"
          icon="📊"
          color="#dcfce7"
        />
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#000000",
            marginBottom: "16px",
          }}
        >
          매출 상세 분석
        </h3>
        <div
          style={{
            height: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9fafb",
            borderRadius: "8px",
            color: "#000000",
          }}
        >
          매출 분석 차트 영역
        </div>
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <ReportCard
          title="총 재고 품목"
          value={reportData.inventory.totalItems.toLocaleString()}
          icon="📦"
          color="#dbeafe"
        />
        <ReportCard
          title="재고 부족 품목"
          value={reportData.inventory.lowStockItems.toLocaleString()}
          icon="⚠️"
          color="#fef3c7"
        />
        <ReportCard
          title="품절 품목"
          value={reportData.inventory.outOfStockItems.toLocaleString()}
          icon="🚫"
          color="#fef2f2"
        />
        <ReportCard
          title="재고 회전율"
          value={`${reportData.inventory.turnoverRate}회`}
          icon="🔄"
          color="#f0fdf4"
        />
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#000000",
            marginBottom: "16px",
          }}
        >
          재고 현황 분석
        </h3>
        <div
          style={{
            height: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9fafb",
            borderRadius: "8px",
            color: "#000000",
          }}
        >
          재고 현황 차트 영역
        </div>
      </div>
    </div>
  );

  const renderFinancialTab = () => (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <ReportCard
          title="순이익"
          value={`₩${reportData.financial.profit.toLocaleString()}`}
          change="+18.3%"
          icon="💰"
          color="#dcfce7"
        />
        <ReportCard
          title="총 비용"
          value={`₩${reportData.financial.expenses.toLocaleString()}`}
          change="-5.2%"
          icon="💸"
          color="#fef2f2"
        />
        <ReportCard
          title="이익률"
          value={`${(reportData.financial.margin * 100).toFixed(1)}%`}
          change="+2.1%"
          icon="📈"
          color="#dbeafe"
        />
        <ReportCard
          title="현금흐름"
          value={`₩${reportData.financial.cashFlow.toLocaleString()}`}
          change="+12.7%"
          icon="💳"
          color="#f3e8ff"
        />
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#000000",
            marginBottom: "16px",
          }}
        >
          재무 상세 분석
        </h3>
        <div
          style={{
            height: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f9fafb",
            borderRadius: "8px",
            color: "#000000",
          }}
        >
          재무 분석 차트 영역
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (!reportData) return null;

    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "sales":
        return renderSalesTab();
      case "inventory":
        return renderInventoryTab();
      case "financial":
        return renderFinancialTab();
      default:
        return renderOverviewTab();
    }
  };

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
            보고서
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#000000",
              margin: 0,
            }}
          >
            비즈니스 성과와 핵심 지표를 확인하세요
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 20px",
                background: activeTab === tab.id ? "#3b82f6" : "transparent",
                color: activeTab === tab.id ? "#ffffff" : "#000000",
                border: "none",
                borderRadius: "8px 8px 0 0",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "400px",
              color: "#000000",
            }}
          >
            데이터를 불러오는 중...
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
}
