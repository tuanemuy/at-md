/**
 * アプリケーション層の表示コンテキストの依存関係
 * 
 * アプリケーション層の表示コンテキストで使用する内部依存をエクスポートします。
 */

// コアドメイン
export * from "../../core/display/mod.ts";

// 外部依存
export { Result, ok, err } from "../../deps.ts"; 