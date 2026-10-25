// Seeds the 2,000-item dataset required by Test Plan IMS-15.
// Run after the normal seed:  npx tsx prisma/seed-items.ts
// Re-run with --force to wipe items and status logs first.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BRANDS = [
  "Nike", "Adidas", "Levi's", "Uniqlo", "Zara", "H&M", "Ralph Lauren",
  "Tommy Hilfiger", "Gap", "Carhartt", "Dickies", "Champion", "Puma",
  "Reebok", "The North Face", "Patagonia", "Calvin Klein", "Diesel",
  "Mango", "Forever 21",
];
const CATEGORIES = [
  "Jacket", "Denim", "T-Shirt", "Hoodie", "Shirt", "Pants", "Shorts",
  "Dress", "Skirt", "Sweater", "Polo", "Outerwear",
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "One Size"];
const CONDITIONS = ["Excellent", "Good", "Fair"];
const REASONS = [
  "Stained collar",
  "Fabric tear at the hem",
  "Size label missing",
  "Not as described",
  "Visible pilling",
];

function pick<T>(values: T[], index: number): T {
  return values[index % values.length];
}

function price(index: number) {
  return 100 + ((index * 137) % 4900);
}

async function chunkedCreate<T>(
  rows: T[],
  create: (batch: T[]) => Promise<unknown>,
  size = 400,
) {
  for (let i = 0; i < rows.length; i += size) {
    await create(rows.slice(i, i + size));
  }
}

async function main() {
  const force = process.argv.includes("--force");
  const existing = await prisma.item.count();

  if (existing > 0 && !force) {
    console.error(
      `Refusing to seed: ${existing} items already exist.\n` +
        "Run with --force to delete items and status logs first.",
    );
    process.exit(1);
  }

  if (force) {
    await prisma.statusLog.deleteMany();
    await prisma.item.deleteMany();
    console.log("Cleared existing items and status logs.");
  }

  const staff = await prisma.user.findUnique({ where: { username: "staff1" } });
  const reviewer = await prisma.user.findUnique({ where: { username: "reviewer1" } });
  if (!staff || !reviewer) {
    console.error("Run `npx prisma db seed` first so staff1 and reviewer1 exist.");
    process.exit(1);
  }

  const now = Date.now();
  const items = Array.from({ length: 2000 }, (_, index) => {
    const bucket = index % 10;
    const status = bucket <= 2 ? "Pending" : bucket <= 7 ? "In Stock" : "Sold";
    const createdAt = new Date(now - ((index * 37) % (60 * 24)) * 60 * 60 * 1000);

    return {
      name: `${pick(BRANDS, index)} ${pick(CATEGORIES, index + 3)}`,
      brand: pick(BRANDS, index),
      category: pick(CATEGORIES, index + 3),
      size: pick(SIZES, index + 1),
      condition: pick(CONDITIONS, index + 2),
      price: price(index),
      status,
      rejectionReason:
        status === "Pending" && bucket === 0 ? pick(REASONS, index) : null,
      createdById: staff.id,
      createdAt,
    };
  });

  await chunkedCreate(items, (batch) => prisma.item.createMany({ data: batch }));
  console.log(`Created ${items.length} items.`);

  const created = await prisma.item.findMany({
    select: { id: true, status: true, createdAt: true, rejectionReason: true },
  });

  type LogRow = {
    itemId: number;
    oldStatus: string | null;
    newStatus: string;
    changedById: number;
    reason: string | null;
    changedAt: Date;
  };

  const logs = created.flatMap((item): LogRow[] => {
    const rows: LogRow[] = [
      {
        itemId: item.id,
        oldStatus: null,
        newStatus: "Pending",
        changedById: staff.id,
        reason: "Item submitted",
        changedAt: item.createdAt,
      },
    ];

    if (item.status === "Pending") {
      if (item.rejectionReason) {
        rows.push({
          itemId: item.id,
          oldStatus: "Pending",
          newStatus: "Pending",
          changedById: reviewer.id,
          reason: item.rejectionReason,
          changedAt: new Date(item.createdAt.getTime() + 60 * 60 * 1000),
        });
      }
      return rows;
    }

    rows.push({
      itemId: item.id,
      oldStatus: "Pending",
      newStatus: "In Stock",
      changedById: reviewer.id,
      reason: null,
      changedAt: new Date(item.createdAt.getTime() + 60 * 60 * 1000),
    });

    if (item.status === "Sold") {
      rows.push({
        itemId: item.id,
        oldStatus: "In Stock",
        newStatus: "Sold",
        changedById: staff.id,
        reason: null,
        changedAt: new Date(item.createdAt.getTime() + 2 * 60 * 60 * 1000),
      });
    }

    return rows;
  });

  await chunkedCreate(logs, (batch) => prisma.statusLog.createMany({ data: batch }));
  console.log(`Created ${logs.length} status log rows.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
