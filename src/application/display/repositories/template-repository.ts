import { TemplateRepository as CoreTemplateRepository, TemplateRepositoryError } from "../../../core/display/repositories/mod.ts";

/**
 * テンプレートリポジトリインターフェース
 * 
 * テンプレートの永続化と検索機能を提供する
 */
export type TemplateRepository = CoreTemplateRepository;

// 型の再エクスポート
export type { TemplateRepositoryError }; 