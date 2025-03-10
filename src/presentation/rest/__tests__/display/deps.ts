/**
 * 表示関連のRESTコントローラーのテストファイル用の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";

// 内部依存関係 - コアドメイン
import { DomainError, ApplicationError } from "../../../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../../../core/errors/application.ts";
import { generateId } from "../../../../core/common/id.ts";

// 表示関連 - エンティティとバリューオブジェクト
import { Page } from "../../../../core/display/entities/page.ts";
import { PageMetadata } from "../../../../core/display/value-objects/page-metadata.ts";

// 表示関連 - 集約
import { PageAggregate } from "../../../../core/display/aggregates/page-aggregate.ts";

// 表示関連 - リポジトリ
import { PageRepository } from "../../../../application/display/repositories/page-repository.ts";

// 表示関連 - クエリ
import { GetPageByIdQuery, GetPageByIdQueryHandler } from "../../../../application/display/queries/get-page-by-id-query.ts";
import { GetPageBySlugQuery, GetPageBySlugQueryHandler } from "../../../../application/display/queries/get-page-by-slug-query.ts";
import { GetPageByContentIdQuery, GetPageByContentIdQueryHandler } from "../../../../application/display/queries/get-page-by-content-id-query.ts";

// 表示関連 - コマンド
// コマンドファイルが存在しないためコメントアウト
// import { CreatePageCommand, CreatePageCommandHandler } from "../../../../application/display/commands/create-page-command.ts";
// import { UpdatePageCommand, UpdatePageCommandHandler } from "../../../../application/display/commands/update-page-command.ts";

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
  EntityNotFoundError,
  generateId,
  
  // 表示関連 - クエリハンドラー
  GetPageByIdQueryHandler,
  GetPageBySlugQueryHandler,
  GetPageByContentIdQueryHandler,
  
  // 表示関連 - コマンドハンドラー
  // CreatePageCommandHandler, // 存在しないためコメントアウト
  // UpdatePageCommandHandler // 存在しないためコメントアウト
};

// 型のエクスポート
export type {
  // 表示関連 - エンティティとバリューオブジェクト
  Page,
  PageMetadata,
  
  // 表示関連 - 集約
  PageAggregate,
  
  // 表示関連 - リポジトリ
  PageRepository,
  
  // 表示関連 - クエリ
  GetPageByIdQuery,
  GetPageBySlugQuery,
  GetPageByContentIdQuery,
  
  // 表示関連 - コマンド
  // CreatePageCommand, // 存在しないためコメントアウト
  // UpdatePageCommand // 存在しないためコメントアウト
}; 