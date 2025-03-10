/**
 * 表示コントローラーのテストファイル用の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";

// 内部依存関係 - コアドメイン
import { DomainError, ApplicationError } from "../../../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../../../core/errors/application.ts";
import { generateId } from "../../../../core/common/id.ts";

// 表示関連 - エンティティとバリューオブジェクト
import { ViewTemplate } from "../../../../core/display/entities/view-template.ts";
import { Page } from "../../../../core/display/entities/page.ts";
import { PageMetadata } from "../../../../core/display/value-objects/page-metadata.ts";

// 表示関連 - 集約
import { PageAggregate } from "../../../../core/display/aggregates/page-aggregate.ts";
// テンプレート集約は存在しないため、コメントアウト
// import { TemplateAggregate, createTemplateAggregate } from "../../../../core/display/aggregates/template-aggregate.ts";

// 表示関連 - リポジトリ
import { PageRepository } from "../../../../application/display/repositories/page-repository.ts";
import { TemplateRepository } from "../../../../application/display/repositories/template-repository.ts";

// 表示関連 - クエリ
import { GetPageByIdQuery, GetPageByIdQueryHandler } from "../../../../application/display/queries/get-page-by-id-query.ts";
import { GetPageBySlugQuery, GetPageBySlugQueryHandler } from "../../../../application/display/queries/get-page-by-slug-query.ts";
import { GetPageByContentIdQuery, GetPageByContentIdQueryHandler } from "../../../../application/display/queries/get-page-by-content-id-query.ts";
import { GetTemplateByIdQuery, GetTemplateByIdQueryHandler } from "../../../../application/display/queries/get-template-by-id-query.ts";

// 表示関連 - コマンド
// コマンドファイルが存在しないため、コメントアウト
// import { CreatePageCommand, CreatePageCommandHandler } from "../../../../application/display/commands/create-page-command.ts";
// import { UpdatePageCommand, UpdatePageCommandHandler } from "../../../../application/display/commands/update-page-command.ts";
// import { CreateTemplateCommand, CreateTemplateCommandHandler } from "../../../../application/display/commands/create-template-command.ts";
// import { UpdateTemplateCommand, UpdateTemplateCommandHandler } from "../../../../application/display/commands/update-template-command.ts";

// 表示関連 - DTOs
import type { PageDto } from "../../dtos/page-dto.ts";
import type { TemplateDto } from "../../dtos/template-dto.ts";

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
  
  // 表示関連 - 集約
  // createPageAggregate, // 存在しないためコメントアウト
  // createTemplateAggregate, // 存在しないためコメントアウト
  
  // 表示関連 - クエリハンドラー
  GetPageByIdQueryHandler,
  GetPageBySlugQueryHandler,
  GetPageByContentIdQueryHandler,
  GetTemplateByIdQueryHandler,
  
  // 表示関連 - コマンドハンドラー
  // CreatePageCommandHandler, // 存在しないためコメントアウト
  // UpdatePageCommandHandler, // 存在しないためコメントアウト
  // CreateTemplateCommandHandler, // 存在しないためコメントアウト
  // UpdateTemplateCommandHandler, // 存在しないためコメントアウト
  
  // 表示関連 - DTOs
  PageDto,
  TemplateDto
};

// 型のエクスポート
export type {
  // 表示関連 - エンティティとバリューオブジェクト
  ViewTemplate,
  Page,
  PageMetadata,
  
  // 表示関連 - 集約
  PageAggregate,
  // TemplateAggregate, // 存在しないためコメントアウト
  
  // 表示関連 - リポジトリ
  PageRepository,
  TemplateRepository,
  
  // 表示関連 - クエリ
  GetPageByIdQuery,
  GetPageBySlugQuery,
  GetPageByContentIdQuery,
  GetTemplateByIdQuery,
  
  // 表示関連 - コマンド
  // CreatePageCommand, // 存在しないためコメントアウト
  // UpdatePageCommand, // 存在しないためコメントアウト
  // CreateTemplateCommand, // 存在しないためコメントアウト
  // UpdateTemplateCommand // 存在しないためコメントアウト
}; 