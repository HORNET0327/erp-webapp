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
    // P&F Sensors
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
    { itemCode: "PF-NBN8-18GM60-E2", qty: 25, unitCost: 45000 },
    { itemCode: "PF-NBB8-18GM50-E0", qty: 18, unitCost: 42000 },
    { itemCode: "WAGO-857-301", qty: 3, unitCost: 850000 },
    { itemCode: "WAGO-857-401", qty: 2, unitCost: 950000 },
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
      await prisma.serialNumber.create({
        data: {
          itemId: sensor.id,
          serialNo: `${sensor.code}-${String(i).padStart(3, "0")}`,
          status: "AVAILABLE",
        },
      });
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

