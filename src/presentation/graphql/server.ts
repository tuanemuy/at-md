/**
 * GraphQLサーバー設定
 * 
 * GraphQLサーバーの設定と起動処理を提供します。
 */

import { createYoga } from "graphql-yoga";
import { typeDefs } from "./schema/mod.ts";
import { resolvers } from "./resolvers/mod.ts";
import { Result, ApplicationError, makeExecutableSchema } from "./deps.ts";

// 基本的なクエリハンドラーとコマンドハンドラーのインターフェース
interface BaseQueryHandler<TQuery, TResult> {
  execute(query: TQuery): Promise<Result<TResult, ApplicationError>>;
}

interface BaseCommandHandler<TCommand, TResult> {
  execute(command: TCommand): Promise<Result<TResult, ApplicationError>>;
}

// クエリハンドラーとコマンドハンドラーの型定義
interface QueryHandlers {
  // ユーザー関連
  getUserByIdQueryHandler: BaseQueryHandler<{ id: string; name: string }, unknown>;
  getUserByUsernameQueryHandler: BaseQueryHandler<{ username: string; name: string }, unknown>;
  getUserByEmailQueryHandler: BaseQueryHandler<{ email: string; name: string }, unknown>;
  getUserByDidQueryHandler: BaseQueryHandler<{ did: string; name: string }, unknown>;
  getUserByHandleQueryHandler: BaseQueryHandler<{ handle: string; name: string }, unknown>;

  // コンテンツ関連
  getContentByIdQueryHandler: BaseQueryHandler<{ id: string; name: string }, unknown>;
  getContentsByUserIdQueryHandler: BaseQueryHandler<{ userId: string; name: string }, unknown[]>;
  getContentsByRepositoryIdQueryHandler: BaseQueryHandler<{ repositoryId: string; name: string }, unknown[]>;
  getContentMetadataByContentIdQueryHandler: BaseQueryHandler<{ contentId: string; name: string }, unknown>;
  getRepositoryByIdQueryHandler: BaseQueryHandler<{ id: string; name: string }, unknown>;
  getRepositoriesByUserIdQueryHandler: BaseQueryHandler<{ userId: string; name: string }, unknown[]>;

  // フィード関連
  getFeedByIdQueryHandler: BaseQueryHandler<{ id: string; name: string }, unknown>;
  getFeedByNameQueryHandler: BaseQueryHandler<{ name: string }, unknown>;
  getFeedsByUserIdQueryHandler: BaseQueryHandler<{ userId: string; name: string }, unknown[]>;
  getPostByIdQueryHandler: BaseQueryHandler<{ id: string; name: string }, unknown>;
  getPostByContentIdQueryHandler: BaseQueryHandler<{ contentId: string; name: string }, unknown>;
  getPostsByUserIdQueryHandler: BaseQueryHandler<{ userId: string; name: string }, unknown[]>;
  getPostsByFeedIdQueryHandler: BaseQueryHandler<{ feedId: string; name: string }, unknown[]>;

  // 表示関連
  getPageByIdQueryHandler: BaseQueryHandler<{ id: string; name: string }, unknown>;
  getPageBySlugQueryHandler: BaseQueryHandler<{ slug: string; name: string }, unknown>;
  getPageByContentIdQueryHandler: BaseQueryHandler<{ contentId: string; name: string }, unknown>;
  getPagesByUserIdQueryHandler: BaseQueryHandler<{ userId: string; name: string }, unknown[]>;
  getPagesByTemplateIdQueryHandler: BaseQueryHandler<{ templateId: string; name: string }, unknown[]>;
  getTemplateByIdQueryHandler: BaseQueryHandler<{ id: string; name: string }, unknown>;
  getAllTemplatesQueryHandler: BaseQueryHandler<{ name: string }, unknown[]>;
}

interface CommandHandlers {
  // ユーザー関連
  createUserCommandHandler: BaseCommandHandler<{ name: string; username: string; email: string; atIdentifier: { did: string; handle?: string } }, unknown>;
  updateUserCommandHandler: BaseCommandHandler<{ id: string; name?: string; username?: string; email?: string }, unknown>;
  deleteUserCommandHandler: BaseCommandHandler<{ id: string }, boolean>;

  // コンテンツ関連
  createContentCommandHandler: BaseCommandHandler<{ name: string; repositoryId: string; content: string; metadata?: Record<string, unknown> }, unknown>;
  updateContentCommandHandler: BaseCommandHandler<{ id: string; content?: string; metadata?: Record<string, unknown> }, unknown>;
  deleteContentCommandHandler: BaseCommandHandler<{ id: string }, boolean>;
  createRepositoryCommandHandler: BaseCommandHandler<{ name: string; userId: string; description?: string }, unknown>;
  updateRepositoryCommandHandler: BaseCommandHandler<{ id: string; name?: string; description?: string }, unknown>;
  deleteRepositoryCommandHandler: BaseCommandHandler<{ id: string }, boolean>;

  // フィード関連
  createFeedCommandHandler: BaseCommandHandler<{ name: string; userId: string; description?: string }, unknown>;
  updateFeedCommandHandler: BaseCommandHandler<{ id: string; name?: string; description?: string }, unknown>;
  deleteFeedCommandHandler: BaseCommandHandler<{ id: string }, boolean>;
  createPostCommandHandler: BaseCommandHandler<{ feedId: string; contentId: string; metadata?: Record<string, unknown> }, unknown>;
  updatePostCommandHandler: BaseCommandHandler<{ id: string; metadata?: Record<string, unknown> }, unknown>;
  deletePostCommandHandler: BaseCommandHandler<{ id: string }, boolean>;
  publishPostCommandHandler: BaseCommandHandler<{ id: string }, unknown>;
  unpublishPostCommandHandler: BaseCommandHandler<{ id: string }, unknown>;

  // 表示関連
  createPageCommandHandler: BaseCommandHandler<{ name: string; userId: string; contentId: string; templateId?: string; slug?: string }, unknown>;
  updatePageCommandHandler: BaseCommandHandler<{ id: string; contentId?: string; templateId?: string; slug?: string }, unknown>;
  deletePageCommandHandler: BaseCommandHandler<{ id: string }, boolean>;
  createTemplateCommandHandler: BaseCommandHandler<{ name: string; userId: string; content: string }, unknown>;
  updateTemplateCommandHandler: BaseCommandHandler<{ id: string; name?: string; content?: string }, unknown>;
  deleteTemplateCommandHandler: BaseCommandHandler<{ id: string }, boolean>;
}

/**
 * GraphQLサーバーを作成する
 * 
 * @param queryHandlers クエリハンドラー
 * @param commandHandlers コマンドハンドラー
 * @returns GraphQLサーバー
 */
export function createGraphQLServer(
  queryHandlers: QueryHandlers,
  commandHandlers: CommandHandlers
) {
  return createYoga({
    schema: makeExecutableSchema({
      typeDefs,
      resolvers,
    }),
    context: {
      queryHandlers,
      commandHandlers,
    },
  });
} 