import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EmailService } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";

// PDF 생성 함수 - 견적서 팝업과 동일한 방식
async function generateQuotationPDF(
  order: any,
  quotationNo: string
): Promise<Buffer> {
  // 한자 숫자 변환 함수 (견적서 팝업과 동일)
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
        result = digits[digit] + units[unitIndex] + result;
        needZero = false;
      } else {
        needZero = true;
      }

      tempNum = Math.floor(tempNum / 10);
      unitIndex++;
    }

    return result + "원整";
  };

  const subtotal = Number(order.totalAmount);
  const subtotalChinese = convertToChineseNumerals(subtotal);

  // 견적서 팝업과 완전히 동일한 HTML 구조 생성
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
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
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000000;
        }
        .header-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .quotation-title {
          text-align: center;
          margin-bottom: 30px;
        }
        .quotation-title h1 {
          font-size: 28px;
          font-weight: bold;
          color: #000000;
          margin: 0;
          letter-spacing: 2px;
        }
        .main-content {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .customer-section {
          width: 45%;
        }
        .company-section {
          width: 45%;
          text-align: right;
        }
        .customer-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .quotation-details {
          font-size: 12px;
          line-height: 1.6;
        }
        .logo-section {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: #0066cc;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: bold;
          border-radius: 8px;
        }
        .company-name {
          margin-left: 20px;
          text-align: left;
        }
        .snd-text {
          font-size: 28px;
          font-weight: bold;
          color: #000000;
          letter-spacing: 8px;
          margin-bottom: 4px;
        }
        .representative {
          font-size: 12px;
          color: #000000;
          font-weight: 500;
        }
        .company-info {
          font-size: 12px;
          line-height: 1.6;
          text-align: left;
          margin-bottom: 15px;
        }
        .business-items {
          border: 1px solid #000000;
          padding: 8px;
          font-size: 10px;
          line-height: 1.4;
          text-align: left;
          margin-bottom: 15px;
        }
        .business-title {
          font-weight: bold;
          margin-bottom: 4px;
        }
        .total-section {
          text-align: left;
          margin-top: 20px;
          font-size: 14px;
          font-weight: bold;
        }
        .total-chinese {
          margin-bottom: 4px;
        }
        .total-korean {
          margin-bottom: 4px;
        }
        .vat-note {
          font-size: 12px;
          color: #666666;
        }
        .quotation-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .quotation-table th,
        .quotation-table td {
          border: 1px solid #000000;
          padding: 8px 4px;
          text-align: center;
        }
        .quotation-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .quotation-table .text-left {
          text-align: left;
        }
        .quotation-table .text-right {
          text-align: right;
        }
        .author-section {
          margin-top: 20px;
          text-align: right;
          font-size: 12px;
        }
        .remarks-section {
          margin-top: 20px;
          font-size: 12px;
        }
        .thank-you {
          margin-top: 20px;
          text-align: center;
          font-size: 14px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="quotation-content">
        {/* 견적서 헤더 */}
        <div class="header-info">
          <div style="font-size: 11px; color: #000000;">
            FAX No: 052-287-5030
          </div>
          <div style="font-size: 11px; color: #000000;">
            No: ${quotationNo}
          </div>
        </div>

        {/* 견적서 제목 */}
        <div class="quotation-title">
          <h1>견 적 서</h1>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div class="main-content">
          {/* 왼쪽 - 수신처 정보 */}
          <div class="customer-section">
            <div style="margin-bottom: 15px;">
              <div class="customer-name">
                ${order.customer.name} 貴中
              </div>
              <div class="quotation-details">
                <div style="margin-bottom: 4px;">
                  참조 : ${order.customer.contactPerson || "담당자"}님
                </div>
                <div style="margin-bottom: 4px;">
                  견적명 : 견적 요청
                </div>
                <div style="margin-bottom: 4px;">
                  하기와 같이 견적합니다.
                </div>
              </div>
            </div>

            <div class="quotation-details">
              <div style="margin-bottom: 4px;">
                작성일자 : ${new Date(order.orderDate).toLocaleDateString(
                  "ko-KR",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </div>
              <div style="margin-bottom: 4px;">
                납입기한 : 발주후 14일 이내
              </div>
              <div style="margin-bottom: 4px;">
                유효기간 : 견적일로 부터 10일
              </div>
              <div style="margin-bottom: 4px;">
                인도장소: ${order.customer.address || "고객사"}
              </div>
              <div style="margin-bottom: 4px;">
                지불조건 : 계약금 30%, 잔금 70%
              </div>
            </div>

            {/* 금액 합계 - 좌측 하단 */}
            <div class="total-section">
              <div class="total-chinese">
                합계${subtotalChinese}
              </div>
              <div class="total-korean">
                (₩${subtotal.toLocaleString()})
              </div>
              <div class="vat-note">
                * V.A.T 별도
              </div>
            </div>
          </div>

          {/* 오른쪽 - 발신처 정보 */}
          <div class="company-section">
            {/* 로고와 S N D 텍스트 */}
            <div class="logo-section">
              <div class="logo">SND</div>
              <div class="company-name">
                <div class="snd-text">S N D</div>
                <div class="representative">대표 김미숙 외 1</div>
              </div>
            </div>

            {/* 회사 정보 */}
            <div class="company-info">
              <div style="margin-bottom: 4px;">
                주소: 경기도 안산시 단원구 성곡로 176
              </div>
              <div style="margin-bottom: 4px;">
                (성곡동, 타원TAKRA 623호)
              </div>
              <div style="margin-bottom: 4px;">전화: 031-434-6862</div>
              <div style="margin-bottom: 15px;">팩스: 031-434-6866</div>
            </div>

            {/* 영업품목 */}
            <div class="business-items">
              <div class="business-title">▶ 영업품목◀</div>
              <div style="margin-bottom: 2px;">
                Sensor(근접, 포토, 레이저, 초음파, 엔코더, RF-ID, 리니어센서),
              </div>
              <div style="margin-bottom: 2px;">
                비젼시스템(비젼센서 및 시스템)
              </div>
              <div style="margin-bottom: 2px;">
                PLC, 인버터, 레벨센서, 바코드시스템
              </div>
              <div>본질안전 방폭모듈, 방폭PC, 방폭퍼지시스템</div>
            </div>
          </div>
        </div>

        {/* 견적 항목 테이블 - 견적서 팝업과 동일한 구조 */}
        <div style="border: 1px solid #000000; margin-bottom: 20px;">
          <table class="quotation-table">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="width: 8%;">No</th>
                <th style="width: 35%;">품명 및 규격</th>
                <th style="width: 8%;">단위</th>
                <th style="width: 8%;">수량</th>
                <th style="width: 12%;">단가</th>
                <th style="width: 12%;">금액</th>
                <th style="width: 17%;">비고</th>
              </tr>
            </thead>
            <tbody>
              ${order.lines
                .map(
                  (line: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td class="text-left">
                    <div style="font-weight: 500;">${line.item.name}</div>
                    <div style="font-size: 10px; color: #666666;">${
                      line.item.code || ""
                    }</div>
                  </td>
                  <td>EA</td>
                  <td>${Number(line.qty).toLocaleString()}</td>
                  <td class="text-right">₩${Number(
                    line.unitPrice
                  ).toLocaleString()}</td>
                  <td class="text-right">₩${(
                    Number(line.qty) * Number(line.unitPrice)
                  ).toLocaleString()}</td>
                  <td>재고유</td>
                </tr>
              `
                )
                .join("")}
              ${Array.from(
                { length: Math.max(0, 5 - order.lines.length) },
                (_, i) => `
                <tr>
                  <td>${order.lines.length + i + 2}</td>
                  <td class="text-left">
                    <div style="height: 20px;"></div>
                  </td>
                  <td></td>
                  <td></td>
                  <td class="text-right"></td>
                  <td class="text-right"></td>
                  <td></td>
                </tr>
              `
              ).join("")}
              <tr>
                <td style="font-weight: bold;">${order.lines.length + 1}</td>
                <td style="text-align: center; font-weight: 900; font-size: 14px;">
                  ******** 이하 여백 ********
                </td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 합계 - 우측 정렬 */}
        <div style="text-align: right; margin-bottom: 20px; font-size: 14px; font-weight: bold;">
          합계 ₩${subtotal.toLocaleString()}
        </div>

        {/* 작성자 */}
        <div class="author-section">
          작성자: ${order.salesperson?.name || "오현석"}
        </div>

        {/* 비고사항 */}
        <div class="remarks-section">
          <div style="margin-bottom: 8px; font-weight: bold;">비고사항</div>
          <div style="border: 1px solid #ccc; padding: 8px; min-height: 60px; background: #f9f9f9;">
            <!-- 비고사항 내용이 여기에 들어갑니다 -->
          </div>
        </div>

        {/* 감사합니다 */}
        <div class="thank-you">
          감사합니다.
        </div>
      </div>
    </body>
    </html>
  `;

  // Puppeteer로 PDF 생성 (견적서 팝업과 동일한 방식)
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, to, subject, message } = body;

    if (!orderId || !to) {
      return NextResponse.json(
        { error: "주문 ID와 이메일 주소가 필요합니다." },
        { status: 400 }
      );
    }

    // 주문 정보 가져오기
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        lines: {
          include: {
            item: true,
          },
        },
        salesperson: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 견적서 번호 생성
    const quotationNo = `Q${new Date().getFullYear()}${String(
      new Date().getMonth() + 1
    ).padStart(2, "0")}${String(new Date().getDate()).padStart(
      2,
      "0"
    )}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;

    // 사용자의 이메일 설정 가져오기
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
    });

    const emailService = new EmailService({
      smtpHost: userInfo?.smtpHost,
      smtpPort: userInfo?.smtpPort,
      smtpSecure: userInfo?.smtpSecure,
      smtpUser: userInfo?.smtpUser,
      smtpPass: userInfo?.smtpPass,
      smtpFromName: userInfo?.smtpFromName,
    });

    // 이메일 설정 확인
    if (!userInfo?.smtpUser || !userInfo?.smtpPass) {
      return NextResponse.json(
        {
          message: "이메일 설정이 완료되지 않았습니다.",
          quotationNo,
          warning: "개인설정 > 이메일 설정에서 SMTP 정보를 입력해주세요.",
          error: "이메일 설정이 필요합니다.",
        },
        { status: 400 }
      );
    }

    // PDF 생성
    const pdfBuffer = await generateQuotationPDF(order, quotationNo);

    // 이메일 발송 (PDF 첨부)
    const success = await emailService.sendQuotationEmailWithPDF(
      to,
      order.customer.name,
      quotationNo,
      Number(order.totalAmount),
      pdfBuffer,
      subject,
      message
    );

    if (success) {
      return NextResponse.json({
        message: "견적서가 성공적으로 발송되었습니다.",
        quotationNo,
      });
    } else {
      return NextResponse.json(
        { error: "견적서 발송에 실패했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending quotation email:", error);
    return NextResponse.json(
      { error: "견적서 발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
