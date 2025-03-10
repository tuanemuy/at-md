/**
 * フィードドメインのGraphQLリゾルバー
 * 
 * フィード関連のクエリとミューテーションの実装を提供します。
 */
import { Result } from "npm:neverthrow";
import { 
  ApplicationError,
  PostAggregate
} from "../deps.ts";
import type {
  Feed,
  User,
  Content
} from "../deps.ts";

// GraphQLコンテキストの型定義
interface GraphQLContext {
  queryHandlers: {
    getFeedByIdQueryHandler: { execute: (query: { name: string; id: string }) => Promise<Result<Feed, ApplicationError>> };
    getFeedByNameQueryHandler: { execute: (query: { name: string; userId: string; feedName: string }) => Promise<Result<Feed, ApplicationError>> };
    getFeedsByUserIdQueryHandler: { execute: (query: { name: string; userId: string; limit?: number; offset?: number }) => Promise<Result<Feed[], ApplicationError>> };
    getPostByIdQueryHandler: { execute: (query: { name: string; id: string }) => Promise<Result<PostAggregate, ApplicationError>> };
    getPostByContentIdQueryHandler: { execute: (query: { name: string; contentId: string }) => Promise<Result<PostAggregate, ApplicationError>> };
    getPostsByUserIdQueryHandler: { execute: (query: { name: string; userId: string; limit?: number; offset?: number }) => Promise<Result<PostAggregate[], ApplicationError>> };
    getPostsByFeedIdQueryHandler: { execute: (query: { name: string; feedId: string; limit?: number; offset?: number }) => Promise<Result<PostAggregate[], ApplicationError>> };
    getAllFeedsQueryHandler: { execute: (query: { name: string }) => Promise<Result<Feed[], ApplicationError>> };
    getUserByIdQueryHandler: { execute: (query: { name: string; id: string }) => Promise<Result<User, ApplicationError>> };
    getContentByIdQueryHandler: { execute: (query: { name: string; id: string }) => Promise<Result<Content, ApplicationError>> };
  };
  commandHandlers: {
    createFeedCommandHandler: { execute: (command: { name: string; [key: string]: unknown }) => Promise<Result<Feed, ApplicationError>> };
    updateFeedCommandHandler: { execute: (command: { name: string; id: string; [key: string]: unknown }) => Promise<Result<Feed, ApplicationError>> };
    deleteFeedCommandHandler: { execute: (command: { name: string; id: string }) => Promise<Result<boolean, ApplicationError>> };
    createPostCommandHandler: { execute: (command: { name: string; [key: string]: unknown }) => Promise<Result<PostAggregate, ApplicationError>> };
    updatePostCommandHandler: { execute: (command: { name: string; id: string; [key: string]: unknown }) => Promise<Result<PostAggregate, ApplicationError>> };
    deletePostCommandHandler: { execute: (command: { name: string; id: string }) => Promise<Result<boolean, ApplicationError>> };
    publishPostCommandHandler: { execute: (command: { name: string; id: string }) => Promise<Result<PostAggregate, ApplicationError>> };
    unpublishPostCommandHandler: { execute: (command: { name: string; id: string }) => Promise<Result<PostAggregate, ApplicationError>> };
  };
}

