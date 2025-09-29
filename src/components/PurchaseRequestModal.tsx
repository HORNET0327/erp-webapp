"use client";

import { useState, useEffect } from "react";

interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Vendor {
  id: string;
  name: string;
  code: string;
}

interface Item {
  id: string;
  code: string;
  name: string;
  basePrice?: number;
  uom?: string;
}

export default function PurchaseRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: PurchaseRequestModalProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: "",
    requiredDate: "",
    notes: "",
    reason: "",
  });
  const [lines, setLines] = useState([
    {
      itemId: "",
      qty: "",
      estimatedCost: "",
      reason: "",
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      fetchItems();
    }
  }, [isOpen]);

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/inventory", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLineChange = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      [field]: value,
    };
    setLines(newLines);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        itemId: "",
        qty: "",
        estimatedCost: "",
        reason: "",
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      setLines(newLines);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validLines = lines.filter(
        (line) => line.itemId && line.qty && line.estimatedCost
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
        resetForm();
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

  const resetForm = () => {
    setFormData({
      vendorId: "",
      requiredDate: "",
      notes: "",
      reason: "",
    });
    setLines([
      {
        itemId: "",
        qty: "",
        estimatedCost: "",
        reason: "",
      },
    ]);
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
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
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
              color: "#6b7280",
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#000000",
                  marginBottom: "6px",
                }}
              >
                공급업체 *
              </label>
              <select
                value={formData.vendorId}
                onChange={(e) => handleInputChange("vendorId", e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  background: "#ffffff",
                }}
              >
                <option value="">공급업체를 선택하세요</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name} ({vendor.code})
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
                  marginBottom: "6px",
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
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                marginBottom: "6px",
              }}
            >
              구매 사유 *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
              required
              placeholder="구매 사유를 입력해주세요"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                minHeight: "80px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                marginBottom: "6px",
              }}
            >
              비고
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="추가 메모를 입력해주세요"
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                minHeight: "60px",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#000000",
                  margin: 0,
                }}
              >
                구매 품목
              </h3>
              <button
                type="button"
                onClick={addLine}
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
                + 품목 추가
              </button>
            </div>

            {lines.map((line, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 2fr auto",
                  gap: "8px",
                  alignItems: "end",
                  marginBottom: "12px",
                }}
              >
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
                    품목
                  </label>
                  <select
                    value={line.itemId}
                    onChange={(e) => handleLineChange(index, "itemId", e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    <option value="">품목 선택</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.code})
                      </option>
                    ))}
                  </select>
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
                    onChange={(e) => handleLineChange(index, "qty", e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "12px",
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
                    예상단가
                  </label>
                  <input
                    type="number"
                    value={line.estimatedCost}
                    onChange={(e) => handleLineChange(index, "estimatedCost", e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "12px",
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
                    사유
                  </label>
                  <input
                    type="text"
                    value={line.reason}
                    onChange={(e) => handleLineChange(index, "reason", e.target.value)}
                    placeholder="품목별 사유"
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  disabled={lines.length === 1}
                  style={{
                    padding: "6px 8px",
                    background: lines.length === 1 ? "#d1d5db" : "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: lines.length === 1 ? "not-allowed" : "pointer",
                    opacity: lines.length === 1 ? 0.6 : 1,
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "#6b7280",
                color: "#ffffff",
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
                background: loading ? "#d1d5db" : "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
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
