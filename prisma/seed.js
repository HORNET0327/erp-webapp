const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function hashPassword(plain) {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

async function main() {
  const adminUsername = "SND";
  const adminEmail = "SND@local"; // placeholder - not used for login
  const adminPassword = "pwd123!@#";

  // Roles
  const [adminRole, leadUserRole, userRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: { name: "ADMIN", label: "Administrator" },
    }),
    prisma.role.upsert({
      where: { name: "LEAD_USER" },
      update: {},
      create: { name: "LEAD_USER", label: "Lead User" },
    }),
    prisma.role.upsert({
      where: { name: "USER" },
      update: {},
      create: { name: "USER", label: "Standard User" },
    }),
  ]);

  // Admin user
  // 우선 기존 관리자 후보(새/옛 이메일) 중 하나를 찾는다
  let adminUser = await prisma.user.findFirst({
    where: { username: adminUsername },
  });

  if (adminUser) {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        username: adminUsername,
        email: adminEmail,
        name: "MASTER",
        passwordHash: hashPassword(adminPassword),
        isActive: true,
      },
    });
  } else {
    adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        name: "MASTER",
        passwordHash: hashPassword(adminPassword),
        isActive: true,
      },
    });
  }

  // UserInfo for admin
  // UserInfo는 userId 또는 employeeCode(고유)로 먼저 업데이트 시도
  const updatedByUser = await prisma.userInfo.updateMany({
    where: { userId: adminUser.id },
    data: {
      departmentCode: "MASTER",
      jobTitle: "Administrator",
      mobile: "010-0000-0000",
      gender: "OTHER",
    },
  });

  if (updatedByUser.count === 0) {
    const updatedByEmp = await prisma.userInfo.updateMany({
      where: { employeeCode: "EMP-0001" },
      data: {
        userId: adminUser.id,
        departmentCode: "MASTER",
        jobTitle: "Administrator",
        mobile: "010-0000-0000",
        gender: "OTHER",
      },
    });

    if (updatedByEmp.count === 0) {
      await prisma.userInfo.create({
        data: {
          userId: adminUser.id,
          employeeCode: "EMP-0001",
          departmentCode: "MASTER",
          jobTitle: "Administrator",
          mobile: "010-0000-0000",
          gender: "OTHER",
        },
      });
    }
  }

  // Grant ADMIN role to admin
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: adminUser.id, roleId: adminRole.id },
    },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
