import {
  Result,
  ok,
  err,
  expect,
  spy,
  UserAggregate,
  createUserAggregate,
  DomainError,
  ApplicationError
} from "../../__tests__/deps/mod.ts";

import type {
  User,
  UserRepository
} from "../../__tests__/deps/mod.ts";

// トランザクションコンテキストのインターフェース
interface TransactionContext {
  id: string;
}

import { CreateUserCommand, CreateUserCommandHandler } from "../create-user-command.ts";

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

Deno.test("CreateUserCommandHandler", async (t) => {
  await t.step("execute - 異常系: 同じユーザー名が存在する場合はエラーを返す", async () => {
    // モックの準備
    const userRepository = new MockUserRepository();
    
    // 同じユーザー名のユーザーが存在することを設定
    const existingUser = createMockUserAggregate("user2", "testuser", "other@example.com", "did:plc:hijklmn");
    userRepository.findByUsername = spy((username: string) => {
      if (username === "testuser") {
        return Promise.resolve(existingUser);
      }
      return Promise.resolve(null);
    });
    
    // テスト対象のハンドラーを作成
    const handler = new CreateUserCommandHandler(userRepository);
    
    // コマンドを作成
    const command: CreateUserCommand = {
      name: "CreateUser",
      id: "user1",
      username: "testuser",
      email: "test@example.com",
      atIdentifier: {
        did: "did:plc:abcdefg",
        handle: "testuser.bsky.social"
      }
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    expect(result.isErr()).toBe(true);
    expect(userRepository.findByUsername.calls.length).toBe(1);
    if (result.isErr()) {
      expect(result.error.message.includes("ユーザー名")).toBe(true);
    }
  });
  
  await t.step("execute - 異常系: 同じメールアドレスが存在する場合はエラーを返す", async () => {
    // モックの準備
    const userRepository = new MockUserRepository();
    
    // ユーザー名は存在しないことを設定
    userRepository.findByUsername = spy((username: string) => Promise.resolve(null));
    
    // 同じメールアドレスのユーザーが存在することを設定
    const existingUser = createMockUserAggregate("user2", "otheruser", "test@example.com", "did:plc:hijklmn");
    userRepository.findByEmail = spy((email: string) => {
      if (email === "test@example.com") {
        return Promise.resolve(existingUser);
      }
      return Promise.resolve(null);
    });
    
    // テスト対象のハンドラーを作成
    const handler = new CreateUserCommandHandler(userRepository);
    
    // コマンドを作成
    const command: CreateUserCommand = {
      name: "CreateUser",
      id: "user1",
      username: "testuser",
      email: "test@example.com",
      atIdentifier: {
        did: "did:plc:abcdefg",
        handle: "testuser.bsky.social"
      }
    };
    
    // テスト実行
    const result = await handler.execute(command);
    
    // 検証
    expect(result.isErr()).toBe(true);
    expect(userRepository.findByUsername.calls.length).toBe(1);
    expect(userRepository.findByEmail.calls.length).toBe(1);
    if (result.isErr()) {
      expect(result.error.message.includes("メールアドレス")).toBe(true);
    }
  });
}); 