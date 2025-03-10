import {
  Result,
  ok,
  err,
  expect,
  spy,
  UserAggregate,
  createUserAggregate,
  DomainError,
  ApplicationError,
  EntityNotFoundError
} from "../../__tests__/deps/mod.ts";

import type {
  User,
  UserRepository
} from "../../__tests__/deps/mod.ts";

// トランザクションコンテキストのインターフェース
interface TransactionContext {
  id: string;
}

import { GetUserByIdQuery, GetUserByIdQueryHandler } from "../get-user-by-id-query.ts";

// モックの作成
class MockUserRepository implements UserRepository {
  findById = spy((_id: string): Promise<UserAggregate | null> => Promise.resolve(null));
  findByUsername = spy((_username: string): Promise<UserAggregate | null> => Promise.resolve(null));
  findByEmail = spy((_email: string): Promise<UserAggregate | null> => Promise.resolve(null));
  findByDid = spy((_did: string): Promise<UserAggregate | null> => Promise.resolve(null));
  findByHandle = spy((_handle: string): Promise<UserAggregate | null> => Promise.resolve(null));
  save = spy((userAggregate: UserAggregate): Promise<UserAggregate> => Promise.resolve(userAggregate));
  saveWithTransaction = spy((userAggregate: UserAggregate, _context: TransactionContext): Promise<Result<UserAggregate, DomainError>> => {
    return Promise.resolve(ok(userAggregate));
  });
  delete = spy((_id: string): Promise<boolean> => Promise.resolve(true));
  deleteWithTransaction = spy((_id: string, _context: TransactionContext): Promise<Result<boolean, DomainError>> => {
    return Promise.resolve(ok(true));
  });
}

// モックのユーザー集約を作成する関数
function createMockUserAggregate(id: string, username: string, email: string, did: string, handle?: string): UserAggregate {
  return {
    user: {
      id,
      username: { value: username },
      email: { value: email },
      atIdentifier: { value: did, handle },
      createdAt: new Date(),
      updatedAt: new Date(),
      updateUsername: function() { return this; },
      updateEmail: function() { return this; },
      updateAtIdentifier: function() { return this; }
    },
    updateUsername: function() { return this; },
    updateEmail: function() { return this; },
    updateAtIdentifier: function() { return this; }
  } as UserAggregate;
}

Deno.test("GetUserByIdQueryHandler", async (t) => {
  await t.step("execute - 正常系: 存在するユーザーIDの場合はユーザーを返す", async () => {
    // モックの準備
    const userRepository = new MockUserRepository();
    const existingUser = createMockUserAggregate("user1", "testuser", "test@example.com", "did:plc:abcdefg");
    
    // ユーザーが存在することを設定
    userRepository.findById = spy((id: string) => {
      if (id === "user1") {
        return Promise.resolve(existingUser);
      }
      return Promise.resolve(null);
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetUserByIdQueryHandler(userRepository);
    
    // クエリを作成
    const query: GetUserByIdQuery = {
      name: "GetUserById",
      id: "user1"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    expect(result.isOk()).toBe(true);
    expect(userRepository.findById.calls.length).toBe(1);
    if (result.isOk()) {
      const user = result.value;
      expect(user?.user.id).toBe("user1");
      expect(user?.user.username.value).toBe("testuser");
      expect(user?.user.email.value).toBe("test@example.com");
    }
  });
  
  await t.step("execute - 正常系: 存在しないユーザーIDの場合はnullを返す", async () => {
    // モックの準備
    const userRepository = new MockUserRepository();
    
    // ユーザーが存在しないことを設定
    userRepository.findById = spy((id: string) => Promise.resolve(null));
    
    // テスト対象のハンドラーを作成
    const handler = new GetUserByIdQueryHandler(userRepository);
    
    // クエリを作成
    const query: GetUserByIdQuery = {
      name: "GetUserById",
      id: "non-existent"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    expect(result.isOk()).toBe(true);
    expect(userRepository.findById.calls.length).toBe(1);
    if (result.isOk()) {
      expect(result.value).toBe(null);
    }
  });
  
  await t.step("execute - 異常系: リポジトリでエラーが発生した場合はエラーを返す", async () => {
    // モックの準備
    const userRepository = new MockUserRepository();
    
    // エラーが発生することを設定
    userRepository.findById = spy((id: string) => {
      throw new Error("Repository error");
    });
    
    // テスト対象のハンドラーを作成
    const handler = new GetUserByIdQueryHandler(userRepository);
    
    // クエリを作成
    const query: GetUserByIdQuery = {
      name: "GetUserById",
      id: "user1"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    expect(result.isErr()).toBe(true);
    expect(userRepository.findById.calls.length).toBe(1);
    if (result.isErr()) {
      expect(result.error.message).toBe("Repository error");
    }
  });
}); 