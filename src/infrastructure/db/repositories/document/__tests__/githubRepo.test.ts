import { describe, test, expect, vi, beforeEach } from "vitest";
import { ok, err } from "neverthrow";
import { generateId } from "@/domain/shared/models/id";
import { DrizzleGitHubRepoRepository } from "../githubRepo";
import type { PgDatabase } from "../../../client";
import { createRepositoryError } from "@/domain/shared/models/common";

// テスト用データ
const mockRepoId = generateId();
const mockUserId = generateId();
const mockRepo = {
  id: mockRepoId,
  owner: "octocat",
  name: "hello-world",
  fullName: "octocat/hello-world",
  installationId: "12345",
  webhookSecret: "secret",
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: mockUserId,
};

describe("DrizzleGitHubRepoRepository", () => {
  let repository: DrizzleGitHubRepoRepository;
  let mockDb: PgDatabase;

  beforeEach(() => {
    // モックデータベースの作成
    mockDb = {
      query: {
        githubRepos: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([[mockRepo]])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([[mockRepo]])),
          })),
        })),
      })),
    } as unknown as PgDatabase;

    // リポジトリの初期化
    repository = new DrizzleGitHubRepoRepository(mockDb);
  });

  describe("findById", () => {
    test("リポジトリが存在する場合、リポジトリを返すこと", async () => {
      // モックの設定
      mockDb.query.githubRepos.findFirst = vi.fn().mockResolvedValueOnce({
        ...mockRepo,
      });

      // テスト実行
      const result = await repository.findById(mockRepoId);

      // 検証
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);

      if (result.isOk()) {
        const repo = result.value;
        expect(repo).not.toBeNull();
        if (repo) {
          expect(repo.id).toBe(mockRepoId);
          expect(repo.owner).toBe(mockRepo.owner);
          expect(repo.name).toBe(mockRepo.name);
          expect(repo.fullName).toBe(mockRepo.fullName);
          expect(repo.installationId).toBe(mockRepo.installationId);
          expect(repo.webhookSecret).toBe(mockRepo.webhookSecret);
        }
      }

      // 正しいパラメータでクエリが呼ばれたことを確認
      expect(mockDb.query.githubRepos.findFirst).toHaveBeenCalledTimes(1);
    });

    test("リポジトリが存在しない場合、nullを返すこと", async () => {
      // モックの設定
      mockDb.query.githubRepos.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.findById(mockRepoId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    test("エラーが発生した場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      const error = new Error("Database error");
      mockDb.query.githubRepos.findFirst = vi.fn().mockRejectedValueOnce(error);

      // テスト実行
      const result = await repository.findById(mockRepoId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.name).toBe("RepositoryError");
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain(
          "Failed to find GitHub repository by ID",
        );
        expect(result.error.cause).toBe(error);
      }
    });
  });

  describe("findByFullName", () => {
    test("リポジトリが存在する場合、リポジトリを返すこと", async () => {
      // モックの設定
      mockDb.query.githubRepos.findFirst = vi.fn().mockResolvedValueOnce({
        ...mockRepo,
      });

      // テスト実行
      const result = await repository.findByFullName(mockRepo.fullName);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk() && result.value) {
        expect(result.value.fullName).toBe(mockRepo.fullName);
        expect(result.value.installationId).toBe(mockRepo.installationId);
      }
    });

    test("リポジトリが存在しない場合、nullを返すこと", async () => {
      // モックの設定
      mockDb.query.githubRepos.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.findByFullName("nonexistent/repo");

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    test("データベースエラーの場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      mockDb.query.githubRepos.findFirst = vi
        .fn()
        .mockRejectedValueOnce(new Error("Connection error"));

      // テスト実行
      const result = await repository.findByFullName(mockRepo.fullName);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain(
          "Failed to find GitHub repository by full name",
        );
      }
    });
  });

  describe("findByUserId", () => {
    test("リポジトリが存在する場合、リポジトリの配列を返すこと", async () => {
      // モックの設定
      const repos = [
        {
          ...mockRepo,
        },
        {
          ...mockRepo,
          id: generateId(),
          name: "another-repo",
          fullName: "octocat/another-repo",
        },
      ];
      mockDb.query.githubRepos.findMany = vi.fn().mockResolvedValueOnce(repos);

      // テスト実行
      const result = await repository.findByUserId(mockUserId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].userId).toBe(mockUserId);
        expect(result.value[0].installationId).toBe(mockRepo.installationId);
      }
    });

    test("リポジトリが存在しない場合、空の配列を返すこと", async () => {
      // モックの設定
      mockDb.query.githubRepos.findMany = vi.fn().mockResolvedValueOnce([]);

      // テスト実行
      const result = await repository.findByUserId(mockUserId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    test("データベースエラーの場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      mockDb.query.githubRepos.findMany = vi
        .fn()
        .mockRejectedValueOnce(new Error("Database error"));

      // テスト実行
      const result = await repository.findByUserId(mockUserId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain(
          "Failed to find GitHub repositories by user ID",
        );
      }
    });
  });

  describe("save", () => {
    test("新規リポジトリを保存できること", async () => {
      // モックの設定
      mockDb.query.githubRepos.findFirst = vi.fn().mockResolvedValueOnce(null);
      const insertMock = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([
          {
            ...mockRepo,
          },
        ]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertMock);

      // テスト実行
      const result = await repository.save(mockRepo);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(mockRepoId);
        expect(result.value.owner).toBe(mockRepo.owner);
        expect(result.value.installationId).toBe(mockRepo.installationId);
      }
      expect(mockDb.insert).toHaveBeenCalled();
      expect(insertMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockRepoId,
          owner: mockRepo.owner,
          name: mockRepo.name,
          installationId: mockRepo.installationId,
        }),
      );
    });

    test("既存リポジトリを更新できること", async () => {
      // モックの設定
      mockDb.query.githubRepos.findFirst = vi.fn().mockResolvedValueOnce({
        ...mockRepo,
      });
      const updateMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([
          {
            ...mockRepo,
            owner: "updated-owner",
            fullName: "updated-owner/hello-world",
            installationId: "updated-installation-id",
          },
        ]),
      };
      mockDb.update = vi.fn().mockReturnValue(updateMock);

      // 更新用リポジトリデータ
      const updatedRepo = {
        ...mockRepo,
        owner: "updated-owner",
        fullName: "updated-owner/hello-world",
        installationId: "updated-installation-id",
      };

      // テスト実行
      const result = await repository.save(updatedRepo);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.owner).toBe("updated-owner");
        expect(result.value.fullName).toBe("updated-owner/hello-world");
        expect(result.value.installationId).toBe("updated-installation-id");
      }
      expect(mockDb.update).toHaveBeenCalled();
      expect(updateMock.set).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "updated-owner",
          fullName: "updated-owner/hello-world",
          installationId: "updated-installation-id",
        }),
      );
    });

    test("保存時にエラーが発生した場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      mockDb.query.githubRepos.findFirst = vi.fn().mockResolvedValueOnce(null);
      mockDb.insert = vi.fn().mockImplementationOnce(() => {
        throw new Error("Insert error");
      });

      // テスト実行
      const result = await repository.save(mockRepo);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain(
          "Failed to save GitHub repository",
        );
      }
    });
  });

  describe("エラーハンドリング", () => {
    test("データベース接続エラーを適切にハンドリングすること", async () => {
      // モックの設定
      mockDb.query.githubRepos.findFirst = vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error("Connection refused");
        });

      // テスト実行
      const result = await repository.findById(mockRepoId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.cause).toBeDefined();
      }
    });

    test("タイムアウトエラーを適切にハンドリングすること", async () => {
      // モックの設定
      mockDb.query.githubRepos.findFirst = vi
        .fn()
        .mockImplementationOnce(() => {
          const error = new Error("Query timeout");
          error.name = "TimeoutError";
          throw error;
        });

      // テスト実行
      const result = await repository.findById(mockRepoId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain(
          "Failed to find GitHub repository by ID",
        );
      }
    });
  });

  describe("マッピング機能", () => {
    test("データベースの結果を正しくドメインモデルにマッピングすること", async () => {
      // モックの設定
      const dbRepo = {
        id: mockRepoId,
        owner: "db-owner",
        name: "db-repo",
        fullName: "db-owner/db-repo",
        installationId: "db-installation-id",
        webhookSecret: "db-webhook-secret",
        description: "A test repository",
        defaultBranch: "main",
        private: true,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUserId,
      };

      mockDb.query.githubRepos.findFirst = vi
        .fn()
        .mockResolvedValueOnce(dbRepo);

      // テスト実行
      const result = await repository.findById(mockRepoId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk() && result.value) {
        const repo = result.value;
        expect(repo.id).toBe(dbRepo.id);
        expect(repo.owner).toBe(dbRepo.owner);
        expect(repo.name).toBe(dbRepo.name);
        expect(repo.fullName).toBe(dbRepo.fullName);
        expect(repo.installationId).toBe(dbRepo.installationId);
        expect(repo.webhookSecret).toBe(dbRepo.webhookSecret);
      }
    });

    test("webhookSecretがnullの場合、undefinedに変換されること", async () => {
      // モックの設定
      const dbRepo = {
        ...mockRepo,
        webhookSecret: null,
      };

      mockDb.query.githubRepos.findFirst = vi
        .fn()
        .mockResolvedValueOnce(dbRepo);

      // テスト実行
      const result = await repository.findById(mockRepoId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk() && result.value) {
        expect(result.value.webhookSecret).toBeUndefined();
      }
    });
  });
});
