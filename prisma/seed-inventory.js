const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding inventory data...");

  // Brands
  const pf = await prisma.brand.upsert({
    where: { code: "PF" },
    update: {},
    create: { code: "PF", name: "Pepperl+Fuchs", country: "Germany" },
  });

  const wago = await prisma.brand.upsert({
    where: { code: "WAGO" },
    update: {},
    create: { code: "WAGO", name: "WAGO Kontakttechnik", country: "Germany" },
  });

  const murr = await prisma.brand.upsert({
    where: { code: "MURR" },
    update: {},
    create: { code: "MURR", name: "MURR Elektronik", country: "Germany" },
  });

  // Categories
  const sensorCat = await prisma.category.upsert({
    where: { code: "SENSOR" },
    update: {},
    create: { code: "SENSOR", name: "센서" },
  });

  const cableCat = await prisma.category.upsert({
    where: { code: "CABLE" },
    update: {},
    create: { code: "CABLE", name: "케이블" },
  });

  const connectorCat = await prisma.category.upsert({
    where: { code: "CONNECTOR" },
    update: {},
    create: { code: "CONNECTOR", name: "커넥터" },
  });

  // Warehouse
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { code: "MAIN" },
    update: {},
    create: { code: "MAIN", name: "본사 창고", address: "서울시 강남구" },
  });

  // Items
  const items = [
    // P&F Proximity Sensors
    {
      code: "PF-NBN8-18GM60-E2",
      name: "P&F 근접센서 NBN8-18GM60-E2",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "NBN8-18GM60-E2",
      spec: "18mm, M18, 3선식, NPN",
      hasSerial: true,
      minStock: 10,
      leadTime: 14,
    },
    {
      code: "PF-NBB8-18GM50-E0",
      name: "P&F 근접센서 NBB8-18GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "NBB8-18GM50-E0",
      spec: "18mm, M18, 2선식, PNP",
      hasSerial: true,
      minStock: 8,
      leadTime: 14,
    },
    {
      code: "PF-NBN4-12GM50-E0",
      name: "P&F 근접센서 NBN4-12GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "NBN4-12GM50-E0",
      spec: "12mm, M12, 3선식, NPN",
      hasSerial: true,
      minStock: 15,
      leadTime: 14,
    },
    {
      code: "PF-NBB4-12GM50-E0",
      name: "P&F 근접센서 NBB4-12GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "NBB4-12GM50-E0",
      spec: "12mm, M12, 2선식, PNP",
      hasSerial: true,
      minStock: 12,
      leadTime: 14,
    },
    {
      code: "PF-NBN15-30GM50-E0",
      name: "P&F 근접센서 NBN15-30GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "NBN15-30GM50-E0",
      spec: "30mm, M30, 3선식, NPN",
      hasSerial: true,
      minStock: 6,
      leadTime: 14,
    },
    // P&F Photoelectric Sensors
    {
      code: "PF-OB1200-18GM50-E0",
      name: "P&F 포토센서 OB1200-18GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "OB1200-18GM50-E0",
      spec: "1200mm, M18, 3선식, NPN",
      hasSerial: true,
      minStock: 8,
      leadTime: 14,
    },
    {
      code: "PF-OB1200-18GM50-E2",
      name: "P&F 포토센서 OB1200-18GM50-E2",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "OB1200-18GM50-E2",
      spec: "1200mm, M18, 3선식, PNP",
      hasSerial: true,
      minStock: 8,
      leadTime: 14,
    },
    {
      code: "PF-OB2000-30GM50-E0",
      name: "P&F 포토센서 OB2000-30GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "OB2000-30GM50-E0",
      spec: "2000mm, M30, 3선식, NPN",
      hasSerial: true,
      minStock: 5,
      leadTime: 14,
    },
    // P&F Laser Sensors
    {
      code: "PF-ODM2000-18GM50-E0",
      name: "P&F 레이저센서 ODM2000-18GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "ODM2000-18GM50-E0",
      spec: "2000mm, M18, 3선식, NPN",
      hasSerial: true,
      minStock: 4,
      leadTime: 21,
    },
    {
      code: "PF-ODM5000-30GM50-E0",
      name: "P&F 레이저센서 ODM5000-30GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "ODM5000-30GM50-E0",
      spec: "5000mm, M30, 3선식, NPN",
      hasSerial: true,
      minStock: 3,
      leadTime: 21,
    },
    // P&F Ultrasonic Sensors
    {
      code: "PF-UC2000-30GM50-E0",
      name: "P&F 초음파센서 UC2000-30GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "UC2000-30GM50-E0",
      spec: "2000mm, M30, 3선식, NPN",
      hasSerial: true,
      minStock: 6,
      leadTime: 21,
    },
    {
      code: "PF-UC4000-30GM50-E0",
      name: "P&F 초음파센서 UC4000-30GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "UC4000-30GM50-E0",
      spec: "4000mm, M30, 3선식, NPN",
      hasSerial: true,
      minStock: 4,
      leadTime: 21,
    },
    // P&F Encoders
    {
      code: "PF-EN500-1024GM50-E0",
      name: "P&F 엔코더 EN500-1024GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "EN500-1024GM50-E0",
      spec: "1024 PPR, M18, 3선식, NPN",
      hasSerial: true,
      minStock: 8,
      leadTime: 21,
    },
    {
      code: "PF-EN500-2048GM50-E0",
      name: "P&F 엔코더 EN500-2048GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "EN500-2048GM50-E0",
      spec: "2048 PPR, M18, 3선식, NPN",
      hasSerial: true,
      minStock: 6,
      leadTime: 21,
    },
    // P&F RF-ID Sensors
    {
      code: "PF-RF100-13GM50-E0",
      name: "P&F RF-ID센서 RF100-13GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "RF100-13GM50-E0",
      spec: "13.56MHz, M18, 3선식, NPN",
      hasSerial: true,
      minStock: 5,
      leadTime: 28,
    },
    {
      code: "PF-RF200-13GM50-E0",
      name: "P&F RF-ID센서 RF200-13GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "RF200-13GM50-E0",
      spec: "13.56MHz, M18, 3선식, PNP",
      hasSerial: true,
      minStock: 5,
      leadTime: 28,
    },
    // P&F Linear Sensors
    {
      code: "PF-LS100-50GM50-E0",
      name: "P&F 리니어센서 LS100-50GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "LS100-50GM50-E0",
      spec: "50mm, M18, 3선식, NPN",
      hasSerial: true,
      minStock: 4,
      leadTime: 28,
    },
    {
      code: "PF-LS200-100GM50-E0",
      name: "P&F 리니어센서 LS200-100GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "LS200-100GM50-E0",
      spec: "100mm, M18, 3선식, NPN",
      hasSerial: true,
      minStock: 3,
      leadTime: 28,
    },
    // P&F Vision Sensors
    {
      code: "PF-VS100-18GM50-E0",
      name: "P&F 비전센서 VS100-18GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "VS100-18GM50-E0",
      spec: "M18, 3선식, NPN, 카메라형",
      hasSerial: true,
      minStock: 2,
      leadTime: 35,
    },
    {
      code: "PF-VS200-30GM50-E0",
      name: "P&F 비전센서 VS200-30GM50-E0",
      categoryId: sensorCat.id,
      brandId: pf.id,
      model: "VS200-30GM50-E0",
      spec: "M30, 3선식, NPN, 스캐너형",
      hasSerial: true,
      minStock: 2,
      leadTime: 35,
    },
    // WAGO Cables
    {
      code: "WAGO-857-301",
      name: "WAGO 케이블 857-301",
      categoryId: cableCat.id,
      brandId: wago.id,
      model: "857-301",
      spec: "3x1.5mm², 300m, PVC",
      hasSerial: false,
      minStock: 5,
      leadTime: 7,
    },
    {
      code: "WAGO-857-401",
      name: "WAGO 케이블 857-401",
      categoryId: cableCat.id,
      brandId: wago.id,
      model: "857-401",
      spec: "4x1.5mm², 300m, PVC",
      hasSerial: false,
      minStock: 5,
      leadTime: 7,
    },
    // MURR Connectors
    {
      code: "MURR-6900M12-4",
      name: "MURR 커넥터 6900M12-4",
      categoryId: connectorCat.id,
      brandId: murr.id,
      model: "6900M12-4",
      spec: "M12, 4핀, 암커넥터",
      hasSerial: false,
      minStock: 20,
      leadTime: 10,
    },
  ];

  for (const itemData of items) {
    await prisma.item.upsert({
      where: { code: itemData.code },
      update: {},
      create: itemData,
    });
  }

  // Inventory Transactions (Initial Stock)
  const itemCodes = items.map((i) => i.code);
  const itemsInDb = await prisma.item.findMany({
    where: { code: { in: itemCodes } },
  });

  const inventoryData = [
    // P&F Proximity Sensors
    { itemCode: "PF-NBN8-18GM60-E2", qty: 25, unitCost: 45000 },
    { itemCode: "PF-NBB8-18GM50-E0", qty: 18, unitCost: 42000 },
    { itemCode: "PF-NBN4-12GM50-E0", qty: 30, unitCost: 38000 },
    { itemCode: "PF-NBB4-12GM50-E0", qty: 25, unitCost: 36000 },
    { itemCode: "PF-NBN15-30GM50-E0", qty: 12, unitCost: 55000 },
    // P&F Photoelectric Sensors
    { itemCode: "PF-OB1200-18GM50-E0", qty: 15, unitCost: 65000 },
    { itemCode: "PF-OB1200-18GM50-E2", qty: 12, unitCost: 68000 },
    { itemCode: "PF-OB2000-30GM50-E0", qty: 8, unitCost: 85000 },
    // P&F Laser Sensors
    { itemCode: "PF-ODM2000-18GM50-E0", qty: 6, unitCost: 120000 },
    { itemCode: "PF-ODM5000-30GM50-E0", qty: 4, unitCost: 180000 },
    // P&F Ultrasonic Sensors
    { itemCode: "PF-UC2000-30GM50-E0", qty: 10, unitCost: 95000 },
    { itemCode: "PF-UC4000-30GM50-E0", qty: 6, unitCost: 125000 },
    // P&F Encoders
    { itemCode: "PF-EN500-1024GM50-E0", qty: 15, unitCost: 75000 },
    { itemCode: "PF-EN500-2048GM50-E0", qty: 12, unitCost: 85000 },
    // P&F RF-ID Sensors
    { itemCode: "PF-RF100-13GM50-E0", qty: 8, unitCost: 150000 },
    { itemCode: "PF-RF200-13GM50-E0", qty: 6, unitCost: 165000 },
    // P&F Linear Sensors
    { itemCode: "PF-LS100-50GM50-E0", qty: 5, unitCost: 200000 },
    { itemCode: "PF-LS200-100GM50-E0", qty: 3, unitCost: 280000 },
    // P&F Vision Sensors
    { itemCode: "PF-VS100-18GM50-E0", qty: 2, unitCost: 350000 },
    { itemCode: "PF-VS200-30GM50-E0", qty: 2, unitCost: 450000 },
    // WAGO Cables
    { itemCode: "WAGO-857-301", qty: 3, unitCost: 850000 },
    { itemCode: "WAGO-857-401", qty: 2, unitCost: 950000 },
    // MURR Connectors
    { itemCode: "MURR-6900M12-4", qty: 45, unitCost: 12000 },
  ];

  for (const inv of inventoryData) {
    const item = itemsInDb.find((i) => i.code === inv.itemCode);
    if (item) {
      await prisma.inventoryTransaction.create({
        data: {
          itemId: item.id,
          warehouseId: mainWarehouse.id,
          txDate: new Date(),
          txType: "RECEIPT",
          qty: inv.qty,
          unitCost: inv.unitCost,
          reference: "INITIAL_STOCK",
        },
      });
    }
  }

  // Serial Numbers for P&F sensors
  const pfSensors = itemsInDb.filter((i) => i.brandId === pf.id);
  for (const sensor of pfSensors) {
    for (let i = 1; i <= 5; i++) {
      const serialNo = `${sensor.code}-${String(i).padStart(3, "0")}`;
      try {
        await prisma.serialNumber.create({
          data: {
            itemId: sensor.id,
            serialNo: serialNo,
            status: "AVAILABLE",
          },
        });
      } catch (error) {
        if (error.code === "P2002") {
          // 시리얼 번호가 이미 존재하는 경우 무시
          console.log(`Serial number ${serialNo} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }
  }

  console.log("Inventory seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
