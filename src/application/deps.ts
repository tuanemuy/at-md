/**
 * アプリケーション層の共通依存関係
 * 
 * アプリケーション層全体で使用する共通の依存関係をエクスポートします。
 */

// 外部依存
export { Result, ok, err } from "../deps.ts";

// コアドメイン共通
export { generateId } from "../core/common/mod.ts";

// エラー
export * from "../core/errors/mod.ts"; 