/**
 * 表示関連のコントローラーの依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";

// 内部依存関係 - コアドメイン
import { DomainError, ApplicationError } from "../../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../../core/errors/application.ts";

// 表示関連のエンティティとバリューオブジェクト
import type { Page } from "../../../core/display/entities/page.ts";
import type { ViewTemplate } from "../../../core/display/entities/view-template.ts";
import type { PageMetadata } from "../../../core/display/value-objects/page-metadata.ts";
import type { PageAggregate } from "../../../core/display/aggregates/page-aggregate.ts";

// 表示関連のリポジトリ
import type { PageRepository } from "../../../application/display/repositories/page-repository.ts";
import type { TemplateRepository } from "../../../application/display/repositories/template-repository.ts";

// 表示関連のクエリとコマンド
import type { GetPageByIdQuery, GetPageByIdQueryHandler } from "../../../application/display/queries/get-page-by-id-query.ts";
import type { GetPageBySlugQuery, GetPageBySlugQueryHandler } from "../../../application/display/queries/get-page-by-slug-query.ts";
import type { GetTemplateByIdQuery, GetTemplateByIdQueryHandler } from "../../../application/display/queries/get-template-by-id-query.ts";

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

// 型のエクスポート
export type {
  // 表示関連のエンティティとバリューオブジェクト
  Page,
  ViewTemplate,
  PageMetadata,
  PageAggregate,
  
  // 表示関連のリポジトリ
  PageRepository,
  TemplateRepository,
  
  // 表示関連のクエリとハンドラー
  GetPageByIdQuery,
  GetPageByIdQueryHandler,
  GetPageBySlugQuery,
  GetPageBySlugQueryHandler,
  GetTemplateByIdQuery,
  GetTemplateByIdQueryHandler
}; 