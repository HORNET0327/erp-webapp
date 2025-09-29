const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const desiredUsername = "SND";
  const candidates = ["MASTER@SND", "admin@local"]; // 기존 관리자 후보 이메일

  // 1) 대상 관리자 사용자 찾기
  let user = await prisma.user.findFirst({
    where: { email: { in: candidates } },
  });
  if (!user) {
    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });
    if (adminRole) {
      const link = await prisma.userRole.findFirst({
        where: { roleId: adminRole.id },
      });
      if (link) {
        user = await prisma.user.findUnique({ where: { id: link.userId } });
      }
    }
  }
  if (!user) {
    console.error("관리자 사용자를 찾지 못했습니다.");
    process.exit(1);
  }

  // 2) username 중복 확인
  const conflict = await prisma.user.findFirst({
    where: { username: desiredUsername, NOT: { id: user.id } },
  });
  if (conflict) {
    console.error(
      `이미 다른 사용자가 username='${desiredUsername}'를 사용 중입니다. 중복을 해소한 뒤 다시 실행하세요.`
    );
    process.exit(1);
  }

  // 3) username 설정 및 ADMIN 역할 보장
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { username: desiredUsername, isActive: true },
    });
    const adminRole = await tx.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: { name: "ADMIN", label: "Administrator" },
    });
    await tx.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
      update: {},
      create: { userId: user.id, roleId: adminRole.id },
    });
  });

  console.log("관리자 username을 'SND'로 설정하고 ADMIN 역할을 보장했습니다.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



































