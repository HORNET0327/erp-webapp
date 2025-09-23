import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { EmailService } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, message, type = "info" } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

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
      return NextResponse.json({
        message: "이메일 설정이 없어 실제 발송하지 않습니다. (테스트 모드)",
        warning: "개인설정에서 이메일 설정을 완료해주세요.",
      });
    }

    const success = await emailService.sendNotificationEmail(
      to,
      subject,
      message,
      type
    );

    if (success) {
      return NextResponse.json({
        message: "이메일이 성공적으로 발송되었습니다.",
      });
    } else {
      return NextResponse.json(
        { error: "이메일 발송에 실패했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "이메일 발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
