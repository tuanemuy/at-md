import { DomainError } from "./base.ts";

/**
 * コンテンツの状態が無効な場合に発生するエラー
 */
export class InvalidContentStateError extends DomainError {
  constructor(currentState: string, attemptedOperation: string) {
    super(`Cannot perform ${attemptedOperation} on content in ${currentState} state`);
    this.name = "InvalidContentStateError";
  }
}

/**
 * メタデータが無効な場合に発生するエラー
 */
export class InvalidMetadataError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMetadataError";
  }
}

/**
 * リポジトリの状態が無効な場合に発生するエラー
 */
export class InvalidRepositoryStateError extends DomainError {
  constructor(currentState: string, attemptedOperation: string) {
    super(`Cannot perform ${attemptedOperation} on repository in ${currentState} state`);
    this.name = "InvalidRepositoryStateError";
  }
}

/**
 * 投稿の状態が無効な場合に発生するエラー
 */
export class InvalidPostStateError extends DomainError {
  constructor(currentState: string, attemptedOperation: string) {
    super(`Cannot perform ${attemptedOperation} on post in ${currentState} state`);
    this.name = "InvalidPostStateError";
  }
} 