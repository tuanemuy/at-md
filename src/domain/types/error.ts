import { z } from "zod";

/**
 * Common error types
 */
export const ErrorType = {
  VALIDATION: "validation",
  NOT_FOUND: "not_found",
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  CONFLICT: "conflict",
  INTERNAL: "internal",
  EXTERNAL: "external",
  NETWORK: "network",
} as const;
export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

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
 * Authentication error codes
 */
export const AuthErrorCode = {
  INVALID_CREDENTIALS: "invalid_credentials",
  TOKEN_EXPIRED: "token_expired",
  TOKEN_INVALID: "token_invalid",
  USER_NOT_FOUND: "user_not_found",
  SESSION_EXPIRED: "session_expired",
  ACCESS_DENIED: "access_denied",
} as const;
export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

/**
 * Resource error codes
 */
export const ResourceErrorCode = {
  NOT_FOUND: "not_found",
  ALREADY_EXISTS: "already_exists",
  ACCESS_DENIED: "access_denied",
} as const;
export type ResourceErrorCode =
  (typeof ResourceErrorCode)[keyof typeof ResourceErrorCode];

/**
 * Repository error codes
 */
export const RepositoryErrorCode = {
  QUERY_FAILED: "query_failed",
  CONNECTION_ERROR: "connection_error",
  TRANSACTION_FAILED: "transaction_failed",
  DELETE_FAILED: "delete_failed",
  UPDATE_FAILED: "update_failed",
  INSERT_FAILED: "insert_failed",
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
} as const;
export type ExternalServiceErrorCode =
  (typeof ExternalServiceErrorCode)[keyof typeof ExternalServiceErrorCode];

/**
 * Network error codes
 */
export const NetworkErrorCode = {
  CONNECTION_FAILED: "connection_failed",
  TIMEOUT: "timeout",
  INVALID_URL: "invalid_url",
} as const;
export type NetworkErrorCode =
  (typeof NetworkErrorCode)[keyof typeof NetworkErrorCode];

/**
 * Zod schema for error types
 */
export const errorTypeSchema = z
  .enum([
    ErrorType.VALIDATION,
    ErrorType.NOT_FOUND,
    ErrorType.UNAUTHORIZED,
    ErrorType.FORBIDDEN,
    ErrorType.CONFLICT,
    ErrorType.INTERNAL,
    ErrorType.EXTERNAL,
    ErrorType.NETWORK,
  ])
  .describe("Error type");

/**
 * Base error class
 * All domain-specific errors inherit from this class
 */
export class AnyError {
  constructor(
    public name: string,
    public type: ErrorType,
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
    super("ValidationError", ErrorType.VALIDATION, code, message, cause);
  }
}

/**
 * Authentication error
 */
export class UnauthorizedError extends AnyError {
  constructor(
    public code: AuthErrorCode,
    public message = "Authentication failed",
    public cause?: Error | unknown,
  ) {
    super("UnauthorizedError", ErrorType.UNAUTHORIZED, code, message, cause);
  }
}

/**
 * Access denied error
 */
export class ForbiddenError extends AnyError {
  constructor(
    public code:
      | typeof AuthErrorCode.ACCESS_DENIED
      | typeof ResourceErrorCode.ACCESS_DENIED,
    public message = "Access denied",
    public cause?: Error | unknown,
  ) {
    super("ForbiddenError", ErrorType.FORBIDDEN, code, message, cause);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AnyError {
  constructor(
    public entityName: string,
    public entityId?: string,
    public code: typeof ResourceErrorCode.NOT_FOUND = ResourceErrorCode.NOT_FOUND,
    public message = `${entityName} not found`,
    public cause?: Error | unknown,
  ) {
    super("NotFoundError", ErrorType.NOT_FOUND, code, message, cause);
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AnyError {
  constructor(
    public entityName: string,
    public code: typeof ResourceErrorCode.ALREADY_EXISTS = ResourceErrorCode.ALREADY_EXISTS,
    public message = `${entityName} already exists`,
    public cause?: Error | unknown,
  ) {
    super("ConflictError", ErrorType.CONFLICT, code, message, cause);
  }
}

/**
 * Internal error
 */
export class InternalError extends AnyError {
  constructor(
    public code: RepositoryErrorCode | string = "internal_error",
    public message = "Internal error occurred",
    public cause?: Error | unknown,
  ) {
    super("InternalError", ErrorType.INTERNAL, code, message, cause);
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AnyError {
  constructor(
    public serviceName: string,
    public code: ExternalServiceErrorCode,
    public message = `Error occurred while communicating with ${serviceName}`,
    public cause?: Error | unknown,
  ) {
    super("ExternalServiceError", ErrorType.EXTERNAL, code, message, cause);
  }
}

/**
 * Network error
 */
export class NetworkError extends AnyError {
  constructor(
    public code: NetworkErrorCode,
    public message = "Network error occurred",
    public cause?: Error | unknown,
  ) {
    super("NetworkError", ErrorType.NETWORK, code, message, cause);
  }
}

/**
 * Convert unknown error to AnyError type
 * @param error Error to convert
 */
export function toAnyError(error: unknown): AnyError {
  if (error instanceof Error) {
    if ("type" in error && typeof error.type === "string" && "code" in error) {
      // Might already be an instance of AnyError
      const anyError = error as Partial<AnyError>;
      if (anyError.name && anyError.type && anyError.code && anyError.message) {
        return error as AnyError;
      }
    }

    // Standard Error object
    return new InternalError("internal_error", error.message, error);
  }

  // String
  if (typeof error === "string") {
    return new InternalError("internal_error", error);
  }

  // Other types
  return new InternalError("internal_error", "Unknown error occurred", error);
}