// リゾルバーの型定義
export const feedResolvers = {
  Query: {
    feed: async (_: unknown, { id }: { id: string }, { queryHandlers }: GraphQLContext) => {
      const result = await queryHandlers.getFeedByIdQueryHandler.execute({
        name: "GetFeedById",
        id,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // フィードを名前で取得
    feedByName: async (
      _: unknown,
      { userId, name }: { userId: string; name: string },
      { queryHandlers }: GraphQLContext
    ) => {
      const result = await queryHandlers.getFeedByNameQueryHandler.execute({
        name: "GetFeedByName",
        userId,
        feedName: name,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // ユーザーIDによるフィード一覧取得
    feedsByUserId: async (
      _: unknown,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      { queryHandlers }: GraphQLContext
    ) => {
      const result = await queryHandlers.getFeedsByUserIdQueryHandler.execute({
        name: "GetFeedsByUserId",
        userId,
        limit,
        offset,
      });

      if (result.isErr()) {
        return [];
      }

      return result.value;
    },

    post: async (_: unknown, { id }: { id: string }, { queryHandlers }: GraphQLContext) => {
      const result = await queryHandlers.getPostByIdQueryHandler.execute({
        name: "GetPostById",
        id,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    postByContentId: async (_: unknown, { contentId }: { contentId: string }, { queryHandlers }: GraphQLContext) => {
      const result = await queryHandlers.getPostByContentIdQueryHandler.execute({
        name: "GetPostByContentId",
        contentId,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // ユーザーIDによる投稿一覧取得
    postsByUserId: async (
      _: unknown,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      { queryHandlers }: GraphQLContext
    ) => {
      const result = await queryHandlers.getPostsByUserIdQueryHandler.execute({
        name: "GetPostsByUserId",
        userId,
        limit,
        offset,
      });

      if (result.isErr()) {
        return [];
      }

      return result.value;
    },

    // フィードIDによる投稿一覧取得
    postsByFeedId: async (
      _: unknown,
      { feedId, limit, offset }: { feedId: string; limit?: number; offset?: number },
      { queryHandlers }: GraphQLContext
    ) => {
      const result = await queryHandlers.getPostsByFeedIdQueryHandler.execute({
        name: "GetPostsByFeedId",
        feedId,
        limit,
        offset,
      });

      if (result.isErr()) {
        return [];
      }

      return result.value;
    },

    feedBySlug: async (_: unknown, { slug }: { slug: string }, { queryHandlers }: GraphQLContext) => {
      // ... existing code ...
    },

    allFeeds: async (_: unknown, __: unknown, { queryHandlers }: GraphQLContext) => {
      // ... existing code ...
    }
  },

  Mutation: {
    createFeed: async (
      _: unknown, 
      { input }: { input: { userId: string; name: string; description?: string; isPublic?: boolean } }, 
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.createFeedCommandHandler.execute({
        name: "CreateFeed",
        userId: input.userId,
        description: input.description,
        isPublic: input.isPublic,
        feedName: input.name
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          feed: null,
        };
      }

      return {
        success: true,
        message: "Feed created successfully",
        feed: result.value,
      };
    },

    updateFeed: async (
      _: unknown, 
      { id, input }: { id: string; input: { name?: string; description?: string; isPublic?: boolean } }, 
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.updateFeedCommandHandler.execute({
        name: "UpdateFeed",
        id,
        ...input,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          feed: null,
        };
      }

      return {
        success: true,
        message: "Feed updated successfully",
        feed: result.value,
      };
    },

    deleteFeed: async (_: unknown, { id }: { id: string }, { commandHandlers }: GraphQLContext) => {
      const result = await commandHandlers.deleteFeedCommandHandler.execute({
        name: "DeleteFeed",
        id,
      });

      if (result.isErr()) {
        return false;
      }

      return true;
    },

    createPost: async (
      _: unknown, 
      { input }: { input: { userId: string; feedId: string; contentId: string; title?: string; description?: string } }, 
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.createPostCommandHandler.execute({
        name: "CreatePost",
        ...input,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          post: null,
        };
      }

      return {
        success: true,
        message: "Post created successfully",
        post: result.value,
      };
    },

    updatePost: async (
      _: unknown, 
      { id, input }: { id: string; input: { title?: string; description?: string } }, 
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.updatePostCommandHandler.execute({
        name: "UpdatePost",
        id,
        ...input,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          post: null,
        };
      }

      return {
        success: true,
        message: "Post updated successfully",
        post: result.value,
      };
    },

    deletePost: async (_: unknown, { id }: { id: string }, { commandHandlers }: GraphQLContext) => {
      const result = await commandHandlers.deletePostCommandHandler.execute({
        name: "DeletePost",
        id,
      });

      if (result.isErr()) {
        return false;
      }

      return true;
    },

    publishPost: async (_: unknown, { id }: { id: string }, { commandHandlers }: GraphQLContext) => {
      const result = await commandHandlers.publishPostCommandHandler.execute({
        name: "PublishPost",
        id,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          post: null,
        };
      }

      return {
        success: true,
        message: "Post published successfully",
        post: result.value,
      };
    },

    unpublishPost: async (_: unknown, { id }: { id: string }, { commandHandlers }: GraphQLContext) => {
      const result = await commandHandlers.unpublishPostCommandHandler.execute({
        name: "UnpublishPost",
        id,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          post: null,
        };
      }

      return {
        success: true,
        message: "Post unpublished successfully",
        post: result.value,
      };
    },
  },

  // Feed型のリゾルバー
  Feed: {
    user: async (parent: { userId?: string }, _: unknown, { queryHandlers }: GraphQLContext) => {
      if (!parent.userId) return null;

      const result = await queryHandlers.getUserByIdQueryHandler.execute({
        name: "GetUserById",
        id: parent.userId,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    posts: async (parent: { id?: string }, _: unknown, { queryHandlers }: GraphQLContext) => {
      if (!parent.id) return [];

      const result = await queryHandlers.getPostsByFeedIdQueryHandler.execute({
        name: "GetPostsByFeedId",
        feedId: parent.id,
      });

      if (result.isErr()) {
        return [];
      }

      return result.value;
    },
  },

  // Post型のリゾルバー
  Post: {
    feed: async (parent: { feedId?: string }, _: unknown, { queryHandlers }: GraphQLContext) => {
      if (!parent.feedId) return null;

      const result = await queryHandlers.getFeedByIdQueryHandler.execute({
        name: "GetFeedById",
        id: parent.feedId,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    content: async (parent: { contentId?: string }, _: unknown, { queryHandlers }: GraphQLContext) => {
      if (!parent.contentId) return null;

      const result = await queryHandlers.getContentByIdQueryHandler.execute({
        name: "GetContentById",
        id: parent.contentId,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },
  },
}; 