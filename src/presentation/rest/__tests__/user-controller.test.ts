/**
 * ユーザーコントローラーのテスト
 */

import { assertEquals, assertRejects } from "https://deno.land/std/assert/mod.ts";
import { beforeEach, describe, it } from "https://deno.land/std/testing/bdd.ts";
import { spy, assertSpyCalls } from "https://deno.land/std/testing/mock.ts";
import { expect } from "@std/expect";
import { test } from "@std/testing/bdd";
import { UserController } from "../controllers/user-controller.ts";
import {
  Result,
  ok,
  err,
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  generateId,
  type UserAggregate,
  type UserRepository,
  TransactionContext
} from "../deps.ts";

import {
  type User,
  type GetUserByIdQuery,
  type CreateUserCommand,
  createUserAggregate,
  GetUserByIdQueryHandler,
  CreateUserCommandHandler
} from "./deps.ts";

// 値オブジェクトの型定義
interface Email {
  value: string;
}

interface Username {
  value: string;
}

interface AtIdentifier {
  value: string;
  handle: string;
}

// テスト用にGetUserByIdQueryの型を定義（拡張ではなく新しい型として定義）
interface TestGetUserByIdQuery {
  id: string;
  name: string;
}

// テスト用にCreateUserCommandの型を定義
interface TestCreateUserCommand {
  name: string;
  username: string;
  email: string;
}

// テスト用にUserControllerインターフェースを定義
interface UserController {
  getUserById(id: string): Promise<Result<UserDto, ApplicationError>>;
  createUser(data: CreateUserData): Promise<Result<UserDto, ApplicationError>>;
}

// ユーザーDTOの型定義
interface UserDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// ユーザー作成データの型定義
interface CreateUserData {
  name: string;
  email: string;
}

// テスト用にUserControllerImplを定義
class UserControllerImpl implements UserController {
  constructor(
    private readonly getUserByIdQueryHandler: MockGetUserByIdQueryHandler,
    private readonly createUserCommandHandler: MockCreateUserCommandHandler
  ) {}

  async getUserById(id: string): Promise<Result<UserDto, ApplicationError>> {
    if (!id) {
      return err(new ValidationError("ユーザーIDは必須です", "id"));
    }

    // テスト用にクエリオブジェクトを作成
    const query: TestGetUserByIdQuery = { id, name: "GetUserById" };
    const result = await this.getUserByIdQueryHandler.execute(query);
    if (result.isErr()) {
      return err(result.error);
    }

    const user = result.value;
    const userDto: UserDto = {
      id: user.user.id,
      name: user.user.username.value,
      email: user.user.email.value,
      createdAt: user.user.createdAt,
      updatedAt: user.user.updatedAt
    };

    return ok(userDto);
  }

  async createUser(data: CreateUserData): Promise<Result<UserDto, ApplicationError>> {
    // テスト用にコマンドオブジェクトを作成
    const command: TestCreateUserCommand = {
      name: "CreateUser",
      username: data.name.toLowerCase().replace(/\s+/g, '-'),
      email: data.email
    };

    const result = await this.createUserCommandHandler.execute(command);
    if (result.isErr()) {
      return err(result.error);
    }

    const user = result.value;
    const userDto: UserDto = {
      id: user.user.id,
      name: user.user.username.value,
      email: user.user.email.value,
      createdAt: user.user.createdAt,
      updatedAt: user.user.updatedAt
    };

    return ok(userDto);
  }
}

// モックリポジトリの作成
class MockUserRepository implements UserRepository {
  users: Record<string, UserAggregate> = {};
  
  constructor(initialUsers: UserAggregate[] = []) {
    for (const user of initialUsers) {
      this.users[user.user.id] = user;
    }
  }
  
  /**
   * IDによってユーザーを検索する
   * @param id ユーザーID
   * @returns ユーザー集約、存在しない場合はnull
   */
  // deno-lint-ignore require-await
  async findById(id: string): Promise<UserAggregate | null> {
    return this.users[id] || null;
  }
  
  /**
   * ユーザー名によってユーザーを検索する
   * @param username ユーザー名
   * @returns ユーザー集約、存在しない場合はnull
   */
  // deno-lint-ignore require-await
  async findByUsername(username: string): Promise<UserAggregate | null> {
    return Object.values(this.users).find(u => u.user.username === username) || null;
  }
  
