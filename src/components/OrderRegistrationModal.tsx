import React, { useState, useEffect } from "react";

interface OrderRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onOrderUpdated: () => void;
}

interface OrderInfo {
  id: string;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  lines: Array<{
    itemCode: string;
    itemName: string;
    qty: number;
    unitPrice: number;
    amount: number;
    uom: string;
  }>;
}

export default function OrderRegistrationModal({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
}: OrderRegistrationModalProps) {
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [requiredDate, setRequiredDate] = useState("");
  const [orderMemo, setOrderMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      fetchOrderDetails();
    }
  }, [isOpen, order]);

  const fetchOrderDetails = async () => {
    if (!order?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // API 응답에서 order 객체 추출
        const orderData = data.success ? data.order : data;
        setOrderInfo(orderData);
        // 기존 납기일이 있으면 설정
        if (orderData.requiredDate) {
          setRequiredDate(
            new Date(orderData.requiredDate).toISOString().split("T")[0]
          );
        }
        // 기존 메모가 있으면 설정
        if (orderData.orderMemo) {
          setOrderMemo(orderData.orderMemo);
        }
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "주문 정보를 가져오는 중 오류가 발생했습니다."
        );
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("주문 정보를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          requiredDate: requiredDate || null,
          orderMemo: orderMemo || null,
        }),
      });

      if (response.ok) {
        alert("수주 등록이 완료되었습니다.");
        onOrderUpdated();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "수주 등록 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("Error registering order:", err);
      setError("수주 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
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
          maxWidth: "800px",
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
            수주 등록
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
              주문 정보를 불러오는 중...
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

        {orderInfo && (
          <form onSubmit={handleSubmit}>
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
                    {orderInfo.orderNo}
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
                    {orderInfo.customerName || orderInfo.customer?.name}
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
                    {formatDate(orderInfo.orderDate)}
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
                    {formatCurrency(orderInfo.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* 주문 품목 */}
            {orderInfo.lines && orderInfo.lines.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#111827",
                    margin: "0 0 12px 0",
                  }}
                >
                  주문 품목
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
                          수량
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
                          단가
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
                          금액
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderInfo.lines.map((line, index) => (
                        <tr
                          key={index}
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
                            {line.item?.code || line.itemCode}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              color: "#374151",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            {line.item?.name || line.itemName}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              color: "#374151",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            {line.qty.toLocaleString()}{" "}
                            {line.item?.uom || line.uom}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              color: "#374151",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            {formatCurrency(line.unitPrice)}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "right",
                              color: "#374151",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            {formatCurrency(line.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 수주 등록 정보 입력 */}
            <div style={{ marginBottom: "20px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 12px 0",
                }}
              >
                수주 등록 정보
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    납기일 *
                  </label>
                  <input
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#374151",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    메모
                  </label>
                  <textarea
                    value={orderMemo}
                    onChange={(e) => setOrderMemo(e.target.value)}
                    placeholder="수주 등록 관련 메모를 입력하세요"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#374151",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <button
                type="button"
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
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: loading ? "#d1d5db" : "#3b82f6",
                  color: loading ? "#9ca3af" : "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {loading ? "등록 중..." : "수주 등록"}
              </button>
            </div>
          </form>
        )}
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
