"use client";

import { useState, useEffect } from "react";

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Item {
  id: string;
  code: string;
  name: string;
  currentStock: number;
}

export default function StockModal({
  isOpen,
  onClose,
  onSuccess,
}: StockModalProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

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

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    setSearchTerm(`${item.name} (${item.code})`);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 품목이 선택되지 않았거나 검색어와 일치하지 않는 경우
    if (!selectedItem || !quantity || !unitCost) {
      if (!selectedItem) {
        alert("품목을 검색하여 선택해주세요.");
        return;
      }
      if (!quantity) {
        alert("수량을 입력해주세요.");
        return;
      }
      if (!unitCost) {
        alert("단가를 입력해주세요.");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/inventory/add-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          itemId: selectedItem.id,
          quantity: Number(quantity),
          unitCost: Number(unitCost),
          reference: reference || "MANUAL_ADD",
          notes: notes,
        }),
      });

      if (response.ok) {
        alert("재고가 성공적으로 추가되었습니다.");
        onSuccess();
        onClose();
        // 폼 초기화
        setSelectedItem(null);
        setSearchTerm("");
        setQuantity("");
        setUnitCost("");
        setReference("");
        setNotes("");
      } else {
        const error = await response.json();
        alert(`재고 추가 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      alert("재고 추가 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedItem(null);
    setSearchTerm("");
    setQuantity("");
    setUnitCost("");
    setReference("");
    setNotes("");
    setShowDropdown(false);
    onClose();
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
          maxWidth: "500px",
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
            재고 추가
          </h2>
          <button
            onClick={handleClose}
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
          {/* 품목 선택 */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              품목 선택 *{" "}
              {selectedItem && (
                <span style={{ color: "#10b981", fontSize: "12px" }}>
                  ✓ 선택됨
                </span>
              )}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) {
                    setSelectedItem(null);
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="품목명 또는 코드로 검색..."
                style={{
                  width: "100%",
                  padding: "12px",
                  border: selectedItem
                    ? "2px solid #10b981"
                    : "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#000000",
                }}
              />
              {showDropdown && filteredItems.length > 0 && (
                <div
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
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
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
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        {item.code} • 현재 재고:{" "}
                        {item.currentStock.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 수량 */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              수량 *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="추가할 수량"
              min="1"
              step="1"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#000000",
              }}
              required
            />
          </div>

          {/* 단가 */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              단가 *
            </label>
            <input
              type="number"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder="단가 (원)"
              min="0"
              step="1"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#000000",
              }}
              required
            />
          </div>

          {/* 참조 */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              참조
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="구매 주문번호, 송장번호 등"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#000000",
              }}
            />
          </div>

          {/* 메모 */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              메모
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 정보나 메모"
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#000000",
                resize: "vertical",
              }}
            />
          </div>

          {/* 버튼 */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: "12px 24px",
                background: "#f3f4f6",
                color: "#000000",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: loading ? "#9ca3af" : "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "추가 중..." : "재고 추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
