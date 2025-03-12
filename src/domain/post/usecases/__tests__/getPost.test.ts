import { expect, test, vi, beforeEach } from "vitest";
import { ok, err } from "neverthrow";
import { GetPostUseCase } from "../getPost";
import { createPostError } from "../../models/errors";
import type { Post } from "../../models/post";
import type { PostRepository } from "../../repositories/post";

// モックの投稿リポジトリを作成
const mockPostRepository: PostRepository = {
  findById: vi.fn(),
  findByDocumentId: vi.fn(),
  findByUserId: vi.fn(),
  save: vi.fn(),
  updateStatus: vi.fn(),
  delete: vi.fn(),
};

// テスト用の投稿データ
const mockPost: Post = {
  id: "post-123",
  documentId: "doc-123",
  platform: "bluesky",
  uri: "at://user.bsky.app/post/123",
  status: "pending",
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "user-123",
};

// 別のユーザーの投稿データ
const otherUserPost: Post = {
  ...mockPost,
  id: "post-456",
  userId: "user-456",
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("存在する投稿IDを指定すると対応する投稿が取得できること", async () => {
  // Arrange
  const useCase = new GetPostUseCase(mockPostRepository);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(mockPost),
  );

  // Act
  const result = await useCase.execute("post-123");

  // Assert
  expect(result.isOk()).toBe(true);
  const post = result._unsafeUnwrap();
  expect(post).not.toBeNull();
  expect(post).toEqual(mockPost);
  expect(post?.id).toBe("post-123");
  expect(post?.documentId).toBe("doc-123");
  expect(post?.platform).toBe("bluesky");
  expect(post?.uri).toBe("at://user.bsky.app/post/123");
  expect(post?.status).toBe("pending");
});

test("存在しない投稿IDを指定するとnullが返されること", async () => {
  // Arrange
  const useCase = new GetPostUseCase(mockPostRepository);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(null),
  );

  // Act
  const result = await useCase.execute("non-existent-id");

  // Assert
  expect(result.isOk()).toBe(true);
  const post = result._unsafeUnwrap();
  expect(post).toBeNull();
});

test("リポジトリでエラーが発生した場合はそのエラーがそのまま返されること", async () => {
  // Arrange
  const useCase = new GetPostUseCase(mockPostRepository);
  const repositoryError = {
    name: "RepositoryError",
    type: "DATABASE_ERROR",
    message: "Failed to connect to database",
  };
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    err(repositoryError),
  );

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
  const useCase = new GetPostUseCase(mockPostRepository);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(null),
  );
  const invalidId = "invalid-id"; // UUIDフォーマットではない

  // Act
  const result = await useCase.execute(invalidId);

  // Assert
  expect(result.isOk()).toBe(true);
  const post = result._unsafeUnwrap();
  expect(post).toBeNull();

  // リポジトリのfindByIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findById).toHaveBeenCalledWith(invalidId);
  expect(mockPostRepository.findById).toHaveBeenCalledTimes(1);
});

test("空文字列のIDを指定した場合もリポジトリに渡されること", async () => {
  // Arrange
  const useCase = new GetPostUseCase(mockPostRepository);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(null),
  );
  const emptyId = "";

  // Act
  const result = await useCase.execute(emptyId);

  // Assert
  expect(result.isOk()).toBe(true);
  const post = result._unsafeUnwrap();
  expect(post).toBeNull();

  // リポジトリのfindByIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findById).toHaveBeenCalledWith(emptyId);
  expect(mockPostRepository.findById).toHaveBeenCalledTimes(1);
});

// セキュリティ関連のテスト
test("異なるユーザーの投稿を取得した場合、ユーザーIDの検証が必要であること", async () => {
  // Arrange
  const useCase = new GetPostUseCase(mockPostRepository);
  (mockPostRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(otherUserPost),
  );
  const currentUserId = "user-123"; // 現在のユーザーID

  // Act
  const result = await useCase.execute("post-456");

  // Assert
  expect(result.isOk()).toBe(true);
  const post = result._unsafeUnwrap();

  // 投稿は取得できるが、ユーザーIDが異なることを確認
  expect(post).not.toBeNull();
  expect(post?.userId).not.toBe(currentUserId);
  expect(post?.userId).toBe("user-456");

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合はアクセスを拒否する必要があります
  // このテストは、そのような検証の必要性を示しています
});
