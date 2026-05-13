import { prisma } from "./client";
import { UserRole } from "@prisma/client";

async function seed() {
  console.log("Seeding database...");

  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (!existingAdmin) {
    console.log("Creating default admin user placeholder...");
    console.log("Note: Create an admin user through Clerk and update their role in the database");
  }

  const defaultSettings = [
    { key: "markup_percentage", value: 20 },
    { key: "enabled_regions", value: ["us-east", "us-west", "eu-west"] },
    { key: "enabled_plans", value: ["g6-nanode-1", "g6-standard-1", "g6-standard-2"] },
    { key: "fallback_enabled", value: true },
    { key: "auto_terminate_expired", value: true },
    { key: "min_order_days", value: 7 },
    { key: "max_order_days", value: 365 },
  ];

  for (const setting of defaultSettings) {
    await prisma.marketSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
      },
    });
  }

  console.log("Seed completed successfully");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
