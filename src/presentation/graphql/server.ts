/**
 * GraphQLサーバー設定
 * 
 * GraphQLサーバーの設定と起動処理を提供します。
 */

import { createYoga, createSchema } from "npm:graphql-yoga";
import { typeDefs } from "./schema/mod.ts";
import { resolvers } from "./resolvers/mod.ts";

// クエリハンドラーとコマンドハンドラーの型定義
interface QueryHandlers {
  // ユーザー関連
  getUserByIdQueryHandler: any;
  getUserByUsernameQueryHandler: any;
  getUserByEmailQueryHandler: any;
  getUserByDidQueryHandler: any;
  getUserByHandleQueryHandler: any;

  // コンテンツ関連
  getContentByIdQueryHandler: any;
  getContentsByUserIdQueryHandler: any;
  getContentsByRepositoryIdQueryHandler: any;
  getContentMetadataByContentIdQueryHandler: any;
  getRepositoryByIdQueryHandler: any;
  getRepositoriesByUserIdQueryHandler: any;

  // フィード関連
  getFeedByIdQueryHandler: any;
  getFeedByNameQueryHandler: any;
  getFeedsByUserIdQueryHandler: any;
  getPostByIdQueryHandler: any;
  getPostByContentIdQueryHandler: any;
  getPostsByUserIdQueryHandler: any;
  getPostsByFeedIdQueryHandler: any;

  // 表示関連
  getPageByIdQueryHandler: any;
  getPageBySlugQueryHandler: any;
  getPageByContentIdQueryHandler: any;
  getPagesByUserIdQueryHandler: any;
  getPagesByTemplateIdQueryHandler: any;
  getTemplateByIdQueryHandler: any;
  getAllTemplatesQueryHandler: any;
}

interface CommandHandlers {
  // ユーザー関連
  createUserCommandHandler: any;
  updateUserCommandHandler: any;
  deleteUserCommandHandler: any;

  // コンテンツ関連
  createContentCommandHandler: any;
  updateContentCommandHandler: any;
  deleteContentCommandHandler: any;
  createRepositoryCommandHandler: any;
  updateRepositoryCommandHandler: any;
  deleteRepositoryCommandHandler: any;

  // フィード関連
  createFeedCommandHandler: any;
  updateFeedCommandHandler: any;
  deleteFeedCommandHandler: any;
  createPostCommandHandler: any;
  updatePostCommandHandler: any;
  deletePostCommandHandler: any;
  publishPostCommandHandler: any;
  unpublishPostCommandHandler: any;

  // 表示関連
  createPageCommandHandler: any;
  updatePageCommandHandler: any;
  deletePageCommandHandler: any;
  createTemplateCommandHandler: any;
  updateTemplateCommandHandler: any;
  deleteTemplateCommandHandler: any;
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
  const schema = createSchema({
    typeDefs,
    resolvers,
  });

  return createYoga({
    schema,
    context: {
      queryHandlers,
      commandHandlers,
    },
  });
} 