/**
 * プレゼンテーション層の共通依存関係
 * 
 * プレゼンテーション層全体で使用する共通の依存関係をエクスポートします。
 */

// 外部依存
export { Result, ok, err } from "../deps.ts";

// エラー
export * from "../core/errors/mod.ts";

// 共通モジュール
export { generateId } from "../core/common/mod.ts";

// アプリケーション層
export type { 
  GetUserByIdQuery, 
  GetUserByUsernameQuery,
  GetUserByEmailQuery,
  GetUserByDidQuery,
  GetUserByHandleQuery,
  CreateUserCommand
} from "../application/account/mod.ts";

export { 
  GetUserByIdQueryHandler,
  GetUserByUsernameQueryHandler,
  GetUserByEmailQueryHandler,
  GetUserByDidQueryHandler,
  GetUserByHandleQueryHandler,
  CreateUserCommandHandler
} from "../application/account/mod.ts";

export type {
  GetContentByIdQuery,
  CreateContentCommand
} from "../application/content/mod.ts";

export {
  GetContentByIdQueryHandler,
  CreateContentCommandHandler
} from "../application/content/mod.ts";

export type {
  GetFeedByIdQuery,
  GetFeedsByUserIdQuery
} from "../application/delivery/mod.ts";

export {
  GetFeedByIdQueryHandler,
  GetFeedsByUserIdQueryHandler
} from "../application/delivery/mod.ts";

// CreateFeedCommandとCreateFeedCommandHandlerが存在しない場合はコメントアウト
// export type { CreateFeedCommand } from "../application/delivery/mod.ts";
// export { CreateFeedCommandHandler } from "../application/delivery/mod.ts";

export type {
  GetPageByIdQuery,
  GetPageBySlugQuery,
  GetPageByContentIdQuery,
  GetTemplateByIdQuery,
  GetAllTemplatesQuery
} from "../application/display/mod.ts";

export {
  GetPageByIdQueryHandler,
  GetPageBySlugQueryHandler,
  GetPageByContentIdQueryHandler,
  GetTemplateByIdQueryHandler,
  GetAllTemplatesQueryHandler
} from "../application/display/mod.ts";

// コアドメイン
export { 
  createUserAggregate 
} from "../core/account/aggregates/mod.ts";

export type { 
  UserAggregate
} from "../core/account/aggregates/mod.ts";

export { 
  createContentAggregate
} from "../core/content/aggregates/content-aggregate.ts";

export type { 
  ContentAggregate
} from "../core/content/aggregates/content-aggregate.ts";

export { 
  createRepositoryAggregate
} from "../core/content/aggregates/repository-aggregate.ts";

export type { 
  RepositoryAggregate
} from "../core/content/aggregates/repository-aggregate.ts";

export { 
  createNewFeedAggregate
} from "../core/delivery/aggregates/feed-aggregate.ts";

export type { 
  FeedAggregate
} from "../core/delivery/aggregates/feed-aggregate.ts";

export { 
  createNewPostAggregate
} from "../core/delivery/aggregates/post-aggregate.ts";

export type { 
  PostAggregate
} from "../core/delivery/aggregates/post-aggregate.ts";

export type { 
  PageAggregate
} from "../core/display/aggregates/page-aggregate.ts";

export type { 
  ViewTemplate
} from "../core/display/entities/view-template.ts";

// リポジトリ
export type { UserRepository } from "../core/account/repositories/user-repository.ts";
export type { ContentRepository } from "../core/content/repositories/content-repository.ts";
export type { RepositoryRepository } from "../core/content/repositories/repository-repository.ts";
export type { FeedRepository } from "../core/delivery/repositories/feed-repository.ts";
export type { PostRepository } from "../core/delivery/repositories/post-repository.ts";
export type { PageRepository } from "../core/display/repositories/page-repository.ts";
export type { TemplateRepository } from "../core/display/repositories/template-repository.ts";

// Hono関連
export { Hono } from "hono";
export { logger } from "hono/logger";
export { cors } from "hono/cors";
export { serveStatic } from "hono/serve-static";
export { validator } from "hono/validator";
export type { Context, Next } from "hono";

// インフラストラクチャ層 - リポジトリ
export { 
  DrizzleUserRepository 
} from "../infrastructure/repositories/drizzle-user-repository.ts";
export { 
  DrizzleContentRepository 
} from "../infrastructure/repositories/drizzle-content-repository.ts";
export { 
  DrizzleRepositoryRepository 
} from "../infrastructure/repositories/drizzle-repository-repository.ts";
export { 
  DrizzleFeedRepository 
} from "../infrastructure/repositories/delivery/drizzle-feed-repository.ts";
export { 
  DrizzlePageRepository 
} from "../infrastructure/repositories/display/drizzle-page-repository.ts";
export { 
  DrizzleTemplateRepository 
} from "../infrastructure/repositories/display/drizzle-template-repository.ts";

// インフラストラクチャ層 - データベース
export { db } from "../infrastructure/database/db.ts"; 