"use client";

import { useState, useEffect } from "react";
import ShipmentDocumentViewer from "./ShipmentDocumentViewer";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  type: "sales" | "purchase";
  onOrderUpdated?: () => void;
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  type,
  onOrderUpdated,
}: OrderDetailModalProps) {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [remarks, setRemarks] = useState("");
  const [showShipmentDocument, setShowShipmentDocument] = useState(false);
  const [shipmentData, setShipmentData] = useState<any>(null);
  const [loadingShipment, setLoadingShipment] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      fetchOrderDetails();
      fetchItems();
      // 모달이 열릴 때마다 편집 상태 초기화
      setIsEditing(false);
    }
  }, [isOpen, order]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-item-dropdown]")) {
        if (editedData && editedData.lines) {
          const newLines = editedData.lines.map((line: any) => ({
            ...line,
            showDropdown: false,
          }));
          setEditedData({ ...editedData, lines: newLines });
        }
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isEditing, editedData]);

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
          setEditedData(data.order);
          setRemarks(data.order.notes || "");
        } else {
          setOrderDetails(data);
          setEditedData(data);
          setRemarks(data.notes || "");
        }
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      // API가 없으면 현재 order 정보 사용
      setOrderDetails(order);
      setEditedData(order);
    } finally {
      setLoading(false);
    }
  };

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

  const handleEdit = () => {
    // 기존 주문 항목들에 itemSearch 속성 추가
    if (editedData && editedData.lines) {
      const updatedLines = editedData.lines.map((line: any) => ({
        ...line,
        itemSearch: line.item?.name
          ? `${line.item.name} (${line.item.code || ""})`
          : "",
        showDropdown: false,
      }));
      setEditedData({ ...editedData, lines: updatedLines });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(orderDetails);
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditedData(null);
    onClose();
  };

  const handleViewShipmentDocument = async () => {
    if (!order?.id) return;

    setLoadingShipment(true);
    try {
      const response = await fetch(
        `/api/orders/${order.id}/shipment-document`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const result = await response.json();
        setShipmentData(result.shipmentData);
        setShowShipmentDocument(true);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "출고지시서를 불러올 수 없습니다.");
      }
    } catch (err) {
      console.error("Error fetching shipment document:", err);
      alert("출고지시서를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoadingShipment(false);
    }
  };

  const handleSave = async () => {
    if (!editedData) return;

    setSaving(true);
    try {
      // 주문 상태 및 비고 업데이트
      const orderUpdateResponse = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editedData.status,
          remarks: remarks,
        }),
      });

      if (!orderUpdateResponse.ok) {
        const errorData = await orderUpdateResponse.json();
        console.error("주문 업데이트 실패:", errorData);
        throw new Error(
          `주문 업데이트에 실패했습니다: ${
            errorData.details || orderUpdateResponse.statusText
          }`
        );
      }

      // 주문 항목 업데이트 (새로운 API 엔드포인트 필요)
      console.log(
        "Sending lines to API:",
        editedData.lines.map((line: any) => ({
          itemId: line.itemId,
          qty: line.qty,
          unitPrice: line.unitPrice,
          amount: line.amount,
          itemName: line.item?.name,
        }))
      );

      const linesResponse = await fetch(`/api/orders/${order.id}/lines`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: editedData.lines }),
      });

      if (!linesResponse.ok) {
        const errorData = await linesResponse.json();
        console.error("주문 항목 업데이트 실패:", errorData);
        throw new Error(
          `주문 항목 업데이트에 실패했습니다: ${
            errorData.details || linesResponse.statusText
          }`
        );
      }

      // 상태명 매핑 함수
      const getStatusDisplayName = (status: string): string => {
        const statusMap: { [key: string]: string } = {
          pending: "견적대기",
          confirmed: "수주확정",
          ready_to_ship: "출고대기",
          shipping: "배송중",
          shipped: "배송완료",
          payment_pending: "수금대기",
          completed: "수금완료",
          cancelled: "취소",
        };
        return statusMap[status.toLowerCase()] || status;
      };

      // 변경사항 추적
      const changes = [];

      console.log("변경사항 추적 시작:", {
        originalStatus: order.status,
        newStatus: editedData.status,
        originalLinesCount: orderDetails?.lines?.length || 0,
        newLinesCount: editedData.lines?.length || 0,
      });

      // 상태 변경 확인
      if (order.status !== editedData.status) {
        changes.push(
          `상태: ${getStatusDisplayName(order.status)} → ${getStatusDisplayName(
            editedData.status
          )}`
        );
      }

      // 주문 항목 변경 확인 (orderDetails 사용)
      if (orderDetails?.lines && editedData.lines) {
        const originalLines = orderDetails.lines.map((line) => ({
          itemName: line.item?.name || "",
          qty: line.qty,
          unitPrice: line.unitPrice,
          amount: line.amount,
        }));

        const newLines = editedData.lines.map((line) => ({
          itemName: line.item?.name || "",
          qty: line.qty,
          unitPrice: line.unitPrice,
          amount: line.amount,
        }));

        console.log("주문 항목 비교:", {
          originalLines: originalLines,
          newLines: newLines,
          isDifferent:
            JSON.stringify(originalLines) !== JSON.stringify(newLines),
        });

        if (JSON.stringify(originalLines) !== JSON.stringify(newLines)) {
          // 총 금액 변경 확인
          const originalTotal = originalLines.reduce(
            (sum, line) => sum + line.amount,
            0
          );
          const newTotal = newLines.reduce((sum, line) => sum + line.amount, 0);

          console.log("총 금액 비교:", {
            originalTotal,
            newTotal,
            isDifferent: originalTotal !== newTotal,
          });

          if (originalTotal !== newTotal) {
            changes.push(
              `총 금액: ₩${originalTotal.toLocaleString()} → ₩${newTotal.toLocaleString()}`
            );
          }

          // 주문 항목 변경사항 상세 기록
          const originalItems = originalLines.map(
            (line) =>
              `${line.item?.name || line.itemName || "알 수 없음"} (${
                line.qty
              }개 × ₩${Number(line.unitPrice).toLocaleString()})`
          );
          const newItems = newLines.map(
            (line) =>
              `${line.item?.name || line.itemName || "알 수 없음"} (${
                line.qty
              }개 × ₩${Number(line.unitPrice).toLocaleString()})`
          );

          changes.push(
            `기존 항목:\n${
              originalItems.length > 0 ? originalItems.join("\n") : "없음"
            }`
          );
          changes.push(
            `변경된 항목:\n${
              newItems.length > 0 ? newItems.join("\n") : "없음"
            }`
          );
        } else {
          console.log("주문 항목 변경 없음");
        }
      }

      // 비고 변경 확인
      const originalRemarks = orderDetails?.notes || "";
      if (originalRemarks !== remarks) {
        changes.push(
          `비고: ${originalRemarks || "없음"} → ${remarks || "없음"}`
        );
      }

      console.log("최종 변경사항:", changes);

      // 활동 로그 기록
      await fetch(`/api/orders/${order.id}/log-activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ORDER_UPDATE",
          description: `주문 정보를 수정했습니다: ${editedData.orderNo}${
            changes.length > 0 ? ` (${changes.join(", ")})` : ""
          }`,
          metadata: {
            orderNo: editedData.orderNo,
            changes: changes,
            originalStatus: order.status,
            newStatus: editedData.status,
          },
        }),
      });

      // 편집 모드 종료
      setIsEditing(false);

      // 데이터 새로고침
      console.log("저장 완료, 데이터 새로고침 시작");
      await fetchOrderDetails();

      // 부모 컴포넌트 새로고침
      onOrderUpdated?.();

      // 잠시 대기 후 다시 한 번 새로고침 (확실하게)
      setTimeout(async () => {
        console.log("지연 새로고침 실행");
        await fetchOrderDetails();
      }, 500);

      alert("주문 정보가 성공적으로 업데이트되었습니다.");
    } catch (error) {
      console.error("Error updating order:", error);
      alert("주문 정보 업데이트 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setEditedData({ ...editedData, status: newStatus });
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...editedData.lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // 합계 재계산
    if (field === "qty" || field === "unitPrice") {
      const oldAmount = newLines[index].amount;
      const qty = Number(newLines[index].qty) || 0;
      const unitPrice = Number(newLines[index].unitPrice) || 0;
      newLines[index].amount = qty * unitPrice;
      console.log("Amount calculation:", {
        qty: newLines[index].qty,
        unitPrice: newLines[index].unitPrice,
        qtyNumber: qty,
        unitPriceNumber: unitPrice,
        oldAmount,
        newAmount: newLines[index].amount,
        calculation: `${qty} * ${unitPrice} = ${qty * unitPrice}`,
      });
    }

    console.log("handleLineChange:", {
      field,
      value,
      line: newLines[index],
      allLines: newLines,
    });

    setEditedData({ ...editedData, lines: newLines });
  };

  const addLine = () => {
    const newLine = {
      itemId: "",
      qty: 1,
      unitPrice: 0,
      amount: 0,
      item: { name: "", code: "" },
      itemSearch: "",
      showDropdown: false,
    };
    setEditedData({
      ...editedData,
      lines: [...editedData.lines, newLine],
    });
  };

  const removeLine = (index: number) => {
    const newLines = editedData.lines.filter(
      (_: any, i: number) => i !== index
    );
    setEditedData({ ...editedData, lines: newLines });
  };

  const filteredItems = (searchTerm: string) => {
    if (!searchTerm) return [];
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleItemSearch = (index: number, value: string) => {
    const newLines = [...editedData.lines];
    newLines[index] = {
      ...newLines[index],
      itemSearch: value,
      showDropdown: value.length > 0,
    };
    setEditedData({ ...editedData, lines: newLines });
  };

  const selectItem = (index: number, item: any) => {
    const newLines = [...editedData.lines];
    const qty = Number(newLines[index].qty) || 0;
    const unitPrice = Number(item.basePrice) || 0;
    const amount = qty * unitPrice;

    console.log("selectItem amount calculation:", {
      itemName: item.name,
      qty: newLines[index].qty,
      unitPrice: item.basePrice,
      qtyNumber: qty,
      unitPriceNumber: unitPrice,
      amount,
      calculation: `${qty} * ${unitPrice} = ${amount}`,
    });

    newLines[index] = {
      ...newLines[index],
      itemId: item.id,
      item: item,
      itemSearch: `${item.name} (${item.code})`,
      showDropdown: false,
      unitPrice: unitPrice,
      amount: amount,
    };
    setEditedData({ ...editedData, lines: newLines });
  };

  // 저장 후 상태 변화 모니터링
  useEffect(() => {
    if (!isEditing) {
      console.log("After save (isEditing false):");
      console.log("  orderDetails.totalAmount:", orderDetails?.totalAmount);
      console.log(
        "  orderDetails.lines:",
        orderDetails?.lines?.map((line: any) => ({
          itemId: line.itemId,
          qty: line.qty,
          unitPrice: line.unitPrice,
          amount: line.amount,
        }))
      );
    }
  }, [isEditing, orderDetails]);

  if (!isOpen || !order) return null;

  const orderData = isEditing ? editedData : orderDetails || order;

  // 디버깅을 위한 로그
  console.log("OrderDetailModal render:", {
    isEditing,
    orderDetails: orderDetails?.lines?.length,
    editedData: editedData?.lines?.length,
    orderData: orderData?.lines?.length,
    order: order?.lines?.length,
  });

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
          maxWidth: "800px",
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
            {type === "sales" ? "판매주문" : "구매주문"} 상세보기
          </h2>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {!isEditing ? (
              <>
                <button
                  onClick={handleEdit}
                  style={{
                    padding: "8px 16px",
                    background: "#3b82f6",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  편집
                </button>
                {/* 출고지시 이후 상태에서만 출고지시서 확인 버튼 표시 */}
                {type === "sales" &&
                  orderDetails &&
                  [
                    "ready_to_ship",
                    "shipping",
                    "shipped",
                    "payment_pending",
                    "completed",
                  ].includes(orderDetails.status) && (
                    <button
                      onClick={handleViewShipmentDocument}
                      disabled={loadingShipment}
                      style={{
                        padding: "8px 16px",
                        background: loadingShipment ? "#9ca3af" : "#8b5cf6",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: loadingShipment ? "not-allowed" : "pointer",
                      }}
                    >
                      {loadingShipment ? "로딩 중..." : "출고지시서 보기"}
                    </button>
                  )}
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
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
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "8px 16px",
                    background: saving ? "#9ca3af" : "#10b981",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </>
            )}
            <button
              onClick={handleClose}
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
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "16px", color: "#6b7280" }}>로딩 중...</div>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* 기본 정보 */}
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#000000",
                  marginBottom: "8px",
                }}
              >
                기본 정보
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                  padding: "8px",
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
                      marginTop: "2px",
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
                      marginTop: "2px",
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
                      marginTop: "2px",
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
                      marginTop: "2px",
                    }}
                  >
                    {isEditing ? (
                      <select
                        value={orderData.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        style={{
                          padding: "6px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "14px",
                          background: "#ffffff",
                          color: "#000000",
                          minWidth: "120px",
                        }}
                      >
                        <option value="pending">견적대기</option>
                        <option value="confirmed">수주확정</option>
                        <option value="ready_to_ship">출고대기</option>
                        <option value="shipping">배송중</option>
                        <option value="shipped">배송완료</option>
                        <option value="payment_pending">수금대기</option>
                        <option value="completed">수금완료</option>
                        <option value="cancelled">취소</option>
                      </select>
                    ) : (
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                          background:
                            orderData.status === "pending"
                              ? "#fef3c7"
                              : orderData.status === "confirmed"
                              ? "#e0e7ff"
                              : orderData.status === "ready_to_ship"
                              ? "#fef3c7"
                              : orderData.status === "shipping"
                              ? "#dbeafe"
                              : orderData.status === "shipped"
                              ? "#d1fae5"
                              : orderData.status === "payment_pending"
                              ? "#fef3c7"
                              : orderData.status === "completed"
                              ? "#d1fae5"
                              : orderData.status === "cancelled"
                              ? "#fef2f2"
                              : "#f3f4f6",
                          color:
                            orderData.status === "pending"
                              ? "#92400e"
                              : orderData.status === "confirmed"
                              ? "#3730a3"
                              : orderData.status === "ready_to_ship"
                              ? "#92400e"
                              : orderData.status === "shipping"
                              ? "#1e40af"
                              : orderData.status === "shipped"
                              ? "#065f46"
                              : orderData.status === "payment_pending"
                              ? "#92400e"
                              : orderData.status === "completed"
                              ? "#065f46"
                              : orderData.status === "cancelled"
                              ? "#dc2626"
                              : "#000000",
                        }}
                      >
                        {orderData.status === "pending"
                          ? "견적대기"
                          : orderData.status === "confirmed"
                          ? "수주확정"
                          : orderData.status === "ready_to_ship"
                          ? "출고대기"
                          : orderData.status === "shipping"
                          ? "배송중"
                          : orderData.status === "shipped"
                          ? "배송완료"
                          : orderData.status === "payment_pending"
                          ? "수금대기"
                          : orderData.status === "completed"
                          ? "수금완료"
                          : orderData.status === "cancelled"
                          ? "취소"
                          : orderData.status}
                      </span>
                    )}
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
                      marginTop: "2px",
                    }}
                  >
                    ₩
                    {(() => {
                      // 편집 모드일 때는 editedData의 합계 계산
                      if (isEditing && editedData?.lines) {
                        const total = editedData.lines.reduce(
                          (sum: number, line: any) =>
                            sum + (parseFloat(line.amount) || 0),
                          0
                        );
                        console.log("Calculating total for edited data:", {
                          lines: editedData.lines.map((line: any) => ({
                            qty: line.qty,
                            unitPrice: line.unitPrice,
                            amount: line.amount,
                          })),
                          total,
                        });
                        return total.toLocaleString();
                      }

                      // 편집 모드가 아닐 때도 주문 항목의 합계를 실시간 계산
                      if (orderData?.lines && orderData.lines.length > 0) {
                        const total = orderData.lines.reduce(
                          (sum: number, line: any) =>
                            sum + (Number(line.amount) || 0),
                          0
                        );
                        console.log("Calculating total for orderData:", {
                          lines: orderData.lines.map((line: any) => ({
                            qty: Number(line.qty) || 0,
                            unitPrice: Number(line.unitPrice) || 0,
                            amount: Number(line.amount) || 0,
                          })),
                          total,
                          orderDataTotalAmount: orderData.totalAmount,
                          orderDataTotalAmountType:
                            typeof orderData.totalAmount,
                        });
                        return total.toLocaleString();
                      }

                      // 주문 항목이 없으면 서버의 totalAmount 사용 (비정상적으로 큰 값이면 0으로 표시)
                      const serverTotal = Number(orderData?.totalAmount) || 0;
                      if (serverTotal > 1000000000 || isNaN(serverTotal)) {
                        // 10억원 이상이면 비정상적인 값으로 간주
                        console.warn("Abnormal totalAmount detected:", {
                          original: orderData?.totalAmount,
                          converted: serverTotal,
                          type: typeof orderData?.totalAmount,
                        });
                        return "0";
                      }
                      return serverTotal.toLocaleString();
                    })()}
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
                      marginTop: "2px",
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
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
                  주문 항목
                </h3>
                {isEditing && (
                  <button
                    onClick={addLine}
                    style={{
                      padding: "6px 12px",
                      background: "#10b981",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    + 항목 추가
                  </button>
                )}
              </div>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "visible",
                  height: `${
                    Math.max(
                      2,
                      (editedData?.lines?.length ||
                        orderData?.lines?.length ||
                        0) + 2
                    ) *
                      50 +
                    50
                  }px`,
                  display: "flex",
                  flexDirection: "column",
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
                        재고수량
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
                        주문수량
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
                      {isEditing && (
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#000000",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            width: "80px",
                          }}
                        >
                          작업
                        </th>
                      )}
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
                            {isEditing ? (
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  value={line.itemSearch || ""}
                                  onChange={(e) =>
                                    handleItemSearch(index, e.target.value)
                                  }
                                  onFocus={() => {
                                    const newLines = [...editedData.lines];
                                    newLines[index].showDropdown = true;
                                    setEditedData({
                                      ...editedData,
                                      lines: newLines,
                                    });
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "6px 8px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                  }}
                                  placeholder="품목명 또는 코드로 검색..."
                                />
                                {line.showDropdown && line.itemSearch && (
                                  <div
                                    data-item-dropdown
                                    style={{
                                      position: "absolute",
                                      top: "100%",
                                      left: 0,
                                      right: 0,
                                      background: "#ffffff",
                                      border: "1px solid #d1d5db",
                                      borderTop: "none",
                                      borderRadius: "0 0 4px 4px",
                                      maxHeight: "200px",
                                      overflow: "auto",
                                      zIndex: 9999,
                                      boxShadow:
                                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                    }}
                                  >
                                    {filteredItems(line.itemSearch || "").map(
                                      (item, itemIndex) => (
                                        <div
                                          key={`item-${index}-${itemIndex}-${item.id}`}
                                          onClick={() =>
                                            selectItem(index, item)
                                          }
                                          style={{
                                            padding: "8px 12px",
                                            cursor: "pointer",
                                            borderBottom: "1px solid #f3f4f6",
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontWeight: "500",
                                              color: "#374151",
                                            }}
                                          >
                                            {item.name} ({item.code})
                                          </div>
                                          <div
                                            style={{
                                              fontSize: "10px",
                                              color: "#6b7280",
                                            }}
                                          >
                                            {item.brand?.name &&
                                              `브랜드: ${item.brand.name}`}
                                            {item.category?.name &&
                                              ` | 카테고리: ${item.category.name}`}
                                          </div>
                                        </div>
                                      )
                                    )}
                                    {filteredItems(line.itemSearch || "")
                                      .length === 0 && (
                                      <div
                                        style={{
                                          padding: "8px 12px",
                                          color: "#6b7280",
                                          fontSize: "12px",
                                        }}
                                      >
                                        검색 결과가 없습니다.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
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
                            )}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              textAlign: "center",
                              fontSize: "14px",
                              color: "#000000",
                            }}
                          >
                            {(() => {
                              const item = items.find(
                                (i) => i.id === line.itemId
                              );
                              return item?.currentStock || 0;
                            })()}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              textAlign: "center",
                              fontSize: "14px",
                              color: "#000000",
                            }}
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                value={line.qty}
                                onChange={(e) =>
                                  handleLineChange(
                                    index,
                                    "qty",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                style={{
                                  width: "80px",
                                  padding: "6px 8px",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                  textAlign: "center",
                                }}
                                min="1"
                              />
                            ) : (
                              line.qty
                            )}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              textAlign: "right",
                              fontSize: "14px",
                              color: "#000000",
                            }}
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                value={line.unitPrice}
                                onChange={(e) =>
                                  handleLineChange(
                                    index,
                                    "unitPrice",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                style={{
                                  width: "120px",
                                  padding: "6px 8px",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                  textAlign: "right",
                                }}
                                min="0"
                                step="0.01"
                              />
                            ) : (
                              `₩${line.unitPrice?.toLocaleString() || "0"}`
                            )}
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
                          {isEditing && (
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              <button
                                onClick={() => removeLine(index)}
                                style={{
                                  padding: "4px 8px",
                                  background: "#ef4444",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                }}
                              >
                                삭제
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={isEditing ? 5 : 4}
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
          </div>
        )}

        {/* 비고란 */}
        <div
          style={{
            marginTop: "24px",
            padding: "20px",
            background: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#000000",
            }}
          >
            비고
          </h3>
          {isEditing ? (
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="비고를 입력하세요..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "inherit",
                color: "#000000",
                resize: "vertical",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
              }}
            />
          ) : (
            <div
              style={{
                padding: "12px",
                background: "#ffffff",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
                color: "#000000",
                lineHeight: "1.5",
                minHeight: "80px",
                whiteSpace: "pre-wrap",
              }}
            >
              {remarks || "비고가 없습니다."}
            </div>
          )}
        </div>

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
            onClick={handleClose}
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

      {/* Shipment Document Viewer */}
      <ShipmentDocumentViewer
        isOpen={showShipmentDocument}
        onClose={() => setShowShipmentDocument(false)}
        shipmentData={shipmentData}
      />
    </div>
  );
}
