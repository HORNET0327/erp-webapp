"use client";

import { useState, useEffect } from "react";

interface Item {
  id: string;
  code: string;
  name: string;
  brand?: { name: string };
  category?: { name: string };
  currentStock?: number;
}

interface OrderLine {
  itemId: string;
  qty: number;
  unitPrice: number;
  total: number;
  item?: Item;
  itemSearch?: string;
  showDropdown?: boolean;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "sales" | "purchase";
  onSuccess: () => void;
}

export default function OrderModal({
  isOpen,
  onClose,
  type,
  onSuccess,
}: OrderModalProps) {
  const [orderLines, setOrderLines] = useState<OrderLine[]>([
    {
      itemId: "",
      qty: 1,
      unitPrice: 0,
      total: 0,
      itemSearch: "",
      showDropdown: false,
    },
  ]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    customerOrVendorId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDate: "",
    status: "pending",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

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

  const handleOrderDataChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setOrderData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemSearch = (index: number, value: string) => {
    const updatedLines = [...orderLines];
    updatedLines[index].itemSearch = value;
    updatedLines[index].showDropdown = value.length > 0;
    setOrderLines(updatedLines);
  };

  const selectItem = (index: number, item: Item) => {
    const updatedLines = [...orderLines];
    updatedLines[index].itemId = item.id;
    updatedLines[index].item = item;
    updatedLines[index].itemSearch = `${item.name} (${item.code})`;
    updatedLines[index].showDropdown = false;
    setOrderLines(updatedLines);
  };

  const handleLineChange = (
    index: number,
    field: keyof OrderLine,
    value: string | number
  ) => {
    const updatedLines = [...orderLines];
    (updatedLines[index] as any)[field] = value;

    if (field === "qty" || field === "unitPrice") {
      updatedLines[index].total =
        updatedLines[index].qty * updatedLines[index].unitPrice;
    }

    setOrderLines(updatedLines);
  };

  const addLine = () => {
    setOrderLines([
      ...orderLines,
      {
        itemId: "",
        qty: 1,
        unitPrice: 0,
        total: 0,
        itemSearch: "",
        showDropdown: false,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (orderLines.length > 1) {
      const updatedLines = orderLines.filter((_, i) => i !== index);
      setOrderLines(updatedLines);
    }
  };

  const totalAmount = orderLines.reduce((sum, line) => sum + line.total, 0);

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
      const orderPayload = {
        ...orderData,
        type,
        orderLines: orderLines.filter((line) => line.itemId && line.qty > 0),
        totalAmount,
      };

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        alert("주문이 성공적으로 생성되었습니다.");
        onSuccess();
        onClose();
        // Reset form
        setOrderLines([
          {
            itemId: "",
            qty: 1,
            unitPrice: 0,
            total: 0,
            itemSearch: "",
            showDropdown: false,
          },
        ]);
        setOrderData({
          customerOrVendorId: "",
          orderDate: new Date().toISOString().split("T")[0],
          expectedDate: "",
          status: "pending",
          notes: "",
        });
      } else {
        const error = await response.json();
        alert(`주문 생성 실패: ${error.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("주문 생성 중 오류가 발생했습니다.");
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
            새 {type === "sales" ? "판매" : "구매"} 주문
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
                {type === "sales" ? "고객" : "공급업체"}
              </label>
              <input
                type="text"
                name="customerOrVendorId"
                value={orderData.customerOrVendorId}
                onChange={handleOrderDataChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#000000",
                }}
                required
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
                주문일
              </label>
              <input
                type="date"
                name="orderDate"
                value={orderData.orderDate}
                onChange={handleOrderDataChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#000000",
                }}
                required
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
                예정일
              </label>
              <input
                type="date"
                name="expectedDate"
                value={orderData.expectedDate}
                onChange={handleOrderDataChange}
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
                상태
              </label>
              <select
                name="status"
                value={orderData.status}
                onChange={handleOrderDataChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#000000",
                }}
              >
                <option value="pending">대기</option>
                <option value="confirmed">확인</option>
                <option value="shipped">배송</option>
                <option value="delivered">완료</option>
                <option value="cancelled">취소</option>
              </select>
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
              주문 항목
            </h3>

            {orderLines.map((line, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
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
                            <div style={{ fontWeight: "500" }}>
                              {item.name} ({item.code})
                            </div>
                            <div style={{ fontSize: "10px", color: "#000000" }}>
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
                    단가
                  </label>
                  <input
                    type="number"
                    value={line.unitPrice}
                    onChange={(e) =>
                      handleLineChange(
                        index,
                        "unitPrice",
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

                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  disabled={orderLines.length === 1}
                  style={{
                    padding: "8px",
                    background: orderLines.length === 1 ? "#f3f4f6" : "#fef2f2",
                    color: orderLines.length === 1 ? "#9ca3af" : "#dc2626",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: orderLines.length === 1 ? "not-allowed" : "pointer",
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
                총 주문금액
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
              비고
            </label>
            <textarea
              name="notes"
              value={orderData.notes}
              onChange={handleOrderDataChange}
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
              {loading ? "생성 중..." : "주문 생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
