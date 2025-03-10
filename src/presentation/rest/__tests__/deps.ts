/**
 * RESTコントローラーのテストファイル用の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";

// 内部依存関係 - コアドメイン
import { DomainError, ApplicationError } from "../../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../../core/errors/application.ts";
import { generateId } from "../../../core/common/id.ts";

// アカウント関連
import { UserAggregate, createUserAggregate } from "../../../core/account/aggregates/user-aggregate.ts";
import { User } from "../../../core/account/entities/user.ts";
import { UserRepository } from "../../../application/account/repositories/user-repository.ts";
import { GetUserByIdQuery, GetUserByIdQueryHandler } from "../../../application/account/queries/get-user-by-id-query.ts";
import { CreateUserCommand, CreateUserCommandHandler } from "../../../application/account/commands/create-user-command.ts";

// コンテンツ関連
import { ContentAggregate, createContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { Content } from "../../../core/content/entities/content.ts";
import { ContentMetadata } from "../../../core/content/value-objects/content-metadata.ts";
import { RepositoryAggregate, createRepositoryAggregate } from "../../../core/content/aggregates/repository-aggregate.ts";
import { Repository } from "../../../core/content/entities/repository.ts";
import { ContentRepository } from "../../../application/content/repositories/content-repository.ts";
import { RepositoryRepository } from "../../../application/content/repositories/repository-repository.ts";
import { GetContentByIdQuery, GetContentByIdQueryHandler } from "../../../application/content/queries/get-content-by-id-query.ts";
import { CreateContentCommand, CreateContentCommandHandler } from "../../../application/content/commands/create-content-command.ts";

// 配信関連
import { FeedAggregate, createNewFeedAggregate } from "../../../core/delivery/aggregates/feed-aggregate.ts";
import { Feed } from "../../../core/delivery/entities/feed.ts";
import { FeedMetadata } from "../../../core/delivery/value-objects/feed-metadata.ts";
import { FeedRepository } from "../../../application/delivery/repositories/feed-repository.ts";
import { CreateFeedCommand, CreateFeedCommandHandler } from "../../../application/delivery/commands/create-feed-command.ts";

// 表示関連
import { Page } from "../../../core/display/entities/page.ts";
import { ViewTemplate } from "../../../core/display/entities/view-template.ts";
import { PageMetadata } from "../../../core/display/value-objects/page-metadata.ts";
import { PageAggregate } from "../../../core/display/aggregates/page-aggregate.ts";
import { PageRepository } from "../../../application/display/repositories/page-repository.ts";
import { TemplateRepository } from "../../../application/display/repositories/template-repository.ts";
import { GetPageByIdQuery, GetPageByIdQueryHandler } from "../../../application/display/queries/get-page-by-id-query.ts";
import { GetPageBySlugQuery, GetPageBySlugQueryHandler } from "../../../application/display/queries/get-page-by-slug-query.ts";
import { GetPageByContentIdQuery, GetPageByContentIdQueryHandler } from "../../../application/display/queries/get-page-by-content-id-query.ts";

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
  
  // アカウント関連
  createUserAggregate,
  GetUserByIdQueryHandler,
  CreateUserCommandHandler,
  
  // コンテンツ関連
  createContentAggregate,
  createRepositoryAggregate,
  GetContentByIdQueryHandler,
  CreateContentCommandHandler,
  
  // 配信関連
  createNewFeedAggregate,
  CreateFeedCommandHandler
};

// 型のエクスポート
export type {
  // アカウント関連
  UserAggregate,
  User,
  UserRepository,
  GetUserByIdQuery,
  CreateUserCommand,
  
  // コンテンツ関連
  ContentAggregate,
  Content,
  ContentMetadata,
  RepositoryAggregate,
  Repository,
  ContentRepository,
  RepositoryRepository,
  GetContentByIdQuery,
  CreateContentCommand,
  
  // 配信関連
  FeedAggregate,
  Feed,
  FeedMetadata,
  FeedRepository,
  CreateFeedCommand
}; 