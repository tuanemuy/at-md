/**
 * GraphQLリゾルバーのエントリーポイント
 * 
 * 各ドメインのリゾルバーを統合して提供します。
 */

// 各ドメインのリゾルバーをインポート
import { userResolvers } from "./user.ts";
import { contentResolvers } from "./content.ts";
import { feedResolvers } from "./feed.ts";
import { displayResolvers } from "./display.ts";

// すべてのリゾルバーを結合
export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...contentResolvers.Query,
    ...feedResolvers.Query,
    ...displayResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...contentResolvers.Mutation,
    ...feedResolvers.Mutation,
    ...displayResolvers.Mutation,
  },
  // 型リゾルバー
  User: userResolvers.User,
  Content: contentResolvers.Content,
  Repository: contentResolvers.Repository,
  ContentMetadata: contentResolvers.ContentMetadata,
  Feed: feedResolvers.Feed,
  Post: feedResolvers.Post,
  Page: displayResolvers.Page,
  Template: displayResolvers.Template,
}; 