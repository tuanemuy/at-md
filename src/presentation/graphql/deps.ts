/**
 * プレゼンテーション層のGraphQL関連の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";
import { makeExecutableSchema } from "npm:@graphql-tools/schema";
import * as graphqlTag from "npm:graphql-tag";
const { gql } = graphqlTag;

// 内部依存関係 - コアドメイン
import { DomainError, ApplicationError } from "../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../core/errors/application.ts";

// アカウント関連
import { GetUserByIdQuery, GetUserByIdQueryHandler } from "../../application/account/queries/get-user-by-id-query.ts";
import { GetUserByUsernameQuery, GetUserByUsernameQueryHandler } from "../../application/account/queries/get-user-by-username-query.ts";
import { GetUserByEmailQuery, GetUserByEmailQueryHandler } from "../../application/account/queries/get-user-by-email-query.ts";
import { GetUserByDidQuery, GetUserByDidQueryHandler } from "../../application/account/queries/get-user-by-did-query.ts";
import { GetUserByHandleQuery, GetUserByHandleQueryHandler } from "../../application/account/queries/get-user-by-handle-query.ts";
import { CreateUserCommand, CreateUserCommandHandler } from "../../application/account/commands/create-user-command.ts";
import type { User } from "../../core/account/entities/user.ts";
import { createUser } from "../../core/account/entities/user.ts";
import type { UserRepository } from "../../application/account/repositories/user-repository.ts";
import { createEmail, createUsername, createAtIdentifier } from "../../core/account/value-objects/mod.ts";

// コンテンツ関連
import { GetContentByIdQuery, GetContentByIdQueryHandler } from "../../application/content/queries/get-content-by-id-query.ts";
import { CreateContentCommand, CreateContentCommandHandler } from "../../application/content/commands/create-content-command.ts";
import type { Content } from "../../core/content/entities/content.ts";
import type { ContentRepository } from "../../application/content/repositories/content-repository.ts";
import type { RepositoryRepository } from "../../application/content/repositories/repository-repository.ts";

// 配信関連
import { GetFeedByIdQuery, GetFeedByIdQueryHandler, GetFeedsByUserIdQuery, GetFeedsByUserIdQueryHandler } from "../../application/delivery/queries/feed-query.ts";
import { CreateFeedCommand, CreateFeedCommandHandler } from "../../application/delivery/commands/create-feed-command.ts";
import { UpdateFeedCommand, UpdateFeedCommandHandler } from "../../application/delivery/commands/update-feed-command.ts";
import { DeleteFeedCommand, DeleteFeedCommandHandler } from "../../application/delivery/commands/delete-feed-command.ts";
import type { Feed } from "../../core/delivery/entities/feed.ts";
import type { FeedRepository } from "../../application/delivery/repositories/feed-repository.ts";
import { PostAggregate } from "../../core/delivery/aggregates/post-aggregate.ts";
import { PublishStatus } from "../../core/delivery/value-objects/publish-status.ts";

// 値のエクスポート
export {
  // 外部依存関係
  Result,
  ok,
  err,
  gql,
  makeExecutableSchema,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  
  // アカウント関連
  GetUserByIdQueryHandler,
  GetUserByUsernameQueryHandler,
  GetUserByEmailQueryHandler,
  GetUserByDidQueryHandler,
  GetUserByHandleQueryHandler,
  CreateUserCommandHandler,
  createUser,
  createEmail,
  createUsername,
  createAtIdentifier,
  
  // コンテンツ関連
  GetContentByIdQueryHandler,
  CreateContentCommandHandler,
  
  // 配信関連
  GetFeedByIdQueryHandler,
  GetFeedsByUserIdQueryHandler,
  CreateFeedCommandHandler,
  UpdateFeedCommandHandler,
  DeleteFeedCommandHandler
};

// 型のエクスポート
export type {
  // アカウント関連
  User,
  UserRepository,
  GetUserByIdQuery,
  GetUserByUsernameQuery,
  GetUserByEmailQuery,
  GetUserByDidQuery,
  GetUserByHandleQuery,
  CreateUserCommand,
  
  // コンテンツ関連
  Content,
  ContentRepository,
  RepositoryRepository,
  GetContentByIdQuery,
  CreateContentCommand,
  
  // 配信関連
  Feed,
  FeedRepository,
  GetFeedByIdQuery,
  GetFeedsByUserIdQuery,
  CreateFeedCommand,
  UpdateFeedCommand,
  DeleteFeedCommand,
  PostAggregate,
  PublishStatus
}; 