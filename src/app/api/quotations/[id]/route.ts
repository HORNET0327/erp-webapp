import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// 견적서 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version");

    // 버전이 지정된 경우 해당 버전의 데이터를 가져오기
    if (version) {
      try {
        const quotationVersion = await prisma.quotationVersion.findFirst({
          where: {
            quotationId: id,
            version: parseInt(version),
          },
          include: {
            quotation: {
              include: {
                order: {
                  include: {
                    customer: true,
                    lines: {
                      include: {
                        item: true,
                      },
                    },
                  },
                },
                customer: true,
                authorUser: true,
              },
            },
          },
        });

        if (!quotationVersion) {
          return NextResponse.json(
            { error: "해당 버전의 견적서를 찾을 수 없습니다." },
            { status: 404 }
          );
        }

        // 디버깅 로그 추가
        console.log("=== API - DB에서 가져온 값 ===");
        console.log(
          "quotationVersion.orderItems:",
          quotationVersion.orderItems
        );
        console.log(
          "quotationVersion.orderItems type:",
          typeof quotationVersion.orderItems
        );
        console.log(
          "quotationVersion.orderItems is null:",
          quotationVersion.orderItems === null
        );
        console.log(
          "quotationVersion.orderItems is undefined:",
          quotationVersion.orderItems === undefined
        );
        console.log(
          "quotationVersion.orderItems length:",
          quotationVersion.orderItems?.length
        );
        console.log("quotationVersion keys:", Object.keys(quotationVersion));

        // JSON.parse 테스트
        if (quotationVersion.orderItems) {
          try {
            const parsed = JSON.parse(quotationVersion.orderItems);
            console.log("JSON.parse 성공:", parsed);
            console.log("JSON.parse length:", parsed.length);
          } catch (e) {
            console.log("JSON.parse 실패:", e.message);
          }
        }

        // 버전별 데이터로 견적서 객체 구성
        const quotation = {
          ...quotationVersion.quotation,
          quotationName: quotationVersion.quotationName,
          paymentDeadline: quotationVersion.paymentDeadline,
          validityPeriod: quotationVersion.validityPeriod,
          deliveryLocation: quotationVersion.deliveryLocation,
          paymentTerms: quotationVersion.paymentTerms,
          author: quotationVersion.author,
          remarks: quotationVersion.remarks,
          subtotal: quotationVersion.subtotal,
          taxAmount: quotationVersion.taxAmount,
          totalAmount: quotationVersion.totalAmount,
        };

        console.log("API - 반환할 quotation:", {
          orderItems: quotation.orderItems,
          orderItemsLength: quotation.orderItems?.length,
          quotationKeys: Object.keys(quotation),
          quotationOrderItems: quotation.orderItems,
          quotationOrderItemsType: typeof quotation.orderItems,
          quotationOrderItemsIsArray: Array.isArray(quotation.orderItems),
        });

        console.log("API - 최종 응답 전송:", {
          quotationOrderItems: quotation.orderItems,
          quotationOrderItemsLength: quotation.orderItems?.length,
          quotationOrderItemsType: typeof quotation.orderItems,
        });

        return NextResponse.json({ quotation });
      } catch (error) {
        console.error("API 에러:", error);
        return NextResponse.json(
          { error: "견적서 조회 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
    }

    // 최신 버전 조회
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            lines: {
              include: {
                item: true,
              },
            },
          },
        },
        customer: true,
        authorUser: true,
        items: {
          include: {
            item: true,
          },
        },
        versions: {
          orderBy: { version: "desc" },
        },
        emails: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "견적서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 최신 버전의 데이터가 있으면 해당 데이터로 견적서 객체 구성
    const latestVersion = quotation.versions[0];
    if (latestVersion) {
      const quotationWithVersionData = {
        ...quotation,
        quotationName: latestVersion.quotationName,
        paymentDeadline: latestVersion.paymentDeadline,
        validityPeriod: latestVersion.validityPeriod,
        deliveryLocation: latestVersion.deliveryLocation,
        paymentTerms: latestVersion.paymentTerms,
        author: latestVersion.author,
        remarks: latestVersion.remarks,
        subtotal: latestVersion.subtotal,
        taxAmount: latestVersion.taxAmount,
        totalAmount: latestVersion.totalAmount,
      };
      return NextResponse.json({ quotation: quotationWithVersionData });
    }

    // 기본 견적서 데이터 반환
    return NextResponse.json({ quotation });
  } catch (error) {
    console.error("견적서 조회 오류:", error);
    return NextResponse.json(
      { error: "견적서 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 견적서 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      quotationName,
      paymentDeadline,
      validityPeriod,
      deliveryLocation,
      paymentTerms,
      author,
      remarks,
      subtotal,
      taxRate = 10,
    } = body;

    // 기존 견적서 조회 (주문 항목 포함)
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            lines: {
              include: {
                item: true,
              },
            },
          },
        },
      },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { error: "견적서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 금액 계산
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // 주문 항목들을 QuotationItem 테이블에 저장할 데이터 준비
    const quotationItems =
      existingQuotation.order?.lines?.map((line: any) => ({
        quotationId: id,
        itemId: line.itemId,
        qty: Number(line.qty) || 0,
        unitPrice: Number(line.unitPrice) || 0,
        amount: Number(line.amount) || 0,
      })) || [];

    // 새 버전 생성
    const newVersion = existingQuotation.version + 1;

    // 견적서 버전만 업데이트 (실제 데이터는 QuotationVersion에 저장)
    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        version: newVersion,
        updatedAt: new Date(),
      },
      include: {
        order: {
          include: {
            customer: true,
            lines: {
              include: {
                item: true,
              },
            },
          },
        },
        customer: true,
        authorUser: true,
      },
    });

    // 변경사항을 버전 이력에 저장
    const changes = {
      quotationName,
      paymentDeadline,
      validityPeriod,
      deliveryLocation,
      paymentTerms,
      author,
      remarks,
      subtotal,
      taxRate,
    };

    // 이전 버전과 비교하여 실제 변경된 내용만 저장
    const previousVersion = await prisma.quotationVersion.findFirst({
      where: { quotationId: id },
      orderBy: { version: "desc" },
    });

    const actualChanges: any = {};
    if (previousVersion) {
      const previousChanges = JSON.parse(previousVersion.changes);
      Object.keys(changes).forEach((key) => {
        if (changes[key as keyof typeof changes] !== previousChanges[key]) {
          actualChanges[key] = {
            from: previousChanges[key],
            to: changes[key as keyof typeof changes],
          };
        }
      });
    } else {
      Object.keys(changes).forEach((key) => {
        actualChanges[key] = changes[key as keyof typeof changes];
      });
    }

    // 새 버전 생성 (항상 새로 생성)
    await prisma.quotationVersion.create({
      data: {
        quotationId: id,
        version: newVersion,
        status: existingQuotation.status,
        quotationName,
        paymentDeadline,
        validityPeriod,
        deliveryLocation,
        paymentTerms,
        author,
        remarks,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        changes: JSON.stringify(actualChanges),
        createdBy: user.id,
      },
    });

    // 견적서 항목들 업데이트 (기존 항목 삭제 후 새로 생성)
    await prisma.quotationItem.deleteMany({
      where: { quotationId: id },
    });

    if (quotationItems.length > 0) {
      await prisma.quotationItem.createMany({
        data: quotationItems,
      });
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error("견적서 수정 오류:", error);
    return NextResponse.json(
      { error: "견적서 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 견적서 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    // 견적서 존재 확인
    const quotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "견적서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 견적서 삭제 (관련 버전과 이메일 이력도 함께 삭제됨)
    await prisma.quotation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "견적서가 삭제되었습니다." });
  } catch (error) {
    console.error("견적서 삭제 오류:", error);
    return NextResponse.json(
      { error: "견적서 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
