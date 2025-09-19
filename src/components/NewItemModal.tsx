"use client";

import { useState, useEffect } from "react";

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

export default function NewItemModal({
  isOpen,
  onClose,
  onSuccess,
}: NewItemModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    uom: "",
    brandId: "",
    categoryId: "",
    model: "",
    spec: "",
    hasSerial: false,
    minStock: 0,
    basePrice: 0,
    leadTime: 0,
    initialStock: 0,
    unitCost: 0,
  });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBrandsAndCategories();
    }
  }, [isOpen]);

  const fetchBrandsAndCategories = async () => {
    try {
      const response = await fetch("/api/inventory/filters", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // 브랜드와 카테고리를 ID와 함께 가져오는 별도 API 필요
        // 임시로 빈 배열로 설정
        setBrands([]);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching brands and categories:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      alert("제품코드와 제품명은 필수 입력 항목입니다.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/inventory/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("새 제품이 성공적으로 추가되었습니다.");
        onSuccess();
        onClose();
        // 폼 초기화
        setFormData({
          code: "",
          name: "",
          uom: "",
          brandId: "",
          categoryId: "",
          model: "",
          spec: "",
          hasSerial: false,
          minStock: 0,
          basePrice: 0,
          leadTime: 0,
          initialStock: 0,
          unitCost: 0,
        });
      } else {
        const error = await response.json();
        alert(`제품 추가 실패: ${error.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Error creating new item:", error);
      alert("제품 추가 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      code: "",
      name: "",
      uom: "",
      brandId: "",
      categoryId: "",
      model: "",
      spec: "",
      hasSerial: false,
      minStock: 0,
      basePrice: 0,
      leadTime: 0,
      initialStock: 0,
      unitCost: 0,
    });
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
          maxWidth: "600px",
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
            새 제품 추가
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            {/* 왼쪽 컬럼 */}
            <div>
              {/* 제품코드 */}
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
                  제품코드 *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="예: ABC-001"
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

              {/* 제품명 */}
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
                  제품명 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="제품명을 입력하세요"
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

              {/* 단위 */}
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
                  단위 (UOM)
                </label>
                <input
                  type="text"
                  name="uom"
                  value={formData.uom}
                  onChange={handleInputChange}
                  placeholder="예: 개, EA, SET"
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

              {/* 모델 */}
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
                  모델
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="모델명"
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

              {/* 시리얼 번호 여부 */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#000000",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    name="hasSerial"
                    checked={formData.hasSerial}
                    onChange={handleInputChange}
                    style={{
                      marginRight: "8px",
                    }}
                  />
                  시리얼 번호 관리
                </label>
              </div>
            </div>

            {/* 오른쪽 컬럼 */}
            <div>
              {/* 브랜드 */}
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
                  브랜드
                </label>
                <input
                  type="text"
                  name="brandId"
                  value={formData.brandId}
                  onChange={handleInputChange}
                  placeholder="브랜드명을 입력하세요"
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

              {/* 카테고리 */}
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
                  카테고리
                </label>
                <input
                  type="text"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  placeholder="카테고리명을 입력하세요"
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

              {/* 최소재고 */}
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

              {/* 기본단가 */}
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

              {/* 리드타임 */}
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
          </div>

          {/* 초기 재고 정보 */}
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "8px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#000000",
                marginBottom: "16px",
              }}
            >
              초기 재고 설정
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
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
                  초기 수량
                </label>
                <input
                  type="number"
                  name="initialStock"
                  value={formData.initialStock}
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
                  단가 (₩)
                </label>
                <input
                  type="number"
                  name="unitCost"
                  value={formData.unitCost}
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
            </div>
          </div>

          {/* 사양 */}
          <div style={{ marginTop: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#000000",
                marginBottom: "4px",
              }}
            >
              사양/설명
            </label>
            <textarea
              name="spec"
              value={formData.spec}
              onChange={handleInputChange}
              placeholder="제품 사양이나 추가 설명을 입력하세요"
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

          {/* 버튼 */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "24px",
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
              {loading ? "추가 중..." : "제품 추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