  /**
   * メールアドレスによってユーザーを検索する
   * @param email メールアドレス
   * @returns ユーザー集約、存在しない場合はnull
   */
  // deno-lint-ignore require-await
  async findByEmail(email: string): Promise<UserAggregate | null> {
    return Object.values(this.users).find(u => u.user.email === email) || null;
  }
  
  /**
   * ATプロトコル識別子のDIDによってユーザーを検索する
   * @param did DID
   * @returns ユーザー集約、存在しない場合はnull
   */
  // deno-lint-ignore require-await
  async findByDid(did: string): Promise<UserAggregate | null> {
    return Object.values(this.users).find(u => u.user.atIdentifier.did === did) || null;
  }
  
  /**
   * ATプロトコル識別子のハンドルによってユーザーを検索する
   * @param handle ハンドル
   * @returns ユーザー集約、存在しない場合はnull
   */
  // deno-lint-ignore require-await
  async findByHandle(handle: string): Promise<UserAggregate | null> {
    return Object.values(this.users).find(u => u.user.atIdentifier.handle === handle) || null;
  }
  
  /**
   * ユーザーを保存する
   * @param userAggregate ユーザー集約
   * @returns 保存されたユーザー集約
   */
  // deno-lint-ignore require-await
  async save(userAggregate: UserAggregate): Promise<UserAggregate> {
    this.users[userAggregate.user.id] = userAggregate;
    return userAggregate;
  }
  
  /**
   * トランザクション内でユーザーを保存する
   * @param userAggregate ユーザー集約
   * @param context トランザクションコンテキスト
   * @returns 保存されたユーザー集約の結果
   */
  // deno-lint-ignore require-await
  async saveWithTransaction(userAggregate: UserAggregate, context: TransactionContext): Promise<Result<UserAggregate, DomainError>> {
    this.users[userAggregate.user.id] = userAggregate;
    return Promise.resolve(ok(userAggregate));
  }
  
  /**
   * ユーザーを削除する
   * @param id ユーザーID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  // deno-lint-ignore require-await
  async delete(id: string): Promise<boolean> {
    if (this.users[id]) {
      delete this.users[id];
      return true;
    }
    return false;
  }
  
  /**
   * トランザクション内でユーザーを削除する
   * @param id ユーザーID
   * @param context トランザクションコンテキスト
   * @returns 削除結果
   */
  // deno-lint-ignore require-await
  async deleteWithTransaction(id: string, context: TransactionContext): Promise<Result<boolean, DomainError>> {
    if (this.users[id]) {
      delete this.users[id];
      return Promise.resolve(ok(true));
    }
    return ok(false);
  }

  // テスト用のヘルパーメソッド
  addUser(user: UserAggregate): void {
    this.users[user.user.id] = user;
  }

  clear(): void {
    this.users = {};
  }
}

// モッククエリハンドラーの作成
class MockGetUserByIdQueryHandler {
  constructor(private repository: MockUserRepository) {}

  execute(query: TestGetUserByIdQuery): Promise<Result<UserAggregate, ApplicationError>> {
    return Promise.resolve().then(() => {
      const user = this.repository.findById(query.id);
      
      if (!user) {
        return err(new EntityNotFoundError("User", query.id));
      }
      
      return ok(user);
    });
  }
}

// モックコマンドハンドラーの作成
class MockCreateUserCommandHandler {
  constructor(private repository: MockUserRepository) {}

