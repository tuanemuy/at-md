import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { spy } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { GetUserByIdQuery, GetUserByIdQueryHandler } from "../get-user-by-id-query.ts";
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

Deno.test("GetUserByIdQueryHandler", async (t) => {
  await t.step("execute - 正常系: 指定したIDのユーザーを取得して返す", async () => {
    // モックの準備
    const userRepository = new MockUserRepository();
    
    // 指定したIDのユーザーが存在することを設定
    const existingUser = createMockUserAggregate("user1", "testuser", "test@example.com", "did:plc:abcdefg");
    userRepository.findById = spy(async (id: string) => {
      if (id === "user1") {
        return existingUser;
      }
      return null;
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
    assertEquals(result.isOk(), true);
    assertEquals(userRepository.findById.calls.length, 1);
    if (result.isOk()) {
      const user = result.value.user;
      assertEquals(user.id, "user1");
      assertEquals(user.username.value, "testuser");
      assertEquals(user.email.value, "test@example.com");
      assertEquals(user.atIdentifier.value, "did:plc:abcdefg");
    }
  });
  
  await t.step("execute - 異常系: 指定したIDのユーザーが存在しない場合はエラーを返す", async () => {
    // モックの準備
    const userRepository = new MockUserRepository();
    
    // 指定したIDのユーザーが存在しないことを設定
    userRepository.findById = spy(async (id: string) => null);
    
    // テスト対象のハンドラーを作成
    const handler = new GetUserByIdQueryHandler(userRepository);
    
    // クエリを作成
    const query: GetUserByIdQuery = {
      name: "GetUserById",
      id: "nonexistent"
    };
    
    // テスト実行
    const result = await handler.execute(query);
    
    // 検証
    assertEquals(result.isErr(), true);
    assertEquals(userRepository.findById.calls.length, 1);
    if (result.isErr()) {
      assertEquals(result.error.message.includes("見つかりません"), true);
    }
  });
}); 