import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, settings } = body;

    if (!to || !settings) {
      return NextResponse.json(
        { error: "이메일 주소와 설정이 필요합니다." },
        { status: 400 }
      );
    }

    // 설정으로부터 transporter 생성
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort),
      secure: settings.smtpSecure === "true",
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });

    // 테스트 이메일 발송
    const mailOptions = {
      from: `"${settings.smtpFromName}" <${settings.smtpUser}>`,
      to,
      subject: "[테스트] ERP 시스템 이메일 설정 확인",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            이메일 설정 테스트
          </h2>
          <p>안녕하세요!</p>
          <p>ERP 시스템의 이메일 설정이 정상적으로 작동합니다.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">설정 정보</h3>
            <p><strong>SMTP 호스트:</strong> ${settings.smtpHost}</p>
            <p><strong>SMTP 포트:</strong> ${settings.smtpPort}</p>
            <p><strong>보안 연결:</strong> ${
              settings.smtpSecure === "true" ? "SSL" : "TLS"
            }</p>
            <p><strong>발신자:</strong> ${settings.smtpFromName}</p>
            <p><strong>테스트 시간:</strong> ${new Date().toLocaleString(
              "ko-KR"
            )}</p>
          </div>
          
          <p>이제 ERP 시스템에서 견적서, 주문서 등의 이메일을 정상적으로 발송할 수 있습니다.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              <strong>ERP 시스템</strong><br>
              이메일 설정 테스트 완료
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message: "테스트 이메일이 성공적으로 발송되었습니다.",
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      {
        error:
          "테스트 이메일 발송 중 오류가 발생했습니다: " +
          (error as Error).message,
      },
      { status: 500 }
    );
  }
}
