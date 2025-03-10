/**
 * アプリケーション層のコンテンツコンテキストの依存関係
 * 
 * アプリケーション層のコンテンツコンテキストで使用する内部依存をエクスポートします。
 */

// コアドメイン
export * from "../../core/content/mod.ts";

// エラー
export * from "../../core/errors/mod.ts";

// 共通モジュール
export { generateId } from "../../core/common/mod.ts";

// 外部依存
export { Result, ok, err } from "../../deps.ts"; 