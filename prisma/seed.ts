// Seeds one test user per role. Run with: npx prisma db seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Same hash algorithm the login action uses. Salt rounds = 10 is fine for a school project.
  const passwordHash = (pw: string) => bcrypt.hashSync(pw, 10);

  const users = [
    {
      username: "staff1",
      displayName: "Jhezl Baldos",
      passwordHash: passwordHash("staff123"),
      role: "STAFF",
    },
    {
      username: "reviewer1",
      displayName: "Jessa Bebita",
      passwordHash: passwordHash("reviewer123"),
      role: "REVIEWER",
    },
    {
      username: "admin1",
      displayName: "Dave Briones",
      passwordHash: passwordHash("admin123"),
      role: "ADMIN",
    },
  ];

  for (const user of users) {
    // upsert keeps the seed safe to re-run without duplicate username errors
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        displayName: user.displayName,
        role: user.role,
        passwordHash: user.passwordHash,
      },
      create: user,
    });
    console.log(`Seeded ${user.role}: ${user.username}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
