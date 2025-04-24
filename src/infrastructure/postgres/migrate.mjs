import path from "node:path";
import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const db = drizzle(new PGlite(process.env.DATABASE_URL || undefined));

await migrate(db, {
  migrationsFolder: path.join(import.meta.dirname, "migrations"),
});

console.log("Migration completed");
