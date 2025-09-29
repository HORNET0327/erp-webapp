import React, { useState, useEffect } from "react";
import ShipmentDocumentViewer from "./ShipmentDocumentViewer";

interface ShipmentCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onConfirmShipment: (orderId: string) => void;
}

interface OrderInfo {
  id: string;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  requiredDate: string | null;
  status: string;
  totalAmount: number;
  notes: string | null;
}

interface ItemInfo {
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  orderedQty: number;
  currentStock: number;
  available: boolean;
  shortage: number;
  minStock: number;
  unitPrice: number;
  amount: number;
}

interface ShipmentCheckData {
  order: OrderInfo;
  items: ItemInfo[];
  canShipAll: boolean;
  totalShortage: number;
  summary: {
    totalItems: number;
    availableItems: number;
    unavailableItems: number;
  };
}

export default function ShipmentCheckModal({
  isOpen,
  onClose,
  orderId,
  onConfirmShipment,
}: ShipmentCheckModalProps) {
  const [data, setData] = useState<ShipmentCheckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingDocument, setCreatingDocument] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [shipmentData, setShipmentData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchShipmentCheck();
    }
  }, [isOpen, orderId]);

  const fetchShipmentCheck = async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/shipment-check`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "출고 확인 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("Error fetching shipment check:", err);
      setError("출고 확인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmShipment = () => {
    if (orderId) {
      onConfirmShipment(orderId);
      // onClose()는 부모 컴포넌트에서 처리
    }
  };

  const handleCreateShipmentDocument = async () => {
    if (!orderId) return;

    setCreatingDocument(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/shipment-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setShipmentData(result.shipmentData);
        setShowDocumentViewer(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "출고지시서 생성 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("Error creating shipment document:", err);
      setError("출고지시서 생성 중 오류가 발생했습니다.");
    } finally {
      setCreatingDocument(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
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
          maxWidth: "900px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#111827",
              margin: 0,
            }}
          >
            출고 가능 여부 확인
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "40px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid #f3f4f6",
                borderTop: "3px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <span style={{ marginLeft: "12px", color: "#6b7280" }}>
              출고 확인 중...
            </span>
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {data && (
          <>
            {/* 주문 정보 */}
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "16px",
                borderRadius: "6px",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 12px 0",
                }}
              >
                주문 정보
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    주문번호:
                  </span>
                  <span
                    style={{
                      marginLeft: "8px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    {data.order.orderNo}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    고객명:
                  </span>
                  <span
                    style={{
                      marginLeft: "8px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    {data.order.customerName}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    주문일:
                  </span>
                  <span
                    style={{
                      marginLeft: "8px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    {formatDate(data.order.orderDate)}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    납기일:
                  </span>
                  <span
                    style={{
                      marginLeft: "8px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    {data.order.requiredDate
                      ? formatDate(data.order.requiredDate)
                      : "미정"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    총 금액:
                  </span>
                  <span
                    style={{
                      marginLeft: "8px",
                      fontWeight: "500",
                      color: "#374151",
                    }}
                  >
                    {formatCurrency(data.order.totalAmount)}
                  </span>
                </div>
                {data.order.notes && (
                  <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                    <span style={{ color: "#6b7280", fontSize: "14px" }}>
                      메모:
                    </span>
                    <div
                      style={{
                        marginTop: "4px",
                        padding: "8px 12px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "4px",
                        fontSize: "14px",
                        color: "#374151",
                        lineHeight: "1.4",
                      }}
                    >
                      {data.order.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 출고 가능 여부 요약 */}
            <div
              style={{
                backgroundColor: data.canShipAll ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${data.canShipAll ? "#bbf7d0" : "#fecaca"}`,
                padding: "16px",
                borderRadius: "6px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: data.canShipAll ? "#22c55e" : "#ef4444",
                    marginRight: "8px",
                  }}
                />
                <span
                  style={{
                    fontWeight: "600",
                    color: data.canShipAll ? "#166534" : "#dc2626",
                  }}
                >
                  {data.canShipAll
                    ? "출고 가능"
                    : `출고 불가 (부족 수량: ${data.totalShortage}개)`}
                </span>
              </div>
              <div style={{ color: "#6b7280", fontSize: "14px" }}>
                {data.summary.availableItems}개 품목 출고 가능 / 총{" "}
                {data.summary.totalItems}개 품목
              </div>
            </div>

            {/* 품목별 재고 현황 */}
            <div style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 12px 0",
                }}
              >
                품목별 재고 현황
              </h3>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f9fafb" }}>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#374151",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        품목코드
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#374151",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        품목명
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: "#374151",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        주문수량
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: "#374151",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        현재재고
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          color: "#374151",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        출고가능
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: "#374151",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        부족수량
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, index) => (
                      <tr
                        key={item.itemId}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "#ffffff" : "#f9fafb",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            color: "#374151",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {item.itemCode}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            color: "#374151",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {item.itemName}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            color: "#374151",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {item.orderedQty.toLocaleString()} {item.uom}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            color: "#374151",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {item.currentStock.toLocaleString()} {item.uom}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "500",
                              backgroundColor: item.available
                                ? "#dcfce7"
                                : "#fef2f2",
                              color: item.available ? "#166534" : "#dc2626",
                            }}
                          >
                            {item.available ? "가능" : "불가"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            color: item.shortage > 0 ? "#dc2626" : "#374151",
                            fontWeight: item.shortage > 0 ? "500" : "normal",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {item.shortage > 0
                            ? `${item.shortage.toLocaleString()} ${item.uom}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 버튼 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <button
                onClick={handleCreateShipmentDocument}
                disabled={creatingDocument || !data.canShipAll}
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    creatingDocument || !data.canShipAll
                      ? "#d1d5db"
                      : "#10b981",
                  color:
                    creatingDocument || !data.canShipAll
                      ? "#9ca3af"
                      : "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    creatingDocument || !data.canShipAll
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {creatingDocument ? "생성 중..." : "출고지시서 생성"}
              </button>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  닫기
                </button>
                <button
                  onClick={handleConfirmShipment}
                  disabled={!data.canShipAll}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: data.canShipAll ? "#3b82f6" : "#d1d5db",
                    color: data.canShipAll ? "#ffffff" : "#9ca3af",
                    border: "none",
                    borderRadius: "6px",
                    cursor: data.canShipAll ? "pointer" : "not-allowed",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  출고지시 생성
                </button>
              </div>
            </div>
          </>
        )}

        {/* Shipment Document Viewer */}
        <ShipmentDocumentViewer
          isOpen={showDocumentViewer}
          onClose={() => setShowDocumentViewer(false)}
          shipmentData={shipmentData}
        />
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
