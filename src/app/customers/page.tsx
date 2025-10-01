"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import CustomerModal from "@/components/CustomerModal";

interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

interface Vendor {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

function CustomerCard({
  title,
  value,
  delta,
  accent,
  isActive,
  onClick,
}: {
  title: string;
  value: string;
  delta?: string;
  accent?: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: isActive ? "#f0f9ff" : "#ffffff",
        border: isActive ? "2px solid #3b82f6" : "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "12px",
        boxShadow: isActive ? "0 4px 6px rgba(59, 130, 246, 0.1)" : "0 1px 2px rgba(0,0,0,0.04)",
        cursor: "pointer",
        transition: "all 0.2s ease",
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

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "500",
        background: isActive ? "#dcfce7" : "#fef2f2",
        color: isActive ? "#166534" : "#991b1b",
      }}
    >
      {isActive ? "활성" : "비활성"}
    </span>
  );
}

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<"customers" | "vendors">(
    "customers"
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Customer | Vendor | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "search">("all");

  useEffect(() => {
    fetchCurrentUser();
    fetchData();
  }, []);

  // 검색어가 변경될 때 필터 상태 조정
  useEffect(() => {
    if (searchTerm && statusFilter === "all") {
      setStatusFilter("search");
    } else if (!searchTerm && statusFilter === "search") {
      setStatusFilter("all");
    }
  }, [searchTerm, statusFilter]);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("거래처 데이터 가져오기 시작...");

      // Fetch customers
      const customersResponse = await fetch("/api/customers", {
        credentials: "include",
      });
      console.log("고객 API 응답:", customersResponse.status);

      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        console.log("고객 데이터:", customersData);
        setCustomers(customersData.customers || []);
      } else {
        console.error(
          "고객 API 오류:",
          customersResponse.status,
          customersResponse.statusText
        );
      }

      // Fetch vendors
      const vendorsResponse = await fetch("/api/vendors", {
        credentials: "include",
      });
      console.log("공급업체 API 응답:", vendorsResponse.status);

      if (vendorsResponse.ok) {
        const vendorsData = await vendorsResponse.json();
        console.log("공급업체 데이터:", vendorsData);
        setVendors(vendorsData.vendors || []);
      } else {
        console.error(
          "공급업체 API 오류:",
          vendorsResponse.status,
          vendorsResponse.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    const data = activeTab === "customers" ? customers : vendors;
    let filtered = data;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.contactPerson &&
            item.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 상태 필터링
    if (statusFilter === "active") {
      filtered = filtered.filter((item) => item.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((item) => !item.isActive);
    }
    // "all"과 "search"는 추가 필터링 없음

    return filtered;
  };

  const filteredCustomers = activeTab === "customers" ? getFilteredData() : [];
  const filteredVendors = activeTab === "vendors" ? getFilteredData() : [];

  const activeCustomers = customers.filter((c) => c.isActive).length;
  const inactiveCustomers = customers.filter((c) => !c.isActive).length;
  const activeVendors = vendors.filter((v) => v.isActive).length;
  const inactiveVendors = vendors.filter((v) => !v.isActive).length;

  const handleNewItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: Customer | Vendor) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleModalSuccess = () => {
    fetchData();
  };

  const handleCardClick = (filterType: "all" | "active" | "inactive" | "search") => {
    setStatusFilter(filterType);
    if (filterType === "search") {
      // 검색 결과 카드를 클릭하면 검색어가 있을 때만 필터 적용
      if (!searchTerm) {
        setStatusFilter("all");
      }
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navigation currentUser={currentUser} />

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
            거래처 관리
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
            onClick={() => setActiveTab("customers")}
            style={{
              padding: "10px 20px",
              background: activeTab === "customers" ? "#3b82f6" : "transparent",
              color: activeTab === "customers" ? "#ffffff" : "#000000",
              border: "none",
              borderRadius: "6px 6px 0 0",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            고객 관리
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            style={{
              padding: "10px 20px",
              background: activeTab === "vendors" ? "#3b82f6" : "transparent",
              color: activeTab === "vendors" ? "#ffffff" : "#000000",
              border: "none",
              borderRadius: "6px 6px 0 0",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            공급업체 관리
          </button>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
            border: "2px solid #0ea5e9",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
            boxShadow: "0 4px 6px rgba(14, 165, 233, 0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#000000",
              marginBottom: "16px",
              paddingBottom: "8px",
              borderBottom: "2px solid #f3f4f6",
            }}
          >
            📊 {activeTab === "customers" ? "고객" : "공급업체"} 현황
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
            }}
          >
            <CustomerCard
              title="전체"
              value={`${
                activeTab === "customers" ? customers.length : vendors.length
              }개`}
              accent="#3b82f6"
              isActive={statusFilter === "all"}
              onClick={() => handleCardClick("all")}
            />
            <CustomerCard
              title="활성"
              value={`${
                activeTab === "customers" ? activeCustomers : activeVendors
              }개`}
              accent="#22c55e"
              isActive={statusFilter === "active"}
              onClick={() => handleCardClick("active")}
            />
            <CustomerCard
              title="비활성"
              value={`${
                activeTab === "customers" ? inactiveCustomers : inactiveVendors
              }개`}
              accent="#ef4444"
              isActive={statusFilter === "inactive"}
              onClick={() => handleCardClick("inactive")}
            />
            <CustomerCard
              title="검색 결과"
              value={`${
                activeTab === "customers"
                  ? filteredCustomers.length
                  : filteredVendors.length
              }개`}
              accent="#8b5cf6"
              isActive={statusFilter === "search"}
              onClick={() => handleCardClick("search")}
            />
          </div>
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1", minWidth: "250px" }}>
            <input
              type="text"
              placeholder={`${
                activeTab === "customers" ? "고객" : "공급업체"
              }명, 코드, 담당자로 검색...`}
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
          <button
            onClick={handleNewItem}
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
            + 새 {activeTab === "customers" ? "고객" : "공급업체"}
          </button>
          <button
            onClick={clearFilters}
            style={{
              padding: "8px 16px",
              background: "#f59e0b",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            필터 초기화
          </button>
          <button
            onClick={fetchData}
            style={{
              padding: "8px 16px",
              background: "#6b7280",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            새로고침
          </button>
        </div>

        {/* Table */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#000000",
                  margin: 0,
                }}
              >
                {activeTab === "customers" ? "고객" : "공급업체"} 목록
              </h3>
              {statusFilter !== "all" && (
                <span
                  style={{
                    padding: "2px 8px",
                    background: "#3b82f6",
                    color: "#ffffff",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "500",
                  }}
                >
                  {statusFilter === "active" && "활성"}
                  {statusFilter === "inactive" && "비활성"}
                  {statusFilter === "search" && "검색 결과"}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#000000",
              }}
            >
              데이터를 불러오는 중...
            </div>
          ) : (
            <div style={{ overflow: "auto" }}>
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
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      코드
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {activeTab === "customers" ? "고객명" : "업체명"}
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      담당자
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      연락처
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      비고
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      상태
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === "customers"
                    ? filteredCustomers
                    : filteredVendors
                  ).map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "12px",
                          color: "#000000",
                          fontWeight: "500",
                        }}
                      >
                        {item.code}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "12px",
                          color: "#000000",
                        }}
                      >
                        {item.name}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "12px",
                          color: "#000000",
                        }}
                      >
                        {item.contactPerson || "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "12px",
                          color: "#000000",
                        }}
                      >
                        {item.phone || "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "12px",
                          color: "#000000",
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={item.notes || ""}
                      >
                        {item.notes || "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "12px",
                        }}
                      >
                        <StatusBadge isActive={item.isActive} />
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
                            gap: "4px",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            onClick={() => handleEditItem(item)}
                            style={{
                              padding: "4px 8px",
                              background: "#f3f4f6",
                              color: "#000000",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "11px",
                              cursor: "pointer",
                            }}
                          >
                            수정
                          </button>
                          <button
                            style={{
                              padding: "4px 8px",
                              background: "#fef2f2",
                              color: "#dc2626",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "11px",
                              cursor: "pointer",
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(activeTab === "customers" ? filteredCustomers : filteredVendors)
                .length === 0 && (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#000000",
                  }}
                >
                  {searchTerm ? "검색 결과가 없습니다." : "데이터가 없습니다."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Modal */}
        <CustomerModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          type={activeTab}
          onSuccess={handleModalSuccess}
          editData={editingItem}
        />
      </div>
    </div>
  );
}
