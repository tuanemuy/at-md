import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { spy } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { ok, err } from "npm:neverthrow";
import { CreateUserCommand, CreateUserCommandHandler } from "../create-user-command.ts";
import { UserRepository } from "../../repositories/user-repository.ts";
import { UserAggregate } from "../../../../core/account/aggregates/user-aggregate.ts";

// モックの作成
class MockUserRepository implements UserRepository {
  findById = spy(async (_id: string): Promise<UserAggregate | null> => null);
  findByUsername = spy(async (_username: string): Promise<UserAggregate | null> => null);
  findByEmail = spy(async (_email: string): Promise<UserAggregate | null> => null);
  findByDid = spy(async (_did: string): Promise<UserAggregate | null> => null);
  findByHandle = spy(async (_handle: string): Promise<UserAggregate | null> => null);
  save = spy(async (userAggregate: UserAggregate): Promise<UserAggregate> => userAggregate);
  delete = spy(async (_id: string): Promise<boolean> => true);
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
    userRepository.findByUsername = spy(async (username: string) => {
      if (username === "testuser") {
        return existingUser;
      }
      return null;
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
    assertEquals(result.isErr(), true);
    assertEquals(userRepository.findByUsername.calls.length, 1);
    if (result.isErr()) {
      assertEquals(result.error.message.includes("ユーザー名"), true);
    }
  });
  
  await t.step("execute - 異常系: 同じメールアドレスが存在する場合はエラーを返す", async () => {
    // モックの準備
    const userRepository = new MockUserRepository();
    
    // ユーザー名は存在しないことを設定
    userRepository.findByUsername = spy(async (username: string) => null);
    
    // 同じメールアドレスのユーザーが存在することを設定
    const existingUser = createMockUserAggregate("user2", "otheruser", "test@example.com", "did:plc:hijklmn");
    userRepository.findByEmail = spy(async (email: string) => {
      if (email === "test@example.com") {
        return existingUser;
      }
      return null;
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
    assertEquals(result.isErr(), true);
    assertEquals(userRepository.findByUsername.calls.length, 1);
    assertEquals(userRepository.findByEmail.calls.length, 1);
    if (result.isErr()) {
      assertEquals(result.error.message.includes("メールアドレス"), true);
    }
  });
}); 