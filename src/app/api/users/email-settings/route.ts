import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 사용자의 이메일 설정 조회
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
    });

    const settings = {
      smtpHost: userInfo?.smtpHost || "",
      smtpPort: userInfo?.smtpPort || "587",
      smtpSecure: userInfo?.smtpSecure || "false",
      smtpUser: userInfo?.smtpUser || "",
      smtpPass: userInfo?.smtpPass || "",
      smtpFromName: userInfo?.smtpFromName || "ERP 시스템",
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return NextResponse.json(
      { error: "이메일 설정 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Email settings request body:", body);
    console.log("Body keys:", Object.keys(body));

    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFromName } =
      body;

    console.log("Extracted values:", {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass: smtpPass ? "***" : "empty",
      smtpFromName,
    });

    // 이메일 설정 업데이트
    console.log("Updating email settings for user:", user.id);

    const result = await prisma.userInfo.upsert({
      where: { userId: user.id },
      update: {
        smtpHost: smtpHost || "",
        smtpPort: smtpPort || "587",
        smtpSecure: smtpSecure || "false",
        smtpUser: smtpUser || "",
        smtpPass: smtpPass || "",
        smtpFromName: smtpFromName || "ERP 시스템",
      },
      create: {
        userId: user.id,
        smtpHost: smtpHost || "",
        smtpPort: smtpPort || "587",
        smtpSecure: smtpSecure || "false",
        smtpUser: smtpUser || "",
        smtpPass: smtpPass || "",
        smtpFromName: smtpFromName || "ERP 시스템",
      },
    });

    console.log("Email settings updated successfully:", result.id);
    return NextResponse.json({ message: "이메일 설정이 저장되었습니다." });
  } catch (error) {
    console.error("Error saving email settings:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    // Prisma 오류인 경우 더 자세한 정보 출력
    if (error && typeof error === "object" && "code" in error) {
      console.error("Prisma error code:", (error as any).code);
      console.error("Prisma error meta:", (error as any).meta);
    }

    return NextResponse.json(
      {
        error: "이메일 설정 저장 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
