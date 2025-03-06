import { PresentationError } from "./base.ts";

/**
 * 入力値が無効な場合に発生するエラー
 */
export class InvalidInputError extends PresentationError {
  constructor(field: string, reason: string) {
    super(`Invalid input for field '${field}': ${reason}`);
    this.name = "InvalidInputError";
  }
}

/**
 * リソースが見つからない場合に発生するエラー
 */
export class ResourceNotFoundError extends PresentationError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = "ResourceNotFoundError";
  }
}

/**
 * 認証されていない場合に発生するエラー
 */
export class UnauthenticatedError extends PresentationError {
  constructor() {
    super("Authentication required to access this resource");
    this.name = "UnauthenticatedError";
  }
} 