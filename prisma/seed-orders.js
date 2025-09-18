const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Creating sample order data...");

  try {
    // Find existing users
    const sndUser = await prisma.user.findFirst({
      where: { username: "SND" },
    });

    const ohsUser = await prisma.user.findFirst({
      where: { username: "OHS" },
    });

    if (!sndUser || !ohsUser) {
      console.log(
        "Required users not found. Please run the main seed script first."
      );
      return;
    }

    // Find or create customers
    const customer1 = await prisma.customer.upsert({
      where: { code: "CUST-001" },
      update: {},
      create: {
        code: "CUST-001",
        name: "삼성전자",
        contactPerson: "김철수",
        email: "kim.cs@samsung.com",
        phone: "02-1234-5678",
        address: "서울시 강남구 테헤란로 123",
        isActive: true,
      },
    });

    const customer2 = await prisma.customer.upsert({
      where: { code: "CUST-002" },
      update: {},
      create: {
        code: "CUST-002",
        name: "LG전자",
        contactPerson: "이영희",
        email: "lee.yh@lg.com",
        phone: "02-2345-6789",
        address: "서울시 영등포구 여의대로 456",
        isActive: true,
      },
    });

    // Find or create vendors
    const vendor1 = await prisma.vendor.upsert({
      where: { code: "VEND-001" },
      update: {},
      create: {
        code: "VEND-001",
        name: "P&F 코리아",
        contactPerson: "박민수",
        email: "park.ms@pf-korea.com",
        phone: "02-3456-7890",
        address: "서울시 마포구 홍대입구역 789",
        isActive: true,
      },
    });

    const vendor2 = await prisma.vendor.upsert({
      where: { code: "VEND-002" },
      update: {},
      create: {
        code: "VEND-002",
        name: "WAGO 한국",
        contactPerson: "정수진",
        email: "jung.sj@wago-korea.com",
        phone: "02-4567-8901",
        address: "서울시 서초구 강남대로 101",
        isActive: true,
      },
    });

    // Find items for order lines
    const items = await prisma.item.findMany({
      take: 5,
    });

    if (items.length === 0) {
      console.log("No items found. Please run inventory seed first.");
      return;
    }

    // Clear existing orders
    await prisma.salesOrderLine.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.purchaseOrderLine.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});

    // Create sample sales orders
    const salesOrders = [
      {
        orderNo: "SO-2024-001",
        customerId: customer1.id,
        salespersonId: ohsUser.id,
        orderDate: new Date("2024-01-15"),
        status: "completed",
        totalAmount: 1500000,
        notes: "정기 주문 - 센서류",
      },
      {
        orderNo: "SO-2024-002",
        customerId: customer2.id,
        salespersonId: ohsUser.id,
        orderDate: new Date("2024-01-20"),
        status: "in_progress",
        totalAmount: 2300000,
        notes: "긴급 주문 - 케이블류",
      },
      {
        orderNo: "SO-2024-003",
        customerId: customer1.id,
        salespersonId: ohsUser.id,
        orderDate: new Date("2024-01-25"),
        status: "pending",
        totalAmount: 850000,
        notes: "신규 고객 주문",
      },
    ];

    for (const orderData of salesOrders) {
      const salesOrder = await prisma.salesOrder.create({
        data: orderData,
      });

      // Create order lines
      const lineCount = Math.floor(Math.random() * 3) + 1; // 1-3 lines per order
      for (let i = 0; i < lineCount; i++) {
        const item = items[Math.floor(Math.random() * items.length)];
        const qty = Math.floor(Math.random() * 10) + 1;
        const unitPrice = Math.floor(Math.random() * 100000) + 50000;
        const amount = qty * unitPrice;

        await prisma.salesOrderLine.create({
          data: {
            salesOrderId: salesOrder.id,
            itemId: item.id,
            qty,
            unitPrice,
            amount,
          },
        });
      }
    }

    // Create sample purchase orders
    const purchaseOrders = [
      {
        poNo: "PO-2024-001",
        vendorId: vendor1.id,
        buyerId: ohsUser.id,
        orderDate: new Date("2024-01-10"),
        status: "completed",
        totalAmount: 3200000,
        notes: "P&F 센서 재고 보충",
      },
      {
        poNo: "PO-2024-002",
        vendorId: vendor2.id,
        buyerId: ohsUser.id,
        orderDate: new Date("2024-01-18"),
        status: "approved",
        totalAmount: 1800000,
        notes: "WAGO 커넥터 주문",
      },
      {
        poNo: "PO-2024-003",
        vendorId: vendor1.id,
        buyerId: ohsUser.id,
        orderDate: new Date("2024-01-22"),
        status: "pending",
        totalAmount: 950000,
        notes: "MURR 케이블 주문",
      },
    ];

    for (const orderData of purchaseOrders) {
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: orderData,
      });

      // Create order lines
      const lineCount = Math.floor(Math.random() * 3) + 1; // 1-3 lines per order
      for (let i = 0; i < lineCount; i++) {
        const item = items[Math.floor(Math.random() * items.length)];
        const qty = Math.floor(Math.random() * 20) + 5;
        const unitCost = Math.floor(Math.random() * 80000) + 30000;
        const amount = qty * unitCost;

        await prisma.purchaseOrderLine.create({
          data: {
            purchaseOrderId: purchaseOrder.id,
            itemId: item.id,
            qty,
            unitCost,
            amount,
          },
        });
      }
    }

    console.log("Sample order data created successfully!");
    console.log(
      `Created ${salesOrders.length} sales orders and ${purchaseOrders.length} purchase orders`
    );
  } catch (error) {
    console.error("Error creating sample order data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
