import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/infrastructure/db",
  schema: "./src/infrastructure/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    // biome-ignore lint: only for migration
    url: process.env.DATABASE_URL!,
  },
});
