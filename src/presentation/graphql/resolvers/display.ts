/**
 * 表示ドメインのGraphQLリゾルバー
 * 
 * 表示関連のクエリとミューテーションの実装を提供します。
 */

// リゾルバーの型定義
export const displayResolvers = {
  Query: {
    // ページをIDで取得
    page: async (_: any, { id }: { id: string }, { queryHandlers }: any) => {
      const result = await queryHandlers.getPageByIdQueryHandler.execute({
        name: "GetPageById",
        id,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // ページをスラグで取得
    pageBySlug: async (_: any, { slug }: { slug: string }, { queryHandlers }: any) => {
      const result = await queryHandlers.getPageBySlugQueryHandler.execute({
        name: "GetPageBySlug",
        slug,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // ページをコンテンツIDで取得
    pageByContentId: async (_: any, { contentId }: { contentId: string }, { queryHandlers }: any) => {
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
      _: any,
      { userId, limit, offset }: { userId: string; limit?: number; offset?: number },
      { queryHandlers }: any
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

    // テンプレートをIDで取得
    template: async (_: any, { id }: { id: string }, { queryHandlers }: any) => {
      const result = await queryHandlers.getTemplateByIdQueryHandler.execute({
        name: "GetTemplateById",
        id,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // すべてのテンプレートを取得
    allTemplates: async (_: any, __: any, { queryHandlers }: any) => {
      const result = await queryHandlers.getAllTemplatesQueryHandler.execute({
        name: "GetAllTemplates",
      });

      if (result.isErr()) {
        return [];
      }

      return result.value;
    },
  },

  Mutation: {
    // ページを作成
    createPage: async (_: any, { input }: any, { commandHandlers }: any) => {
      const result = await commandHandlers.createPageCommandHandler.execute({
        name: "CreatePage",
        ...input,
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
        message: "Page created successfully",
        page: result.value,
      };
    },

    // ページを更新
    updatePage: async (_: any, { id, input }: any, { commandHandlers }: any) => {
      const result = await commandHandlers.updatePageCommandHandler.execute({
        name: "UpdatePage",
        id,
        ...input,
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
        message: "Page updated successfully",
        page: result.value,
      };
    },

    // ページを削除
    deletePage: async (_: any, { id }: { id: string }, { commandHandlers }: any) => {
      const result = await commandHandlers.deletePageCommandHandler.execute({
        name: "DeletePage",
        id,
      });

      if (result.isErr()) {
        return false;
      }

      return true;
    },

    // テンプレートを作成
    createTemplate: async (_: any, { input }: any, { commandHandlers }: any) => {
      const result = await commandHandlers.createTemplateCommandHandler.execute({
        name: "CreateTemplate",
        ...input,
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
        message: "Template created successfully",
        template: result.value,
      };
    },

    // テンプレートを更新
    updateTemplate: async (_: any, { id, input }: any, { commandHandlers }: any) => {
      const result = await commandHandlers.updateTemplateCommandHandler.execute({
        name: "UpdateTemplate",
        id,
        ...input,
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
        message: "Template updated successfully",
        template: result.value,
      };
    },

    // テンプレートを削除
    deleteTemplate: async (_: any, { id }: { id: string }, { commandHandlers }: any) => {
      const result = await commandHandlers.deleteTemplateCommandHandler.execute({
        name: "DeleteTemplate",
        id,
      });

      if (result.isErr()) {
        return false;
      }

      return true;
    },
  },

  // Page型のリゾルバー
  Page: {
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

    // テンプレート情報を取得
    template: async (parent: any, _: any, { queryHandlers }: any) => {
      if (!parent.templateId) return null;

      const result = await queryHandlers.getTemplateByIdQueryHandler.execute({
        name: "GetTemplateById",
        id: parent.templateId,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },
  },

  // Template型のリゾルバー
  Template: {
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

    // このテンプレートを使用しているページ一覧を取得
    pages: async (parent: any, _: any, { queryHandlers }: any) => {
      if (!parent.id) return [];

      const result = await queryHandlers.getPagesByTemplateIdQueryHandler.execute({
        name: "GetPagesByTemplateId",
        templateId: parent.id,
      });

      if (result.isErr()) {
        return [];
      }

      return result.value;
    },
  },
}; 