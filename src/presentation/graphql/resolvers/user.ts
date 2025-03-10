/**
 * ユーザードメインのGraphQLリゾルバー
 * 
 * ユーザー関連のクエリとミューテーションの実装を提供します。
 */

import {
  Result,
  ok,
  err,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  GetUserByIdQuery,
  GetUserByIdQueryHandler,
  GetUserByUsernameQuery,
  GetUserByUsernameQueryHandler,
  GetUserByEmailQuery,
  GetUserByEmailQueryHandler,
  GetUserByDidQuery,
  GetUserByDidQueryHandler,
  GetUserByHandleQuery,
  GetUserByHandleQueryHandler,
  CreateUserCommand,
  CreateUserCommandHandler,
  createUser,
  createEmail,
  createUsername,
  createAtIdentifier
} from "../deps.ts";

import type {
  User,
  UserRepository
} from "../deps.ts";

// コンテキスト型の定義
interface GraphQLContext {
  userRepository: UserRepository;
  commandHandlers?: {
    updateUserCommandHandler: { execute: (command: { name: string; id: string; [key: string]: unknown }) => Promise<Result<User, ApplicationError>> };
    deleteUserCommandHandler: { execute: (command: { name: string; id: string }) => Promise<Result<boolean, ApplicationError>> };
  };
}

