import { InfrastructureError } from "./base.ts";

/**
 * データベース操作時に発生するエラー
 */
export class DatabaseError extends InfrastructureError {
  constructor(operation: string, detail: string) {
    super(`Database error during ${operation}: ${detail}`);
    this.name = "DatabaseError";
  }
}

/**
 * 外部サービス連携時に発生するエラー
 */
export class ExternalServiceError extends InfrastructureError {
  constructor(service: string, operation: string, detail: string) {
    super(`Error in ${service} during ${operation}: ${detail}`);
    this.name = "ExternalServiceError";
  }
}

/**
 * ネットワーク接続時に発生するエラー
 */
export class NetworkError extends InfrastructureError {
  constructor(url: string, detail: string) {
    super(`Network error while accessing ${url}: ${detail}`);
    this.name = "NetworkError";
  }
} 