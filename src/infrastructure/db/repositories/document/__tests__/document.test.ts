import { describe, test, expect, vi, beforeEach } from "vitest";
import { ok, err } from "neverthrow";
import { generateId } from "@/domain/shared/models/id";
import { DrizzleDocumentRepository } from "../document";
import type { PgDatabase } from "../../../client";
import { createRepositoryError } from "@/domain/shared/models/common";
import type { DocumentScope } from "@/domain/document/models/document";

// テスト用データ
const mockDocumentId = generateId();
const mockGitHubRepoId = generateId();
const mockUserId = generateId();
const mockDocument = {
  id: mockDocumentId,
  gitHubRepoId: mockGitHubRepoId,
  userId: mockUserId,
  path: "test/path.md",
  title: "テスト文書",
  document: "# テスト文書\n\nこれはテスト文書です。",
  scope: "private" as DocumentScope,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("DrizzleDocumentRepository", () => {
  let repository: DrizzleDocumentRepository;
  let mockDb: PgDatabase;

  beforeEach(() => {
    // モックデータベースの作成
    mockDb = {
      query: {
        documents: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([[mockDocument]])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([[mockDocument]])),
          })),
        })),
      })),
    } as unknown as PgDatabase;

    // リポジトリの初期化
    repository = new DrizzleDocumentRepository(mockDb);
  });

  describe("findById", () => {
    test("文書が存在する場合、文書を返すこと", async () => {
      // モックの設定
      mockDb.query.documents.findFirst = vi
        .fn()
        .mockResolvedValueOnce(mockDocument);

      // テスト実行
      const result = await repository.findById(mockDocumentId);

      // 検証
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);

      if (result.isOk()) {
        const document = result.value;
        expect(document).not.toBeNull();
        if (document) {
          expect(document.id).toBe(mockDocumentId);
          expect(document.title).toBe(mockDocument.title);
          expect(document.path).toBe(mockDocument.path);
          expect(document.document).toBe(mockDocument.document);
        }
      }

      // 正しいパラメータでクエリが呼ばれたことを確認
      expect(mockDb.query.documents.findFirst).toHaveBeenCalledTimes(1);
    });

    test("文書が存在しない場合、nullを返すこと", async () => {
      // モックの設定
      mockDb.query.documents.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.findById(mockDocumentId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    test("エラーが発生した場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      const error = new Error("Database error");
      mockDb.query.documents.findFirst = vi.fn().mockRejectedValueOnce(error);

      // テスト実行
      const result = await repository.findById(mockDocumentId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.name).toBe("RepositoryError");
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to find document by ID");
        expect(result.error.cause).toBe(error);
      }
    });

    test("無効なIDの場合でも適切にハンドリングすること", async () => {
      // モックの設定
      const invalidId = "invalid-id" as unknown as string;
      mockDb.query.documents.findFirst = vi
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

  describe("findByGitHubRepoAndPath", () => {
    test("文書が存在する場合、文書を返すこと", async () => {
      // モックの設定
      mockDb.query.documents.findFirst = vi
        .fn()
        .mockResolvedValueOnce(mockDocument);

      // テスト実行
      const result = await repository.findByGitHubRepoAndPath(
        mockGitHubRepoId,
        mockDocument.path,
      );

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk() && result.value) {
        expect(result.value.gitHubRepoId).toBe(mockGitHubRepoId);
        expect(result.value.path).toBe(mockDocument.path);
      }
    });

    test("文書が存在しない場合、nullを返すこと", async () => {
      // モックの設定
      mockDb.query.documents.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.findByGitHubRepoAndPath(
        mockGitHubRepoId,
        "nonexistent/path.md",
      );

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    test("データベースエラーの場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      mockDb.query.documents.findFirst = vi
        .fn()
        .mockRejectedValueOnce(new Error("Connection error"));

      // テスト実行
      const result = await repository.findByGitHubRepoAndPath(
        mockGitHubRepoId,
        mockDocument.path,
      );

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain(
          "Failed to find document by GitHub repo and path",
        );
      }
    });
  });

  describe("findByGitHubRepo", () => {
    test("文書が存在する場合、文書の配列を返すこと", async () => {
      // モックの設定
      const documents = [
        mockDocument,
        { ...mockDocument, id: generateId(), path: "another/path.md" },
      ];
      mockDb.query.documents.findMany = vi
        .fn()
        .mockResolvedValueOnce(documents);

      // テスト実行
      const result = await repository.findByGitHubRepo(mockGitHubRepoId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].gitHubRepoId).toBe(mockGitHubRepoId);
      }
    });

    test("文書が存在しない場合、空の配列を返すこと", async () => {
      // モックの設定
      mockDb.query.documents.findMany = vi.fn().mockResolvedValueOnce([]);

      // テスト実行
      const result = await repository.findByGitHubRepo(mockGitHubRepoId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    test("データベースエラーの場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      mockDb.query.documents.findMany = vi
        .fn()
        .mockRejectedValueOnce(new Error("Database error"));

      // テスト実行
      const result = await repository.findByGitHubRepo(mockGitHubRepoId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain(
          "Failed to find documents by GitHub repo",
        );
      }
    });
  });

  describe("save", () => {
    test("新規文書を保存できること", async () => {
      // モックの設定
      mockDb.query.documents.findFirst = vi.fn().mockResolvedValueOnce(null);
      const insertMock = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([mockDocument]),
      };
      mockDb.insert = vi.fn().mockReturnValue(insertMock);

      // テスト実行
      const result = await repository.save(mockDocument);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(mockDocumentId);
        expect(result.value.title).toBe(mockDocument.title);
      }
      expect(mockDb.insert).toHaveBeenCalled();
      expect(insertMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockDocumentId,
          title: mockDocument.title,
          path: mockDocument.path,
        }),
      );
    });

    test("既存文書を更新できること", async () => {
      // モックの設定
      mockDb.query.documents.findFirst = vi
        .fn()
        .mockResolvedValueOnce(mockDocument);
      const updateMock = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValueOnce([
          {
            ...mockDocument,
            title: "更新後のタイトル",
          },
        ]),
      };
      mockDb.update = vi.fn().mockReturnValue(updateMock);

      // 更新用文書データ
      const updatedDocument = {
        ...mockDocument,
        title: "更新後のタイトル",
      };

      // テスト実行
      const result = await repository.save(updatedDocument);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("更新後のタイトル");
      }
      expect(mockDb.update).toHaveBeenCalled();
      expect(updateMock.set).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "更新後のタイトル",
        }),
      );
    });

    test("保存時にエラーが発生した場合、RepositoryErrorを返すこと", async () => {
      // モックの設定
      mockDb.query.documents.findFirst = vi.fn().mockResolvedValueOnce(null);
      mockDb.insert = vi.fn().mockImplementationOnce(() => {
        throw new Error("Insert error");
      });

      // テスト実行
      const result = await repository.save(mockDocument);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to save document");
      }
    });

    test("必須フィールドが欠けている場合でも適切にハンドリングすること", async () => {
      // 不完全な文書データ
      const incompleteDocument = {
        ...mockDocument,
        title: "", // 空のタイトル
      };

      // モックの設定
      mockDb.query.documents.findFirst = vi.fn().mockResolvedValueOnce(null);
      mockDb.insert = vi.fn().mockImplementationOnce(() => {
        throw new Error("Validation error");
      });

      // テスト実行
      const result = await repository.save(incompleteDocument);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
      }
    });
  });

  describe("エラーハンドリング", () => {
    test("データベース接続エラーを適切にハンドリングすること", async () => {
      // モックの設定
      mockDb.query.documents.findFirst = vi.fn().mockImplementationOnce(() => {
        throw new Error("Connection refused");
      });

      // テスト実行
      const result = await repository.findById(mockDocumentId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.cause).toBeDefined();
      }
    });

    test("タイムアウトエラーを適切にハンドリングすること", async () => {
      // モックの設定
      mockDb.query.documents.findFirst = vi.fn().mockImplementationOnce(() => {
        const error = new Error("Query timeout");
        error.name = "TimeoutError";
        throw error;
      });

      // テスト実行
      const result = await repository.findById(mockDocumentId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to find document by ID");
      }
    });
  });

  describe("マッピング機能", () => {
    test("データベースの結果を正しくドメインモデルにマッピングすること", async () => {
      // モックの設定
      const dbDocument = {
        id: mockDocumentId,
        gitHubRepoId: mockGitHubRepoId,
        userId: mockUserId,
        path: "db/path.md",
        title: "DBドキュメント",
        description: "これはDBから取得したドキュメントです",
        document: "# DBドキュメント\n\nこれはDBから取得したドキュメントです。",
        scope: "public" as DocumentScope,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.documents.findFirst = vi
        .fn()
        .mockResolvedValueOnce(dbDocument);

      // テスト実行
      const result = await repository.findById(mockDocumentId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk() && result.value) {
        const document = result.value;
        expect(document.id).toBe(dbDocument.id);
        expect(document.title).toBe(dbDocument.title);
        expect(document.path).toBe(dbDocument.path);
        expect(document.document).toBe(dbDocument.document);
        expect(document.scope).toBe(dbDocument.scope);
        expect(document.description).toBe(dbDocument.description);
      }
    });

    test("descriptionがnullの場合でも適切にマッピングすること", async () => {
      // モックの設定
      const dbDocument = {
        id: mockDocumentId,
        gitHubRepoId: mockGitHubRepoId,
        userId: mockUserId,
        path: "db/path.md",
        title: "DBドキュメント",
        description: null,
        document: "# DBドキュメント",
        scope: "private" as DocumentScope,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.documents.findFirst = vi
        .fn()
        .mockResolvedValueOnce(dbDocument);

      // テスト実行
      const result = await repository.findById(mockDocumentId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk() && result.value) {
        const document = result.value;
        expect(document.description).toBeUndefined();
      }
    });
  });
});