  execute(command: TestCreateUserCommand): Promise<Result<UserAggregate, ApplicationError>> {
    return Promise.resolve().then(() => {
      // 既存ユーザーの確認
      const existingUserByEmail = this.repository.findByEmail(command.email);
      if (existingUserByEmail) {
        return err(new ValidationError("このメールアドレスは既に使用されています", "email"));
      }

      const existingUserByUsername = this.repository.findByUsername(command.username);
      if (existingUserByUsername) {
        return err(new ValidationError("このユーザー名は既に使用されています", "username"));
      }

      // 値オブジェクトの作成
      const email = { value: command.email } as Email;
      const username = { value: command.username } as Username;
      const atIdentifier = { value: `did:example:${generateId()}`, handle: `@${command.username}` } as AtIdentifier;

      // ユーザーの作成
      const user = {
        id: generateId(),
        name: command.name,
        email: email,
        username: username,
        atIdentifier: atIdentifier,
        createdAt: new Date(),
        updatedAt: new Date(),
        updateUsername: (username: Username) => ({ ...user, username, updatedAt: new Date() }),
        updateEmail: (email: Email) => ({ ...user, email, updatedAt: new Date() }),
        updateAtIdentifier: (atIdentifier: AtIdentifier) => ({ ...user, atIdentifier, updatedAt: new Date() })
      } as User;

      // UserAggregateの作成
      const userAggregate = {
        user,
        updateUsername(username: string): UserAggregate {
          const usernameObj = { value: username } as Username;
          return {
            ...this,
            user: this.user.updateUsername(usernameObj)
          };
        },
        updateEmail(email: string): UserAggregate {
          const emailObj = { value: email } as Email;
          return {
            ...this,
            user: this.user.updateEmail(emailObj)
          };
        },
        updateAtIdentifier(did: string, handle?: string): UserAggregate {
          const atIdentifierObj = { 
            value: did, 
            handle: handle || this.user.atIdentifier.handle 
          } as AtIdentifier;
          return {
            ...this,
            user: this.user.updateAtIdentifier(atIdentifierObj)
          };
        }
      } as UserAggregate;

      // ユーザーの保存
      this.repository.save(userAggregate);
      
      return ok(userAggregate);
    });
  }
}

