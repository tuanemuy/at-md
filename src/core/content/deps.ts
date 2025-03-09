/**
 * コンテンツコンテキストの依存関係
 * 
 * コンテンツコンテキストで使用する内部依存をエクスポートします。
 */

// 共通モジュール
export * from "../common/mod.ts";

// 外部依存
export { z } from "../../deps.ts";
export { Result, ok, err } from "../../deps.ts"; 