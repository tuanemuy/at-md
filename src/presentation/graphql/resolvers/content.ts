/**
 * コンテンツドメインのGraphQLリゾルバー
 * 
 * コンテンツ関連のクエリとミューテーションの実装を提供します。
 */

// リゾルバーの型定義
export const contentResolvers = {
  Query: {
    // コンテンツをIDで取得
    content: async (_: any, { id }: { id: string }, { queryHandlers }: any) => {
      const result = await queryHandlers.getContentByIdQueryHandler.execute({
        name: "GetContentById",
        id,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // ユーザーIDによるコンテンツ一覧取得
    contentsByUserId: async (
      _: any,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      { queryHandlers }: any
    ) => {
      const result = await queryHandlers.getContentsByUserIdQueryHandler.execute({
        name: "GetContentsByUserId",
        userId,
        limit,
        offset,
      });

      if (result.isErr()) {
        return [];
      }

      return result.value;
    },

    // リポジトリをIDで取得
    repository: async (_: any, { id }: { id: string }, { queryHandlers }: any) => {
      const result = await queryHandlers.getRepositoryByIdQueryHandler.execute({
        name: "GetRepositoryById",
        id,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // ユーザーIDによるリポジトリ一覧取得
    repositoriesByUserId: async (
      _: any,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      { queryHandlers }: any
    ) => {
      const result = await queryHandlers.getRepositoriesByUserIdQueryHandler.execute({
        name: "GetRepositoriesByUserId",
        userId,
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
    // コンテンツを作成
    createContent: async (_: any, { input }: any, { commandHandlers }: any) => {
      const result = await commandHandlers.createContentCommandHandler.execute({
        name: "CreateContent",
        ...input,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          content: null,
        };
      }

      return {
        success: true,
        message: "Content created successfully",
        content: result.value,
      };
    },

    // コンテンツを更新
    updateContent: async (_: any, { id, input }: any, { commandHandlers }: any) => {
      const result = await commandHandlers.updateContentCommandHandler.execute({
        name: "UpdateContent",
        id,
        ...input,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          content: null,
        };
      }

      return {
        success: true,
        message: "Content updated successfully",
        content: result.value,
      };
    },

    // コンテンツを削除
    deleteContent: async (_: any, { id }: { id: string }, { commandHandlers }: any) => {
      const result = await commandHandlers.deleteContentCommandHandler.execute({
        name: "DeleteContent",
        id,
      });

      if (result.isErr()) {
        return false;
      }

      return true;
    },

    // リポジトリを作成
    createRepository: async (_: any, { input }: any, { commandHandlers }: any) => {
      const result = await commandHandlers.createRepositoryCommandHandler.execute({
        name: "CreateRepository",
        ...input,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          repository: null,
        };
      }

      return {
        success: true,
        message: "Repository created successfully",
        repository: result.value,
      };
    },

    // リポジトリを更新
    updateRepository: async (_: any, { id, input }: any, { commandHandlers }: any) => {
      const result = await commandHandlers.updateRepositoryCommandHandler.execute({
        name: "UpdateRepository",
        id,
        ...input,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          repository: null,
        };
      }

      return {
        success: true,
        message: "Repository updated successfully",
        repository: result.value,
      };
    },

    // リポジトリを削除
    deleteRepository: async (_: any, { id }: { id: string }, { commandHandlers }: any) => {
      const result = await commandHandlers.deleteRepositoryCommandHandler.execute({
        name: "DeleteRepository",
        id,
      });

      if (result.isErr()) {
        return false;
      }

      return true;
    },
  },

  // Content型のリゾルバー
  Content: {
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

    // リポジトリ情報を取得
    repository: async (parent: any, _: any, { queryHandlers }: any) => {
      if (!parent.repositoryId) return null;

      const result = await queryHandlers.getRepositoryByIdQueryHandler.execute({
        name: "GetRepositoryById",
        id: parent.repositoryId,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // メタデータを取得
    metadata: async (parent: any, _: any, { queryHandlers }: any) => {
      if (!parent.id) return null;

      const result = await queryHandlers.getContentMetadataByContentIdQueryHandler.execute({
        name: "GetContentMetadataByContentId",
        contentId: parent.id,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },
  },

  // Repository型のリゾルバー
  Repository: {
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

    // コンテンツ一覧を取得
    contents: async (parent: any, _: any, { queryHandlers }: any) => {
      if (!parent.id) return [];

      const result = await queryHandlers.getContentsByRepositoryIdQueryHandler.execute({
        name: "GetContentsByRepositoryId",
        repositoryId: parent.id,
      });

      if (result.isErr()) {
        return [];
      }

      return result.value;
    },
  },

  // ContentMetadata型のリゾルバー
  ContentMetadata: {
    // 必要に応じて関連データを取得するリゾルバーを追加
  },
}; 