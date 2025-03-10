/**
 * プレゼンテーション層のREST関連の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";
import { Hono } from "npm:hono";
import type { Context } from "npm:hono";
import { StatusCode } from "npm:hono/utils/http-status";
import { cors } from "npm:hono/cors";

// 内部依存関係 - コアドメイン
import { DomainError, ApplicationError } from "../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../core/errors/application.ts";
import { generateId } from "../../core/common/id.ts";

// アカウント関連
import { GetUserByIdQuery, GetUserByIdQueryHandler } from "../../application/account/queries/get-user-by-id-query.ts";
import { CreateUserCommand, CreateUserCommandHandler } from "../../application/account/commands/create-user-command.ts";
import type { User } from "../../core/account/entities/user.ts";
import type { UserRepository } from "../../application/account/repositories/user-repository.ts";
import type { UserAggregate } from "../../core/account/aggregates/user-aggregate.ts";

// コンテンツ関連
import { GetContentByIdQuery, GetContentByIdQueryHandler } from "../../application/content/queries/get-content-by-id-query.ts";
import { CreateContentCommand, CreateContentCommandHandler } from "../../application/content/commands/create-content-command.ts";
import type { Content } from "../../core/content/entities/content.ts";
import type { ContentRepository } from "../../application/content/repositories/content-repository.ts";
import type { RepositoryRepository } from "../../application/content/repositories/repository-repository.ts";
import type { ContentAggregate } from "../../core/content/aggregates/content-aggregate.ts";
import type { RepositoryAggregate } from "../../core/content/aggregates/repository-aggregate.ts";

// 配信関連
import { GetFeedByIdQuery, GetFeedByIdQueryHandler } from "../../application/delivery/queries/feed-query.ts";
import { GetFeedsByUserIdQuery, GetFeedsByUserIdQueryHandler } from "../../application/delivery/queries/feed-query.ts";
import { GetFeedByNameQuery, GetFeedByNameQueryHandler } from "../../application/delivery/queries/feed-query.ts";
import { CreateFeedCommand, CreateFeedCommandHandler } from "../../application/delivery/commands/create-feed-command.ts";
import { UpdateFeedCommand, UpdateFeedCommandHandler } from "../../application/delivery/commands/update-feed-command.ts";
import { DeleteFeedCommand, DeleteFeedCommandHandler } from "../../application/delivery/commands/delete-feed-command.ts";
import type { Feed } from "../../core/delivery/entities/feed.ts";
import type { FeedRepository } from "../../application/delivery/repositories/feed-repository.ts";
import type { FeedAggregate } from "../../core/delivery/aggregates/feed-aggregate.ts";

// 表示関連
import { GetPageByIdQuery, GetPageByIdQueryHandler } from "../../application/display/queries/get-page-by-id-query.ts";
import { GetPageBySlugQuery, GetPageBySlugQueryHandler } from "../../application/display/queries/get-page-by-slug-query.ts";
import { GetPageByContentIdQuery, GetPageByContentIdQueryHandler } from "../../application/display/queries/get-page-by-content-id-query.ts";
import { GetTemplateByIdQuery, GetTemplateByIdQueryHandler } from "../../application/display/queries/get-template-by-id-query.ts";
import { GetAllTemplatesQuery, GetAllTemplatesQueryHandler } from "../../application/display/queries/get-all-templates-query.ts";
import type { PageAggregate } from "../../core/display/aggregates/page-aggregate.ts";
import type { ViewTemplate } from "../../core/display/entities/view-template.ts";

// トランザクション関連
import type { TransactionContext } from "../../infrastructure/deps.ts";

// 値のエクスポート
export {
  // 外部依存関係
  Result,
  ok,
  err,
  Hono,
  Hono as Router,
  cors,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  generateId,
  
  // アカウント関連
  GetUserByIdQueryHandler,
  CreateUserCommandHandler,
  
  // コンテンツ関連
  GetContentByIdQueryHandler,
  CreateContentCommandHandler,
  
  // 配信関連
  GetFeedByIdQueryHandler,
  GetFeedsByUserIdQueryHandler,
  GetFeedByNameQueryHandler,
  CreateFeedCommandHandler,
  UpdateFeedCommandHandler,
  DeleteFeedCommandHandler,
  
  // 表示関連
  GetPageByIdQueryHandler,
  GetPageBySlugQueryHandler,
  GetPageByContentIdQueryHandler,
  GetTemplateByIdQueryHandler,
  GetAllTemplatesQueryHandler
};

// 型のエクスポート
export type {
  // 外部依存関係
  Context,
  StatusCode as Status,
  
  // アカウント関連
  User,
  UserRepository,
  UserAggregate,
  GetUserByIdQuery,
  CreateUserCommand,
  
  // コンテンツ関連
  Content,
  ContentRepository,
  RepositoryRepository,
  ContentAggregate,
  RepositoryAggregate,
  GetContentByIdQuery,
  CreateContentCommand,
  
  // 配信関連
  Feed,
  FeedRepository,
  FeedAggregate,
  GetFeedByIdQuery,
  GetFeedsByUserIdQuery,
  GetFeedByNameQuery,
  CreateFeedCommand,
  UpdateFeedCommand,
  DeleteFeedCommand,
  
  // 表示関連
  PageAggregate,
  ViewTemplate,
  GetPageByIdQuery,
  GetPageBySlugQuery,
  GetPageByContentIdQuery,
  GetTemplateByIdQuery,
  GetAllTemplatesQuery,
  
  // トランザクション関連
  TransactionContext
}; 