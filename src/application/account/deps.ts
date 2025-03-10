/**
 * アプリケーション層のアカウントコンテキストの依存関係
 * 
 * アプリケーション層のアカウントコンテキストで使用する内部依存をエクスポートします。
 */

// コアドメイン
export * from "../../core/account/mod.ts";

// 共通モジュール
export { generateId } from "../../core/common/mod.ts";

// 外部依存
export { Result, ok, err } from "../../deps.ts"; 