import { describe, it, expect, vi, beforeEach } from "vitest";
import { ok, err } from "neverthrow";
import { generateId } from "@/domain/shared/models/id";
import { DrizzleTagRepository, DrizzleDocumentTagRepository } from "../tag";
import type { PgDatabase } from "../../../client";
import { tags, documentTags } from "../../../schema";
import { createTag, createDocumentTag } from "@/domain/document/models/tag";
import { createRepositoryError } from "@/domain/shared/models/common";

// テスト用データ
const mockTagId = generateId();
const mockUserId = generateId();
const mockDocumentId = generateId();
const mockTag = {
  id: mockTagId,
  name: "テストタグ",
  userId: mockUserId,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDocumentTag = {
  id: generateId(),
  documentId: mockDocumentId,
  tagId: mockTagId,
  createdAt: new Date(),
};

describe("DrizzleTagRepository", () => {
  let repository: DrizzleTagRepository;
  let mockDb: PgDatabase;

  beforeEach(() => {
    // モックデータベースの作成
    mockDb = {
      query: {
        tags: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        documentTags: {
          findMany: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockTag])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([mockTag])),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    } as unknown as PgDatabase;

    // リポジトリの初期化
    repository = new DrizzleTagRepository(mockDb);
  });

  describe("findById", () => {
    it("存在するタグIDで検索すると、タグを返す", async () => {
      // モックの設定
      mockDb.query.tags.findFirst = vi.fn().mockResolvedValueOnce(mockTag);

      // テスト実行
      const result = await repository.findById(mockTagId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const foundTag = result.value;
        expect(foundTag).not.toBeNull();
        expect(foundTag?.id).toBe(mockTag.id);
        expect(foundTag?.name).toBe(mockTag.name);
        expect(foundTag?.userId).toBe(mockTag.userId);
      }
    });

    it("存在しないタグIDで検索すると、nullを返す", async () => {
      // モックの設定
      mockDb.query.tags.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.findById(generateId());

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    it("データベースエラーの場合、RepositoryErrorを返す", async () => {
      // モックの設定
      mockDb.query.tags.findFirst = vi
        .fn()
        .mockRejectedValueOnce(new Error("Database error"));

      // テスト実行
      const result = await repository.findById(mockTagId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to find tag by ID");
      }
    });
  });

  describe("findBySlug", () => {
    it("存在するタグ名で検索すると、タグを返す", async () => {
      // モックの設定
      mockDb.query.tags.findFirst = vi.fn().mockResolvedValueOnce(mockTag);

      // テスト実行
      const result = await repository.findBySlug(mockTag.name);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const foundTag = result.value;
        expect(foundTag).not.toBeNull();
        expect(foundTag?.id).toBe(mockTag.id);
        expect(foundTag?.name).toBe(mockTag.name);
      }
    });

    it("存在しないタグ名で検索すると、nullを返す", async () => {
      // モックの設定
      mockDb.query.tags.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.findBySlug("存在しないタグ");

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe("findByUserId", () => {
    it("ユーザーIDに関連するタグを返す", async () => {
      // モックの設定
      const mockTags = [
        mockTag,
        {
          id: generateId(),
          name: "テストタグ2",
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockDb.query.tags.findMany = vi.fn().mockResolvedValueOnce(mockTags);

      // テスト実行
      const result = await repository.findByUserId(mockUserId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const foundTags = result.value;
        expect(foundTags.length).toBe(2);
        expect(foundTags[0].id).toBe(mockTags[0].id);
        expect(foundTags[1].id).toBe(mockTags[1].id);
      }
    });

    it("ユーザーIDに関連するタグがない場合、空の配列を返す", async () => {
      // モックの設定
      mockDb.query.tags.findMany = vi.fn().mockResolvedValueOnce([]);

      // テスト実行
      const result = await repository.findByUserId(generateId());

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe("findByDocumentId", () => {
    it("文書IDに関連するタグを返す", async () => {
      // モックの設定
      const mockDocumentTags = [{ tagId: mockTagId }, { tagId: generateId() }];
      const mockTags = [
        mockTag,
        {
          id: mockDocumentTags[1].tagId,
          name: "テストタグ2",
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // documentTagsのfindManyをモック
      mockDb.query.documentTags.findMany = vi
        .fn()
        .mockResolvedValueOnce(mockDocumentTags);

      // tagsのfindManyをモック（最初のタグID用）
      mockDb.query.tags.findMany = vi.fn().mockResolvedValueOnce([mockTags[0]]);

      // tagsのfindFirstをモック（残りのタグID用）
      mockDb.query.tags.findFirst = vi.fn().mockResolvedValueOnce(mockTags[1]);

      // テスト実行
      const result = await repository.findByDocumentId(mockDocumentId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const foundTags = result.value;
        expect(foundTags.length).toBe(2);
        expect(foundTags[0].id).toBe(mockTags[0].id);
        expect(foundTags[1].id).toBe(mockTags[1].id);
      }
    });

    it("文書IDに関連するタグがない場合、空の配列を返す", async () => {
      // モックの設定
      mockDb.query.documentTags.findMany = vi.fn().mockResolvedValueOnce([]);

      // テスト実行
      const result = await repository.findByDocumentId(generateId());

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe("save", () => {
    it("新しいタグを保存すると、保存されたタグを返す", async () => {
      // モックの設定
      mockDb.query.tags.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const tag = {
        id: mockTagId,
        ...createTag("新しいタグ", mockUserId),
      };
      const result = await repository.save(tag);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const savedTag = result.value;
        expect(savedTag.id).toBe(mockTag.id);
        expect(savedTag.name).toBe(mockTag.name);
      }
    });

    it("既存のタグを更新すると、更新されたタグを返す", async () => {
      // モックの設定
      mockDb.query.tags.findFirst = vi.fn().mockResolvedValueOnce(mockTag);

      // テスト実行
      const updatedTag = {
        ...mockTag,
        name: "更新されたタグ名",
      };
      const result = await repository.save(updatedTag);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const savedTag = result.value;
        expect(savedTag.id).toBe(mockTag.id);
      }
    });
  });

  describe("delete", () => {
    it("タグを削除すると、成功結果を返す", async () => {
      // テスト実行
      const result = await repository.delete(mockTagId);

      // 検証
      expect(result.isOk()).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});

describe("DrizzleDocumentTagRepository", () => {
  let repository: DrizzleDocumentTagRepository;
  let mockDb: PgDatabase;

  beforeEach(() => {
    // モックデータベースの作成
    mockDb = {
      query: {
        documentTags: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockDocumentTag])),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    } as unknown as PgDatabase;

    // リポジトリの初期化
    repository = new DrizzleDocumentTagRepository(mockDb);
  });

  describe("findByDocumentId", () => {
    it("文書IDに関連する文書タグを返す", async () => {
      // モックの設定
      const mockDocumentTags = [
        mockDocumentTag,
        {
          id: generateId(),
          documentId: mockDocumentId,
          tagId: generateId(),
          createdAt: new Date(),
        },
      ];
      mockDb.query.documentTags.findMany = vi
        .fn()
        .mockResolvedValueOnce(mockDocumentTags);

      // テスト実行
      const result = await repository.findByDocumentId(mockDocumentId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const foundDocumentTags = result.value;
        expect(foundDocumentTags.length).toBe(2);
        expect(foundDocumentTags[0].id).toBe(mockDocumentTags[0].id);
        expect(foundDocumentTags[1].id).toBe(mockDocumentTags[1].id);
      }
    });

    it("文書IDに関連する文書タグがない場合、空の配列を返す", async () => {
      // モックの設定
      mockDb.query.documentTags.findMany = vi.fn().mockResolvedValueOnce([]);

      // テスト実行
      const result = await repository.findByDocumentId(generateId());

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe("findByTagId", () => {
    it("タグIDに関連する文書タグを返す", async () => {
      // モックの設定
      const mockDocumentTags = [
        mockDocumentTag,
        {
          id: generateId(),
          documentId: generateId(),
          tagId: mockTagId,
          createdAt: new Date(),
        },
      ];
      mockDb.query.documentTags.findMany = vi
        .fn()
        .mockResolvedValueOnce(mockDocumentTags);

      // テスト実行
      const result = await repository.findByTagId(mockTagId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const foundDocumentTags = result.value;
        expect(foundDocumentTags.length).toBe(2);
        expect(foundDocumentTags[0].id).toBe(mockDocumentTags[0].id);
        expect(foundDocumentTags[1].id).toBe(mockDocumentTags[1].id);
      }
    });

    it("タグIDに関連する文書タグがない場合、空の配列を返す", async () => {
      // モックの設定
      mockDb.query.documentTags.findMany = vi.fn().mockResolvedValueOnce([]);

      // テスト実行
      const result = await repository.findByTagId(generateId());

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe("save", () => {
    it("新しい文書タグを保存すると、保存された文書タグを返す", async () => {
      // モックの設定
      mockDb.query.documentTags.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const documentTag = {
        id: generateId(),
        ...createDocumentTag(mockDocumentId, mockTagId),
      };
      const result = await repository.save(documentTag);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const savedDocumentTag = result.value;
        expect(savedDocumentTag.id).toBe(mockDocumentTag.id);
        expect(savedDocumentTag.documentId).toBe(mockDocumentTag.documentId);
        expect(savedDocumentTag.tagId).toBe(mockDocumentTag.tagId);
      }
    });

    it("既に存在する文書タグの組み合わせを保存すると、既存の文書タグを返す", async () => {
      // モックの設定
      mockDb.query.documentTags.findFirst = vi
        .fn()
        .mockResolvedValueOnce(mockDocumentTag);

      // テスト実行
      const newDocumentTag = {
        id: generateId(),
        ...createDocumentTag(mockDocumentId, mockTagId),
      };
      const result = await repository.save(newDocumentTag);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const savedDocumentTag = result.value;
        expect(savedDocumentTag.id).toBe(mockDocumentTag.id);
        expect(savedDocumentTag.documentId).toBe(mockDocumentTag.documentId);
        expect(savedDocumentTag.tagId).toBe(mockDocumentTag.tagId);
      }
    });
  });

  describe("delete", () => {
    it("文書タグを削除すると、成功結果を返す", async () => {
      // テスト実行
      const result = await repository.delete(mockDocumentTag.id);

      // 検証
      expect(result.isOk()).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("deleteByDocumentIdAndTagId", () => {
    it("文書IDとタグIDに一致する文書タグを削除すると、成功結果を返す", async () => {
      // テスト実行
      const result = await repository.deleteByDocumentIdAndTagId(
        mockDocumentId,
        mockTagId,
      );

      // 検証
      expect(result.isOk()).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
