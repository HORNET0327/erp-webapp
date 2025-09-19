"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import InventoryModal from "@/components/InventoryModal";
import StockModal from "@/components/StockModal";
import NewItemModal from "@/components/NewItemModal";

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  brand: { name: string };
  category: { name: string };
  currentStock: number;
  avgPurchasePrice: number;
  basePrice: number;
  recentUnitCost: number;
  minStock: number;
  leadTime: number;
  // API에서 추가로 반환하는 필드들
  uom?: string | null;
  categoryId?: string;
  brandId?: string;
  model?: string;
  spec?: string;
  hasSerial?: boolean;
  createdAt?: string;
  updatedAt?: string;
  invTx?: any[];
  stockValue?: number;
  isLowStock?: boolean;
  reference?: string;
  notes?: string;
}

interface Filter {
  brand: string;
  category: string;
}

export default function InventoryPage() {
  const [currentUser, setCurrentUser] = useState<string>("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filter>({ brand: "", category: "" });
  const [availableFilters, setAvailableFilters] = useState<{
    brands: string[];
    categories: string[];
  }>({ brands: [], categories: [] });
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: "" });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [stockStatusFilter, setStockStatusFilter] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchCurrentUser();
    fetchInventory();
    fetchFilters();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, filters, stockStatusFilter]);

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

  const fetchInventory = async () => {
    try {
      const response = await fetch(
        `/api/inventory?search=${searchTerm}&brand=${filters.brand}&category=${filters.category}`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setInventory(data);
        } else {
          console.error("Unexpected data format:", data);
          setInventory([]);
        }
      } else {
        console.error("Failed to fetch inventory:", response.status);
        setInventory([]);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const response = await fetch("/api/inventory/filters", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableFilters(data);
      }
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const filterInventory = () => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (typeof item.brand === "object" &&
            item.brand?.name &&
            item.brand.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (typeof item.category === "object" &&
            item.category?.name &&
            item.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filters.brand) {
      filtered = filtered.filter(
        (item) =>
          typeof item.brand === "object" && item.brand?.name === filters.brand
      );
    }

    if (filters.category) {
      filtered = filtered.filter(
        (item) =>
          typeof item.category === "object" &&
          item.category?.name === filters.category
      );
    }

    if (stockStatusFilter) {
      filtered = filtered.filter((item) => {
        const status = getStockStatus(item.currentStock);
        return status.text === stockStatusFilter;
      });
    }

    setFilteredInventory(filtered);
  };

  const handleRowDoubleClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleInventoryUpdate = () => {
    fetchInventory();
  };

  const handleStockAdded = () => {
    fetchInventory();
  };

  const handleNewItemAdded = () => {
    fetchInventory();
    fetchFilters(); // 브랜드/카테고리 목록도 새로고침
  };

  const showTooltip = (e: React.MouseEvent, item: InventoryItem) => {
    const rect = e.currentTarget.getBoundingClientRect();

    // 실제 사용자 입력 정보가 있는지 확인
    const hasUserReference =
      item.reference &&
      !["MANUAL_ADD", "INITIAL_STOCK", "STOCK_ADJUSTMENT"].includes(
        item.reference
      );
    const hasUserNotes = item.notes && item.notes.trim() !== "";

    // 사용자 입력 정보가 없으면 툴팁을 표시하지 않음
    if (!hasUserReference && !hasUserNotes) {
      return;
    }

    let content = "";
    if (hasUserReference) {
      content += `참조: ${item.reference}`;
    }
    if (hasUserNotes) {
      if (content) content += "\n";
      content += `메모: ${item.notes}`;
    }

    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: content,
    });
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, x: 0, y: 0, content: "" });
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";

    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!sortConfig) return filteredInventory;

    return [...filteredInventory].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof InventoryItem];
      let bValue: any = b[sortConfig.key as keyof InventoryItem];

      // 중첩 객체 처리 (brand.name, category.name)
      if (sortConfig.key === "brand") {
        aValue = a.brand?.name || "";
        bValue = b.brand?.name || "";
      } else if (sortConfig.key === "category") {
        aValue = a.category?.name || "";
        bValue = b.category?.name || "";
      }

      // 숫자 정렬
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      // 문자열 정렬
      if (sortConfig.direction === "asc") {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
  };

  const getStockStatus = (currentStock: number) => {
    if (currentStock <= 0) return { text: "재고없음", color: "#ef4444" };
    if (currentStock <= 10) return { text: "부족", color: "#f59e0b" };
    return { text: "정상", color: "#10b981" };
  };

  // Statistics
  const totalProducts = filteredInventory.length;
  const lowStockProducts = filteredInventory.filter(
    (item) => item.currentStock <= 10
  ).length;
  const totalValue = filteredInventory.reduce(
    (sum, item) => sum + item.currentStock * item.avgPurchasePrice,
    0
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Navigation currentUser={currentUser} />

      <div style={{ padding: "20px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              재고 관리
            </h1>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setShowStockModal(true)}
              style={{
                padding: "12px 24px",
                background: "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>📦</span>
              수동 재고추가
            </button>
            <button
              onClick={() => setShowNewItemModal(true)}
              style={{
                padding: "12px 24px",
                background: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>➕</span>새 제품 추가
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "10px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              전체 품목
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#000000",
              }}
            >
              {totalProducts}
            </div>
          </div>

          <div
            onClick={() => {
              setStockStatusFilter(
                stockStatusFilter === "부족" ? null : "부족"
              );
            }}
            style={{
              background: stockStatusFilter === "부족" ? "#fef2f2" : "#ffffff",
              padding: "10px",
              borderRadius: "12px",
              border:
                stockStatusFilter === "부족"
                  ? "2px solid #ef4444"
                  : "1px solid #e5e7eb",
              boxShadow:
                stockStatusFilter === "부족"
                  ? "0 4px 6px rgba(239, 68, 68, 0.1)"
                  : "0 1px 3px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (stockStatusFilter !== "부족") {
                e.currentTarget.style.background = "#fef2f2";
                e.currentTarget.style.border = "2px solid #ef4444";
                e.currentTarget.style.boxShadow =
                  "0 4px 6px rgba(239, 68, 68, 0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (stockStatusFilter !== "부족") {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.border = "1px solid #e5e7eb";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              }
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              재고 부족
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#ef4444",
              }}
            >
              {lowStockProducts}
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "10px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              총 재고 가치
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#000000",
              }}
            >
              ₩{totalValue.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            marginBottom: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr auto",
              gap: "16px",
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#000000",
                  marginBottom: "4px",
                }}
              >
                검색
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="제품명, 품목코드, 브랜드, 카테고리로 검색..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#000000",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#000000",
                  marginBottom: "4px",
                }}
              >
                브랜드
              </label>
              <select
                value={filters.brand}
                onChange={(e) =>
                  setFilters({ ...filters, brand: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#000000",
                }}
              >
                <option value="">전체 브랜드</option>
                {availableFilters.brands.map((brand, index) => (
                  <option key={`brand-${index}-${brand}`} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#000000",
                  marginBottom: "4px",
                }}
              >
                카테고리
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#000000",
                }}
              >
                <option value="">전체 카테고리</option>
                {availableFilters.categories.map((category, index) => (
                  <option
                    key={`category-${index}-${category}`}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setSearchTerm("");
                setFilters({ brand: "", category: "" });
              }}
              style={{
                padding: "8px 16px",
                background: "#f3f4f6",
                color: "#000000",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              초기화
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
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
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th
                      onClick={() => handleSort("code")}
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      품목코드{" "}
                      {sortConfig?.key === "code" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("name")}
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      제품명{" "}
                      {sortConfig?.key === "name" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("brand")}
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      브랜드{" "}
                      {sortConfig?.key === "brand" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("category")}
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      카테고리{" "}
                      {sortConfig?.key === "category" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("currentStock")}
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      현재재고{" "}
                      {sortConfig?.key === "currentStock" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("recentUnitCost")}
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      최근단가{" "}
                      {sortConfig?.key === "recentUnitCost" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("avgPurchasePrice")}
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      최근구매단가{" "}
                      {sortConfig?.key === "avgPurchasePrice" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("basePrice")}
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      기본 판매단가{" "}
                      {sortConfig?.key === "basePrice" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("model")}
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      모델{" "}
                      {sortConfig?.key === "model" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      시리얼번호
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedData().map((item) => {
                    const stockStatus = getStockStatus(item.currentStock);
                    return (
                      <tr
                        key={item.id}
                        onDoubleClick={() => handleRowDoubleClick(item)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8fafc";
                          showTooltip(e, item);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                          hideTooltip();
                        }}
                        style={{
                          cursor: "pointer",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            color: "#000000",
                          }}
                        >
                          {String(item.code || "")}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            color: "#000000",
                          }}
                        >
                          {String(item.name || "")}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            color: "#000000",
                          }}
                        >
                          {typeof item.brand === "object" && item.brand?.name
                            ? item.brand.name
                            : "-"}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: "14px",
                            color: "#000000",
                          }}
                        >
                          {typeof item.category === "object" &&
                          item.category?.name
                            ? item.category.name
                            : "-"}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontSize: "14px",
                            color: "#000000",
                          }}
                        >
                          {Number(item.currentStock || 0).toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontSize: "14px",
                            color: "#000000",
                          }}
                        >
                          ₩{Number(item.recentUnitCost || 0).toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontSize: "14px",
                            color: "#000000",
                          }}
                        >
                          ₩{Number(item.avgPurchasePrice || 0).toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontSize: "14px",
                            color: "#000000",
                          }}
                        >
                          ₩{Number(item.basePrice || 0).toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "left",
                            fontSize: "14px",
                            color: "#000000",
                          }}
                        >
                          {String(item.model || "-")}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontSize: "14px",
                            color: "#000000",
                          }}
                        >
                          {item.hasSerial ? "✓" : "-"}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#ffffff",
                              background: stockStatus.color,
                            }}
                          >
                            {String(stockStatus.text || "")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredInventory.length === 0 && !loading && (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#000000",
                  }}
                >
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inventory Modal */}
      <InventoryModal
        isOpen={showModal}
        onClose={handleModalClose}
        item={selectedItem}
        onSuccess={handleInventoryUpdate}
      />

      {/* Stock Modal */}
      <StockModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        onSuccess={handleStockAdded}
      />

      {/* New Item Modal */}
      <NewItemModal
        isOpen={showNewItemModal}
        onClose={() => setShowNewItemModal(false)}
        onSuccess={handleNewItemAdded}
      />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x - 100,
            top: tooltip.y - 60,
            background: "#1f2937",
            color: "#ffffff",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            zIndex: 1001,
            maxWidth: "200px",
            whiteSpace: "pre-line",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
