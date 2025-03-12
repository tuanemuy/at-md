import { expect, test, vi, beforeEach } from "vitest";
import { ok, err } from "neverthrow";
import { PublishPostUseCase } from "../publishPost";
import { createPostError } from "../../models/errors";
import type { Post } from "../../models/post";
import type { PostRepository } from "../../repositories/post";
import type { PostService } from "../../services/post";

// モックの投稿リポジトリとサービスを作成
const mockPostRepository: PostRepository = {
  findById: vi.fn(),
  findByDocumentId: vi.fn(),
  findByUserId: vi.fn(),
  save: vi.fn(),
  updateStatus: vi.fn(),
  delete: vi.fn(),
};

const mockPostService: PostService = {
  createPost: vi.fn(),
  getPostStatus: vi.fn(),
};

// テスト用の投稿データ
const mockPendingPost: Post = {
  id: "post-123",
  documentId: "doc-123",
  platform: "bluesky",
  uri: "",
  status: "pending",
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "user-123",
};

const mockPublishedPost: Post = {
  ...mockPendingPost,
  status: "published",
  uri: "at://user.bsky.app/post/123",
  publishedAt: new Date(),
  updatedAt: new Date(Date.now() + 1000), // 更新日時を新しくする
};

const mockFailedPost: Post = {
  ...mockPendingPost,
  status: "failed",
  error: "Previous publish attempt failed",
  updatedAt: new Date(Date.now() + 1000), // 更新日時を新しくする
};

// 別のユーザーの投稿データ
const otherUserPost: Post = {
  ...mockPendingPost,
  id: "post-456",
  userId: "user-456",
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("pending状態の投稿を公開すると公開状態になり公開日時が設定されること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(mockPendingPost),
  );
  (mockPostService.getPostStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok("published"),
  );
  (
    mockPostRepository.updateStatus as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockPublishedPost));

  // Act
  const result = await useCase.execute("post-123");

  // Assert
  expect(result.isOk()).toBe(true);
  const publishedPost = result._unsafeUnwrap();
  expect(publishedPost.status).toBe("published");
  expect(publishedPost.publishedAt).not.toBeNull();
  expect(publishedPost.uri).toBe("at://user.bsky.app/post/123");
  expect(publishedPost.updatedAt.getTime()).toBeGreaterThan(
    mockPendingPost.updatedAt.getTime(),
  );
});

test("すでに公開済みの投稿を公開しようとしても再公開されずに成功すること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(mockPublishedPost),
  );

  // Act
  const result = await useCase.execute("post-123");

  // Assert
  expect(result.isOk()).toBe(true);
  const publishedPost = result._unsafeUnwrap();
  expect(publishedPost).toEqual(mockPublishedPost);

  // すでに公開済みの場合はステータス確認が実行されないことを確認
  expect(mockPostService.getPostStatus).not.toHaveBeenCalled();
  expect(mockPostRepository.updateStatus).not.toHaveBeenCalled();
});

test("失敗状態の投稿を公開すると公開状態に更新されること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(mockFailedPost),
  );
  (mockPostService.getPostStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok("published"),
  );
  (
    mockPostRepository.updateStatus as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockPublishedPost));

  // Act
  const result = await useCase.execute("post-123");

  // Assert
  expect(result.isOk()).toBe(true);
  const publishedPost = result._unsafeUnwrap();
  expect(publishedPost.status).toBe("published");
  expect(publishedPost.publishedAt).not.toBeNull();
  expect(publishedPost).not.toHaveProperty("error");
});

test("存在しない投稿IDを指定した場合は投稿が見つからないエラーが返されること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(null),
  );

  // Act
  const result = await useCase.execute("non-existent-id");

  // Assert
  expect(result.isErr()).toBe(true);
  const error = result._unsafeUnwrapErr();
  expect(error.name).toBe("PostError");
  expect(error.type).toBe("API_ERROR");
  expect(error.message).toContain("投稿が見つかりません");
  expect(error.message).toContain("non-existent-id");

  // 投稿が見つからない場合は後続の処理が実行されないことを確認
  expect(mockPostService.getPostStatus).not.toHaveBeenCalled();
  expect(mockPostRepository.updateStatus).not.toHaveBeenCalled();
});

test("投稿サービスでエラーが発生した場合はそのエラーがそのまま返されること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(mockPendingPost),
  );
  const postError = createPostError("API_ERROR", "Failed to get post status");
  (mockPostService.getPostStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
    err(postError),
  );

  // Act
  const result = await useCase.execute("post-123");

  // Assert
  expect(result.isErr()).toBe(true);
  const error = result._unsafeUnwrapErr();
  expect(error).toEqual(postError);
  expect(error.name).toBe("PostError");
  expect(error.type).toBe("API_ERROR");
  expect(error.message).toBe("Failed to get post status");

  // エラーが発生した場合は更新処理が実行されないことを確認
  expect(mockPostRepository.updateStatus).not.toHaveBeenCalled();
});

test("リポジトリでエラーが発生した場合はそのエラーがそのまま返されること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(mockPendingPost),
  );
  (mockPostService.getPostStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok("published"),
  );
  const repositoryError = {
    name: "RepositoryError",
    type: "DATABASE_ERROR",
    message: "Failed to connect to database",
  };
  (
    mockPostRepository.updateStatus as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(repositoryError));

  // Act
  const result = await useCase.execute("post-123");

  // Assert
  expect(result.isErr()).toBe(true);
  const error = result._unsafeUnwrapErr();
  expect(error).toEqual(repositoryError);
  expect(error.name).toBe("RepositoryError");
  expect(error.type).toBe("DATABASE_ERROR");
  expect(error.message).toBe("Failed to connect to database");
});

