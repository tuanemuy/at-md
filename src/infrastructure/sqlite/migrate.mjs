import path from "node:path";
import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const db = drizzle({
  connection: {
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});

await migrate(db, {
  migrationsFolder: path.join(import.meta.dirname, "migrations"),
});

console.log("Migration completed");
