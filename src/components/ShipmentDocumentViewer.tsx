import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ShipmentDocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentData: any;
}

export default function ShipmentDocumentViewer({
  isOpen,
  onClose,
  shipmentData,
}: ShipmentDocumentViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<any>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shipmentData) {
      setEditableData({
        ...shipmentData,
        shippingMethod: shipmentData.shippingMethod || "",
        carrier: shipmentData.carrier || "",
        paymentType: shipmentData.paymentType || "선불",
        packagingMethod: shipmentData.packagingMethod || "",
      });
    }
  }, [shipmentData]);

  if (!isOpen || !shipmentData) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const handlePrint = () => {
    if (!pdfRef.current) return;

    // 새로운 창을 열어서 인쇄용 HTML 생성
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("팝업이 차단되었습니다. 팝업을 허용해주세요.");
      return;
    }

    // 인쇄용 HTML 생성
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>출고지시서</title>
          <style>
            body {
              margin: 0;
              padding: 8mm;
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #000000;
              background: white;
            }
            .document-header {
              text-align: center;
              margin-bottom: 32px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 16px;
            }
            .document-title {
              font-size: 20px;
              font-weight: bold;
              color: #111827;
              margin: 0 0 8px 0;
            }
            .document-number {
              margin: 0;
              color: #6b7280;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-bottom: 24px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #111827;
              margin: 0 0 12px 0;
              border-bottom: 1px solid #d1d5db;
              padding-bottom: 4px;
            }
            .info-content {
              line-height: 1.6;
            }
            .info-content p {
              margin: 4px 0;
              color: #000000;
            }
            .info-content .label {
              font-weight: 500;
            }
            .shipping-info {
              margin-bottom: 24px;
            }
            .shipping-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .shipping-item label {
              display: block;
              font-size: 14px;
              font-weight: 500;
              color: #000000;
              margin-bottom: 4px;
            }
            .shipping-item p {
              margin: 4px 0;
              color: #000000;
              min-height: 20px;
            }
            .items-section {
              margin-bottom: 24px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #d1d5db;
            }
            .items-table th {
              padding: 12px;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border: 1px solid #d1d5db;
              background-color: #f9fafb;
            }
            .items-table td {
              padding: 12px;
              border: 1px solid #d1d5db;
              color: #000000;
            }
            .items-table .text-right {
              text-align: right;
            }
            .items-table tfoot td {
              background-color: #f9fafb;
              font-weight: 600;
            }
            .notes-section {
              margin-bottom: 24px;
            }
            .notes-content {
              padding: 12px;
              background-color: #f9fafb;
              border: 1px solid #d1d5db;
              border-radius: 4px;
              white-space: pre-wrap;
              color: #000000;
            }
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin-top: 32px;
              border-top: 1px solid #e5e7eb;
              padding-top: 16px;
            }
            .signature-item p {
              margin: 0 0 40px 0;
              font-weight: 500;
              color: #000000;
            }
            .signature-date {
              margin: 0;
              font-size: 12px;
              color: #000000;
            }
            @page {
              margin: 8mm;
              size: A4;
            }
            @media print {
              body {
                margin: 0;
                padding: 8mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="document-header">
            <h1 class="document-title">출고지시서</h1>
            <p class="document-number">출고지시서 번호: ${
              shipmentData.shipmentNo
            }</p>
          </div>

          <div class="info-section">
            <div>
              <h3 class="section-title">발주처 정보</h3>
              <div class="info-content">
                <p class="label">${shipmentData.customerName}</p>
                ${
                  shipmentData.customerEmail
                    ? `<p>이메일: ${shipmentData.customerEmail}</p>`
                    : ""
                }
                ${
                  shipmentData.customerPhone
                    ? `<p>전화: ${shipmentData.customerPhone}</p>`
                    : ""
                }
                ${
                  shipmentData.customerAddress
                    ? `<p>주소: ${shipmentData.customerAddress}</p>`
                    : ""
                }
              </div>
            </div>
            <div>
              <h3 class="section-title">주문 정보</h3>
              <div class="info-content">
                <p><span class="label">주문번호:</span> ${
                  shipmentData.orderNo
                }</p>
                <p><span class="label">주문일:</span> ${formatDate(
                  shipmentData.orderDate
                )}</p>
                <p><span class="label">납기일:</span> ${
                  shipmentData.requiredDate
                    ? formatDate(shipmentData.requiredDate)
                    : "미정"
                }</p>
                <p><span class="label">담당자:</span> ${
                  shipmentData.salespersonName || "미지정"
                }</p>
              </div>
            </div>
          </div>

          <div class="shipping-info">
            <h3 class="section-title">배송 정보</h3>
            <div class="shipping-grid">
              <div class="shipping-item">
                <label>배송방법</label>
                <p>${editableData?.shippingMethod || "미입력"}</p>
              </div>
              <div class="shipping-item">
                <label>운송업체</label>
                <p>${editableData?.carrier || "미입력"}</p>
              </div>
              <div class="shipping-item">
                <label>착불/선불</label>
                <p>${editableData?.paymentType || "선불"}</p>
              </div>
              <div class="shipping-item">
                <label>포장방법</label>
                <p>${editableData?.packagingMethod || "미입력"}</p>
              </div>
            </div>
          </div>

          <div class="items-section">
            <h3 class="section-title">출고 품목</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>품목코드</th>
                  <th>품목명</th>
                  <th class="text-right">수량</th>
                  <th class="text-right">단가</th>
                  <th class="text-right">금액</th>
                </tr>
              </thead>
              <tbody>
                ${shipmentData.items
                  .map(
                    (item: any) => `
                  <tr>
                    <td>${item.itemCode}</td>
                    <td>${item.itemName}</td>
                    <td class="text-right">${item.qty.toLocaleString()}${
                      item.uom ? ` ${item.uom}` : ""
                    }</td>
                    <td class="text-right">${formatCurrency(
                      item.unitPrice
                    )}</td>
                    <td class="text-right">${formatCurrency(item.amount)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="text-right">총 금액</td>
                  <td class="text-right">${formatCurrency(
                    shipmentData.totalAmount
                  )}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${
            shipmentData.notes
              ? `
            <div class="notes-section">
              <h3 class="section-title">특이사항</h3>
              <div class="notes-content">${shipmentData.notes}</div>
            </div>
          `
              : ""
          }

          <div class="signature-section">
            <div>
              <p>출고 담당자: ________________</p>
              <p class="signature-date">날짜: ${formatDate(
                new Date().toISOString()
              )}</p>
            </div>
            <div>
              <p>승인자: ________________</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();

    // 인쇄 실행
    printWindow.focus();

    // 약간의 지연 후 인쇄 (렌더링 완료 대기)
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 100);
  };

  const handleDownloadPDF = () => {
    if (!pdfRef.current) return;

    import("html2canvas").then((html2canvas) => {
      import("jspdf").then((jsPDF) => {
        html2canvas.default(pdfRef.current).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF.jsPDF("p", "mm", "a4");
          const imgWidth = 210;
          const pageHeight = 295;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;

          let position = 0;

          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          const fileName = `출고지시서_${shipmentData.shipmentNo}_${
            shipmentData.customerName || "고객"
          }.pdf`;
          pdf.save(fileName);
        });
      });
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `/api/orders/${shipmentData.orderId}/shipment-document/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shippingMethod: editableData?.shippingMethod || "",
            carrier: editableData?.carrier || "",
            paymentType: editableData?.paymentType || "선불",
            packagingMethod: editableData?.packagingMethod || "",
          }),
        }
      );

      if (response.ok) {
        setIsEditing(false);
        // 저장된 데이터로 shipmentData 업데이트
        const updatedData = {
          ...shipmentData,
          shippingMethod: editableData?.shippingMethod || "",
          carrier: editableData?.carrier || "",
          paymentType: editableData?.paymentType || "선불",
          packagingMethod: editableData?.packagingMethod || "",
        };
        // 부모 컴포넌트에 저장 완료 알림 (필요시)
        alert("배송정보가 저장되었습니다.");
      } else {
        alert("저장 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Error saving shipment document:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditableData({
      ...shipmentData,
      shippingMethod: shipmentData.shippingMethod || "",
      carrier: shipmentData.carrier || "",
      paymentType: shipmentData.paymentType || "선불",
      packagingMethod: shipmentData.packagingMethod || "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setEditableData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div
      className="shipment-document-container"
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
        className="shipment-document-content"
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
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            borderBottom: "2px solid #e5e7eb",
            paddingBottom: "16px",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#111827",
              margin: 0,
            }}
          >
            출고지시서
          </h1>
          <div style={{ display: "flex", gap: "8px" }}>
            {!isEditing ? (
              <>
                <button
                  onClick={handleEdit}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  편집
                </button>
                <button
                  onClick={handlePrint}
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
                  인쇄
                </button>
                <button
                  onClick={handleDownloadPDF}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  PDF 다운로드
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
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
                  저장
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#ef4444",
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
          </div>
        </div>

        {/* 출고지시서 내용 */}
        <div
          ref={pdfRef}
          className="shipment-document-print"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "12px",
            width: "210mm",
            minHeight: "297mm",
            background: "#ffffff",
            padding: "20mm",
            lineHeight: "1.4",
            color: "#000000",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {/* 회사 정보 */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "32px",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "16px",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#111827",
                margin: "0 0 8px 0",
              }}
            >
              출고지시서
            </h2>
            <p style={{ margin: 0, color: "#6b7280" }}>
              출고지시서 번호: {shipmentData.shipmentNo}
            </p>
          </div>

          {/* 기본 정보 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            {/* 발주처 정보 */}
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 12px 0",
                  borderBottom: "1px solid #d1d5db",
                  paddingBottom: "4px",
                }}
              >
                발주처 정보
              </h3>
              <div style={{ lineHeight: "1.6" }}>
                <p
                  style={{
                    margin: "4px 0",
                    fontWeight: "500",
                    color: "#000000",
                  }}
                >
                  {shipmentData.customerName}
                </p>
                {shipmentData.customerEmail && (
                  <p style={{ margin: "4px 0", color: "#000000" }}>
                    이메일: {shipmentData.customerEmail}
                  </p>
                )}
                {shipmentData.customerPhone && (
                  <p style={{ margin: "4px 0", color: "#000000" }}>
                    전화: {shipmentData.customerPhone}
                  </p>
                )}
                {shipmentData.customerAddress && (
                  <p style={{ margin: "4px 0", color: "#000000" }}>
                    주소: {shipmentData.customerAddress}
                  </p>
                )}
              </div>
            </div>

            {/* 주문 정보 */}
            <div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 12px 0",
                  borderBottom: "1px solid #d1d5db",
                  paddingBottom: "4px",
                }}
              >
                주문 정보
              </h3>
              <div style={{ lineHeight: "1.6" }}>
                <p style={{ margin: "4px 0" }}>
                  <span style={{ fontWeight: "500", color: "#000000" }}>
                    주문번호:
                  </span>{" "}
                  <span style={{ color: "#000000" }}>
                    {shipmentData.orderNo}
                  </span>
                </p>
                <p style={{ margin: "4px 0" }}>
                  <span style={{ fontWeight: "500", color: "#000000" }}>
                    주문일:
                  </span>{" "}
                  <span style={{ color: "#000000" }}>
                    {formatDate(shipmentData.orderDate)}
                  </span>
                </p>
                <p style={{ margin: "4px 0" }}>
                  <span style={{ fontWeight: "500", color: "#000000" }}>
                    납기일:
                  </span>{" "}
                  <span style={{ color: "#000000" }}>
                    {shipmentData.requiredDate
                      ? formatDate(shipmentData.requiredDate)
                      : "미정"}
                  </span>
                </p>
                <p style={{ margin: "4px 0" }}>
                  <span style={{ fontWeight: "500", color: "#000000" }}>
                    담당자:
                  </span>{" "}
                  <span style={{ color: "#000000" }}>
                    {shipmentData.salespersonName || "미지정"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 배송 정보 */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 12px 0",
                borderBottom: "1px solid #d1d5db",
                paddingBottom: "4px",
              }}
            >
              배송 정보
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
                  배송방법
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editableData?.shippingMethod || ""}
                    onChange={(e) =>
                      handleInputChange("shippingMethod", e.target.value)
                    }
                    placeholder="택배, 직송, 화물 등"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  />
                ) : (
                  <p
                    style={{
                      margin: "4px 0",
                      color: "#000000",
                      minHeight: "20px",
                    }}
                  >
                    {editableData?.shippingMethod || "미입력"}
                  </p>
                )}
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
                  운송업체
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editableData?.carrier || ""}
                    onChange={(e) =>
                      handleInputChange("carrier", e.target.value)
                    }
                    placeholder="CJ대한통운, 한진택배 등"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  />
                ) : (
                  <p
                    style={{
                      margin: "4px 0",
                      color: "#000000",
                      minHeight: "20px",
                    }}
                  >
                    {editableData?.carrier || "미입력"}
                  </p>
                )}
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
                  착불/선불
                </label>
                {isEditing ? (
                  <select
                    value={editableData?.paymentType || "선불"}
                    onChange={(e) =>
                      handleInputChange("paymentType", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  >
                    <option value="선불">선불</option>
                    <option value="착불">착불</option>
                  </select>
                ) : (
                  <p
                    style={{
                      margin: "4px 0",
                      color: "#000000",
                      minHeight: "20px",
                    }}
                  >
                    {editableData?.paymentType || "선불"}
                  </p>
                )}
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
                  포장방법
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editableData?.packagingMethod || ""}
                    onChange={(e) =>
                      handleInputChange("packagingMethod", e.target.value)
                    }
                    placeholder="박스포장, 완충포장 등"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#000000",
                    }}
                  />
                ) : (
                  <p
                    style={{
                      margin: "4px 0",
                      color: "#000000",
                      minHeight: "20px",
                    }}
                  >
                    {editableData?.packagingMethod || "미입력"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 출고 품목 */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 12px 0",
                borderBottom: "1px solid #d1d5db",
                paddingBottom: "4px",
              }}
            >
              출고 품목
            </h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid #d1d5db",
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
                      border: "1px solid #d1d5db",
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
                      border: "1px solid #d1d5db",
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
                      border: "1px solid #d1d5db",
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
                      border: "1px solid #d1d5db",
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
                      border: "1px solid #d1d5db",
                    }}
                  >
                    금액
                  </th>
                </tr>
              </thead>
              <tbody>
                {shipmentData.items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        color: "#000000",
                      }}
                    >
                      {item.itemCode}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        color: "#000000",
                      }}
                    >
                      {item.itemName}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        border: "1px solid #d1d5db",
                        color: "#000000",
                      }}
                    >
                      {item.qty.toLocaleString()} {item.uom}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        border: "1px solid #d1d5db",
                        color: "#000000",
                      }}
                    >
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        border: "1px solid #d1d5db",
                        color: "#000000",
                      }}
                    >
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <td
                    colSpan={4}
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: "600",
                      border: "1px solid #d1d5db",
                      color: "#000000",
                    }}
                  >
                    총 금액
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: "600",
                      border: "1px solid #d1d5db",
                      color: "#000000",
                    }}
                  >
                    {formatCurrency(shipmentData.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 메모 */}
          {shipmentData.notes && (
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 12px 0",
                  borderBottom: "1px solid #d1d5db",
                  paddingBottom: "4px",
                }}
              >
                특이사항
              </h3>
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  whiteSpace: "pre-wrap",
                  color: "#000000",
                }}
              >
                {shipmentData.notes}
              </div>
            </div>
          )}

          {/* 서명란 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginTop: "32px",
              borderTop: "1px solid #e5e7eb",
              paddingTop: "16px",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 40px 0",
                  fontWeight: "500",
                  color: "#000000",
                }}
              >
                출고 담당자: ________________
              </p>
              <p style={{ margin: "0", fontSize: "12px", color: "#000000" }}>
                날짜: {formatDate(new Date().toISOString())}
              </p>
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 40px 0",
                  fontWeight: "500",
                  color: "#000000",
                }}
              >
                승인자: ________________
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
