const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.session.deleteMany({}),
    prisma.userRole.deleteMany({}),
    prisma.userInfo.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);
  console.log("All user-related data cleared.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

