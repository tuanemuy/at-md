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

export const ApplicationServiceErrorCode = {
  ACCOUNT_CONTEXT_ERROR: "account_context_error",
  NOTE_CONTEXT_ERROR: "note_context_error",
  POST_CONTEXT_ERROR: "post_context_error",
} as const;
export type ApplicationServiceErrorCode =
  (typeof ApplicationServiceErrorCode)[keyof typeof ApplicationServiceErrorCode];

/**
 * Base error class
 * All domain-specific errors inherit from this class
 */
export class AnyError {
  public readonly name: string = "AnyError";
  public readonly cause?: Error;

  constructor(
    public readonly code: string,
    public readonly message: string,
    cause?: unknown,
  ) {
    this.cause = isError(cause) ? cause : undefined;
  }
}

/**
 * Validation error
 */
export class ValidationError extends AnyError {
  public readonly name = "ValidationError";
  public readonly cause?: Error;

  constructor(
    public readonly code: ValidationErrorCode,
    public readonly message: string,
    public readonly validationErrors: Record<string, string[]> = {},
    cause?: unknown,
  ) {
    super(code, message, cause);
  }
}

/**
 * Repository error
 */
export class RepositoryError extends AnyError {
  public readonly name = "RepositoryError";
  public readonly cause?: Error;

  constructor(
    public readonly code: RepositoryErrorCode,
    public readonly message: string,
    cause?: unknown,
  ) {
    super(code, message, cause);
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AnyError {
  public readonly name = "ExternalServiceError";
  public readonly cause?: Error;

  constructor(
    public readonly serviceName: string,
    public readonly code: ExternalServiceErrorCode,
    public readonly message: string,
    cause?: unknown,
  ) {
    super(code, message, cause);
  }
}

/**
 * Application service error
 */
export class ApplicationServiceError extends AnyError {
  public readonly name = "ApplicationServiceError";
  public readonly cause?: Error;

  constructor(
    public readonly usecase: string,
    public readonly code: ApplicationServiceErrorCode,
    public readonly message: string,
    cause?: unknown,
  ) {
    super(code, message, cause);
  }
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
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
