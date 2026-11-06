// Extra test data that the 2,000-item seeder cannot provide.
// Run after prisma/seed-items.ts with the TEST database:
//   npm run db:test:fixtures
//
// Adds:
//   - staff2 / staff123      (TC-22 needs items owned by another Staff user)
//   - Low Stock Test         (exactly 5 In Stock items, so TC-19 can pass)
//   - Healthy Stock Test     (6 In Stock items, so TC-20 can pass)
//   - two items owned by staff2, one Pending and one In Stock
//
// The script is idempotent: it deletes its own FIXTURE- items first, then
// recreates them with the same values.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PREFIX = "FIXTURE-";
const LOW_STOCK_CATEGORY = "Low Stock Test";
const HEALTHY_STOCK_CATEGORY = "Healthy Stock Test";

type SeedItem = {
  name: string;
  brand: string;
  category: string;
  size: string;
  condition: string;
  price: number;
  status: "Pending" | "In Stock";
  rejectionReason?: string | null;
};

async function main() {
  const staff1 = await prisma.user.findUnique({ where: { username: "staff1" } });
  const reviewer = await prisma.user.findUnique({
    where: { username: "reviewer1" },
  });
  if (!staff1 || !reviewer) {
    console.error(
      "Run `npm run db:test:reset` first so staff1 and reviewer1 exist.",
    );
    process.exit(1);
  }

  const staff2 = await prisma.user.upsert({
    where: { username: "staff2" },
    update: {
      displayName: "Mika Santos",
      role: "STAFF",
      passwordHash: bcrypt.hashSync("staff123", 10),
    },
    create: {
      username: "staff2",
      displayName: "Mika Santos",
      role: "STAFF",
      passwordHash: bcrypt.hashSync("staff123", 10),
    },
  });

  // Remove a previous run of this script (status logs first, no cascades).
  const previous = await prisma.item.findMany({
    where: { name: { startsWith: PREFIX } },
    select: { id: true },
  });
  if (previous.length > 0) {
    const ids = previous.map((row) => row.id);
    await prisma.statusLog.deleteMany({ where: { itemId: { in: ids } } });
    await prisma.item.deleteMany({ where: { id: { in: ids } } });
    console.log(`Cleared ${previous.length} fixture items.`);
  }

  const items: SeedItem[] = [
    // Low-stock category: exactly 5 In Stock items.
    ...Array.from({ length: 5 }, (_, index) => ({
      name: `${PREFIX}LowStock-${String(index + 1).padStart(2, "0")}`,
      brand: "Uniqlo",
      category: LOW_STOCK_CATEGORY,
      size: "M",
      condition: "Good",
      price: 250 + index * 10,
      status: "In Stock" as const,
    })),
    // Healthy category: 6 In Stock items, one above the threshold.
    ...Array.from({ length: 6 }, (_, index) => ({
      name: `${PREFIX}Healthy-${String(index + 1).padStart(2, "0")}`,
      brand: "Gap",
      category: HEALTHY_STOCK_CATEGORY,
      size: "L",
      condition: "Excellent",
      price: 300 + index * 10,
      status: "In Stock" as const,
    })),
    // Owned by staff2 so a staff1 search must not return them (TC-22).
    {
      name: `${PREFIX}Staff2-Pending`,
      brand: "Carhartt",
      category: "Jacket",
      size: "XL",
      condition: "Fair",
      price: 1200,
      status: "Pending",
    },
    {
      name: `${PREFIX}Staff2-InStock`,
      brand: "Dickies",
      category: "Pants",
      size: "32",
      condition: "Good",
      price: 900,
      status: "In Stock",
    },
  ];

  for (const item of items) {
    const owner = item.name.includes("Staff2") ? staff2 : staff1;
    const approved = item.status === "In Stock";

    await prisma.item.create({
      data: {
        name: item.name,
        brand: item.brand,
        category: item.category,
        size: item.size,
        condition: item.condition,
        price: item.price,
        status: item.status,
        rejectionReason: item.rejectionReason ?? null,
        createdById: owner.id,
        statusLogs: {
          create: [
            {
              oldStatus: null,
              newStatus: "Pending",
              changedById: owner.id,
              reason: "Item submitted",
            },
            ...(approved
              ? [
                  {
                    oldStatus: "Pending",
                    newStatus: "In Stock",
                    changedById: reviewer.id,
                    reason: null,
                  },
                ]
              : []),
          ],
        },
      },
    });
  }

  console.log(
    [
      `Seeded ${items.length} fixture items.`,
      `  ${LOW_STOCK_CATEGORY}: 5 In Stock`,
      `  ${HEALTHY_STOCK_CATEGORY}: 6 In Stock`,
      `  staff2 / staff123 (id ${staff2.id})`,
    ].join("\n"),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
