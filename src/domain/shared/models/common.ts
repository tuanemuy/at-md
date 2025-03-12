import { z } from "zod";
import type { Result } from "neverthrow";

/**
 * 共通エラー型
 * すべてのドメインエラーの基底インターフェース
 */
export interface AnyError extends Error {
  name: string;
  type: string;
  message: string;
  cause?: Error;
}

/**
 * リポジトリエラーコード
 */
export const repositoryErrorCodeSchema = z.enum([
  "NOT_FOUND",
  "ALREADY_EXISTS",
  "VALIDATION_ERROR",
  "DATABASE_ERROR",
  "UNKNOWN_ERROR",
]);
export type RepositoryErrorCode = z.infer<typeof repositoryErrorCodeSchema>;

/**
 * リポジトリエラー
 */
export interface RepositoryError extends AnyError {
  name: "RepositoryError";
  type: RepositoryErrorCode;
}

/**
 * リポジトリエラーを作成する
 * @param type エラータイプ
 * @param message エラーメッセージ
 * @param cause 原因となったエラー
 * @returns リポジトリエラー
 */
export function createRepositoryError(
  type: RepositoryErrorCode,
  message: string,
  cause?: Error,
): RepositoryError {
  return {
    name: "RepositoryError",
    type,
    message,
    cause,
  };
}

/**
 * サービスエラーコード
 */
export const serviceErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "BUSINESS_RULE_VIOLATION",
  "EXTERNAL_SERVICE_ERROR",
  "UNKNOWN_ERROR",
]);
export type ServiceErrorCode = z.infer<typeof serviceErrorCodeSchema>;

/**
 * サービスエラー
 */
export interface ServiceError extends AnyError {
  name: "ServiceError";
  type: ServiceErrorCode;
}

/**
 * サービスエラーを作成する
 * @param type エラータイプ
 * @param message エラーメッセージ
 * @param cause 原因となったエラー
 * @returns サービスエラー
 */
export function createServiceError(
  type: ServiceErrorCode,
  message: string,
  cause?: Error,
): ServiceError {
  return {
    name: "ServiceError",
    type,
    message,
    cause,
  };
}

// Result型のエクスポート
export type { Result };
