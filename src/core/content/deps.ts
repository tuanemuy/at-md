/**
 * コンテンツドメインの依存関係
 * 
 * 外部ライブラリや他のモジュールへの依存関係を管理します。
 */

// 外部ライブラリ
export { Result, err, ok } from "npm:neverthrow";
export { z } from "npm:zod";

// 共通モジュール
export { generateId } from "../common/mod.ts";

// エラーモジュール
export { 
  DomainError, 
  InvalidContentStateError, 
  InvalidMetadataError,
  InvalidRepositoryStateError
} from "../errors/mod.ts"; 