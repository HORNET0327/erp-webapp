const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function main() {
  console.log("OHS 사용자 샘플 데이터 생성 중...");

  try {
    // OHS 사용자 찾기
    const ohsUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: "OHS" }, { email: "OHS@SND.com" }],
      },
      include: { userInfo: true },
    });

    if (!ohsUser) {
      console.log("OHS 사용자를 찾을 수 없습니다. 먼저 사용자를 생성해주세요.");
      return;
    }

    console.log("OHS 사용자 발견:", ohsUser.username);

    // 기존 샘플 데이터 삭제 (OHS 사용자 관련)
    await prisma.salesOrderLine.deleteMany({
      where: {
        salesOrder: {
          salespersonId: ohsUser.id,
        },
      },
    });

    await prisma.salesOrder.deleteMany({
      where: {
        salespersonId: ohsUser.id,
      },
    });

    await prisma.purchaseOrderLine.deleteMany({
      where: {
        purchaseOrder: {
          buyerId: ohsUser.id,
        },
      },
    });

    await prisma.purchaseOrder.deleteMany({
      where: {
        buyerId: ohsUser.id,
      },
    });

    // 고객 데이터 생성
    const customers = await Promise.all([
      prisma.customer.upsert({
        where: { code: "CUST001" },
        update: {},
        create: {
          code: "CUST001",
          name: "삼성전자",
          contactPerson: "김철수",
          email: "kim.cs@samsung.com",
          phone: "02-1234-5678",
          address: "서울시 강남구 테헤란로 123",
          isActive: true,
        },
      }),
      prisma.customer.upsert({
        where: { code: "CUST002" },
        update: {},
        create: {
          code: "CUST002",
          name: "LG전자",
          contactPerson: "이영희",
          email: "lee.yh@lge.com",
          phone: "02-2345-6789",
          address: "서울시 영등포구 여의대로 456",
          isActive: true,
        },
      }),
      prisma.customer.upsert({
        where: { code: "CUST003" },
        update: {},
        create: {
          code: "CUST003",
          name: "현대자동차",
          contactPerson: "박민수",
          email: "park.ms@hyundai.com",
          phone: "02-3456-7890",
          address: "서울시 서초구 서초대로 789",
          isActive: true,
        },
      }),
    ]);

    // 공급업체 데이터 생성
    const vendors = await Promise.all([
      prisma.vendor.upsert({
        where: { code: "VEND001" },
        update: {},
        create: {
          code: "VEND001",
          name: "P&F Korea",
          contactPerson: "John Smith",
          email: "john.smith@pf-korea.com",
          phone: "02-1111-2222",
          address: "서울시 중구 명동 111",
          isActive: true,
        },
      }),
      prisma.vendor.upsert({
        where: { code: "VEND002" },
        update: {},
        create: {
          code: "VEND002",
          name: "WAGO Korea",
          contactPerson: "김영수",
          email: "kim.ys@wago-korea.com",
          phone: "02-3333-4444",
          address: "서울시 강서구 공항대로 222",
          isActive: true,
        },
      }),
      prisma.vendor.upsert({
        where: { code: "VEND003" },
        update: {},
        create: {
          code: "VEND003",
          name: "MURR Korea",
          contactPerson: "이정호",
          email: "lee.jh@murr-korea.com",
          phone: "02-5555-6666",
          address: "서울시 송파구 올림픽로 333",
          isActive: true,
        },
      }),
    ]);

    // 기존 아이템들 가져오기
    const items = await prisma.item.findMany({
      include: { brand: true, category: true },
    });

    if (items.length === 0) {
      console.log("아이템이 없습니다. 먼저 인벤토리 시드를 실행해주세요.");
      return;
    }

    // OHS 사용자의 판매 주문 생성 (최근 6개월)
    const salesOrders = [];
    const currentDate = new Date();

    for (let i = 0; i < 15; i++) {
      const orderDate = new Date(currentDate);
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 180)); // 최근 6개월

      const customer = customers[Math.floor(Math.random() * customers.length)];
      const status = Math.random() > 0.2 ? "COMPLETED" : "PENDING"; // 80% 완료, 20% 대기

      const salesOrder = await prisma.salesOrder.create({
        data: {
          orderNo: `SO-${String(Date.now() + i).slice(-8)}`,
          customerId: customer.id,
          salespersonId: ohsUser.id,
          orderDate: orderDate,
          requiredDate: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7일 후
          status: status,
          totalAmount: 0, // 나중에 계산
          notes: `OHS가 처리한 주문 #${i + 1}`,
        },
      });

      // 판매 주문 라인 생성 (1-3개 아이템)
      const lineCount = Math.floor(Math.random() * 3) + 1;
      let orderTotal = 0;

      for (let j = 0; j < lineCount; j++) {
        const item = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 10) + 1;
        const unitPrice = Math.floor(Math.random() * 50000) + 10000; // 10,000 ~ 60,000원
        const lineTotal = quantity * unitPrice;
        orderTotal += lineTotal;

        await prisma.salesOrderLine.create({
          data: {
            salesOrderId: salesOrder.id,
            itemId: item.id,
            qty: quantity,
            unitPrice: unitPrice,
            amount: lineTotal,
          },
        });
      }

      // 주문 총액 업데이트
      await prisma.salesOrder.update({
        where: { id: salesOrder.id },
        data: { totalAmount: orderTotal },
      });

      salesOrders.push(salesOrder);
    }

    // OHS 사용자의 구매 주문 생성 (최근 6개월)
    const purchaseOrders = [];

    for (let i = 0; i < 12; i++) {
      const orderDate = new Date(currentDate);
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 180)); // 최근 6개월

      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const status = Math.random() > 0.3 ? "COMPLETED" : "PENDING"; // 70% 완료, 30% 대기

      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNo: `PO-${String(Date.now() + i + 1000).slice(-8)}`,
          vendorId: vendor.id,
          buyerId: ohsUser.id,
          orderDate: orderDate,
          requiredDate: new Date(
            orderDate.getTime() + 14 * 24 * 60 * 60 * 1000
          ), // 14일 후
          status: status,
          totalAmount: 0, // 나중에 계산
          notes: `OHS가 처리한 구매주문 #${i + 1}`,
        },
      });

      // 구매 주문 라인 생성 (1-4개 아이템)
      const lineCount = Math.floor(Math.random() * 4) + 1;
      let orderTotal = 0;

      for (let j = 0; j < lineCount; j++) {
        const item = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 20) + 5; // 5-25개
        const unitCost = Math.floor(Math.random() * 30000) + 5000; // 5,000 ~ 35,000원
        const lineTotal = quantity * unitCost;
        orderTotal += lineTotal;

        await prisma.purchaseOrderLine.create({
          data: {
            purchaseOrderId: purchaseOrder.id,
            itemId: item.id,
            qty: quantity,
            unitCost: unitCost,
            amount: lineTotal,
          },
        });
      }

      // 주문 총액 업데이트
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: { totalAmount: orderTotal },
      });

      purchaseOrders.push(purchaseOrder);
    }

    console.log("✅ OHS 사용자 샘플 데이터 생성 완료!");
    console.log(`- 판매 주문: ${salesOrders.length}개`);
    console.log(`- 구매 주문: ${purchaseOrders.length}개`);
    console.log(`- 고객: ${customers.length}개`);
    console.log(`- 공급업체: ${vendors.length}개`);
  } catch (error) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
