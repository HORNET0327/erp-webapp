"use client";

import { useState, useEffect } from "react";

interface Item {
  id: string;
  code: string;
  name: string;
  brand?: { name: string };
  category?: { name: string };
  currentStock?: number;
  basePrice?: number;
}

interface Vendor {
  id: string;
  name: string;
  code: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

interface PurchaseRequestLine {
  itemId: string;
  qty: number;
  estimatedCost: number;
  total: number;
  reason: string;
  item?: Item;
  itemSearch?: string;
  showDropdown?: boolean;
}

interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: PurchaseRequestModalProps) {
  const [lines, setLines] = useState<PurchaseRequestLine[]>([
    {
      itemId: "",
      qty: 1,
      estimatedCost: 0,
      total: 0,
      reason: "",
      itemSearch: "",
      showDropdown: false,
    },
  ]);
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    vendorId: "",
    requiredDate: "",
    notes: "",
    reason: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      fetchVendors();
    } else {
      // 모달이 닫힐 때 state 초기화
      setVendorSearch("");
      setShowVendorDropdown(false);
      setSelectedVendor(null);
      setFormData({
        vendorId: "",
        requiredDate: "",
        notes: "",
        reason: "",
      });
      setLines([
        {
          itemId: "",
          qty: 1,
          estimatedCost: 0,
          total: 0,
          reason: "",
          itemSearch: "",
          showDropdown: false,
        },
      ]);
    }
  }, [isOpen]);

  // Enter 키로 인한 실수 주문 생성 방지
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && isOpen) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showVendorDropdown && !target.closest("[data-vendor-dropdown]")) {
        setShowVendorDropdown(false);
      }
    };

    if (showVendorDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showVendorDropdown]);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/inventory", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(Array.isArray(data.vendors) ? data.vendors : []);
      } else {
        console.error("Failed to fetch vendors:", response.status);
        setVendors([]);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVendorSearch = (value: string) => {
    setVendorSearch(value);
    setShowVendorDropdown(true);
    if (value.length === 0) {
      setSelectedVendor(null);
      setFormData((prev) => ({ ...prev, vendorId: "" }));
    }
  };

  const selectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorSearch(`${vendor.name} (${vendor.code})`);
    setShowVendorDropdown(false);
    setFormData((prev) => ({ ...prev, vendorId: vendor.id }));
  };

  const filteredVendors = (vendors || []).filter(
    (vendor) =>
      vendorSearch.length === 0 ||
      vendor.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      vendor.code.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const handleItemSearch = (index: number, value: string) => {
    const updatedLines = [...lines];
    updatedLines[index].itemSearch = value;
    updatedLines[index].showDropdown = value.length > 0;
    setLines(updatedLines);
  };

  const selectItem = (index: number, item: Item) => {
    const updatedLines = [...lines];
    updatedLines[index].itemId = item.id;
    updatedLines[index].item = item;
    updatedLines[index].itemSearch = `${item.name} (${item.code})`;
    updatedLines[index].showDropdown = false;

    // 기본 단가가 있으면 자동으로 단가에 입력
    if (item.basePrice && item.basePrice > 0) {
      updatedLines[index].estimatedCost = item.basePrice;
      const qty = Number(updatedLines[index].qty) || 0;
      const estimatedCost = Number(item.basePrice) || 0;
      updatedLines[index].total = qty * estimatedCost;
    }

    setLines(updatedLines);
  };

  const handleLineChange = (
    index: number,
    field: keyof PurchaseRequestLine,
    value: string | number
  ) => {
    const updatedLines = [...lines];
    (updatedLines[index] as any)[field] = value;

    if (field === "qty" || field === "estimatedCost") {
      const qty = Number(updatedLines[index].qty) || 0;
      const estimatedCost = Number(updatedLines[index].estimatedCost) || 0;
      updatedLines[index].total = qty * estimatedCost;
    }

    setLines(updatedLines);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        itemId: "",
        qty: 1,
        estimatedCost: 0,
        total: 0,
        reason: "",
        itemSearch: "",
        showDropdown: false,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      const updatedLines = lines.filter((_, i) => i !== index);
      setLines(updatedLines);
    }
  };

  const totalAmount = lines.reduce((sum, line) => sum + line.total, 0);

  const filteredItems = (searchTerm: string) => {
    if (!searchTerm) return [];
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validLines = lines.filter(
        (line) => line.itemId && line.qty > 0
      );

      if (validLines.length === 0) {
        alert("최소 하나의 품목을 입력해주세요.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/purchase-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          lines: validLines.map((line) => ({
            itemId: line.itemId,
            qty: Number(line.qty),
            estimatedCost: Number(line.estimatedCost),
            reason: line.reason,
          })),
        }),
      });

      if (response.ok) {
        alert("구매요청이 생성되었습니다.");
        onSuccess();
        onClose();
        // Reset form
        setLines([
          {
            itemId: "",
            qty: 1,
            estimatedCost: 0,
            total: 0,
            reason: "",
            itemSearch: "",
            showDropdown: false,
          },
        ]);
        setFormData({
          vendorId: "",
          requiredDate: "",
          notes: "",
          reason: "",
        });
      } else {
        const error = await response.json();
        alert(`오류: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating purchase request:", error);
      alert("구매요청 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          width: "90%",
          maxWidth: "800px",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#000000",
              margin: 0,
            }}
          >
            새 구매요청
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#000000",
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Order Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
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
                공급업체
              </label>
              <div style={{ position: "relative" }} data-vendor-dropdown>
                <input
                  type="text"
                  value={vendorSearch}
                  onChange={(e) => handleVendorSearch(e.target.value)}
                  onFocus={() => setShowVendorDropdown(true)}
                  placeholder="공급업체를 검색하세요..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: selectedVendor
                      ? "2px solid #3b82f6"
                      : "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#000000",
                  }}
                  required
                />
                {showVendorDropdown && filteredVendors.length > 0 && (
                  <div
                    data-vendor-dropdown
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "#ffffff",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      maxHeight: "200px",
                      overflow: "auto",
                      zIndex: 1001,
                    }}
                  >
                    {filteredVendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        onClick={() => selectVendor(vendor)}
                        style={{
                          padding: "12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #f3f4f6",
                          color: "#000000",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#ffffff";
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            marginBottom: "4px",
                          }}
                        >
                          {vendor.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                          }}
                        >
                          {vendor.code}
                          {vendor.contactPerson &&
                            ` • ${vendor.contactPerson}`}
                          {vendor.phone && ` • ${vendor.phone}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                필요일
              </label>
              <input
                type="date"
                value={formData.requiredDate}
                onChange={(e) => handleInputChange("requiredDate", e.target.value)}
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
          </div>

          {/* Order Lines */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#000000",
                marginBottom: "16px",
              }}
            >
              구매 품목
            </h3>

            {lines.map((line, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
                  gap: "12px",
                  marginBottom: "12px",
                  alignItems: "end",
                }}
              >
                <div style={{ position: "relative" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    품목
                  </label>
                  <input
                    type="text"
                    value={line.itemSearch || ""}
                    onChange={(e) => handleItemSearch(index, e.target.value)}
                    placeholder="품목을 검색하세요..."
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  />

                  {line.showDropdown && line.itemSearch && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#ffffff",
                        border: "1px solid #d1d5db",
                        borderTop: "none",
                        borderRadius: "0 0 6px 6px",
                        maxHeight: "200px",
                        overflow: "auto",
                        zIndex: 1001,
                      }}
                    >
                      {filteredItems(line.itemSearch || "").map(
                        (item, itemIndex) => (
                          <div
                            key={`item-${index}-${itemIndex}-${item.id}`}
                            onClick={() => selectItem(index, item)}
                            style={{
                              padding: "8px 12px",
                              cursor: "pointer",
                              borderBottom: "1px solid #f3f4f6",
                            }}
                          >
                            <div
                              style={{ fontWeight: "500", color: "#374151" }}
                            >
                              {item.name} ({item.code})
                            </div>
                            <div style={{ fontSize: "10px", color: "#6b7280" }}>
                              {item.brand?.name} | {item.category?.name}
                              {item.currentStock !== undefined && (
                                <span
                                  style={{
                                    color:
                                      item.currentStock > 0
                                        ? "#10b981"
                                        : "#ef4444",
                                    marginLeft: "8px",
                                  }}
                                >
                                  재고: {item.currentStock}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    수량
                  </label>
                  <input
                    type="number"
                    value={line.qty}
                    onChange={(e) =>
                      handleLineChange(index, "qty", Number(e.target.value))
                    }
                    min="1"
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
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    요청단가
                  </label>
                  <input
                    type="number"
                    value={line.estimatedCost}
                    onChange={(e) =>
                      handleLineChange(
                        index,
                        "estimatedCost",
                        Number(e.target.value)
                      )
                    }
                    min="0"
                    step="0.01"
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
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    합계
                  </label>
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  >
                    ₩{line.total.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#000000",
                      marginBottom: "4px",
                    }}
                  >
                    사유
                  </label>
                  <input
                    type="text"
                    value={line.reason}
                    onChange={(e) =>
                      handleLineChange(index, "reason", e.target.value)
                    }
                    placeholder="품목별 사유"
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

                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  disabled={lines.length === 1}
                  style={{
                    padding: "8px",
                    background: lines.length === 1 ? "#f3f4f6" : "#fef2f2",
                    color: lines.length === 1 ? "#9ca3af" : "#dc2626",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: lines.length === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  삭제
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addLine}
              style={{
                padding: "8px 16px",
                background: "#f0f9ff",
                color: "#000000",
                border: "1px solid #0ea5e9",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
                marginTop: "8px",
              }}
            >
              + 항목 추가
            </button>
          </div>

          {/* Total Amount */}
          <div
            style={{
              background: "#f8fafc",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                총 구매요청금액
              </span>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#000000",
                }}
              >
                ₩{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                marginBottom: "4px",
              }}
            >
              구매 사유
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
              required
              placeholder="구매 사유를 입력해주세요"
              rows={3}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#000000",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                marginBottom: "4px",
              }}
            >
              비고
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="추가 메모를 입력해주세요"
              rows={3}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#000000",
                resize: "vertical",
              }}
            />
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "#f3f4f6",
                color: "#000000",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              style={{
                padding: "10px 20px",
                background: loading ? "#9ca3af" : "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "생성 중..." : "구매요청 생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}