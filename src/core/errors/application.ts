import { ApplicationError } from "./base.ts";

/**
 * エンティティが見つからない場合に発生するエラー
 */
export class EntityNotFoundError extends ApplicationError {
  constructor(entityType: string, id: string) {
    super(`${entityType} with id ${id} not found`);
    this.name = "EntityNotFoundError";
  }
}

/**
 * 認可エラー（権限不足）の場合に発生するエラー
 */
export class AuthorizationError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * バリデーションエラーの場合に発生するエラー
 */
export class ValidationError extends ApplicationError {
  constructor(field: string, reason: string) {
    super(`Validation failed for field '${field}': ${reason}`);
    this.name = "ValidationError";
  }
} 