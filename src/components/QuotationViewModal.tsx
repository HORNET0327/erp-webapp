"use client";

import { useState, useEffect } from "react";

interface QuotationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationId: string;
  version?: number;
}

export default function QuotationViewModal({
  isOpen,
  onClose,
  quotationId,
  version,
}: QuotationViewModalProps) {
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 한자 숫자 변환 함수
  const convertToChineseNumerals = (num: number): string => {
    // 입력값 검증
    if (typeof num !== "number" || isNaN(num) || !isFinite(num)) {
      return "零원整";
    }

    const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

    // 정수로 변환 (소수점 제거)
    const intNum = Math.floor(Math.abs(num));

    if (intNum === 0) return "零원整";

    // 만 단위로 나누어 처리
    const man = Math.floor(intNum / 10000); // 만 단위
    const remainder = intNum % 10000; // 나머지

    let result = "";

    // 만 단위 처리
    if (man > 0) {
      result += convertThousands(man) + "万";
    }

    // 나머지 처리
    if (remainder > 0) {
      if (man > 0 && remainder < 1000) {
        result += "零";
      }
      result += convertThousands(remainder);
    }

    return result + "원整";

    // 천 단위까지 변환하는 헬퍼 함수
    function convertThousands(n: number): string {
      if (n === 0) return "";

      let result = "";
      const thousands = Math.floor(n / 1000);
      const hundreds = Math.floor((n % 1000) / 100);
      const tens = Math.floor((n % 100) / 10);
      const ones = n % 10;

      if (thousands > 0) {
        result += digits[thousands] + "千";
      }
      if (hundreds > 0) {
        if (thousands > 0 && hundreds < 1) result += "零";
        result += digits[hundreds] + "百";
      } else if (thousands > 0 && (tens > 0 || ones > 0)) {
        result += "零";
      }
      if (tens > 0) {
        if (tens === 1) {
          result += "十";
        } else {
          result += digits[tens] + "十";
        }
      } else if ((thousands > 0 || hundreds > 0) && ones > 0) {
        result += "零";
      }
      if (ones > 0) {
        result += digits[ones];
      }

      return result;
    }
  };

  useEffect(() => {
    if (isOpen && quotationId) {
      fetchQuotation();
    }
  }, [isOpen, quotationId, version]);

  const fetchQuotation = async () => {
    setLoading(true);

    console.log("QuotationViewModal - fetchQuotation 호출:", {
      quotationId,
      version,
      versionType: typeof version,
    });

    try {
      const url = version
        ? `/api/quotations/${quotationId}?version=${version}`
        : `/api/quotations/${quotationId}`;

      console.log("QuotationViewModal - 요청 URL:", url);

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log("QuotationViewModal - Fetched quotation data:", {
          quotationId,
          version,
          orderItems: data.quotation?.orderItems,
          orderItemsLength: data.quotation?.orderItems?.length,
          subtotal: data.quotation?.subtotal,
          totalAmount: data.quotation?.totalAmount,
        });
        setQuotation(data.quotation);
      } else {
        console.error("견적서 조회 실패");
        alert("견적서를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("견적서 조회 오류:", error);
      alert("견적서 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // 인쇄 시 견적서 영역만 표시되도록 설정
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const printContent =
        document.getElementById("quotation-content")?.innerHTML;
      if (printContent) {
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
        printWindow.close();
      }
    } else {
      // 폴백: 기본 인쇄
      window.print();
    }
  };

  const handleDownloadPDF = () => {
    // PDF 다운로드 로직 (기존 QuotationModal의 PDF 다운로드 로직과 동일)
    const element = document.getElementById("quotation-content");
    if (!element) return;

    import("html2canvas").then((html2canvas) => {
      import("jspdf").then((jsPDF) => {
        html2canvas.default(element).then((canvas) => {
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

          pdf.save(`quotation-${quotation?.quotationNo || "unknown"}.pdf`);
        });
      });
    });
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
            📋 견적서 조회 - {quotation?.quotationNo || "로딩 중..."}
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

        {/* 액션 버튼들 */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={handlePrint}
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
            🖨️ 인쇄
          </button>
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            📄 PDF 다운로드
          </button>
        </div>

        {/* 견적서 내용 */}
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
          ) : quotation ? (
            <div
              id="quotation-content"
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
                  No: {quotation.quotationNo}
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
                      {quotation.customer?.name || "고객사"} 貴中
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                      참조 : {quotation.customer?.contactPerson || "담당자"}님
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                      견적명 : {quotation.quotationName || "견적 요청"}
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                      하기와 같이 견적합니다.
                    </div>
                  </div>

                  <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
                    <div style={{ marginBottom: "4px" }}>
                      작성일자 :{" "}
                      {new Date(quotation.createdAt).toLocaleDateString(
                        "ko-KR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                      납입기한 :{" "}
                      {quotation.paymentDeadline || "발주후 14일 이내"}
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                      유효기간 :{" "}
                      {quotation.validityPeriod || "견적일로부터 10일"}
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                      인도장소: {quotation.deliveryLocation || "N/A"}
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                      지불조건 :{" "}
                      {quotation.paymentTerms || "계약금 30%, 잔금 70%"}
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
                      합계{" "}
                      {convertToChineseNumerals(Number(quotation.subtotal))}
                    </div>
                    <div style={{ marginBottom: "4px" }}>
                      (₩{Number(quotation.subtotal).toLocaleString()})
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
                      <img
                        src="/images/sndlogo.png"
                        alt="Company Logo"
                        style={{
                          maxWidth: "80px",
                          maxHeight: "80px",
                          objectFit: "contain",
                        }}
                        onError={(e) => {
                          console.error(
                            "이미지 로딩 에러:",
                            "/images/sndlogo.png"
                          );
                          console.error("에러:", e);
                          e.currentTarget.style.display = "none";
                        }}
                        onLoad={() => {
                          console.log(
                            "이미지 로딩 성공:",
                            "/images/sndlogo.png"
                          );
                        }}
                      />
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
                    <div style={{ marginBottom: "4px" }}>
                      전화: 031-434-6862
                    </div>
                    <div style={{ marginBottom: "15px" }}>
                      팩스: 031-434-6866
                    </div>
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
                    {(() => {
                      console.log(
                        "QuotationViewModal - 렌더링 시 orderItems:",
                        {
                          orderItems: quotation.orderItems,
                          orderItemsType: typeof quotation.orderItems,
                          orderItemsLength: quotation.orderItems?.length,
                          quotation: quotation,
                        }
                      );
                      return null;
                    })()}
                    {quotation.orderItems && quotation.orderItems.length > 0 ? (
                      <>
                        {/* 실제 제품들 */}
                        {quotation.orderItems.map(
                          (line: any, index: number) => (
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
                                  {line.itemName || "N/A"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "10px",
                                    color: "#666666",
                                  }}
                                >
                                  {line.itemCode || ""}
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
                                {line.qty || 1}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #000000",
                                  padding: "8px 4px",
                                  textAlign: "right",
                                }}
                              >
                                ₩{(line.unitPrice || 0).toLocaleString()}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #000000",
                                  padding: "8px 4px",
                                  textAlign: "right",
                                }}
                              >
                                ₩{(line.amount || 0).toLocaleString()}
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
                          )
                        )}

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
                            {quotation.order.lines.length + 1}
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
                          {
                            length: Math.max(
                              0,
                              5 - quotation.order.lines.length
                            ),
                          },
                          (_, index) => (
                            <tr key={`empty-${index}`}>
                              <td
                                style={{
                                  border: "1px solid #000000",
                                  padding: "8px 4px",
                                  textAlign: "center",
                                }}
                              >
                                {quotation.order.lines.length + index + 2}
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
                        ₩{Number(quotation.subtotal).toLocaleString()}
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
                {/* 왼쪽 - 작성자 */}
                <div
                  style={{
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>작성자 : {quotation.author || "N/A"}</span>
                </div>

                {/* 오른쪽 - 합계 */}
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                  합계 (₩{Number(quotation.subtotal).toLocaleString()})
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
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    fontSize: "11px",
                    fontFamily: "inherit",
                  }}
                >
                  {quotation.remarks || ""}
                </div>
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
          ) : (
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
              <div style={{ fontSize: "48px" }}>📄</div>
              <div>견적서를 불러올 수 없습니다.</div>
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
    </div>
  );
}
