/**
 * 表示ドメインのGraphQLリゾルバー
 * 
 * 表示関連のクエリとミューテーションの実装を提供します。
 */

import { Result, ApplicationError } from "../deps.ts";

// コンテキスト型の定義
interface GraphQLContext {
  queryHandlers: {
    getPageByIdQueryHandler: {
      execute(query: { name: string; id: string }): Promise<Result<unknown, ApplicationError>>;
    };
    getPageBySlugQueryHandler: {
      execute(query: { name: string; slug: string }): Promise<Result<unknown, ApplicationError>>;
    };
    getPageByContentIdQueryHandler: {
      execute(query: { name: string; contentId: string }): Promise<Result<unknown, ApplicationError>>;
    };
    getPagesByUserIdQueryHandler: {
      execute(query: { name: string; userId: string; limit?: number; offset?: number }): Promise<Result<unknown[], ApplicationError>>;
    };
    getPagesByTemplateIdQueryHandler: {
      execute(query: { name: string; templateId: string; limit?: number; offset?: number }): Promise<Result<unknown[], ApplicationError>>;
    };
    getTemplateByIdQueryHandler: {
      execute(query: { name: string; id: string }): Promise<Result<unknown, ApplicationError>>;
    };
    getAllTemplatesQueryHandler: {
      execute(query: { name: string }): Promise<Result<unknown[], ApplicationError>>;
    };
    getUserByIdQueryHandler: {
      execute(query: { name: string; id: string }): Promise<Result<unknown, ApplicationError>>;
    };
    getContentByIdQueryHandler: {
      execute(query: { name: string; id: string }): Promise<Result<unknown, ApplicationError>>;
    };
  };
  commandHandlers: {
    createPageCommandHandler: {
      execute(command: { name: string; userId: string; contentId: string; templateId?: string; slug?: string }): Promise<Result<unknown, ApplicationError>>;
    };
    updatePageCommandHandler: {
      execute(command: { id: string; contentId?: string; templateId?: string; slug?: string }): Promise<Result<unknown, ApplicationError>>;
    };
    deletePageCommandHandler: {
      execute(command: { id: string }): Promise<Result<boolean, ApplicationError>>;
    };
    createTemplateCommandHandler: {
      execute(command: { name: string; userId: string; content: string }): Promise<Result<unknown, ApplicationError>>;
    };
    updateTemplateCommandHandler: {
      execute(command: { id: string; name?: string; content?: string }): Promise<Result<unknown, ApplicationError>>;
    };
    deleteTemplateCommandHandler: {
      execute(command: { id: string }): Promise<Result<boolean, ApplicationError>>;
    };
  };
}

// リゾルバーの型定義
export const displayResolvers = {
  Query: {
    page: async (_: unknown, { id }: { id: string }, { queryHandlers }: GraphQLContext) => {
      const result = await queryHandlers.getPageByIdQueryHandler.execute({
        name: "GetPageById",
        id,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    pageBySlug: async (_: unknown, { slug }: { slug: string }, { queryHandlers }: GraphQLContext) => {
      const result = await queryHandlers.getPageBySlugQueryHandler.execute({
        name: "GetPageBySlug",
        slug,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    pageByContentId: async (_: unknown, { contentId }: { contentId: string }, { queryHandlers }: GraphQLContext) => {
      const result = await queryHandlers.getPageByContentIdQueryHandler.execute({
        name: "GetPageByContentId",
        contentId,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // ユーザーIDによるページ一覧取得
    pagesByUserId: async (
      _: unknown,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      { queryHandlers }: GraphQLContext
    ) => {
      const result = await queryHandlers.getPagesByUserIdQueryHandler.execute({
        name: "GetPagesByUserId",
        userId,
        limit,
        offset,
      });

      if (result.isErr()) {
        return [];
      }

      return result.value;
    },

    template: async (_: unknown, { id }: { id: string }, { queryHandlers }: GraphQLContext) => {
      const result = await queryHandlers.getTemplateByIdQueryHandler.execute({
        name: "GetTemplateById",
        id,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    templates: async (_: unknown, __: unknown, { queryHandlers }: GraphQLContext) => {
      const result = await queryHandlers.getAllTemplatesQueryHandler.execute({
        name: "GetAllTemplates",
      });

      if (result.isErr()) {
        return [];
      }

      return result.value;
    },

    // テンプレートIDによるページ一覧取得
    pagesByTemplateId: async (
      _: unknown,
      { templateId, limit, offset }: { templateId: string; limit?: number; offset?: number },
      { queryHandlers }: GraphQLContext
    ) => {
      const result = await queryHandlers.getPagesByTemplateIdQueryHandler.execute({
        name: "GetPagesByTemplateId",
        templateId,
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
    createPage: async (
      _: unknown,
      { input }: { input: { userId: string; contentId: string; templateId?: string; slug?: string } },
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.createPageCommandHandler.execute({
        name: "CreatePage",
        userId: input.userId,
        contentId: input.contentId,
        templateId: input.templateId,
        slug: input.slug,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          page: null,
        };
      }

      return {
        success: true,
        message: "ページが作成されました",
        page: result.value,
      };
    },

    updatePage: async (
      _: unknown,
      { id, input }: { id: string; input: { contentId?: string; templateId?: string; slug?: string } },
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.updatePageCommandHandler.execute({
        id,
        contentId: input.contentId,
        templateId: input.templateId,
        slug: input.slug,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          page: null,
        };
      }

      return {
        success: true,
        message: "ページが更新されました",
        page: result.value,
      };
    },

    deletePage: async (
      _: unknown,
      { id }: { id: string },
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.deletePageCommandHandler.execute({
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
        message: "ページが削除されました",
      };
    },

    createTemplate: async (
      _: unknown,
      { input }: { input: { name: string; userId: string; content: string } },
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.createTemplateCommandHandler.execute({
        name: input.name,
        userId: input.userId,
        content: input.content,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          template: null,
        };
      }

      return {
        success: true,
        message: "テンプレートが作成されました",
        template: result.value,
      };
    },

    updateTemplate: async (
      _: unknown,
      { id, input }: { id: string; input: { name?: string; content?: string } },
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.updateTemplateCommandHandler.execute({
        id,
        name: input.name,
        content: input.content,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          template: null,
        };
      }

      return {
        success: true,
        message: "テンプレートが更新されました",
        template: result.value,
      };
    },

    deleteTemplate: async (
      _: unknown,
      { id }: { id: string },
      { commandHandlers }: GraphQLContext
    ) => {
      const result = await commandHandlers.deleteTemplateCommandHandler.execute({
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
        message: "テンプレートが削除されました",
      };
    },
  },

  // Page型のリゾルバー
  Page: {
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

    template: async (parent: { templateId?: string }, _: unknown, { queryHandlers }: GraphQLContext) => {
      if (!parent.templateId) return null;

      const result = await queryHandlers.getTemplateByIdQueryHandler.execute({
        name: "GetTemplateById",
        id: parent.templateId,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    }
  },

  // Template型のリゾルバー
  Template: {
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

    pages: async (parent: { id?: string }, _: unknown, { queryHandlers }: GraphQLContext) => {
      if (!parent.id) return [];

      const result = await queryHandlers.getPagesByTemplateIdQueryHandler.execute({
        name: "GetPagesByTemplateId",
        templateId: parent.id,
      });

      if (result.isErr()) {
        return [];
      }

      return result.value;
    }
  },
}; 