// リゾルバーの型定義
export const userResolvers = {
  Query: {
    /**
     * IDによるユーザー取得
     */
    getUserById: async (_: unknown, { id }: { id: string }, { userRepository }: GraphQLContext): Promise<Result<User, ApplicationError>> => {
      try {
        const query: GetUserByIdQuery = {
          name: "GetUserById",
          id
        };
        
        const handler = new GetUserByIdQueryHandler(userRepository);
        const result = await handler.execute(query);
        
        if (result.isErr()) {
          return err(result.error);
        }
        
        if (!result.value) {
          return err(new EntityNotFoundError("User", `ユーザーが見つかりません: ${id}`));
        }
        
        // UserAggregateからUserへの変換
        const userAggregate = result.value;
        const user = createUser({
          id: userAggregate.user.id,
          username: userAggregate.user.username,
          email: userAggregate.user.email,
          atIdentifier: userAggregate.user.atIdentifier,
          did: userAggregate.user.did,
          passwordHash: userAggregate.user.passwordHash
        });
        
        return ok(user);
      } catch (error) {
        return err(new ApplicationError(`ユーザー取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`));
      }
    },
    
    /**
     * ユーザー名によるユーザー取得
     */
    getUserByUsername: async (_: unknown, { username }: { username: string }, { userRepository }: GraphQLContext): Promise<Result<User, ApplicationError>> => {
      try {
        const query: GetUserByUsernameQuery = {
          name: "GetUserByUsername",
          username
        };
        
        const handler = new GetUserByUsernameQueryHandler(userRepository);
        const result = await handler.execute(query);
        
        if (result.isErr()) {
          return err(result.error);
        }
        
        if (!result.value) {
          return err(new EntityNotFoundError("User", `ユーザーが見つかりません: ${username}`));
        }
        
        // UserAggregateからUserへの変換
        const userAggregate = result.value;
        const user = createUser({
          id: userAggregate.user.id,
          username: userAggregate.user.username,
          email: userAggregate.user.email,
          atIdentifier: userAggregate.user.atIdentifier,
          did: userAggregate.user.did,
          passwordHash: userAggregate.user.passwordHash
        });
        
        return ok(user);
      } catch (error) {
        return err(new ApplicationError(`ユーザー取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`));
      }
    },
    
    /**
     * メールアドレスによるユーザー取得
     */
    getUserByEmail: async (_: unknown, { email }: { email: string }, { userRepository }: GraphQLContext): Promise<Result<User, ApplicationError>> => {
      try {
        const query: GetUserByEmailQuery = {
          name: "GetUserByEmail",
          email
        };
        
        const handler = new GetUserByEmailQueryHandler(userRepository);
        const result = await handler.execute(query);
        
        if (result.isErr()) {
          return err(result.error);
        }
        
        if (!result.value) {
          return err(new EntityNotFoundError("User", `ユーザーが見つかりません: ${email}`));
        }
        
        // UserAggregateからUserへの変換
        const userAggregate = result.value;
        const user = createUser({
          id: userAggregate.user.id,
          username: userAggregate.user.username,
          email: userAggregate.user.email,
          atIdentifier: userAggregate.user.atIdentifier,
          did: userAggregate.user.did,
          passwordHash: userAggregate.user.passwordHash
        });
        
        return ok(user);
      } catch (error) {
        return err(new ApplicationError(`ユーザー取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`));
      }
    },
    
    /**
     * DIDによるユーザー取得
     */
    getUserByDid: async (_: unknown, { did }: { did: string }, { userRepository }: GraphQLContext): Promise<Result<User, ApplicationError>> => {
      try {
        const query: GetUserByDidQuery = {
          name: "GetUserByDid",
          did
        };
        
        const handler = new GetUserByDidQueryHandler(userRepository);
        const result = await handler.execute(query);
        
        if (result.isErr()) {
          return err(result.error);
        }
        
        if (!result.value) {
          return err(new EntityNotFoundError("User", `ユーザーが見つかりません: ${did}`));
        }
        
        // UserAggregateからUserへの変換
        const userAggregate = result.value;
        const user = createUser({
          id: userAggregate.user.id,
          username: userAggregate.user.username,
          email: userAggregate.user.email,
          atIdentifier: userAggregate.user.atIdentifier,
          did: userAggregate.user.did,
          passwordHash: userAggregate.user.passwordHash
        });
        
        return ok(user);
      } catch (error) {
        return err(new ApplicationError(`ユーザー取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`));
      }
    },
    
    /**
     * ハンドルによるユーザー取得
     */
    getUserByHandle: async (_: unknown, { handle }: { handle: string }, { userRepository }: GraphQLContext): Promise<Result<User, ApplicationError>> => {
      try {
        const query: GetUserByHandleQuery = {
          name: "GetUserByHandle",
          handle
        };
        
        const handler = new GetUserByHandleQueryHandler(userRepository);
        const result = await handler.execute(query);
        
        if (result.isErr()) {
          return err(result.error);
        }
        
        if (!result.value) {
          return err(new EntityNotFoundError("User", `ユーザーが見つかりません: ${handle}`));
        }
        
        // UserAggregateからUserへの変換
        const userAggregate = result.value;
        const user = createUser({
          id: userAggregate.user.id,
          username: userAggregate.user.username,
          email: userAggregate.user.email,
          atIdentifier: userAggregate.user.atIdentifier,
          did: userAggregate.user.did,
          passwordHash: userAggregate.user.passwordHash
        });
        
        return ok(user);
      } catch (error) {
        return err(new ApplicationError(`ユーザー取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`));
      }
    }
  },

  Mutation: {
    /**
     * ユーザー作成
     */
    createUser: async (
      _: unknown, 
      { input }: { input: { username: string; email: string; handle?: string } }, 
      { userRepository }: GraphQLContext
    ): Promise<Result<User, ApplicationError>> => {
      try {
        const command: CreateUserCommand = {
          name: "CreateUser",
          username: input.username,
          email: input.email,
          id: crypto.randomUUID(),
          atIdentifier: {
            did: `did:plc:${crypto.randomUUID()}`,
            handle: input.handle
          }
        };
        
        const handler = new CreateUserCommandHandler(userRepository);
        const result = await handler.execute(command);
        
        if (result.isErr()) {
          return err(result.error);
        }
        
        // UserAggregateからUserへの変換
        const userAggregate = result.value;
        const user = createUser({
          id: userAggregate.user.id,
          username: userAggregate.user.username,
          email: userAggregate.user.email,
          atIdentifier: userAggregate.user.atIdentifier,
          did: userAggregate.user.did,
          passwordHash: userAggregate.user.passwordHash
        });
        
        return ok(user);
      } catch (error) {
        return err(new ApplicationError(`ユーザー作成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`));
      }
    },

    /**
     * ユーザー更新
     */
    updateUser: async (
      _: unknown, 
      { id, input }: { id: string; input: { username?: string; email?: string; handle?: string } }, 
      { commandHandlers }: { commandHandlers: { updateUserCommandHandler: { execute: (command: { name: string; id: string; [key: string]: unknown }) => Promise<Result<User, ApplicationError>> } } }
    ) => {
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

    /**
     * ユーザー削除
     */
    deleteUser: async (
      _: unknown, 
      { id }: { id: string }, 
      { commandHandlers }: { commandHandlers: { deleteUserCommandHandler: { execute: (command: { name: string; id: string }) => Promise<Result<boolean, ApplicationError>> } } }
    ) => {
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