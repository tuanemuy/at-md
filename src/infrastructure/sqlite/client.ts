import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export function getDatabase(databaseUrl: string, authToken: string) {
  return drizzle({
    connection: {
      url: databaseUrl,
      authToken: authToken,
    },
    schema,
  });
}

interface DatabaseError {
  code: string;
}

export function isDatabaseError(value: unknown): value is DatabaseError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if ("code" in value) {
    return true;
  }

  return false;
}

export function mapRepositoryError(error: unknown) {
  const code = isDatabaseError(error) ? error.code : undefined;
  return new RepositoryError(
    code || RepositoryErrorCode.UNKNOWN_ERROR,
    "SQLite Error",
    error,
  );
}
