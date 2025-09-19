"use client";

import { useState, useEffect } from "react";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  type: "sales" | "purchase";
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  type,
}: OrderDetailModalProps) {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      fetchOrderDetails();
    }
  }, [isOpen, order]);

  const fetchOrderDetails = async () => {
    if (!order) return;

    setLoading(true);
    try {
      // 주문 상세 정보를 가져오는 API 호출
      const response = await fetch(`/api/orders/${order.id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Order details API response:", data);
        if (data.success && data.order) {
          setOrderDetails(data.order);
        } else {
          setOrderDetails(data);
        }
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      // API가 없으면 현재 order 정보 사용
      setOrderDetails(order);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const orderData = orderDetails || order;

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
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "90vh",
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
            {type === "sales" ? "판매주문" : "구매주문"} 상세보기
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

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "16px", color: "#6b7280" }}>로딩 중...</div>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* 기본 정보 */}
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#000000",
                  marginBottom: "12px",
                }}
              >
                기본 정보
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  padding: "16px",
                  background: "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    주문번호
                  </label>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#000000",
                      marginTop: "4px",
                    }}
                  >
                    {orderData.orderNo}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    주문일
                  </label>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#000000",
                      marginTop: "4px",
                    }}
                  >
                    {orderData.orderDate
                      ? new Date(orderData.orderDate).toLocaleDateString(
                          "ko-KR"
                        )
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {type === "sales" ? "고객" : "공급업체"}
                  </label>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#000000",
                      marginTop: "4px",
                    }}
                  >
                    {orderData.customer?.name ||
                      orderData.vendor?.name ||
                      "N/A"}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    상태
                  </label>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#000000",
                      marginTop: "4px",
                    }}
                  >
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        background:
                          orderData.status === "pending"
                            ? "#fef3c7"
                            : orderData.status === "in_progress"
                            ? "#dbeafe"
                            : "#d1fae5",
                        color:
                          orderData.status === "pending"
                            ? "#92400e"
                            : orderData.status === "in_progress"
                            ? "#1e40af"
                            : "#065f46",
                      }}
                    >
                      {orderData.status === "pending"
                        ? "대기"
                        : orderData.status === "in_progress"
                        ? "진행중"
                        : "완료"}
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    총 금액
                  </label>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#000000",
                      marginTop: "4px",
                    }}
                  >
                    ₩{orderData.totalAmount?.toLocaleString() || "0"}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    담당자
                  </label>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#000000",
                      marginTop: "4px",
                    }}
                  >
                    {orderData.salesperson?.username ||
                      orderData.buyer?.username ||
                      "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* 주문 항목 */}
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#000000",
                  marginBottom: "12px",
                }}
              >
                주문 항목
              </h3>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#000000",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        품목
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#000000",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        수량
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#000000",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        단가
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#000000",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        합계
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.lines && orderData.lines.length > 0 ? (
                      orderData.lines.map((line: any, index: number) => (
                        <tr
                          key={index}
                          style={{
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "14px",
                              color: "#000000",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: "500" }}>
                                {line.item?.name || "N/A"}
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#6b7280",
                                  marginTop: "2px",
                                }}
                              >
                                {line.item?.code || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              textAlign: "center",
                              fontSize: "14px",
                              color: "#000000",
                            }}
                          >
                            {line.qty}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              textAlign: "right",
                              fontSize: "14px",
                              color: "#000000",
                            }}
                          >
                            ₩{line.unitPrice?.toLocaleString() || "0"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              textAlign: "right",
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#000000",
                            }}
                          >
                            ₩{line.amount?.toLocaleString() || "0"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            padding: "40px 16px",
                            textAlign: "center",
                            fontSize: "14px",
                            color: "#6b7280",
                          }}
                        >
                          주문 항목이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 비고 */}
            {orderData.notes && (
              <div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#000000",
                    marginBottom: "12px",
                  }}
                >
                  비고
                </h3>
                <div
                  style={{
                    padding: "16px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#000000",
                    lineHeight: "1.5",
                  }}
                >
                  {orderData.notes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "#6b7280",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
