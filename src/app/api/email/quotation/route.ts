import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EmailService } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

// PDF 생성 함수 - 견적서 화면의 이미지를 PDF로 변환
async function generateQuotationPDFFromImage(
  imageData: string
): Promise<Buffer> {
  // Base64 이미지 데이터를 Buffer로 변환
  const base64Data = imageData.replace(/^data:image\/png;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  // jsPDF로 PDF 생성
  const pdf = new jsPDF("p", "mm", "a4");
  const imgWidth = 210; // A4 너비 (mm)
  const imgHeight = 297; // A4 높이 (mm)

  // 이미지를 PDF에 추가
  pdf.addImage(imageBuffer, "PNG", 0, 0, imgWidth, imgHeight);

  // PDF를 Buffer로 변환
  return Buffer.from(pdf.output("arraybuffer"));
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, to, subject, message, quotationImageData } = body;

    if (!orderId || !to) {
      return NextResponse.json(
        { error: "주문 ID와 이메일 주소가 필요합니다." },
        { status: 400 }
      );
    }

    if (!quotationImageData) {
      return NextResponse.json(
        { error: "견적서 이미지 데이터가 필요합니다." },
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

    // 이미지에서 PDF 생성
    const pdfBuffer = await generateQuotationPDFFromImage(quotationImageData);

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
