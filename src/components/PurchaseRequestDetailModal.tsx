"use client";

import { useState, useEffect } from "react";

interface PurchaseRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRequest: any;
  onPurchaseRequestUpdated?: () => void;
}

export default function PurchaseRequestDetailModal({
  isOpen,
  onClose,
  purchaseRequest,
  onPurchaseRequestUpdated,
}: PurchaseRequestDetailModalProps) {
  
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && purchaseRequest) {
      fetchPurchaseRequestDetails();
      fetchItems();
      setIsEditing(false);
    }
  }, [isOpen, purchaseRequest]);

  const fetchPurchaseRequestDetails = async () => {
    if (!purchaseRequest?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/purchase-requests/${purchaseRequest.id}`);
      if (response.ok) {
        const data = await response.json();
        setEditedData(data);
      }
    } catch (error) {
      console.error("Error fetching purchase request details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/inventory");
      if (response.ok) {
        const data = await response.json();
        setItems(data || []);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditedData(null);
    onClose();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedData) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/purchase-requests/${purchaseRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedData),
      });

      if (response.ok) {
        setIsEditing(false);
        onPurchaseRequestUpdated?.();
      } else {
        console.error("Failed to update purchase request");
      }
    } catch (error) {
      console.error("Error updating purchase request:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(purchaseRequest);
    setIsEditing(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { background: "#fef3c7", color: "#92400e", border: "#f59e0b" };
      case "approved":
        return { background: "#d1fae5", color: "#065f46", border: "#10b981" };
      case "rejected":
        return { background: "#fee2e2", color: "#991b1b", border: "#ef4444" };
      case "converted":
        return { background: "#e0e7ff", color: "#3730a3", border: "#6366f1" };
      default:
        return { background: "#f3f4f6", color: "#374151", border: "#d1d5db" };
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "요청대기";
      case "approved":
        return "승인됨";
      case "rejected":
        return "거부됨";
      case "converted":
        return "변환됨";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  if (!isOpen || !purchaseRequest) return null;

  const data = editedData || purchaseRequest;
  console.log("PurchaseRequestDetailModal data:", data);
  console.log("Requester info:", data.requester);
  console.log("Approver info:", data.approver);
  const statusStyle = getStatusStyle(data.status);

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
      onClick={handleClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "900px",
          width: "90%",
          maxHeight: "95vh",
          overflow: "auto",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "1px solid #e5e7eb",
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
            구매요청 상세보기
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            {!isEditing ? (
              <>
                <button
                  onClick={handleEdit}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  수정
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  닫기
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: saving ? "#9ca3af" : "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {saving ? "저장중..." : "저장"}
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  취소
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div>로딩중...</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 기본 정보 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                padding: "16px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
              }}
            >
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                  요청번호
                </label>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#000000" }}>
                  {data.requestNo}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                  상태
                </label>
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500",
                      border: `1px solid ${statusStyle.border}`,
                      backgroundColor: statusStyle.background,
                      color: statusStyle.color,
                    }}
                  >
                    {getStatusText(data.status)}
                  </span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                  공급업체
                </label>
                <div style={{ fontSize: "14px", color: "#000000" }}>
                  {data.vendor?.name || "-"}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                  요청자
                </label>
                <div style={{ fontSize: "14px", color: "#000000" }}>
                  {data.requester?.name || data.requester?.username || "-"}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                  요청일
                </label>
                <div style={{ fontSize: "14px", color: "#000000" }}>
                  {formatDate(data.requestDate)}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                  필요일
                </label>
                <div style={{ fontSize: "14px", color: "#000000" }}>
                  {data.requiredDate ? formatDate(data.requiredDate) : "-"}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                  총 금액
                </label>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#000000" }}>
                  {formatCurrency(data.totalAmount || 0)}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                  승인자
                </label>
                <div style={{ fontSize: "14px", color: "#000000" }}>
                  {data.approver?.name || data.approver?.username || "-"}
                </div>
              </div>
            </div>

            {/* 구매사유 */}
            {data.reason && (
              <div>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#000000", marginBottom: "8px", display: "block" }}>
                  구매사유
                </label>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#000000",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {data.reason}
                </div>
              </div>
            )}

            {/* 비고 */}
            {data.notes && (
              <div>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#000000", marginBottom: "8px", display: "block" }}>
                  비고
                </label>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#f9fafb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#000000",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {data.notes}
                </div>
              </div>
            )}

            {/* 요청항목 */}
            <div>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#000000", marginBottom: "12px", display: "block" }}>
                요청항목
              </label>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                    backgroundColor: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#374151" }}>
                    품목
                  </div>
                  <div style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#374151" }}>
                    수량
                  </div>
                  <div style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#374151" }}>
                    요청단가
                  </div>
                  <div style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#374151" }}>
                    금액
                  </div>
                  <div style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#374151" }}>
                    사유
                  </div>
                  <div style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#374151" }}>
                    단위
                  </div>
                </div>
                {data.lines?.map((line: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                      borderBottom: index < data.lines.length - 1 ? "1px solid #e5e7eb" : "none",
                    }}
                  >
                    <div style={{ padding: "12px 16px", fontSize: "14px", color: "#000000" }}>
                      <div style={{ fontWeight: "500" }}>{line.item?.name}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        {line.item?.code}
                      </div>
                    </div>
                    <div style={{ padding: "12px 16px", fontSize: "14px", color: "#000000" }}>
                      {line.qty}
                    </div>
                    <div style={{ padding: "12px 16px", fontSize: "14px", color: "#000000" }}>
                      {formatCurrency(line.estimatedCost || 0)}
                    </div>
                    <div style={{ padding: "12px 16px", fontSize: "14px", color: "#000000" }}>
                      {formatCurrency(line.amount || 0)}
                    </div>
                    <div style={{ padding: "12px 16px", fontSize: "14px", color: "#000000" }}>
                      {line.reason || "-"}
                    </div>
                    <div style={{ padding: "12px 16px", fontSize: "14px", color: "#000000" }}>
                      {line.item?.uom || "-"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
