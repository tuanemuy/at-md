import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/infrastructure/database/schema/mod.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: Deno.env.get("DATABASE_URL") || "postgres://test:test@localhost:55432/at-md",
  },
  verbose: true,
  strict: true,
});
