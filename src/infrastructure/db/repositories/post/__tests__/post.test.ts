import { describe, it, expect, vi, beforeEach } from "vitest";
import { ok, err } from "neverthrow";
import { generateId } from "@/domain/shared/models/id";
import { DrizzlePostRepository } from "../post";
import type { PgDatabase } from "../../../client";
import { posts } from "../../../schema";
import { createRepositoryError } from "@/domain/shared/models/common";
import type { Post, PostPlatform, PostStatus } from "@/domain/post/models/post";

// テスト用データ
const mockPostId = generateId();
const mockDocumentId = generateId();
const mockUserId = generateId();
const mockPost = {
  id: mockPostId,
  documentId: mockDocumentId,
  userId: mockUserId,
  platform: "bluesky" as PostPlatform,
  uri: "at://example.com/post/123",
  status: "pending" as PostStatus,
  publishedAt: null,
  error: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("DrizzlePostRepository", () => {
  let repository: DrizzlePostRepository;
  let mockDb: PgDatabase;

  beforeEach(() => {
    // モックデータベースの作成
    mockDb = {
      query: {
        posts: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockPost])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([mockPost])),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    } as unknown as PgDatabase;

    // リポジトリの初期化
    repository = new DrizzlePostRepository(mockDb);
  });

  describe("findById", () => {
    it("存在する投稿IDで検索すると、投稿を返す", async () => {
      // モックの設定
      mockDb.query.posts.findFirst = vi.fn().mockResolvedValueOnce(mockPost);

      // テスト実行
      const result = await repository.findById(mockPostId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const foundPost = result.value;
        expect(foundPost).not.toBeNull();
        expect(foundPost?.id).toBe(mockPost.id);
        expect(foundPost?.documentId).toBe(mockPost.documentId);
        expect(foundPost?.platform).toBe(mockPost.platform);
        expect(foundPost?.status).toBe(mockPost.status);
      }
    });

    it("存在しない投稿IDで検索すると、nullを返す", async () => {
      // モックの設定
      mockDb.query.posts.findFirst = vi.fn().mockResolvedValueOnce(null);

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
      mockDb.query.posts.findFirst = vi
        .fn()
        .mockRejectedValueOnce(new Error("Database error"));

      // テスト実行
      const result = await repository.findById(mockPostId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to find post by ID");
      }
    });
  });

  describe("findByDocumentId", () => {
    it("存在する文書IDで検索すると、投稿を返す", async () => {
      // モックの設定
      mockDb.query.posts.findFirst = vi.fn().mockResolvedValueOnce(mockPost);

      // テスト実行
      const result = await repository.findByDocumentId(mockDocumentId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const foundPost = result.value;
        expect(foundPost).not.toBeNull();
        expect(foundPost?.id).toBe(mockPost.id);
        expect(foundPost?.documentId).toBe(mockPost.documentId);
      }
    });

    it("存在しない文書IDで検索すると、nullを返す", async () => {
      // モックの設定
      mockDb.query.posts.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.findByDocumentId(generateId());

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe("findByUserId", () => {
    it("ユーザーIDに関連する投稿を返す", async () => {
      // モックの設定
      const mockPosts = [
        mockPost,
        {
          id: generateId(),
          documentId: generateId(),
          userId: mockUserId,
          platform: "bluesky",
          uri: "at://example.com/post/456",
          status: "published",
          publishedAt: new Date(),
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockDb.query.posts.findMany = vi.fn().mockResolvedValueOnce(mockPosts);

      // テスト実行
      const result = await repository.findByUserId(mockUserId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const foundPosts = result.value;
        expect(foundPosts.length).toBe(2);
        expect(foundPosts[0].id).toBe(mockPosts[0].id);
        expect(foundPosts[1].id).toBe(mockPosts[1].id);
      }
    });

    it("ユーザーIDに関連する投稿がない場合、空の配列を返す", async () => {
      // モックの設定
      mockDb.query.posts.findMany = vi.fn().mockResolvedValueOnce([]);

      // テスト実行
      const result = await repository.findByUserId(generateId());

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe("save", () => {
    it("新しい投稿を保存すると、保存された投稿を返す", async () => {
      // モックの設定
      mockDb.query.posts.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const post: Post = {
        id: mockPostId,
        documentId: mockDocumentId,
        userId: mockUserId,
        platform: "bluesky",
        uri: "",
        status: "pending",
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await repository.save(post);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const savedPost = result.value;
        expect(savedPost.id).toBe(mockPost.id);
        expect(savedPost.documentId).toBe(mockPost.documentId);
        expect(savedPost.platform).toBe(mockPost.platform);
      }
    });

    it("既存の投稿を更新すると、更新された投稿を返す", async () => {
      // モックの設定
      mockDb.query.posts.findFirst = vi.fn().mockResolvedValueOnce(mockPost);

      // テスト実行
      const updatedPost: Post = {
        ...mockPost,
        status: "published",
        publishedAt: new Date(),
        uri: "at://example.com/post/updated",
      };
      const result = await repository.save(updatedPost);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const savedPost = result.value;
        expect(savedPost.id).toBe(mockPost.id);
      }
    });
  });

  describe("updateStatus", () => {
    it("投稿ステータスを更新すると、更新された投稿を返す", async () => {
      // モックの設定
      mockDb.query.posts.findFirst = vi.fn().mockResolvedValueOnce(mockPost);

      // テスト実行
      const result = await repository.updateStatus(mockPostId, "published");

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedPost = result.value;
        expect(updatedPost.id).toBe(mockPost.id);
      }
    });

    it("存在しない投稿IDでステータス更新すると、エラーを返す", async () => {
      // モックの設定
      mockDb.query.posts.findFirst = vi.fn().mockResolvedValueOnce(null);

      // テスト実行
      const result = await repository.updateStatus(generateId(), "published");

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NOT_FOUND");
      }
    });

    it("エラーメッセージを指定してステータスを更新すると、エラーメッセージが設定される", async () => {
      // モックの設定
      mockDb.query.posts.findFirst = vi.fn().mockResolvedValueOnce(mockPost);
      const updatedPost: Post = {
        ...mockPost,
        status: "failed",
        error: "投稿に失敗しました",
      };

      // モックの更新
      const mockUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([updatedPost])),
          })),
        })),
      }));

      // @ts-ignore - モックの型を無視
      mockDb.update = mockUpdate;

      // テスト実行
      const result = await repository.updateStatus(
        mockPostId,
        "failed",
        "投稿に失敗しました",
      );

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const post = result.value;
        expect(post.status).toBe("failed");
        expect(post.error).toBe("投稿に失敗しました");
      }
    });
  });

  describe("delete", () => {
    it("投稿を削除すると、成功結果を返す", async () => {
      // テスト実行
      const result = await repository.delete(mockPostId);

      // 検証
      expect(result.isOk()).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
