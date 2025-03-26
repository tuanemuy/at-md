/**
 * Validation error codes
 */
export const ValidationErrorCode = {
  INVALID_INPUT: "invalid_input",
  REQUIRED_FIELD: "required_field",
  INVALID_FORMAT: "invalid_format",
  INVALID_LENGTH: "invalid_length",
  INVALID_VALUE: "invalid_value",
} as const;
export type ValidationErrorCode =
  (typeof ValidationErrorCode)[keyof typeof ValidationErrorCode];

/**
 * Repository error codes
 */
export const RepositoryErrorCode = {
  // データベース接続関連
  CONNECTION_ERROR: "connection_error",

  // トランザクション関連
  TRANSACTION_ERROR: "transaction_error",

  // トランザクション関連
  TRANSACTION_ROLLBACK_ERROR: "transaction_rollback_error",

  // 構文エラーもしくはアクセス規則違反
  SYNTAX_OR_ACCESS_ERROR: "syntax_or_access_error",

  // システムエラー
  SYSTEM_ERROR: "system_error",

  // データエラー
  DATA_ERROR: "data_error",

  // 制約関連
  UNIQUE_VIOLATION: "unique_violation",
  CONSTRAINT_VIOLATION: "constraint_violation",

  // データが見つからない
  NOT_FOUND: "not_found",

  // その他
  UNKNOWN_ERROR: "unknown_error",
} as const;
export type RepositoryErrorCode =
  (typeof RepositoryErrorCode)[keyof typeof RepositoryErrorCode];

/**
 * External service error codes
 */
export const ExternalServiceErrorCode = {
  REQUEST_FAILED: "request_failed",
  RESPONSE_INVALID: "response_invalid",
  SERVICE_UNAVAILABLE: "service_unavailable",
  RATE_LIMITED: "rate_limited",
  AUTHENTICATION_FAILED: "authentication_failed",
  PROFILE_RETRIEVAL_FAILED: "profile_retrieval_failed",
  UNEXPECTED_ERROR: "unexpected_error",
} as const;
export type ExternalServiceErrorCode =
  (typeof ExternalServiceErrorCode)[keyof typeof ExternalServiceErrorCode];

/**
 * Base error class
 * All domain-specific errors inherit from this class
 */
export class AnyError {
  constructor(
    public code: string,
    public message: string,
    public cause?: Error | unknown,
  ) {}
}

/**
 * Validation error
 */
export class ValidationError extends AnyError {
  constructor(
    public code: ValidationErrorCode,
    public message: string,
    public validationErrors: Record<string, string[]> = {},
    public cause?: Error | unknown,
  ) {
    super(code, message, cause);
  }
}

/**
 * Repository error
 */
export class RepositoryError extends AnyError {
  constructor(
    public code: RepositoryErrorCode,
    public message: string,
    public cause?: Error | unknown,
  ) {
    super(code, message, cause);
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AnyError {
  constructor(
    public serviceName: string,
    public code: ExternalServiceErrorCode,
    public message: string,
    public cause?: Error | unknown,
  ) {
    super(code, message, cause);
  }
}

/**
 * Convert unknown error to AnyError type
 * @param error Error to convert
 */
export function toAnyError(error: unknown): AnyError {
  if (error instanceof Error) {
    if (error instanceof AnyError) {
      return error;
    }

    // Standard Error object
    return new AnyError("unknown_error", error.message, error);
  }

  // String
  if (typeof error === "string") {
    return new AnyError("unknown_error", error);
  }

  // Other types
  return new AnyError("unknown_error", "Unknown error occurred", error);
}
