const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Adding Lead User role...");

  // Lead User 역할 추가
  const leadUserRole = await prisma.role.upsert({
    where: { name: "LEAD_USER" },
    update: {},
    create: {
      name: "LEAD_USER",
      label: "Lead User",
    },
  });

  console.log("Lead User role created:", leadUserRole);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