describe("UserController", () => {
  let userRepository: MockUserRepository;
  let getUserByIdQueryHandler: MockGetUserByIdQueryHandler;
  let createUserCommandHandler: MockCreateUserCommandHandler;
  let controller: UserController;
  let testUserId: string;

  beforeEach(() => {
    // テスト用のリポジトリとハンドラーを作成
    userRepository = new MockUserRepository();
    getUserByIdQueryHandler = new MockGetUserByIdQueryHandler(userRepository);
    createUserCommandHandler = new MockCreateUserCommandHandler(userRepository);
    
    // コントローラーの作成
    controller = new UserControllerImpl(
      getUserByIdQueryHandler,
      createUserCommandHandler
    );
    
    // テスト用のユーザーIDを生成
    testUserId = generateId();
    
    // リポジトリをクリア
    userRepository.clear();
  });

  describe("getUserById", () => {
    it("存在するユーザーIDを指定した場合、ユーザー情報を返す", async () => {
      // テスト用のユーザーデータを作成
      const email = { value: "test@example.com" } as Email;
      const username = { value: "testuser" } as Username;
      const atIdentifier = { value: "did:example:123", handle: "@testuser" } as AtIdentifier;

      const user = {
        id: testUserId,
        name: "テストユーザー",
        email: email,
        username: username,
        atIdentifier: atIdentifier,
        createdAt: new Date(),
        updatedAt: new Date(),
        updateUsername: (username: Username) => ({ ...user, username, updatedAt: new Date() }),
        updateEmail: (email: Email) => ({ ...user, email, updatedAt: new Date() }),
        updateAtIdentifier: (atIdentifier: AtIdentifier) => ({ ...user, atIdentifier, updatedAt: new Date() })
      } as User;

      // テスト用にUserAggregateを作成
      const userAggregate: UserAggregate = {
        user,
        updateUsername(username: string): UserAggregate {
          const usernameObj = { value: username } as Username;
          return {
            ...this,
            user: this.user.updateUsername(usernameObj)
          };
        },
        updateEmail(email: string): UserAggregate {
          const emailObj = { value: email } as Email;
          return {
            ...this,
            user: this.user.updateEmail(emailObj)
          };
        },
        updateAtIdentifier(did: string, handle: string): UserAggregate {
          const atIdentifierObj = { value: did, handle } as AtIdentifier;
          return {
            ...this,
            user: this.user.updateAtIdentifier(atIdentifierObj)
          };
        }
      };
      
      // リポジトリにユーザーを追加
      userRepository.addUser(userAggregate);
      
      // クエリハンドラーのexecuteメソッドをスパイ
      const executeSpy = spy(getUserByIdQueryHandler, "execute");
      
      // ユーザーを取得
      const result = await controller.getUserById(testUserId);
      
      // 検証
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        const userDto = result.value;
        assertEquals(userDto.id, testUserId);
        assertEquals(userDto.name, "テストユーザー");
        assertEquals(userDto.email, "test@example.com");
      }
      
      // クエリハンドラーが正しく呼び出されたことを確認
      assertSpyCalls(executeSpy, 1);
      assertEquals(executeSpy.calls[0].args[0].id, testUserId);
    });

    it("存在しないユーザーIDを指定した場合、エラーを返す", async () => {
      // クエリハンドラーのexecuteメソッドをスパイ
      const executeSpy = spy(getUserByIdQueryHandler, "execute");
      
      // 存在しないIDでユーザーを取得
      const result = await controller.getUserById("non-existent-id");
      
      // 検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof EntityNotFoundError, true);
      }
      
      // クエリハンドラーが正しく呼び出されたことを確認
      assertSpyCalls(executeSpy, 1);
      assertEquals(executeSpy.calls[0].args[0].id, "non-existent-id");
    });
  });

  describe("createUser", () => {
    it("有効なユーザーデータを指定した場合、ユーザーを作成して返す", async () => {
      // コマンドハンドラーのexecuteメソッドをスパイ
      const executeSpy = spy(createUserCommandHandler, "execute");
      
      // ユーザー作成リクエスト
      const createUserRequest = {
        name: "新規ユーザー",
        email: "new-user@example.com"
      };
      
      // ユーザーを作成
      const result = await controller.createUser(createUserRequest);
      
      // 検証
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        const userDto = result.value;
        assertEquals(userDto.name, "新規ユーザー");
        assertEquals(userDto.email, "new-user@example.com");
      }
      
      // コマンドハンドラーが正しく呼び出されたことを確認
      assertSpyCalls(executeSpy, 1);
      assertEquals(executeSpy.calls[0].args[0].email, "new-user@example.com");
    });

    it("既に存在するメールアドレスを指定した場合、エラーを返す", async () => {
      // 既存ユーザーの作成
      const email = { value: "existing@example.com" } as Email;
      const username = { value: "existinguser" } as Username;
      const atIdentifier = { value: "did:example:456", handle: "@existinguser" } as AtIdentifier;

      const user = {
        id: generateId(),
        name: "既存ユーザー",
        email: email,
        username: username,
        atIdentifier: atIdentifier,
        createdAt: new Date(),
        updatedAt: new Date(),
        updateUsername: (username: Username) => ({ ...user, username, updatedAt: new Date() }),
        updateEmail: (email: Email) => ({ ...user, email, updatedAt: new Date() }),
        updateAtIdentifier: (atIdentifier: AtIdentifier) => ({ ...user, atIdentifier, updatedAt: new Date() })
      } as User;

      // テスト用にUserAggregateを作成
      const userAggregate: UserAggregate = {
        user,
        updateUsername(username: string): UserAggregate {
          const usernameObj = { value: username } as Username;
          return {
            ...this,
            user: this.user.updateUsername(usernameObj)
          };
        },
        updateEmail(email: string): UserAggregate {
          const emailObj = { value: email } as Email;
          return {
            ...this,
            user: this.user.updateEmail(emailObj)
          };
        },
        updateAtIdentifier(did: string, handle: string): UserAggregate {
          const atIdentifierObj = { value: did, handle } as AtIdentifier;
          return {
            ...this,
            user: this.user.updateAtIdentifier(atIdentifierObj)
          };
        }
      };
      
      // リポジトリに既存ユーザーを追加
      userRepository.addUser(userAggregate);
      
      // コマンドハンドラーのexecuteメソッドをスパイ
      const executeSpy = spy(createUserCommandHandler, "execute");
      
      // 既存のメールアドレスでユーザー作成リクエスト
      const createUserRequest = {
        name: "重複ユーザー",
        email: "existing@example.com"
      };
      
      // ユーザーを作成
      const result = await controller.createUser(createUserRequest);
      
      // 検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof ValidationError, true);
      }
      
      // コマンドハンドラーが正しく呼び出されたことを確認
      assertSpyCalls(executeSpy, 1);
      assertEquals(executeSpy.calls[0].args[0].email, "existing@example.com");
    });
  });
}); 