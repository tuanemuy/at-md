/**
 * フィードドメインのGraphQLリゾルバー
 * 
 * フィード関連のクエリとミューテーションの実装を提供します。
 */

// リゾルバーの型定義
export const feedResolvers = {
  Query: {
    // フィードをIDで取得
    feed: async (_: any, { id }: { id: string }, { queryHandlers }: any) => {
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
      _: any,
      { userId, name }: { userId: string; name: string },
      { queryHandlers }: any
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
      _: any,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      { queryHandlers }: any
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

    // 投稿をIDで取得
    post: async (_: any, { id }: { id: string }, { queryHandlers }: any) => {
      const result = await queryHandlers.getPostByIdQueryHandler.execute({
        name: "GetPostById",
        id,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // 投稿をコンテンツIDで取得
    postByContentId: async (_: any, { contentId }: { contentId: string }, { queryHandlers }: any) => {
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
      _: any,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      { queryHandlers }: any
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
      _: any,
      { feedId, limit, offset }: { feedId: string; limit?: number; offset?: number },
      { queryHandlers }: any
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
  },

  Mutation: {
    // フィードを作成
    createFeed: async (_: any, { input }: any, { commandHandlers }: any) => {
      const result = await commandHandlers.createFeedCommandHandler.execute({
        name: "CreateFeed",
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
        message: "Feed created successfully",
        feed: result.value,
      };
    },

    // フィードを更新
    updateFeed: async (_: any, { id, input }: any, { commandHandlers }: any) => {
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

    // フィードを削除
    deleteFeed: async (_: any, { id }: { id: string }, { commandHandlers }: any) => {
      const result = await commandHandlers.deleteFeedCommandHandler.execute({
        name: "DeleteFeed",
        id,
      });

      if (result.isErr()) {
        return false;
      }

      return true;
    },

    // 投稿を作成
    createPost: async (_: any, { input }: any, { commandHandlers }: any) => {
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

    // 投稿を更新
    updatePost: async (_: any, { id, input }: any, { commandHandlers }: any) => {
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

    // 投稿を削除
    deletePost: async (_: any, { id }: { id: string }, { commandHandlers }: any) => {
      const result = await commandHandlers.deletePostCommandHandler.execute({
        name: "DeletePost",
        id,
      });

      if (result.isErr()) {
        return false;
      }

      return true;
    },

    // 投稿を公開
    publishPost: async (_: any, { id }: { id: string }, { commandHandlers }: any) => {
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

    // 投稿の公開を取り消し
    unpublishPost: async (_: any, { id }: { id: string }, { commandHandlers }: any) => {
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
    // ユーザー情報を取得
    user: async (parent: any, _: any, { queryHandlers }: any) => {
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

    // 投稿一覧を取得
    posts: async (parent: any, _: any, { queryHandlers }: any) => {
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
    // フィード情報を取得
    feed: async (parent: any, _: any, { queryHandlers }: any) => {
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

    // コンテンツ情報を取得
    content: async (parent: any, _: any, { queryHandlers }: any) => {
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