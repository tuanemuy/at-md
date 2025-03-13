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
import { createTag, createDocumentTag } from "@/domain/document/models/tag";
import { createDocument } from "@/domain/document/models/document";
import {
  DrizzleTagRepository,
  DrizzleDocumentTagRepository,
} from "../../repositories/document/tag";
import { DrizzleDocumentRepository } from "../../repositories/document/document";
import { DrizzleUserRepository } from "../../repositories/account/user";
import { DrizzleGitHubRepoRepository } from "../../repositories/document/githubRepo";
import { createGitHubRepo } from "@/domain/document/models/githubRepo";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
} from "../setup";
import * as loggerModule from "@/lib/logger";

describe("DrizzleTagRepository (Integration)", () => {
  const client = new PGlite();
  const db = getTestDatabase(client);
  const tagRepository = new DrizzleTagRepository(db);
  const documentTagRepository = new DrizzleDocumentTagRepository(db);
  const documentRepository = new DrizzleDocumentRepository(db);
  const githubRepoRepository = new DrizzleGitHubRepoRepository(db);
  const userRepository = new DrizzleUserRepository(db);
  let userId: string;
  let repoId: string;
  let documentId: string;

  // テスト前にデータベースをセットアップ
  beforeAll(async () => {
    // ロガーをモック化
    vi.spyOn(loggerModule.logger, "debug").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "info").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "warn").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "error").mockImplementation(() => {});

    await setupTestDatabase(client);
  });

  // 各テスト前にデータベースをクリーンアップし、必要なデータを作成
  beforeEach(async () => {
    await cleanupTestDatabase(client);

    // テスト用ユーザーの作成
    userId = generateId();
    const userData = createUser("Test User", "did:example:123");
    const user = { id: userId, ...userData };
    await userRepository.save(user);

    // テスト用GitHubリポジトリの作成
    repoId = generateId();
    const repoData = createGitHubRepo(
      "testowner",
      "testrepo",
      "testowner/testrepo",
      userId,
    );
    const repo = { id: repoId, ...repoData };
    await githubRepoRepository.save(repo);

    // テスト用文書の作成
    documentId = generateId();
    const documentData = createDocument(
      repoId,
      "test/path.md",
      "Test Document",
      "# Test Content",
      userId,
    );
    const document = { id: documentId, ...documentData };
    await documentRepository.save(document);
  });

  // テスト後にデータベース接続を閉じる
  afterAll(async () => {
    await closeTestDatabase(client);
    vi.restoreAllMocks();
  });

  describe("TagRepository", () => {
    it("新しいタグを保存して取得できること", async () => {
      // テスト用タグの作成
      const tagId = generateId();
      const tagData = createTag("テストタグ", userId);
      const tag = { id: tagId, ...tagData };

      // タグを保存
      const saveResult = await tagRepository.save(tag);
      expect(saveResult.isOk()).toBe(true);

      // IDでタグを取得
      const findByIdResult = await tagRepository.findById(tagId);
      expect(findByIdResult.isOk()).toBe(true);
      if (findByIdResult.isOk()) {
        const foundTag = findByIdResult.value;
        expect(foundTag).not.toBeNull();
        expect(foundTag?.id).toBe(tagId);
        expect(foundTag?.name).toBe("テストタグ");
        expect(foundTag?.userId).toBe(userId);
      }
    });

    it("タグ名でタグを検索できること", async () => {
      // テスト用タグの作成と保存
      const tagId = generateId();
      const tagData = createTag("ユニークタグ", userId);
      const tag = { id: tagId, ...tagData };
      await tagRepository.save(tag);

      // タグ名でタグを取得（findBySlugはnameで検索する実装になっている）
      const findResult = await tagRepository.findBySlug("ユニークタグ");
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        const foundTag = findResult.value;
        expect(foundTag).not.toBeNull();
        expect(foundTag?.id).toBe(tagId);
        expect(foundTag?.name).toBe("ユニークタグ");
      }
    });

    it("ユーザーIDでタグを検索できること", async () => {
      // 複数のテスト用タグを作成して保存
      const tag1Id = generateId();
      const tag1Data = createTag("タグ1", userId);
      const tag1 = { id: tag1Id, ...tag1Data };

      const tag2Id = generateId();
      const tag2Data = createTag("タグ2", userId);
      const tag2 = { id: tag2Id, ...tag2Data };

      await tagRepository.save(tag1);
      await tagRepository.save(tag2);

      // ユーザーIDでタグを取得
      const findResult = await tagRepository.findByUserId(userId);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        const tags = findResult.value;
        expect(tags.length).toBe(2);

        // 各タグが正しく取得できていることを確認
        const names = tags.map((tag) => tag.name);
        expect(names).toContain("タグ1");
        expect(names).toContain("タグ2");
      }
    });

    it("文書IDでタグを検索できること", async () => {
      // テスト用タグの作成と保存
      const tag1Id = generateId();
      const tag1Data = createTag("文書タグ1", userId);
      const tag1 = { id: tag1Id, ...tag1Data };
      await tagRepository.save(tag1);

      const tag2Id = generateId();
      const tag2Data = createTag("文書タグ2", userId);
      const tag2 = { id: tag2Id, ...tag2Data };
      await tagRepository.save(tag2);

      // 文書タグ関連を作成
      const docTag1Id = generateId();
      const docTag1Data = createDocumentTag(documentId, tag1Id);
      const docTag1 = { id: docTag1Id, ...docTag1Data };
      await documentTagRepository.save(docTag1);

      const docTag2Id = generateId();
      const docTag2Data = createDocumentTag(documentId, tag2Id);
      const docTag2 = { id: docTag2Id, ...docTag2Data };
      await documentTagRepository.save(docTag2);

      // 文書IDでタグを取得
      const findResult = await tagRepository.findByDocumentId(documentId);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        const tags = findResult.value;
        expect(tags.length).toBe(2);

        // 各タグが正しく取得できていることを確認
        const names = tags.map((tag) => tag.name);
        expect(names).toContain("文書タグ1");
        expect(names).toContain("文書タグ2");
      }
    });

    it("存在しないIDでタグを検索するとnullを返すこと", async () => {
      const nonExistentId = generateId();
      const result = await tagRepository.findById(nonExistentId);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    it("タグ情報を更新できること", async () => {
      // テスト用タグの作成と保存
      const tagId = generateId();
      const tagData = createTag("元のタグ名", userId);
      const tag = { id: tagId, ...tagData };
      await tagRepository.save(tag);

      // タグ情報を更新
      const updatedTag = {
        ...tag,
        name: "更新後のタグ名",
      };

      const updateResult = await tagRepository.save(updatedTag);
      expect(updateResult.isOk()).toBe(true);

      // 更新されたタグを取得して確認
      const findResult = await tagRepository.findById(tagId);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        const foundTag = findResult.value;
        expect(foundTag).not.toBeNull();
        expect(foundTag?.name).toBe("更新後のタグ名");
      }
    });

    it("タグを削除できること", async () => {
      // テスト用タグの作成と保存
      const tagId = generateId();
      const tagData = createTag("削除テスト", userId);
      const tag = { id: tagId, ...tagData };
      await tagRepository.save(tag);

      // タグを削除
      const deleteResult = await tagRepository.delete(tagId);
      expect(deleteResult.isOk()).toBe(true);

      // 削除されたタグを検索
      const findResult = await tagRepository.findById(tagId);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });
  });

  describe("DocumentTagRepository", () => {
    it("文書タグを保存して取得できること", async () => {
      // テスト用タグの作成と保存
      const tagId = generateId();
      const tagData = createTag("文書タグテスト", userId);
      const tag = { id: tagId, ...tagData };
      await tagRepository.save(tag);

      // 文書タグ関連を作成
      const docTagId = generateId();
      const docTagData = createDocumentTag(documentId, tagId);
      const docTag = { id: docTagId, ...docTagData };

      // 文書タグを保存
      const saveResult = await documentTagRepository.save(docTag);
      expect(saveResult.isOk()).toBe(true);

      // 文書IDで文書タグを取得
      const findByDocumentIdResult =
        await documentTagRepository.findByDocumentId(documentId);
      expect(findByDocumentIdResult.isOk()).toBe(true);
      if (findByDocumentIdResult.isOk()) {
        const documentTags = findByDocumentIdResult.value;
        expect(documentTags.length).toBe(1);
        expect(documentTags[0].documentId).toBe(documentId);
        expect(documentTags[0].tagId).toBe(tagId);
      }
    });

    it("タグIDで文書タグを検索できること", async () => {
      // テスト用タグの作成と保存
      const tagId = generateId();
      const tagData = createTag("タグID検索テスト", userId);
      const tag = { id: tagId, ...tagData };
      await tagRepository.save(tag);

      // 文書タグ関連を作成
      const docTagId = generateId();
      const docTagData = createDocumentTag(documentId, tagId);
      const docTag = { id: docTagId, ...docTagData };
      await documentTagRepository.save(docTag);

      // タグIDで文書タグを取得
      const findByTagIdResult = await documentTagRepository.findByTagId(tagId);
      expect(findByTagIdResult.isOk()).toBe(true);
      if (findByTagIdResult.isOk()) {
        const documentTags = findByTagIdResult.value;
        expect(documentTags.length).toBe(1);
        expect(documentTags[0].documentId).toBe(documentId);
        expect(documentTags[0].tagId).toBe(tagId);
      }
    });

    it("文書タグを削除できること", async () => {
      // テスト用タグの作成と保存
      const tagId = generateId();
      const tagData = createTag("削除テスト", userId);
      const tag = { id: tagId, ...tagData };
      await tagRepository.save(tag);

      // 文書タグ関連を作成
      const docTagId = generateId();
      const docTagData = createDocumentTag(documentId, tagId);
      const docTag = { id: docTagId, ...docTagData };
      await documentTagRepository.save(docTag);

      // 文書タグを削除
      const deleteResult = await documentTagRepository.delete(docTagId);
      expect(deleteResult.isOk()).toBe(true);

      // 削除後に文書IDで検索
      const findResult =
        await documentTagRepository.findByDocumentId(documentId);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value.length).toBe(0);
      }
    });

    it("文書IDとタグIDで文書タグを削除できること", async () => {
      // テスト用タグの作成と保存
      const tagId = generateId();
      const tagData = createTag("複合削除テスト", userId);
      const tag = { id: tagId, ...tagData };
      await tagRepository.save(tag);

      // 文書タグ関連を作成
      const docTagId = generateId();
      const docTagData = createDocumentTag(documentId, tagId);
      const docTag = { id: docTagId, ...docTagData };
      await documentTagRepository.save(docTag);

      // 文書IDとタグIDで文書タグを削除
      const deleteResult =
        await documentTagRepository.deleteByDocumentIdAndTagId(
          documentId,
          tagId,
        );
      expect(deleteResult.isOk()).toBe(true);

      // 削除後に文書IDで検索
      const findResult =
        await documentTagRepository.findByDocumentId(documentId);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value.length).toBe(0);
      }
    });

    it("同じ文書とタグの組み合わせで保存しても重複しないこと", async () => {
      // テスト用タグの作成と保存
      const tagId = generateId();
      const tagData = createTag("重複テスト", userId);
      const tag = { id: tagId, ...tagData };
      await tagRepository.save(tag);

      // 1回目の文書タグ関連を作成
      const docTagId1 = generateId();
      const docTagData1 = createDocumentTag(documentId, tagId);
      const docTag1 = { id: docTagId1, ...docTagData1 };
      await documentTagRepository.save(docTag1);

      // 2回目の文書タグ関連を作成（同じ文書とタグの組み合わせ）
      const docTagId2 = generateId();
      const docTagData2 = createDocumentTag(documentId, tagId);
      const docTag2 = { id: docTagId2, ...docTagData2 };
      await documentTagRepository.save(docTag2);

      // 文書IDで文書タグを取得
      const findResult =
        await documentTagRepository.findByDocumentId(documentId);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        // 重複は保存されないので1件のみ
        expect(findResult.value.length).toBe(1);
      }
    });
  });

  // エラーハンドリングのテスト
  describe("エラーハンドリング", () => {
    describe("TagRepository", () => {
      it("データベース接続エラーを適切にハンドリングすること", async () => {
        // エラーをシミュレートするためのモックを作成
        const mockDb = {
          query: {
            tags: {
              findFirst: vi.fn().mockImplementation(() => {
                throw new Error("Connection refused");
              }),
            },
          },
        } as unknown as typeof db;
        
        // 一時的にモックを使用するリポジトリを作成
        const tempRepository = new DrizzleTagRepository(mockDb);
        
        // テスト実行
        const result = await tempRepository.findById(generateId());
        
        // 検証
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe("DATABASE_ERROR");
          expect(result.error.message).toContain("Failed to find tag by ID");
          expect(result.error.cause).toBeDefined();
        }
      });

      it("無効なIDの場合でも適切にハンドリングすること", async () => {
        // 無効なIDを使用
        const invalidId = "invalid-id" as unknown as string;
        
        // テスト実行
        const result = await tagRepository.findById(invalidId);
        
        // 検証
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe("DATABASE_ERROR");
          expect(result.error.message).toContain("Failed to find tag by ID");
        }
      });

      it("saveでデータベースエラーが発生した場合、RepositoryErrorを返すこと", async () => {
        // insertメソッドをモック化してエラーをスローさせる
        const insertSpy = vi
          .spyOn(db, "insert")
          .mockRejectedValueOnce(new Error("Insert error"));

        const tagId = generateId();
        const tagData = createTag("エラーテスト", userId);
        const tag = { id: tagId, ...tagData };

        const result = await tagRepository.save(tag);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe("DATABASE_ERROR");
          expect(result.error.message).toContain("Failed to save tag");
        }

        // モックをリセット
        insertSpy.mockRestore();
      });

      it("deleteでデータベースエラーが発生した場合、RepositoryErrorを返すこと", async () => {
        // deleteメソッドをモック化してエラーをスローさせる
        const deleteSpy = vi
          .spyOn(db, "delete")
          .mockRejectedValueOnce(new Error("Delete error"));

        const tagId = generateId();
        const result = await tagRepository.delete(tagId);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe("DATABASE_ERROR");
          expect(result.error.message).toContain("Failed to delete tag");
        }

        // モックをリセット
        deleteSpy.mockRestore();
      });
    });

    describe("DocumentTagRepository", () => {
      it("データベース接続エラーを適切にハンドリングすること", async () => {
        // エラーをシミュレートするためのモックを作成
        const mockDb = {
          query: {
            documentTags: {
              findMany: vi.fn().mockImplementation(() => {
                throw new Error("Connection refused");
              }),
            },
          },
        } as unknown as typeof db;
        
        // 一時的にモックを使用するリポジトリを作成
        const tempRepository = new DrizzleDocumentTagRepository(mockDb);
        
        // テスト実行
        const result = await tempRepository.findByDocumentId(generateId());
        
        // 検証
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe("DATABASE_ERROR");
          expect(result.error.message).toContain("Failed to find document tags by document ID");
          expect(result.error.cause).toBeDefined();
        }
      });

      it("saveでデータベースエラーが発生した場合、RepositoryErrorを返すこと", async () => {
        // insertメソッドをモック化してエラーをスローさせる
        const insertSpy = vi
          .spyOn(db, "insert")
          .mockRejectedValueOnce(new Error("Insert error"));

        const docTagId = generateId();
        const tagId = generateId();
        const tagData = createTag("エラーテスト", userId);
        const tag = { id: tagId, ...tagData };
        await tagRepository.save(tag);

        const docTagData = createDocumentTag(documentId, tagId);
        const docTag = { id: docTagId, ...docTagData };

        const result = await documentTagRepository.save(docTag);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe("DATABASE_ERROR");
          expect(result.error.message).toContain("Failed to save document tag");
        }

        // モックをリセット
        insertSpy.mockRestore();
      });

      it("deleteでデータベースエラーが発生した場合、RepositoryErrorを返すこと", async () => {
        // deleteメソッドをモック化してエラーをスローさせる
        const deleteSpy = vi
          .spyOn(db, "delete")
          .mockRejectedValueOnce(new Error("Delete error"));

        const docTagId = generateId();
        const result = await documentTagRepository.delete(docTagId);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe("DATABASE_ERROR");
          expect(result.error.message).toContain("Failed to delete document tag");
        }

        // モックをリセット
        deleteSpy.mockRestore();
      });

      it("deleteByDocumentIdAndTagIdでデータベースエラーが発生した場合、RepositoryErrorを返すこと", async () => {
        // deleteメソッドをモック化してエラーをスローさせる
        const deleteSpy = vi
          .spyOn(db, "delete")
          .mockRejectedValueOnce(new Error("Delete error"));

        const result = await documentTagRepository.deleteByDocumentIdAndTagId(documentId, generateId());

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe("DATABASE_ERROR");
          expect(result.error.message).toContain("Failed to delete document tag by document ID and tag ID");
        }

        // モックをリセット
        deleteSpy.mockRestore();
      });
    });
  });
});
