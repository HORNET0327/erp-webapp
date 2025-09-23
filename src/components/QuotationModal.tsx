"use client";

import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import EmailModal from "./EmailModal";

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function QuotationModal({
  isOpen,
  onClose,
  order,
}: QuotationModalProps) {
  const [quotationData, setQuotationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [author, setAuthor] = useState("차장 김제면");
  const [remarks, setRemarks] = useState("");
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("계약금 30%, 잔금 70%");
  const [quotationName, setQuotationName] = useState("견적 요청");
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [isEditingQuotationName, setIsEditingQuotationName] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(
    "/images/sndlogo.png"
  );
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  // 현재 사용자 정보 가져오기
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        console.log("API 응답 데이터:", data);
        if (data.user && data.user.name) {
          setAuthor(data.user.name);
          console.log("사용자 이름 설정됨:", data.user.name);
        } else if (data.user && data.user.username) {
          setAuthor(data.user.username);
          console.log("사용자명으로 설정됨:", data.user.username);
        } else {
          setAuthor("차장 김제면");
          console.log("사용자 정보가 없어서 기본값 사용");
        }
      } else {
        setAuthor("차장 김제면");
        console.log("API 응답 실패, 기본값 사용");
      }
    } catch (error) {
      console.error("사용자 정보 가져오기 실패:", error);
      setAuthor("차장 김제면"); // 기본값으로 폴백
    }
  };

  useEffect(() => {
    if (isOpen && order) {
      generateQuotation();
      fetchCurrentUser(); // 사용자 정보 가져오기
    } else if (!isOpen) {
      // 모달이 닫힐 때 입력값 초기화
      setAuthor("차장 김제면");
      setRemarks("");
      setDeliveryLocation("");
      setPaymentTerms("계약금 30%, 잔금 70%");
      setQuotationName("견적 요청");
      setIsEditingAuthor(false);
      setIsEditingDelivery(false);
      setIsEditingPayment(false);
      setIsEditingQuotationName(false);
    }
  }, [isOpen, order]);

  // 숫자를 한자로 변환하는 함수
  const convertToChineseNumerals = (num: number): string => {
    const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    const units = ["", "十", "百", "千", "万"];

    if (num === 0) return "零원整";
    if (num < 0) return "零원整";

    let result = "";
    let unitIndex = 0;
    let needZero = false;
    let tempNum = num;

    while (tempNum > 0) {
      const digit = tempNum % 10;

      if (digit !== 0) {
        if (needZero && result !== "") {
          result = "零" + result;
        }
        if (unitIndex === 0) {
          result = digits[digit] + result;
        } else {
          result = digits[digit] + units[unitIndex] + result;
        }
        needZero = false;
      } else if (unitIndex === 4) {
        // 万 단위
        if (needZero && result !== "") {
          result = "零" + result;
        }
        result = units[unitIndex] + result;
        needZero = false;
      } else if (result !== "") {
        needZero = true;
      }

      tempNum = Math.floor(tempNum / 10);
      unitIndex++;
    }

    return result + "원整";
  };

  const generateQuotation = async () => {
    if (!order) return;

    setLoading(true);
    try {
      // 주문 상세 정보 가져오기
      const response = await fetch(`/api/orders/${order.id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("주문 상세 정보를 가져올 수 없습니다.");
      }

      const data = await response.json();
      const detailedOrder = data.order;

      console.log("Detailed order data:", detailedOrder);

      // 견적서 데이터 생성
      const subtotal = detailedOrder.totalAmount || 0;
      const quotation = {
        quotationNo: `20250919-${String(
          Math.floor(Math.random() * 9999) + 1
        ).padStart(4, "0")}`,
        orderNo: detailedOrder.orderNo,
        customer: detailedOrder.customer,
        orderDate: detailedOrder.orderDate,
        validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 10일 후
        items: detailedOrder.lines || [],
        subtotal: subtotal,
        subtotalChinese: convertToChineseNumerals(subtotal),
        taxRate: 10, // 10% 부가세
        taxAmount: subtotal * 0.1,
        totalAmount: subtotal * 1.1,
        notes: detailedOrder.notes || "",
        terms: [
          "견적 유효기간: 견적일로부터 10일",
          "결제조건: 계약금 30%, 잔금 70%",
          "납기: 주문확정 후 2주 이내",
          "배송: 고객 부담",
          "품질보증: 납품일로부터 1년",
        ],
      };

      console.log("Generated quotation data:", quotation);
      setQuotationData(quotation);

      // 고객 주소를 인도장소로 설정
      if (detailedOrder.customer?.address) {
        setDeliveryLocation(detailedOrder.customer.address);
      } else {
        setDeliveryLocation("고객사 지정 장소");
      }
    } catch (error) {
      console.error("Error generating quotation:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      alert("견적서 생성 중 오류가 발생했습니다: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // 인쇄 시 견적서 영역만 표시되도록 설정
    const printWindow = window.open("", "_blank");
    if (printWindow && pdfRef.current) {
      const printContent = pdfRef.current.innerHTML;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>견적서</title>
            <style>
              @page {
                size: A4;
                margin: 0;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: Arial, sans-serif;
                background: white;
                color: #000000;
              }
              .quotation-content {
                width: 210mm;
                min-height: 297mm;
                background: #ffffff;
                padding: 20mm;
                font-size: 12px;
                line-height: 1.4;
                margin: 0 auto;
                position: relative;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                .quotation-content {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  margin: 0;
                  padding: 20mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="quotation-content">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // 약간의 지연 후 인쇄 (렌더링 완료 대기)
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 100);
    } else {
      // 폴백: 기본 인쇄
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current || !quotationData) return;

    try {
      setLoading(true);

      // HTML을 캔버스로 변환
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2, // 고해상도
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      // PDF 생성
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 너비 (mm)
      const pageHeight = 295; // A4 높이 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // 첫 페이지 추가
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 추가 페이지가 필요한 경우
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // PDF 다운로드
      const fileName = `견적서_${quotationData.quotationNo}_${
        quotationData.customer?.name || "고객"
      }.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF 생성 중 오류:", error);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

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
      onClick={isEmailModalOpen ? undefined : onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "900px",
          width: "95%",
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
            견적서
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handlePrint}
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
              인쇄
            </button>
            <button
              onClick={() => setIsEmailModalOpen(true)}
              disabled={loading}
              style={{
                padding: "8px 16px",
                background: loading ? "#6b7280" : "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              견적서 보내기
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              style={{
                padding: "8px 16px",
                background: loading ? "#6b7280" : "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "PDF 생성 중..." : "PDF 다운로드"}
            </button>
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
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "16px", color: "#6b7280" }}>
              견적서 생성 중...
            </div>
          </div>
        ) : quotationData ? (
          <div
            ref={pdfRef}
            className="quotation-content"
            style={{
              width: "210mm",
              minHeight: "297mm",
              background: "#ffffff",
              padding: "20mm",
              fontFamily: "Arial, sans-serif",
              fontSize: "12px",
              lineHeight: "1.4",
              color: "#000000",
            }}
          >
            {/* 견적서 헤더 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}
            >
              {/* 왼쪽 상단 - FAX 번호 */}
              <div style={{ fontSize: "11px", color: "#000000" }}>
                FAX No: 052-287-5030
              </div>

              {/* 오른쪽 상단 - 견적번호 */}
              <div style={{ fontSize: "11px", color: "#000000" }}>
                No: {quotationData.quotationNo}
              </div>
            </div>

            {/* 견적서 제목 */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "30px",
              }}
            >
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#000000",
                  margin: "0",
                  letterSpacing: "2px",
                }}
              >
                견 적 서
              </h1>
            </div>

            {/* 메인 컨텐츠 영역 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "30px",
              }}
            >
              {/* 왼쪽 - 수신처 정보 */}
              <div style={{ width: "45%" }}>
                <div style={{ marginBottom: "15px" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {quotationData.customer?.name || "고객사"} 貴中
                  </div>
                  <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                    참조 : {quotationData.customer?.contactPerson || "담당자"}님
                  </div>
                  <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                    견적명 :
                    {isEditingQuotationName ? (
                      <input
                        type="text"
                        value={quotationName}
                        onChange={(e) => setQuotationName(e.target.value)}
                        onBlur={() => setIsEditingQuotationName(false)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            setIsEditingQuotationName(false);
                          }
                        }}
                        autoFocus
                        style={{
                          border: "1px solid #ccc",
                          padding: "2px 4px",
                          fontSize: "12px",
                          width: "120px",
                          marginLeft: "4px",
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => setIsEditingQuotationName(true)}
                        style={{
                          marginLeft: "4px",
                          cursor: "pointer",
                          color: "#000000",
                        }}
                      >
                        {quotationName}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                    하기와 같이 견적합니다.
                  </div>
                </div>

                <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
                  <div style={{ marginBottom: "4px" }}>
                    작성일자 :{" "}
                    {new Date(quotationData.orderDate).toLocaleDateString(
                      "ko-KR",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    납입기한 : 발주후 14일 이내
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    유효기간 : 견적일로 부터 10일
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    인도장소:
                    {isEditingDelivery ? (
                      <input
                        type="text"
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        onBlur={() => setIsEditingDelivery(false)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            setIsEditingDelivery(false);
                          }
                        }}
                        autoFocus
                        style={{
                          border: "1px solid #ccc",
                          padding: "2px 4px",
                          fontSize: "12px",
                          width: "150px",
                          marginLeft: "4px",
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => setIsEditingDelivery(true)}
                        style={{
                          marginLeft: "4px",
                          cursor: "pointer",
                          color: "#000000",
                        }}
                      >
                        {deliveryLocation}
                      </span>
                    )}
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    지불조건 :
                    {isEditingPayment ? (
                      <input
                        type="text"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        onBlur={() => setIsEditingPayment(false)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            setIsEditingPayment(false);
                          }
                        }}
                        autoFocus
                        style={{
                          border: "1px solid #ccc",
                          padding: "2px 4px",
                          fontSize: "12px",
                          width: "150px",
                          marginLeft: "4px",
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => setIsEditingPayment(true)}
                        style={{
                          marginLeft: "4px",
                          cursor: "pointer",
                          color: "#000000",
                        }}
                      >
                        {paymentTerms}
                      </span>
                    )}
                  </div>
                </div>

                {/* 금액 합계 - 좌측 하단으로 완전 이동 */}
                <div
                  style={{
                    textAlign: "left",
                    marginTop: "20px",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  <div style={{ marginBottom: "4px" }}>
                    합계{quotationData.subtotalChinese}
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    (₩{quotationData.subtotal.toLocaleString()})
                  </div>
                  <div style={{ fontSize: "12px", color: "#666666" }}>
                    * V.A.T 별도
                  </div>
                </div>
              </div>

              {/* 오른쪽 - 발신처 정보 */}
              <div style={{ width: "45%", textAlign: "right" }}>
                {/* 로고와 S N D 텍스트 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  {/* 로고 */}
                  <div>
                    {logoImage ? (
                      <img
                        src={logoImage}
                        alt="Company Logo"
                        style={{
                          maxWidth: "80px",
                          maxHeight: "80px",
                          objectFit: "contain",
                        }}
                        onError={(e) => {
                          console.error("이미지 로딩 에러:", logoImage);
                          console.error("에러:", e);
                          e.currentTarget.style.display = "none";
                        }}
                        onLoad={() => {
                          console.log("이미지 로딩 성공:", logoImage);
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          background: "#0066cc",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          fontWeight: "bold",
                          borderRadius: "8px",
                        }}
                      >
                        SND
                      </div>
                    )}
                  </div>

                  {/* S N D 텍스트와 대표 정보 */}
                  <div
                    style={{
                      marginLeft: "20px",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: "bold",
                        color: "#000000",
                        letterSpacing: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      S N D
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#000000",
                        fontWeight: "500",
                      }}
                    >
                      대표 김미숙 외 1
                    </div>
                  </div>
                </div>

                {/* 회사 정보 */}
                <div
                  style={{
                    fontSize: "12px",
                    lineHeight: "1.6",
                    textAlign: "left",
                  }}
                >
                  <div style={{ marginBottom: "4px" }}>
                    주소: 경기도 안산시 단원구 성곡로 176
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    (성곡동, 타원TAKRA 623호)
                  </div>
                  <div style={{ marginBottom: "4px" }}>전화: 031-434-6862</div>
                  <div style={{ marginBottom: "15px" }}>팩스: 031-434-6866</div>
                </div>

                {/* 영업품목 */}
                <div
                  style={{
                    border: "1px solid #000000",
                    padding: "8px",
                    fontSize: "10px",
                    lineHeight: "1.4",
                    textAlign: "left",
                    marginBottom: "15px",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    ▶ 영업품목◀
                  </div>
                  <div style={{ marginBottom: "2px" }}>
                    Sensor(근접, 포토, 레이저, 초음파, 엔코더, RF-ID,
                    리니어센서),
                  </div>
                  <div style={{ marginBottom: "2px" }}>
                    비젼시스템(비젼센서 및 시스템)
                  </div>
                  <div style={{ marginBottom: "2px" }}>
                    PLC, 인버터, 레벨센서, 바코드시스템
                  </div>
                  <div>본질안전 방폭모듈, 방폭PC, 방폭퍼지시스템</div>
                </div>
              </div>
            </div>

            {/* 견적 항목 테이블 */}
            <div
              style={{
                border: "1px solid #000000",
                marginBottom: "20px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "11px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "8%",
                      }}
                    >
                      No
                    </th>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "35%",
                      }}
                    >
                      품명 및 규격
                    </th>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "8%",
                      }}
                    >
                      단위
                    </th>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "8%",
                      }}
                    >
                      수량
                    </th>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "12%",
                      }}
                    >
                      단가
                    </th>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "12%",
                      }}
                    >
                      금액
                    </th>
                    <th
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "17%",
                      }}
                    >
                      비고
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quotationData.items && quotationData.items.length > 0 ? (
                    <>
                      {/* 실제 제품들 */}
                      {quotationData.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td
                            style={{
                              border: "1px solid #000000",
                              padding: "8px 4px",
                              textAlign: "center",
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000000",
                              padding: "8px 4px",
                              textAlign: "left",
                            }}
                          >
                            <div style={{ fontWeight: "500" }}>
                              {item.item?.name || "N/A"}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#666666",
                              }}
                            >
                              {item.item?.code || ""}
                            </div>
                          </td>
                          <td
                            style={{
                              border: "1px solid #000000",
                              padding: "8px 4px",
                              textAlign: "center",
                            }}
                          >
                            EA
                          </td>
                          <td
                            style={{
                              border: "1px solid #000000",
                              padding: "8px 4px",
                              textAlign: "center",
                            }}
                          >
                            {item.qty || 1}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000000",
                              padding: "8px 4px",
                              textAlign: "right",
                            }}
                          >
                            ₩
                            {(
                              item.unitPrice ||
                              item.unitCost ||
                              0
                            ).toLocaleString()}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000000",
                              padding: "8px 4px",
                              textAlign: "right",
                            }}
                          >
                            ₩{(item.amount || 0).toLocaleString()}
                          </td>
                          <td
                            style={{
                              border: "1px solid #000000",
                              padding: "8px 4px",
                              textAlign: "center",
                            }}
                          >
                            재고유
                          </td>
                        </tr>
                      ))}

                      {/* 이하 여백 문구 */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "8px 4px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {quotationData.items.length + 1}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "8px 4px",
                            textAlign: "center",
                            fontWeight: "900",
                            fontSize: "14px",
                          }}
                        >
                          ******** 이하 여백 *******
                        </td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "8px 4px",
                            textAlign: "center",
                          }}
                        ></td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "8px 4px",
                            textAlign: "center",
                          }}
                        ></td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "8px 4px",
                            textAlign: "center",
                          }}
                        ></td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "8px 4px",
                            textAlign: "center",
                          }}
                        ></td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "8px 4px",
                            textAlign: "center",
                          }}
                        ></td>
                      </tr>

                      {/* 빈 행들 (최소 5개까지) */}
                      {Array.from(
                        { length: Math.max(0, 5 - quotationData.items.length) },
                        (_, index) => (
                          <tr key={`empty-${index}`}>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "8px 4px",
                                textAlign: "center",
                              }}
                            >
                              {quotationData.items.length + index + 2}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "8px 4px",
                                textAlign: "left",
                              }}
                            >
                              <div style={{ height: "20px" }}></div>
                            </td>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "8px 4px",
                                textAlign: "center",
                              }}
                            ></td>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "8px 4px",
                                textAlign: "center",
                              }}
                            ></td>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "8px 4px",
                                textAlign: "right",
                              }}
                            ></td>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "8px 4px",
                                textAlign: "right",
                              }}
                            ></td>
                            <td
                              style={{
                                border: "1px solid #000000",
                                padding: "8px 4px",
                                textAlign: "center",
                              }}
                            ></td>
                          </tr>
                        )
                      )}
                    </>
                  ) : (
                    Array.from({ length: 5 }, (_, index) => (
                      <tr key={index}>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "8px 4px",
                            textAlign: "center",
                          }}
                        >
                          {index + 1}
                        </td>
                        <td
                          colSpan={6}
                          style={{
                            border: "1px solid #000000",
                            padding: "8px 4px",
                            textAlign: "center",
                            color: "#666666",
                          }}
                        >
                          {index === 0 ? "견적 항목이 없습니다." : ""}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* 합계 행 */}
                  <tr style={{ background: "#f0f0f0" }}>
                    <td
                      colSpan={2}
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      ******** 이 하 여 백 *******
                    </td>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                      }}
                    ></td>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                      }}
                    ></td>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                      }}
                    ></td>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      ₩{quotationData.subtotal.toLocaleString()}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "8px 4px",
                      }}
                    ></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 작성자와 합계 - 비고사항 위 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "20px",
                marginBottom: "10px",
              }}
            >
              {/* 왼쪽 - 작성자 입력 */}
              <div
                style={{
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                <span>작성자 : </span>
                {isEditingAuthor ? (
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    onBlur={() => setIsEditingAuthor(false)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        setIsEditingAuthor(false);
                      }
                    }}
                    autoFocus
                    style={{
                      border: "1px solid #ccc",
                      padding: "2px 4px",
                      fontSize: "12px",
                      width: "120px",
                      marginLeft: "4px",
                    }}
                  />
                ) : (
                  <span
                    onClick={() => setIsEditingAuthor(true)}
                    style={{
                      marginLeft: "4px",
                      cursor: "pointer",
                      color: "#000000",
                    }}
                  >
                    {author}
                  </span>
                )}
              </div>

              {/* 오른쪽 - 합계 */}
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                합계 (₩{quotationData.subtotal.toLocaleString()})
              </div>
            </div>

            {/* 비고사항 - 전체 너비 */}
            <div
              style={{
                border: "1px solid #000000",
                width: "100%",
                height: "100px",
                padding: "8px",
                fontSize: "11px",
                marginBottom: "10px",
              }}
            >
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="비고사항을 입력하세요"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: "11px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* 감사합니다 - 비고사항 아래 */}
            <div
              style={{
                textAlign: "right",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              감사합니다.
            </div>
          </div>
        ) : null}

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

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        type="quotation"
        orderId={order?.id}
        customerEmail={order?.customer?.email}
        customerName={order?.customer?.name}
      />
    </div>
  );
}
