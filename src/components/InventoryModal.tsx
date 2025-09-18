"use client";

import { useState, useEffect } from "react";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    code: string;
    name: string;
    brand: { name: string };
    category: { name: string };
    currentStock: number;
    basePrice: number;
    minStock: number | null;
    leadTime: number | null;
  } | null;
  onSuccess: () => void;
}

export default function InventoryModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: InventoryModalProps) {
  const [formData, setFormData] = useState({
    basePrice: 0,
    minStock: 0,
    leadTime: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        basePrice: item.basePrice || 0,
        minStock: item.minStock || 0,
        leadTime: item.leadTime || 0,
      });
    }
  }, [isOpen, item]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        alert("재고 항목이 성공적으로 수정되었습니다.");
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(`재고 수정 실패: ${error.details || error.error}`);
      }
    } catch (error) {
      console.error("Error updating inventory item:", error);
      alert("재고 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

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
            재고 항목 수정
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
          <div style={{ marginBottom: "24px" }}>
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#000000",
                  marginBottom: "4px",
                }}
              >
                {item.name} ({item.code})
              </div>
              <div style={{ fontSize: "12px", color: "#000000" }}>
                브랜드: {item.brand?.name || "-"} | 카테고리:{" "}
                {item.category?.name || "-"}
              </div>
              <div style={{ fontSize: "12px", color: "#000000" }}>
                현재 재고: {item.currentStock.toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#000000",
                  marginBottom: "4px",
                }}
              >
                기본단가 (₩)
              </label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleInputChange}
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

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#000000",
                  marginBottom: "4px",
                }}
              >
                최소재고
              </label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleInputChange}
                min="0"
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

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#000000",
                  marginBottom: "4px",
                }}
              >
                리드타임 (일)
              </label>
              <input
                type="number"
                name="leadTime"
                value={formData.leadTime}
                onChange={handleInputChange}
                min="0"
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
              {loading ? "수정 중..." : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
