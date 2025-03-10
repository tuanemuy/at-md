/**
 * コンテンツドメインのGraphQLリゾルバー
 * 
 * コンテンツ関連のクエリとミューテーションの実装を提供します。
 */

import { Result, ApplicationError } from "../deps.ts";

// コンテキスト型の定義
interface GraphQLContext {
  queryHandlers: {
    getContentByIdQueryHandler: {
      execute(query: { name: string; id: string }): Promise<Result<unknown, ApplicationError>>;
    };
    getContentsByUserIdQueryHandler: {
      execute(query: { name: string; userId: string; limit?: number; offset?: number }): Promise<Result<unknown[], ApplicationError>>;
    };
    getContentsByRepositoryIdQueryHandler: {
      execute(query: { name: string; repositoryId: string; limit?: number; offset?: number }): Promise<Result<unknown[], ApplicationError>>;
    };
    getContentMetadataByContentIdQueryHandler: {
      execute(query: { name: string; contentId: string }): Promise<Result<unknown, ApplicationError>>;
    };
    getRepositoryByIdQueryHandler: {
      execute(query: { name: string; id: string }): Promise<Result<unknown, ApplicationError>>;
    };
    getRepositoriesByUserIdQueryHandler: {
      execute(query: { name: string; userId: string; limit?: number; offset?: number }): Promise<Result<unknown[], ApplicationError>>;
    };
  };
  commandHandlers: {
    createContentCommandHandler: {
      execute(command: { name: string; repositoryId: string; content: string; metadata?: Record<string, unknown> }): Promise<Result<unknown, ApplicationError>>;
    };
    updateContentCommandHandler: {
      execute(command: { id: string; content?: string; metadata?: Record<string, unknown> }): Promise<Result<unknown, ApplicationError>>;
    };
    deleteContentCommandHandler: {
      execute(command: { id: string }): Promise<Result<boolean, ApplicationError>>;
    };
    createRepositoryCommandHandler: {
      execute(command: { name: string; userId: string; description?: string }): Promise<Result<unknown, ApplicationError>>;
    };
    updateRepositoryCommandHandler: {
      execute(command: { id: string; name?: string; description?: string }): Promise<Result<unknown, ApplicationError>>;
    };
    deleteRepositoryCommandHandler: {
      execute(command: { id: string }): Promise<Result<boolean, ApplicationError>>;
    };
  };
}

// リゾルバーの型定義
export const contentResolvers = {
  Query: {
    content: async (_: unknown, { id }: { id: string }, { queryHandlers }: GraphQLContext) => {
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
      _: unknown,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      { queryHandlers }: GraphQLContext
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

    // リポジトリの取得
    repository: async (_: unknown, { id }: { id: string }, { queryHandlers }: GraphQLContext) => {
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
      _: unknown,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      { queryHandlers }: GraphQLContext
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

    // リポジトリIDによるコンテンツ一覧取得
    contentsByRepositoryId: async (
      _: unknown,
      { repositoryId, limit, offset }: { repositoryId: string; limit?: number; offset?: number },
      { queryHandlers }: GraphQLContext
    ) => {
      const result = await queryHandlers.getContentsByRepositoryIdQueryHandler.execute({
        name: "GetContentsByRepositoryId",
        repositoryId,
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
    createContent: async (
      _: unknown, 
      { input }: { input: { repositoryId: string; content: string; metadata?: Record<string, unknown> } }, 
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.createContentCommandHandler.execute({
        name: "CreateContent",
        repositoryId: input.repositoryId,
        content: input.content,
        metadata: input.metadata,
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
        message: "コンテンツが作成されました",
        content: result.value,
      };
    },

    updateContent: async (
      _: unknown, 
      { id, input }: { id: string; input: { content?: string; metadata?: Record<string, unknown> } }, 
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.updateContentCommandHandler.execute({
        id,
        content: input.content,
        metadata: input.metadata,
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
        message: "コンテンツが更新されました",
        content: result.value,
      };
    },

    deleteContent: async (_: unknown, { id }: { id: string }, { commandHandlers }: GraphQLContext) => {
      const result = await commandHandlers.deleteContentCommandHandler.execute({
        id,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
        };
      }

      return {
        success: true,
        message: "コンテンツが削除されました",
      };
    },

    createRepository: async (
      _: unknown, 
      { input }: { input: { name: string; userId: string; description?: string } }, 
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.createRepositoryCommandHandler.execute({
        name: "CreateRepository",
        userId: input.userId,
        description: input.description,
      });

      if (result.isErr()) {
        throw new Error(result.error.message);
      }

      return result.value;
    },

    updateRepository: async (
      _: unknown, 
      { id, input }: { id: string; input: { name?: string; description?: string } }, 
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.updateRepositoryCommandHandler.execute({
        id,
        name: input.name,
        description: input.description,
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
        message: "リポジトリが更新されました",
        repository: result.value,
      };
    },

    deleteRepository: async (_: unknown, { id }: { id: string }, { commandHandlers }: GraphQLContext) => {
      const result = await commandHandlers.deleteRepositoryCommandHandler.execute({
        id,
      });

      if (result.isErr()) {
        throw new Error(result.error.message);
      }

      return true;
    },
  },

  // Content型のリゾルバー
  Content: {
    user: (parent: { userId: string }, _: unknown, { queryHandlers }: GraphQLContext) => {
      if (!parent.userId) return null;

      // ユーザーリポジトリは直接アクセスできないため、ここではダミーデータを返す
      return {
        id: parent.userId,
        username: "user",
        email: "user@example.com",
      };
    },

    repository: async (parent: { repositoryId: string }, _: unknown, { queryHandlers }: GraphQLContext) => {
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

    metadata: (parent: { metadata?: Record<string, unknown> }, _: unknown, { queryHandlers }: GraphQLContext) => {
      return parent.metadata || {
        tags: [],
        categories: [],
        language: "ja",
      };
    },
  },

  // Repository型のリゾルバー
  Repository: {
    user: (parent: { userId: string }, _: unknown, { queryHandlers }: GraphQLContext) => {
      if (!parent.userId) return null;

      // ユーザーリポジトリは直接アクセスできないため、ここではダミーデータを返す
      return {
        id: parent.userId,
        username: "user",
        email: "user@example.com",
      };
    },

    contents: async (parent: { id: string }, _: unknown, { queryHandlers }: GraphQLContext) => {
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