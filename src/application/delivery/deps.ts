/**
 * アプリケーション層の配信コンテキストの依存関係
 * 
 * アプリケーション層の配信コンテキストで使用する内部依存をエクスポートします。
 */

// コアドメイン
export * from "../../core/delivery/mod.ts";

// 外部依存
export { Result, ok, err } from "../../deps.ts"; 