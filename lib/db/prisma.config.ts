import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma v7 moved datasource connection URLs out of schema.prisma.
// - The runtime connection is handled by the driver adapter passed to
//   `new PrismaClient({ adapter })` in src/client.ts (uses DATABASE_URL).
// - The `datasource.url` below is used only by Migrate/introspection CLI
//   commands, which want a direct (non-pooled) connection — hence DIRECT_URL.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
