/**
 * ユーザードメインのGraphQLリゾルバー
 * 
 * ユーザー関連のクエリとミューテーションの実装を提供します。
 */

import { GetUserByIdQueryHandler } from "../../../application/account/queries/get-user-by-id-query.ts";
import { GetUserByUsernameQueryHandler } from "../../../application/account/queries/get-user-by-username-query.ts";
import { GetUserByEmailQueryHandler } from "../../../application/account/queries/get-user-by-email-query.ts";
import { GetUserByDidQueryHandler } from "../../../application/account/queries/get-user-by-did-query.ts";
import { GetUserByHandleQueryHandler } from "../../../application/account/queries/get-user-by-handle-query.ts";
import { CreateUserCommandHandler } from "../../../application/account/commands/create-user-command.ts";

// リゾルバーの型定義
export const userResolvers = {
  Query: {
    // ユーザーをIDで取得
    user: async (_: any, { id }: { id: string }, { queryHandlers }: any) => {
      const result = await queryHandlers.getUserByIdQueryHandler.execute({
        name: "GetUserById",
        id,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // ユーザーをユーザー名で取得
    userByUsername: async (_: any, { username }: { username: string }, { queryHandlers }: any) => {
      const result = await queryHandlers.getUserByUsernameQueryHandler.execute({
        name: "GetUserByUsername",
        username,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // ユーザーをメールアドレスで取得
    userByEmail: async (_: any, { email }: { email: string }, { queryHandlers }: any) => {
      const result = await queryHandlers.getUserByEmailQueryHandler.execute({
        name: "GetUserByEmail",
        email,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // ユーザーをDIDで取得
    userByDid: async (_: any, { did }: { did: string }, { queryHandlers }: any) => {
      const result = await queryHandlers.getUserByDidQueryHandler.execute({
        name: "GetUserByDid",
        did,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },

    // ユーザーをハンドルで取得
    userByHandle: async (_: any, { handle }: { handle: string }, { queryHandlers }: any) => {
      const result = await queryHandlers.getUserByHandleQueryHandler.execute({
        name: "GetUserByHandle",
        handle,
      });

      if (result.isErr()) {
        return null;
      }

      return result.value;
    },
  },

  Mutation: {
    // ユーザーを作成
    createUser: async (_: any, { input }: any, { commandHandlers }: any) => {
      const result = await commandHandlers.createUserCommandHandler.execute({
        name: "CreateUser",
        ...input,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          user: null,
        };
      }

      return {
        success: true,
        message: "User created successfully",
        user: result.value,
      };
    },

    // ユーザーを更新
    updateUser: async (_: any, { id, input }: any, { commandHandlers }: any) => {
      const result = await commandHandlers.updateUserCommandHandler.execute({
        name: "UpdateUser",
        id,
        ...input,
      });

      if (result.isErr()) {
        return {
          success: false,
          message: result.error.message,
          user: null,
        };
      }

      return {
        success: true,
        message: "User updated successfully",
        user: result.value,
      };
    },

    // ユーザーを削除
    deleteUser: async (_: any, { id }: { id: string }, { commandHandlers }: any) => {
      const result = await commandHandlers.deleteUserCommandHandler.execute({
        name: "DeleteUser",
        id,
      });

      if (result.isErr()) {
        return false;
      }

      return true;
    },
  },

  // User型のリゾルバー
  User: {
    // 必要に応じて関連データを取得するリゾルバーを追加
  },
}; 