"use client";

import { useState, useEffect } from "react";
import QuotationViewModal from "./QuotationViewModal";

interface HistoryItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  user: string;
  details?: any;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNo: string;
}

export default function HistoryModal({
  isOpen,
  onClose,
  orderId,
  orderNo,
}: HistoryModalProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isQuotationViewOpen, setIsQuotationViewOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(
    null
  );
  const [selectedQuotationVersion, setSelectedQuotationVersion] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchHistory();
    }
  }, [isOpen, orderId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistoryItems(data.history || []);
      } else {
        console.error("히스토리 조회 실패");
        setHistoryItems([]);
      }
    } catch (error) {
      console.error("히스토리 조회 오류:", error);
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuotation = (quotationId: string, version?: number) => {
    setSelectedQuotationId(quotationId);
    setSelectedQuotationVersion(version);
    setIsQuotationViewOpen(true);
  };

  const handleQuotationViewClose = () => {
    setIsQuotationViewOpen(false);
    setSelectedQuotationId(null);
    setSelectedQuotationVersion(undefined);
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "ORDER_CREATED":
        return "📝";
      case "QUOTATION_CREATED":
        return "📋";
      case "QUOTATION_UPDATED":
        return "✏️";
      case "QUOTATION_SENT":
        return "📧";
      case "ORDER_REGISTERED":
        return "📦";
      case "SHIPMENT_CREATED":
        return "🚚";
      case "SHIPMENT_PROCESSED":
        return "✅";
      case "TAX_INVOICE_ISSUED":
        return "🧾";
      case "PAYMENT_REGISTERED":
        return "💰";
      default:
        return "📌";
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "ORDER_CREATED":
        return "새 주문 생성";
      case "QUOTATION_CREATED":
        return "견적서 저장";
      case "QUOTATION_UPDATED":
        return "견적서 수정";
      case "QUOTATION_SENT":
        return "견적서 전송";
      case "ORDER_REGISTERED":
        return "수주등록";
      case "SHIPMENT_CREATED":
        return "출고지시";
      case "SHIPMENT_PROCESSED":
        return "출고처리";
      case "TAX_INVOICE_ISSUED":
        return "세금계산서 발행";
      case "PAYMENT_REGISTERED":
        return "수금등록";
      default:
        return action;
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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
            📋 주문 히스토리 - {orderNo}
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

        {/* 히스토리 목록 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: "8px",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
                color: "#6b7280",
              }}
            >
              로딩 중...
            </div>
          ) : historyItems.length === 0 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
                color: "#6b7280",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ fontSize: "48px" }}>📝</div>
              <div>아직 기록된 활동이 없습니다.</div>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {historyItems.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "16px",
                    backgroundColor: index % 2 === 0 ? "#f9fafb" : "white",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      minWidth: "32px",
                      textAlign: "center",
                    }}
                  >
                    {getActionIcon(item.action)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: "16px",
                          color: "#1f2937",
                        }}
                      >
                        {getActionText(item.action)}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          fontFamily: "monospace",
                        }}
                      >
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "#4b5563",
                        fontSize: "14px",
                        marginBottom: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{item.description}</span>
                      {(item.action === "QUOTATION_CREATED" ||
                        item.action === "QUOTATION_UPDATED") &&
                        item.details?.quotationId && (
                          <button
                            onClick={() =>
                              handleViewQuotation(
                                item.details.quotationId,
                                item.details?.version
                              )
                            }
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#3b82f6",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              marginLeft: "8px",
                            }}
                          >
                            📄 견적서 보기
                          </button>
                        )}
                    </div>

                    {/* 상세 정보 표시 */}
                    {item.details && (
                      <div
                        style={{
                          marginBottom: "8px",
                          padding: "12px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "6px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {item.details.orderNo && (
                          <div
                            style={{ marginBottom: "4px", fontSize: "13px" }}
                          >
                            <span
                              style={{ fontWeight: "600", color: "#374151" }}
                            >
                              주문번호:
                            </span>{" "}
                            <span style={{ color: "#1f2937" }}>
                              {item.details.orderNo}
                            </span>
                          </div>
                        )}
                        {item.details.customer && (
                          <div
                            style={{ marginBottom: "4px", fontSize: "13px" }}
                          >
                            <span
                              style={{ fontWeight: "600", color: "#374151" }}
                            >
                              고객:
                            </span>{" "}
                            <span style={{ color: "#1f2937" }}>
                              {item.details.customer}
                            </span>
                          </div>
                        )}
                        {item.details.vendorName && (
                          <div
                            style={{ marginBottom: "4px", fontSize: "13px" }}
                          >
                            <span
                              style={{ fontWeight: "600", color: "#374151" }}
                            >
                              공급업체:
                            </span>{" "}
                            <span style={{ color: "#1f2937" }}>
                              {item.details.vendorName}
                            </span>
                          </div>
                        )}
                        {item.details.totalAmount && (
                          <div
                            style={{ marginBottom: "4px", fontSize: "13px" }}
                          >
                            <span
                              style={{ fontWeight: "600", color: "#374151" }}
                            >
                              금액:
                            </span>{" "}
                            <span style={{ color: "#1f2937" }}>
                              {Number(
                                item.details.totalAmount
                              ).toLocaleString()}
                              원
                            </span>
                          </div>
                        )}
                        {item.details.status && (
                          <div
                            style={{ marginBottom: "4px", fontSize: "13px" }}
                          >
                            <span
                              style={{ fontWeight: "600", color: "#374151" }}
                            >
                              상태:
                            </span>{" "}
                            <span style={{ color: "#1f2937" }}>
                              {item.details.status}
                            </span>
                          </div>
                        )}
                        {item.details.quotationNo && (
                          <div
                            style={{ marginBottom: "4px", fontSize: "13px" }}
                          >
                            <span
                              style={{ fontWeight: "600", color: "#374151" }}
                            >
                              견적번호:
                            </span>{" "}
                            <span style={{ color: "#1f2937" }}>
                              {item.details.quotationNo}
                            </span>
                          </div>
                        )}
                        {item.details.sentTo && (
                          <div
                            style={{ marginBottom: "4px", fontSize: "13px" }}
                          >
                            <span
                              style={{ fontWeight: "600", color: "#374151" }}
                            >
                              수신자:
                            </span>{" "}
                            <span style={{ color: "#1f2937" }}>
                              {item.details.sentTo}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      담당자: {item.user}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            닫기
          </button>
        </div>
      </div>

      {/* 견적서 조회 모달 */}
      <QuotationViewModal
        isOpen={isQuotationViewOpen}
        onClose={handleQuotationViewClose}
        quotationId={selectedQuotationId || ""}
        version={selectedQuotationVersion}
      />
    </div>
  );
}
