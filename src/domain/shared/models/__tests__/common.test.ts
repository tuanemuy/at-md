import { expect, test } from "vitest";
import {
  createRepositoryError,
  createServiceError,
  repositoryErrorCodeSchema,
  serviceErrorCodeSchema,
} from "../common";

test("createRepositoryError関数が正しいリポジトリエラーを作成すること", () => {
  const type = "NOT_FOUND";
  const message = "Entity not found";
  const cause = new Error("Original error");

  const error = createRepositoryError(type, message, cause);

  expect(error.name).toBe("RepositoryError");
  expect(error.type).toBe(type);
  expect(error.message).toBe(message);
  expect(error.cause).toBe(cause);
});

test("createServiceError関数が正しいサービスエラーを作成すること", () => {
  const type = "VALIDATION_ERROR";
  const message = "Validation failed";
  const cause = new Error("Original error");

  const error = createServiceError(type, message, cause);

  expect(error.name).toBe("ServiceError");
  expect(error.type).toBe(type);
  expect(error.message).toBe(message);
  expect(error.cause).toBe(cause);
});

test("repositoryErrorCodeSchemaが有効なエラーコードを検証すること", () => {
  const validCodes = [
    "NOT_FOUND",
    "ALREADY_EXISTS",
    "VALIDATION_ERROR",
    "DATABASE_ERROR",
    "UNKNOWN_ERROR",
  ];

  for (const code of validCodes) {
    expect(() => repositoryErrorCodeSchema.parse(code)).not.toThrow();
  }

  expect(() => repositoryErrorCodeSchema.parse("INVALID_CODE")).toThrow();
});

test("serviceErrorCodeSchemaが有効なエラーコードを検証すること", () => {
  const validCodes = [
    "VALIDATION_ERROR",
    "BUSINESS_RULE_VIOLATION",
    "EXTERNAL_SERVICE_ERROR",
    "UNKNOWN_ERROR",
  ];

  for (const code of validCodes) {
    expect(() => serviceErrorCodeSchema.parse(code)).not.toThrow();
  }

  expect(() => serviceErrorCodeSchema.parse("INVALID_CODE")).toThrow();
});
