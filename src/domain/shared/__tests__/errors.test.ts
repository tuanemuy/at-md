import { expect, test } from "vitest";
import { 
  repositoryErrorCodeSchema, 
  validationErrorCodeSchema,
  authenticationErrorCodeSchema,
  authorizationErrorCodeSchema,
  externalServiceErrorCodeSchema
} from "../models/errors";

test("リポジトリエラーコードが正しく定義されていること", () => {
  const validCodes = [
    "CONNECTION_ERROR",
    "QUERY_ERROR",
    "CONSTRAINT_ERROR",
    "NOT_FOUND",
    "INVALID_ID",
    "DUPLICATE_ENTRY",
    "OPTIMISTIC_LOCK_ERROR"
  ];
  
  for (const code of validCodes) {
    const result = repositoryErrorCodeSchema.safeParse(code);
    expect(result.success).toBe(true);
  }
  
  const invalidCode = "INVALID_CODE";
  const result = repositoryErrorCodeSchema.safeParse(invalidCode);
  expect(result.success).toBe(false);
});

test("バリデーションエラーコードが正しく定義されていること", () => {
  const validCodes = [
    "INVALID_INPUT",
    "MISSING_REQUIRED_FIELD",
    "INVALID_FORMAT",
    "OUT_OF_RANGE",
    "INVALID_ENUM_VALUE"
  ];
  
  for (const code of validCodes) {
    const result = validationErrorCodeSchema.safeParse(code);
    expect(result.success).toBe(true);
  }
  
  const invalidCode = "INVALID_CODE";
  const result = validationErrorCodeSchema.safeParse(invalidCode);
  expect(result.success).toBe(false);
});

test("認証エラーコードが正しく定義されていること", () => {
  const validCodes = [
    "UNAUTHORIZED",
    "TOKEN_EXPIRED",
    "INVALID_TOKEN",
    "MISSING_TOKEN",
    "INVALID_CREDENTIALS"
  ];
  
  for (const code of validCodes) {
    const result = authenticationErrorCodeSchema.safeParse(code);
    expect(result.success).toBe(true);
  }
  
  const invalidCode = "INVALID_CODE";
  const result = authenticationErrorCodeSchema.safeParse(invalidCode);
  expect(result.success).toBe(false);
});

test("認可エラーコードが正しく定義されていること", () => {
  const validCodes = [
    "FORBIDDEN",
    "INSUFFICIENT_PERMISSIONS",
    "RESOURCE_ACCESS_DENIED"
  ];
  
  for (const code of validCodes) {
    const result = authorizationErrorCodeSchema.safeParse(code);
    expect(result.success).toBe(true);
  }
  
  const invalidCode = "INVALID_CODE";
  const result = authorizationErrorCodeSchema.safeParse(invalidCode);
  expect(result.success).toBe(false);
});

test("外部サービスエラーコードが正しく定義されていること", () => {
  const validCodes = [
    "SERVICE_UNAVAILABLE",
    "RATE_LIMITED",
    "TIMEOUT",
    "NETWORK_ERROR",
    "API_ERROR"
  ];
  
  for (const code of validCodes) {
    const result = externalServiceErrorCodeSchema.safeParse(code);
    expect(result.success).toBe(true);
  }
  
  const invalidCode = "INVALID_CODE";
  const result = externalServiceErrorCodeSchema.safeParse(invalidCode);
  expect(result.success).toBe(false);
}); 