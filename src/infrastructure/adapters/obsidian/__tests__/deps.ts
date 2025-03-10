/**
 * Obsidianアダプターのテストファイル用の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";

// 内部依存関係 - コアドメイン
import { DomainError, ApplicationError } from "../../../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../../../core/errors/application.ts";

// 値のエクスポート
export {
  // 外部依存関係
  Result,
  ok,
  err,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError
}; 