import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { generateId } from "@/domain/shared/models/id";
import { createUser } from "@/domain/account/models/user";
import { DrizzleUserRepository } from "../../repositories/account/user";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
} from "../setup";
import * as loggerModule from "@/lib/logger";

describe("DrizzleUserRepository (Integration)", () => {
  const client = new PGlite();
  const db = getTestDatabase(client);
  const repository = new DrizzleUserRepository(db);

  // テスト前にデータベースをセットアップ
  beforeAll(async () => {
    // ロガーをモック化
    vi.spyOn(loggerModule.logger, "debug").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "info").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "warn").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "error").mockImplementation(() => {});

    await setupTestDatabase(client);
  });

  // 各テスト前にデータベースをクリーンアップ
  beforeEach(async () => {
    await cleanupTestDatabase(client);
  });

  // テスト後にデータベース接続を閉じる
  afterAll(async () => {
    await closeTestDatabase(client);
    vi.restoreAllMocks();
  });

  it("新しいユーザーを保存して取得できること", async () => {
    // テスト用ユーザーの作成
    const userId = generateId();
    const userData = createUser("Test User", "did:example:123");
    const user = { id: userId, ...userData };

    // ユーザーを保存
    const saveResult = await repository.save(user);
    expect(saveResult.isOk()).toBe(true);

    // IDでユーザーを取得
    const findByIdResult = await repository.findById(userId);
    expect(findByIdResult.isOk()).toBe(true);
    if (findByIdResult.isOk()) {
      const foundUser = findByIdResult.value;
      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(userId);
      expect(foundUser?.did).toBe("did:example:123");
      expect(foundUser?.name).toBe("Test User");
    }
  });

  it("DIDでユーザーを検索できること", async () => {
    // テスト用ユーザーの作成と保存
    const userId = generateId();
    const userData = createUser("Test User 2", "did:example:456");
    const user = { id: userId, ...userData };

    await repository.save(user);

    // DIDでユーザーを取得
    const findByDidResult = await repository.findByDid("did:example:456");
    expect(findByDidResult.isOk()).toBe(true);
    if (findByDidResult.isOk()) {
      const foundUser = findByDidResult.value;
      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(userId);
      expect(foundUser?.did).toBe("did:example:456");
      expect(foundUser?.name).toBe("Test User 2");
    }
  });

  it("存在しないIDでユーザーを検索するとnullを返すこと", async () => {
    const nonExistentId = generateId();
    const result = await repository.findById(nonExistentId);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeNull();
    }
  });

  it("存在しないDIDでユーザーを検索するとnullを返すこと", async () => {
    const result = await repository.findByDid("did:example:nonexistent");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeNull();
    }
  });

  it("ユーザー情報を更新できること", async () => {
    // テスト用ユーザーの作成と保存
    const userId = generateId();
    const userData = createUser("Test User 3", "did:example:789");
    const user = { id: userId, ...userData };

    await repository.save(user);

    // ユーザー情報を更新
    const updatedUser = {
      ...user,
      name: "Updated User",
    };

    const updateResult = await repository.save(updatedUser);
    expect(updateResult.isOk()).toBe(true);

    // 更新されたユーザーを取得して確認
    const findResult = await repository.findById(userId);
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const foundUser = findResult.value;
      expect(foundUser).not.toBeNull();
      expect(foundUser?.name).toBe("Updated User");
      // DIDは変更されていないことを確認
      expect(foundUser?.did).toBe("did:example:789");
    }
  });

  it("複数のユーザーを保存して個別に取得できること", async () => {
    // 複数のテスト用ユーザーを作成して保存
    const user1Id = generateId();
    const user1Data = createUser("User One", "did:example:user1");
    const user1 = { id: user1Id, ...user1Data };

    const user2Id = generateId();
    const user2Data = createUser("User Two", "did:example:user2");
    const user2 = { id: user2Id, ...user2Data };

    const user3Id = generateId();
    const user3Data = createUser("User Three", "did:example:user3");
    const user3 = { id: user3Id, ...user3Data };

    await repository.save(user1);
    await repository.save(user2);
    await repository.save(user3);

    // 個別にユーザーを取得して確認
    const findUser1Result = await repository.findById(user1Id);
    const findUser2Result = await repository.findById(user2Id);
    const findUser3Result = await repository.findById(user3Id);

    expect(findUser1Result.isOk()).toBe(true);
    expect(findUser2Result.isOk()).toBe(true);
    expect(findUser3Result.isOk()).toBe(true);

    if (
      findUser1Result.isOk() &&
      findUser2Result.isOk() &&
      findUser3Result.isOk()
    ) {
      const foundUser1 = findUser1Result.value;
      const foundUser2 = findUser2Result.value;
      const foundUser3 = findUser3Result.value;

      expect(foundUser1).not.toBeNull();
      expect(foundUser2).not.toBeNull();
      expect(foundUser3).not.toBeNull();

      expect(foundUser1?.did).toBe("did:example:user1");
      expect(foundUser2?.did).toBe("did:example:user2");
      expect(foundUser3?.did).toBe("did:example:user3");
    }
  });

  it("ユーザーを削除できること", async () => {
    // テスト用ユーザーの作成と保存
    const userId = generateId();
    const userData = createUser("Delete Test User", "did:example:delete");
    const user = { id: userId, ...userData };

    await repository.save(user);

    // ユーザーが保存されていることを確認
    const findBeforeDeleteResult = await repository.findById(userId);
    expect(findBeforeDeleteResult.isOk()).toBe(true);
    if (findBeforeDeleteResult.isOk()) {
      expect(findBeforeDeleteResult.value).not.toBeNull();
    }

    // ユーザーを削除
    const deleteResult = await repository.delete(userId);
    expect(deleteResult.isOk()).toBe(true);

    // 削除後にユーザーが存在しないことを確認
    const findAfterDeleteResult = await repository.findById(userId);
    expect(findAfterDeleteResult.isOk()).toBe(true);
    if (findAfterDeleteResult.isOk()) {
      expect(findAfterDeleteResult.value).toBeNull();
    }
  });

  it("存在しないユーザーを削除しても成功すること", async () => {
    const nonExistentId = generateId();
    
    // 存在しないユーザーを削除
    const deleteResult = await repository.delete(nonExistentId);
    
    // 削除操作自体は成功する
    expect(deleteResult.isOk()).toBe(true);
  });

  // エラーハンドリングのテスト
  describe("エラーハンドリング", () => {
    it("データベース接続エラーを適切にハンドリングすること", async () => {
      // オリジナルのクライアントを保存
      const originalClient = client;
      const originalDb = db;
      
      try {
        // エラーをシミュレートするためのモックを作成
        const mockDb = {
          query: {
            users: {
              findFirst: vi.fn().mockImplementation(() => {
                throw new Error("Connection refused");
              }),
            },
          },
        } as unknown as typeof db;
        
        // 一時的にモックを使用するリポジトリを作成
        const tempRepository = new DrizzleUserRepository(mockDb);
        
        // テスト実行
        const result = await tempRepository.findById(generateId());
        
        // 検証
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe("DATABASE_ERROR");
          expect(result.error.message).toContain("Failed to find user by ID");
          expect(result.error.cause).toBeDefined();
        }
      } finally {
        // 元のクライアントと接続を復元（他のテストに影響を与えないため）
      }
    });

    it("無効なIDの場合でも適切にハンドリングすること", async () => {
      // 無効なIDを使用
      const invalidId = "invalid-id" as unknown as string;
      
      // テスト実行
      const result = await repository.findById(invalidId);
      
      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to find user by ID");
      }
    });
  });
});
