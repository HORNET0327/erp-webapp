const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function hashPassword(plain) {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

async function main() {
  const targetId = "MASTER";
  const targetEmail = "MASTER@SND";
  const targetName = "SND";
  const targetPassword = "pwd123!@#";

  const existingTarget = await prisma.user.findUnique({
    where: { id: targetId },
  });
  if (existingTarget) {
    // Update fields and ensure ADMIN role exists
    await prisma.user.update({
      where: { id: targetId },
      data: {
        email: targetEmail,
        name: targetName,
        passwordHash: hashPassword(targetPassword),
        isActive: true,
      },
    });
  } else {
    // Find any existing admin-like user
    const sourceUser = await prisma.user.findFirst({
      where: { email: { in: ["MASTER@SND", "admin@local"] } },
    });

    // Create MASTER user fresh
    const master = await prisma.user.create({
      data: {
        id: targetId,
        email: targetEmail,
        name: targetName,
        passwordHash: hashPassword(targetPassword),
        isActive: true,
      },
    });

    if (sourceUser) {
      const oldId = sourceUser.id;
      // Move dependent relations to MASTER in a transaction
      await prisma.$transaction([
        prisma.userRole.updateMany({
          where: { userId: oldId },
          data: { userId: targetId },
        }),
        prisma.session.updateMany({
          where: { userId: oldId },
          data: { userId: targetId },
        }),
        prisma.userInfo.updateMany({
          where: { userId: oldId },
          data: { userId: targetId },
        }),
      ]);
      // Remove old user if different
      if (oldId !== targetId) {
        await prisma.user.delete({ where: { id: oldId } }).catch(() => {});
      }
    }

    // Ensure ADMIN role and mapping
    const adminRole = await prisma.role.upsert({
      where: { name: "ADMIN" },
      update: {},
      create: { name: "ADMIN", label: "Administrator" },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: master.id, roleId: adminRole.id } },
      update: {},
      create: { userId: master.id, roleId: adminRole.id },
    });
  }

  console.log("Admin user set to id=MASTER, email=MASTER@SND");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
