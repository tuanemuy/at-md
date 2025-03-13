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
import { createDocument } from "@/domain/document/models/document";
import { createGitHubRepo } from "@/domain/document/models/githubRepo";
import { createPost } from "@/domain/post/models/post";
import { DrizzlePostRepository } from "../../repositories/post/post";
import { DrizzleDocumentRepository } from "../../repositories/document/document";
import { DrizzleGitHubRepoRepository } from "../../repositories/document/githubRepo";
import { DrizzleUserRepository } from "../../repositories/account/user";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
} from "../setup";
import * as loggerModule from "@/lib/logger";

describe("DrizzlePostRepository (Integration)", () => {
  const client = new PGlite();
  const db = getTestDatabase(client);
  const postRepository = new DrizzlePostRepository(db);
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
      "testuser",
      "test-repo",
      "12345",
      userId,
      "secret"
    );
    const repo = { id: repoId, ...repoData };
    await githubRepoRepository.save(repo);

    // テスト用文書の作成
    documentId = generateId();
    const documentData = createDocument(
      repoId,
      "test/document.md",
      "Test Document",
      "# Test Document\n\nContent",
      userId,
      "This is a test document",
      "public"
    );
    const document = { id: documentId, ...documentData };
    await documentRepository.save(document);
  });

  // テスト後にデータベース接続を終了
  afterAll(async () => {
    await closeTestDatabase(client);
  });

  it("新しい投稿を保存して取得できること", async () => {
    // テスト用投稿の作成
    const postId = generateId();
    const postData = createPost(
      documentId,
      "bluesky",
      userId,
      "pending"
    );
    const post = { id: postId, ...postData };

    // 投稿を保存
    const saveResult = await postRepository.save(post);
    expect(saveResult.isOk()).toBe(true);

    // 保存した投稿をIDで取得
    const findByIdResult = await postRepository.findById(postId);
    
    // 投稿の取得に成功したことを確認
    expect(findByIdResult.isOk()).toBe(true);
    if (findByIdResult.isOk()) {
      const foundPost = findByIdResult.value;
      expect(foundPost).not.toBeNull();
      expect(foundPost?.id).toBe(postId);
      expect(foundPost?.documentId).toBe(documentId);
      expect(foundPost?.userId).toBe(userId);
      expect(foundPost?.platform).toBe("bluesky");
      expect(foundPost?.status).toBe("pending");
    }
  });

  it("文書IDで投稿を検索できること", async () => {
    // テスト用投稿の作成と保存
    const postId = generateId();
    const postData = createPost(
      documentId,
      "bluesky",
      userId,
      "pending"
    );
    const post = { id: postId, ...postData };
    await postRepository.save(post);

    // 文書IDで投稿を検索
    const findResult = await postRepository.findByDocumentId(documentId);
    
    // 投稿の検索に成功したことを確認
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const foundPost = findResult.value;
      expect(foundPost).not.toBeNull();
      expect(foundPost?.id).toBe(postId);
      expect(foundPost?.documentId).toBe(documentId);
    }
  });

  it("ユーザーIDで投稿を検索できること", async () => {
    // 複数の投稿を作成して保存
    const postId1 = generateId();
    const postData1 = createPost(
      documentId,
      "bluesky",
      userId,
      "pending"
    );
    const post1 = { id: postId1, ...postData1 };
    await postRepository.save(post1);

    const postId2 = generateId();
    const postData2 = createPost(
      documentId,
      "bluesky",
      userId,
      "published"
    );
    const post2 = { id: postId2, ...postData2 };
    await postRepository.save(post2);

    // ユーザーIDで投稿を検索
    const findResult = await postRepository.findByUserId(userId);
    
    // 投稿の検索に成功したことを確認
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const posts = findResult.value;
      expect(posts.length).toBe(2);
      
      // 各投稿が正しく取得できていることを確認
      const foundPostIds = posts.map(post => post.id);
      expect(foundPostIds).toContain(postId1);
      expect(foundPostIds).toContain(postId2);
    }
  });

  it("存在しないIDで投稿を検索するとnullを返すこと", async () => {
    const nonExistentId = generateId();
    const findResult = await postRepository.findById(nonExistentId);
    
    // 投稿の検索に成功したことを確認
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      expect(findResult.value).toBeNull();
    }
  });

  it("投稿情報を更新できること", async () => {
    // テスト用投稿の作成と保存
    const postId = generateId();
    const postData = createPost(
      documentId,
      "bluesky",
      userId,
      "pending"
    );
    const post = { id: postId, ...postData };
    await postRepository.save(post);

    // 投稿情報を更新
    const updatedPost = {
      ...post,
      uri: "at://example.com/post/123",
      status: "published" as const,
    };

    const updateResult = await postRepository.save(updatedPost);
    expect(updateResult.isOk()).toBe(true);

    // 更新された投稿を取得して確認
    const findResult = await postRepository.findById(postId);
    
    // 投稿の取得に成功したことを確認
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const foundPost = findResult.value;
      expect(foundPost).not.toBeNull();
      expect(foundPost?.uri).toBe("at://example.com/post/123");
      expect(foundPost?.status).toBe("published");
    }
  });

  it("投稿ステータスを更新できること", async () => {
    // テスト用投稿の作成と保存
    const postId = generateId();
    const postData = createPost(
      documentId,
      "bluesky",
      userId,
      "pending"
    );
    const post = { id: postId, ...postData };
    await postRepository.save(post);

    // 投稿ステータスを更新
    const updateResult = await postRepository.updateStatus(postId, "published");
    expect(updateResult.isOk()).toBe(true);

    // 更新された投稿を取得して確認
    const findResult = await postRepository.findById(postId);
    
    // 投稿の取得に成功したことを確認
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const foundPost = findResult.value;
      expect(foundPost).not.toBeNull();
      expect(foundPost?.status).toBe("published");
      expect(foundPost?.publishedAt).not.toBeNull();
    }
  });

  it("エラー情報を含めて投稿ステータスを更新できること", async () => {
    // テスト用投稿の作成と保存
    const postId = generateId();
    const postData = createPost(
      documentId,
      "bluesky",
      userId,
      "pending"
    );
    const post = { id: postId, ...postData };
    await postRepository.save(post);

    // エラー情報を含めて投稿ステータスを更新
    const errorMessage = "Failed to publish post";
    const updateResult = await postRepository.updateStatus(postId, "failed", errorMessage);
    expect(updateResult.isOk()).toBe(true);

    // 更新された投稿を取得して確認
    const findResult = await postRepository.findById(postId);
    
    // 投稿の取得に成功したことを確認
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const foundPost = findResult.value;
      expect(foundPost).not.toBeNull();
      expect(foundPost?.status).toBe("failed");
      expect(foundPost?.error).toBe(errorMessage);
    }
  });

  it("投稿を削除できること", async () => {
    // テスト用投稿の作成と保存
    const postId = generateId();
    const postData = createPost(
      documentId,
      "bluesky",
      userId,
      "pending"
    );
    const post = { id: postId, ...postData };
    await postRepository.save(post);

    // 投稿を削除
    const deleteResult = await postRepository.delete(postId);
    expect(deleteResult.isOk()).toBe(true);

    // 削除された投稿を検索
    const findResult = await postRepository.findById(postId);
    
    // 投稿の検索に成功したことを確認
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      expect(findResult.value).toBeNull();
    }
  });

  it("存在しないIDの投稿ステータスを更新するとエラーを返すこと", async () => {
    const nonExistentId = generateId();
    const updateResult = await postRepository.updateStatus(nonExistentId, "published");
    
    expect(updateResult.isErr()).toBe(true);
    if (updateResult.isErr()) {
      expect(updateResult.error.type).toBe("NOT_FOUND");
    }
  });

  // エラーハンドリングのテスト
  describe("エラーハンドリング", () => {
    it("findByIdでデータベースエラーが発生した場合、RepositoryErrorを返すこと", async () => {
      // findFirstメソッドをモック化してエラーをスローさせる
      const findFirstSpy = vi
        .spyOn(db.query.posts, "findFirst")
        .mockRejectedValueOnce(new Error("Database error"));

      const postId = generateId();
      const result = await postRepository.findById(postId);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to find post by ID");
      }

      // モックをリセット
      findFirstSpy.mockRestore();
    });

    it("saveでデータベースエラーが発生した場合、RepositoryErrorを返すこと", async () => {
      // insertメソッドをモック化してエラーをスローさせる
      const insertSpy = vi
        .spyOn(db, "insert")
        .mockRejectedValueOnce(new Error("Insert error"));

      const postId = generateId();
      const postData = createPost(
        documentId,
        "bluesky",
        userId,
        "pending"
      );
      const post = { id: postId, ...postData };

      const result = await postRepository.save(post);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to save post");
      }

      // モックをリセット
      insertSpy.mockRestore();
    });

    it("deleteでデータベースエラーが発生した場合、RepositoryErrorを返すこと", async () => {
      // deleteメソッドをモック化してエラーをスローさせる
      const deleteSpy = vi
        .spyOn(db, "delete")
        .mockRejectedValueOnce(new Error("Delete error"));

      const postId = generateId();
      const result = await postRepository.delete(postId);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("DATABASE_ERROR");
        expect(result.error.message).toContain("Failed to delete post");
      }

      // モックをリセット
      deleteSpy.mockRestore();
    });
  });
}); 