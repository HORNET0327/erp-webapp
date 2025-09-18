"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import InventoryModal from "@/components/InventoryModal";

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

  useEffect(() => {
    fetchCurrentUser();
    fetchInventory();
    fetchFilters();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, filters]);

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
        <div style={{ marginBottom: "24px" }}>
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
          <p
            style={{
              fontSize: "16px",
              color: "#000000",
              margin: 0,
            }}
          >
            제품 재고 현황을 확인하고 관리하세요 (더블클릭하여 수정)
          </p>
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
              padding: "20px",
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
            style={{
              background: "#ffffff",
              padding: "20px",
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
              padding: "20px",
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
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      품목코드
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      제품명
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      브랜드
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      카테고리
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      현재재고
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      최근단가
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      최근구매단가
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#000000",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      기본단가
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
                  {filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item.currentStock);
                    return (
                      <tr
                        key={item.id}
                        onDoubleClick={() => handleRowDoubleClick(item)}
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
    </div>
  );
}
