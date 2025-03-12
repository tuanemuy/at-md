import { describe, test, expect, vi, beforeEach } from "vitest";
import { ok, err } from "neverthrow";
import { generateId } from "@/domain/shared/models/id";
import { DrizzleUserRepository } from "../user";
import type { PgDatabase } from "../../../client";
import { createRepositoryError } from "@/domain/shared/models/common";

// テスト用データ
const mockUserId = generateId();
const mockUser = {
  id: mockUserId,
  name: "テストユーザー",
  did: "did:example:123",
  createdAt: new Date(),
  updatedAt: new Date(),
  gitHubConnections: [],
};

const mockGitHubConnection = {
  id: generateId(),
  userId: mockUserId,
  installationId: "12345",
  accessToken: "test-token",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("DrizzleUserRepository", () => {
  let repository: DrizzleUserRepository;
  let mockDb: PgDatabase;

  beforeEach(() => {
    // モックデータベースの作成
    mockDb = {
      query: {
        users: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        githubConnections: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([[mockUser]])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([[mockUser]])),
          })),
        })),
      })),
    } as unknown as PgDatabase;

    // リポジトリの初期化
    repository = new DrizzleUserRepository(mockDb);
  });

  describe("findById", () => {
    test("ユーザーが存在する場合、ユーザーを返すこと", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce({
        ...mockUser,
        githubConnections: [mockGitHubConnection],
      });

      // テスト実行
      const result = await repository.findById(mockUserId);

      // 検証
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);

      if (result.isOk()) {
        const user = result.value;
        expect(user).not.toBeNull();
        if (user) {
          expect(user.id).toBe(mockUserId);
          expect(user.name).toBe(mockUser.name);
          expect(user.did).toBe(mockUser.did);
          expect(user.gitHubConnections).toHaveLength(1);
          expect(user.gitHubConnections[0].installationId).toBe(
            mockGitHubConnection.installationId,
          );
        }
      }

      // 正しいパラメータでクエリが呼ばれたことを確認
      expect(mockDb.query.users.findFirst).toHaveBeenCalledTimes(1);
    });

    test("ユーザーが存在しない場合、nullを返すこと", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.findById(mockUserId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    test("エラーが発生した場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      const error = new Error("Database error");
      mockDb.query.users.findFirst = vi.fn().mockRejectedValueOnce(error);

      // テスト実行
      const result = await repository.findById(mockUserId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.name).toBe("RepositoryError");
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to find user by ID");
        expect(result.error.cause).toBe(error);
      }
    });

    test("無効なIDの場合でも適切にハンドリングすること", async () => {
      // モックの設定
      const invalidId = "invalid-id" as unknown as string;
      mockDb.query.users.findFirst = vi
        .fn()
        .mockRejectedValueOnce(new Error("Invalid ID"));

      // テスト実行
      const result = await repository.findById(invalidId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
      }
    });
  });

  describe("findByDid", () => {
    test("DIDでユーザーを検索できること", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce({
        ...mockUser,
        githubConnections: [],
      });

      // テスト実行
      const result = await repository.findByDid(mockUser.did);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk() && result.value) {
        expect(result.value.did).toBe(mockUser.did);
      }
    });

    test("存在しないDIDの場合、nullを返すこと", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.findByDid("did:example:nonexistent");

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    test("空のDIDでも適切にハンドリングすること", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.findByDid("");

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    test("データベースエラーの場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi
        .fn()
        .mockRejectedValueOnce(new Error("Connection error"));

      // テスト実行
      const result = await repository.findByDid(mockUser.did);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to find user by DID");
      }
    });
  });

  describe("save", () => {
    test("新規ユーザーを保存できること", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(null);
      const insertMock = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([mockUser]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertMock);
      mockDb.query.githubConnections.findMany = vi
        .fn()
        .mockResolvedValueOnce([]);

      // テスト実行
      const result = await repository.save(mockUser);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(mockUserId);
        expect(result.value.name).toBe(mockUser.name);
      }
      expect(mockDb.insert).toHaveBeenCalled();
      expect(insertMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUserId,
          name: mockUser.name,
          did: mockUser.did,
        }),
      );
    });

    test("既存ユーザーを更新できること", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(mockUser);
      const updateMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([
          {
            ...mockUser,
            name: "更新後の名前",
          },
        ]),
      };
      mockDb.update = vi.fn().mockReturnValue(updateMock);
      mockDb.query.githubConnections.findMany = vi
        .fn()
        .mockResolvedValueOnce([]);

      // 更新用ユーザーデータ
      const updatedUser = {
        ...mockUser,
        name: "更新後の名前",
      };

      // テスト実行
      const result = await repository.save(updatedUser);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("更新後の名前");
      }
      expect(mockDb.update).toHaveBeenCalled();
      expect(updateMock.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "更新後の名前",
        }),
      );
    });

    test("保存時にエラーが発生した場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(null);
      mockDb.insert = vi.fn().mockImplementationOnce(() => {
        throw new Error("Insert error");
      });

      // テスト実行
      const result = await repository.save(mockUser);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to save user");
      }
    });

    test("必須フィールドが欠けている場合でも適切にハンドリングすること", async () => {
      // 不完全なユーザーデータ
      const incompleteUser = {
        ...mockUser,
        name: "", // 空の名前
      };

      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(null);
      mockDb.insert = vi.fn().mockImplementationOnce(() => {
        throw new Error("Validation error");
      });

      // テスト実行
      const result = await repository.save(incompleteUser);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
      }
    });
  });

  describe("addGitHubConnection", () => {
    test("GitHub連携情報を追加できること", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(mockUser);
      mockDb.query.githubConnections.findFirst = vi
        .fn()
        .mockResolvedValueOnce(null);
      const insertMock = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([mockGitHubConnection]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertMock);

      // テスト実行
      const result = await repository.addGitHubConnection(
        mockUserId,
        mockGitHubConnection,
      );

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(mockGitHubConnection.id);
        expect(result.value.installationId).toBe(
          mockGitHubConnection.installationId,
        );
      }
      expect(mockDb.insert).toHaveBeenCalled();
      expect(insertMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockGitHubConnection.id,
          userId: mockUserId,
          installationId: mockGitHubConnection.installationId,
        }),
      );
    });

    test("既存のGitHub連携情報を更新できること", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(mockUser);
      mockDb.query.githubConnections.findFirst = vi
        .fn()
        .mockResolvedValueOnce(mockGitHubConnection);
      const updateMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([
          {
            ...mockGitHubConnection,
            accessToken: "updated-token",
          },
        ]),
      };
      mockDb.update = vi.fn().mockReturnValue(updateMock);

      // 更新用連携データ
      const updatedConnection = {
        ...mockGitHubConnection,
        accessToken: "updated-token",
      };

      // テスト実行
      const result = await repository.addGitHubConnection(
        mockUserId,
        updatedConnection,
      );

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.accessToken).toBe("updated-token");
      }
      expect(mockDb.update).toHaveBeenCalled();
    });

    test("存在しないユーザーIDの場合、NOT_FOUNDエラーを返すこと", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.addGitHubConnection(
        generateId(),
        mockGitHubConnection,
      );

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
        expect(result.error.message).toContain("User with ID");
      }
    });

    test("accessTokenがnullの場合でも適切に処理すること", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(mockUser);
      mockDb.query.githubConnections.findFirst = vi
        .fn()
        .mockResolvedValueOnce(null);
      const insertMock = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([
          {
            ...mockGitHubConnection,
            accessToken: null,
          },
        ]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertMock);

      // accessTokenがnullの連携データ
      const connectionWithNullToken = {
        ...mockGitHubConnection,
        accessToken: null,
      };

      // テスト実行
      const result = await repository.addGitHubConnection(
        mockUserId,
        connectionWithNullToken,
      );

      // 検証
      expect(result.isOk()).toBe(true);
      expect(insertMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: "",
        }),
      );
    });

    test("データベースエラーの場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(mockUser);
      mockDb.query.githubConnections.findFirst = vi
        .fn()
        .mockResolvedValueOnce(null);
      mockDb.insert = vi.fn().mockImplementationOnce(() => {
        throw new Error("Database connection error");
      });

      // テスト実行
      const result = await repository.addGitHubConnection(
        mockUserId,
        mockGitHubConnection,
      );

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain(
          "Failed to add GitHub connection",
        );
      }
    });
  });

  describe("エラーハンドリング", () => {
    test("データベース接続エラーを適切にハンドリングすること", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockImplementationOnce(() => {
        throw new Error("Connection refused");
      });

      // テスト実行
      const result = await repository.findById(mockUserId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.cause).toBeDefined();
      }
    });

    test("タイムアウトエラーを適切にハンドリングすること", async () => {
      // モックの設定
      mockDb.query.users.findFirst = vi.fn().mockImplementationOnce(() => {
        const error = new Error("Query timeout");
        error.name = "TimeoutError";
        throw error;
      });

      // テスト実行
      const result = await repository.findById(mockUserId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to find user by ID");
      }
    });
  });

  describe("マッピング機能", () => {
    test("データベースの結果を正しくドメインモデルにマッピングすること", async () => {
      // モックの設定
      const dbUser = {
        id: mockUserId,
        name: "DBユーザー",
        did: "did:example:db",
        createdAt: new Date(),
        updatedAt: new Date(),
        githubConnections: [
          {
            id: generateId(),
            userId: mockUserId,
            installationId: "db-installation",
            accessToken: "db-token",
            createdAt: new Date(),
            updatedAt: new Date(),
            tokenType: "bearer",
            expiresAt: "",
          },
        ],
      };

      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(dbUser);

      // テスト実行
      const result = await repository.findById(mockUserId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk() && result.value) {
        const user = result.value;
        expect(user.id).toBe(dbUser.id);
        expect(user.name).toBe(dbUser.name);
        expect(user.did).toBe(dbUser.did);
        expect(user.gitHubConnections).toHaveLength(1);
        expect(user.gitHubConnections[0].installationId).toBe(
          "db-installation",
        );
        expect(user.gitHubConnections[0].accessToken).toBe("db-token");
      }
    });

    test("GitHubConnectionsが存在しない場合でも適切にマッピングすること", async () => {
      // モックの設定
      const dbUser = {
        id: mockUserId,
        name: "DBユーザー",
        did: "did:example:db",
        createdAt: new Date(),
        updatedAt: new Date(),
        // githubConnectionsが存在しない
      };

      mockDb.query.users.findFirst = vi.fn().mockResolvedValueOnce(dbUser);

      // テスト実行
      const result = await repository.findById(mockUserId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk() && result.value) {
        const user = result.value;
        expect(user.gitHubConnections).toEqual([]);
      }
    });
  });
});
