import { Result } from "npm:neverthrow";
import { ViewTemplate } from "../../../core/display/entities/view-template.ts";
import { InfrastructureError } from "../../../core/errors/base.ts";

/**
 * テンプレートリポジトリのエラー型
 */
export type TemplateRepositoryError = InfrastructureError;

/**
 * テンプレートリポジトリインターフェース
 * 
 * テンプレートの永続化と検索機能を提供する
 */
export interface TemplateRepository {
  /**
   * IDによってテンプレートを検索する
   * 
   * @param id 検索するテンプレートID
   * @returns テンプレートのResult、見つからない場合はnull
   */
  findById(id: string): Promise<Result<ViewTemplate | null, TemplateRepositoryError>>;

  /**
   * 名前によってテンプレートを検索する
   * 
   * @param name 検索するテンプレート名
   * @returns テンプレートのResult、見つからない場合はnull
   */
  findByName(name: string): Promise<Result<ViewTemplate | null, TemplateRepositoryError>>;

  /**
   * すべてのテンプレートを取得する
   * 
   * @returns テンプレートの配列のResult
   */
  findAll(): Promise<Result<ViewTemplate[], TemplateRepositoryError>>;

  /**
   * テンプレートを保存する
   * 
   * @param template 保存するテンプレート
   * @returns 成功した場合は空のResult、失敗した場合はエラー
   */
  save(template: ViewTemplate): Promise<Result<void, TemplateRepositoryError>>;

  /**
   * テンプレートを削除する
   * 
   * @param id 削除するテンプレートID
   * @returns 成功した場合は空のResult、失敗した場合はエラー
   */
  delete(id: string): Promise<Result<void, TemplateRepositoryError>>;
} 