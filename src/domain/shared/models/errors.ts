import { z } from "zod";

/**
 * 基本エラーインターフェース
 */
export interface AnyError {
  name: string;
  type: string;
  message: string;
  cause?: Error;
}

/**
 * リポジトリエラーコード
 */
export const repositoryErrorCodeSchema = z.enum([
  "CONNECTION_ERROR",
  "QUERY_ERROR",
  "CONSTRAINT_ERROR",
  "NOT_FOUND",
  "INVALID_ID",
  "DUPLICATE_ENTRY",
  "OPTIMISTIC_LOCK_ERROR"
]);
export type RepositoryErrorCode = z.infer<typeof repositoryErrorCodeSchema>;

/**
 * リポジトリエラー
 */
export interface RepositoryError extends AnyError {
  name: "RepositoryError";
  type: RepositoryErrorCode;
  message: string;
  cause?: Error;
}

/**
 * バリデーションエラーコード
 */
export const validationErrorCodeSchema = z.enum([
  "INVALID_INPUT",
  "MISSING_REQUIRED_FIELD",
  "INVALID_FORMAT",
  "OUT_OF_RANGE",
  "INVALID_ENUM_VALUE"
]);
export type ValidationErrorCode = z.infer<typeof validationErrorCodeSchema>;

/**
 * バリデーションエラー
 */
export interface ValidationError extends AnyError {
  name: "ValidationError";
  type: ValidationErrorCode;
  message: string;
  cause?: Error;
}

/**
 * 認証エラーコード
 */
export const authenticationErrorCodeSchema = z.enum([
  "UNAUTHORIZED",
  "TOKEN_EXPIRED",
  "INVALID_TOKEN",
  "MISSING_TOKEN",
  "INVALID_CREDENTIALS"
]);
export type AuthenticationErrorCode = z.infer<typeof authenticationErrorCodeSchema>;

/**
 * 認証エラー
 */
export interface AuthenticationError extends AnyError {
  name: "AuthenticationError";
  type: AuthenticationErrorCode;
  message: string;
  cause?: Error;
}

/**
 * 認可エラーコード
 */
export const authorizationErrorCodeSchema = z.enum([
  "FORBIDDEN",
  "INSUFFICIENT_PERMISSIONS",
  "RESOURCE_ACCESS_DENIED"
]);
export type AuthorizationErrorCode = z.infer<typeof authorizationErrorCodeSchema>;

/**
 * 認可エラー
 */
export interface AuthorizationError extends AnyError {
  name: "AuthorizationError";
  type: AuthorizationErrorCode;
  message: string;
  cause?: Error;
}

/**
 * 外部サービスエラーコード
 */
export const externalServiceErrorCodeSchema = z.enum([
  "SERVICE_UNAVAILABLE",
  "RATE_LIMITED",
  "TIMEOUT",
  "NETWORK_ERROR",
  "API_ERROR"
]);
export type ExternalServiceErrorCode = z.infer<typeof externalServiceErrorCodeSchema>;

/**
 * 外部サービスエラー
 */
export interface ExternalServiceError extends AnyError {
  name: "ExternalServiceError";
  type: ExternalServiceErrorCode;
  message: string;
  cause?: Error;
} 