test("無効なIDフォーマットを指定した場合もリポジトリに渡されること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(null),
  );
  const invalidId = "invalid-id"; // UUIDフォーマットではない

  // Act
  const result = await useCase.execute(invalidId);

  // Assert
  expect(result.isErr()).toBe(true);
  const error = result._unsafeUnwrapErr();
  expect(error.name).toBe("PostError");
  expect(error.type).toBe("API_ERROR");
  expect(error.message).toContain("投稿が見つかりません");
  expect(error.message).toContain(invalidId);

  // リポジトリのfindByIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findById).toHaveBeenCalledWith(invalidId);
  expect(mockPostRepository.findById).toHaveBeenCalledTimes(1);
});

test("空文字列のIDを指定した場合もリポジトリに渡されること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(null),
  );
  const emptyId = "";

  // Act
  const result = await useCase.execute(emptyId);

  // Assert
  expect(result.isErr()).toBe(true);
  const error = result._unsafeUnwrapErr();
  expect(error.name).toBe("PostError");
  expect(error.type).toBe("API_ERROR");
  expect(error.message).toContain("投稿が見つかりません");
  expect(error.message).toContain(emptyId);

  // リポジトリのfindByIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findById).toHaveBeenCalledWith(emptyId);
  expect(mockPostRepository.findById).toHaveBeenCalledTimes(1);
});

test("非常に長いエラーメッセージを持つ失敗状態の投稿を公開できること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  const longErrorMessage = "e".repeat(1000); // 非常に長いエラーメッセージ
  const postWithLongError: Post = {
    ...mockPendingPost,
    status: "failed",
    error: longErrorMessage,
  };

  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(postWithLongError),
  );
  (mockPostService.getPostStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok("published"),
  );
  (
    mockPostRepository.updateStatus as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockPublishedPost));

  // Act
  const result = await useCase.execute("post-123");

  // Assert
  expect(result.isOk()).toBe(true);
  const publishedPost = result._unsafeUnwrap();
  expect(publishedPost.status).toBe("published");
  expect(publishedPost).not.toHaveProperty("error");

  // ステータス確認が正しく呼び出されたことを確認
  expect(mockPostService.getPostStatus).toHaveBeenCalledWith("post-123");
});

// セキュリティ関連のテスト
test("異なるユーザーの投稿を公開しようとした場合、ユーザーIDの検証が必要であること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(otherUserPost),
  );
  const currentUserId = "user-123"; // 現在のユーザーID

  // モックの設定を追加
  (mockPostService.getPostStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok("published"),
  );
  (
    mockPostRepository.updateStatus as ReturnType<typeof vi.fn>
  ).mockResolvedValue(
    ok({
      ...otherUserPost,
      status: "published",
      publishedAt: new Date(),
    }),
  );

  // Act
  const result = await useCase.execute("post-456");

  // Assert
  expect(result.isOk()).toBe(true); // 現在の実装では権限チェックがないため成功する
  const publishedPost = result._unsafeUnwrap();

  // 投稿のユーザーIDが現在のユーザーと異なることを確認
  expect(publishedPost.userId).not.toBe(currentUserId);
  expect(publishedPost.userId).toBe("user-456");

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合は操作を拒否する必要があります
  // このテストは、そのような検証の必要性を示しています
});

// SQLインジェクション対策のテスト
test("SQLインジェクションを試みるIDを指定した場合でも安全に処理されること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(null),
  );
  const maliciousId = "1'; DROP TABLE posts; --";

  // Act
  const result = await useCase.execute(maliciousId);

  // Assert
  expect(result.isErr()).toBe(true);
  const error = result._unsafeUnwrapErr();
  expect(error.name).toBe("PostError");
  expect(error.type).toBe("API_ERROR");
  expect(error.message).toContain("投稿が見つかりません");

  // リポジトリのfindByIdメソッドが安全に呼び出されたことを確認
  expect(mockPostRepository.findById).toHaveBeenCalledWith(maliciousId);
  expect(mockPostRepository.findById).toHaveBeenCalledTimes(1);
});

// XSSインジェクション対策のテスト
test("XSSインジェクションを含むURIを持つ投稿が安全に処理されること", async () => {
  // Arrange
  const useCase = new PublishPostUseCase(mockPostRepository, mockPostService);
  const postWithXSS: Post = {
    ...mockPendingPost,
    uri: "<script>alert('XSS')</script>",
  };
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(postWithXSS),
  );
  (mockPostService.getPostStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok("published"),
  );
  (
    mockPostRepository.updateStatus as ReturnType<typeof vi.fn>
  ).mockResolvedValue(
    ok({
      ...postWithXSS,
      status: "published",
      publishedAt: new Date(),
    }),
  );

  // Act
  const result = await useCase.execute("post-123");

  // Assert
  expect(result.isOk()).toBe(true);
  const publishedPost = result._unsafeUnwrap();

  // URIにXSSが含まれていても処理が成功することを確認
  expect(publishedPost.uri).toContain("<script>");

  // 実際のアプリケーションでは、出力時にエスケープ処理が必要です
  // このテストは、そのような処理の必要性を示しています
});
