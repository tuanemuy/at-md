import { expect, test, vi, beforeEach } from "vitest";
import { ok, err } from "neverthrow";
import { GetPostsByUserUseCase } from "../getPostsByUser";
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
const mockPosts: Post[] = [
  {
    id: "post-123",
    documentId: "doc-123",
    platform: "bluesky",
    uri: "at://user.bsky.app/post/123",
    status: "pending",
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  },
  {
    id: "post-456",
    documentId: "doc-456",
    platform: "bluesky",
    uri: "at://user.bsky.app/post/456",
    status: "published",
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  },
];

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("ユーザーIDに関連する投稿が存在する場合、それらの投稿が取得できること", async () => {
  // Arrange
  const useCase = new GetPostsByUserUseCase(mockPostRepository);
  (
    mockPostRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockPosts));

  // Act
  const result = await useCase.execute("user-123");

  // Assert
  expect(result.isOk()).toBe(true);
  const posts = result._unsafeUnwrap();
  expect(posts).toHaveLength(2);
  expect(posts[0].id).toBe("post-123");
  expect(posts[1].id).toBe("post-456");
  expect(posts[0].userId).toBe("user-123");
  expect(posts[1].userId).toBe("user-123");

  // リポジトリのfindByUserIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findByUserId).toHaveBeenCalledWith("user-123");
  expect(mockPostRepository.findByUserId).toHaveBeenCalledTimes(1);
});

test("ユーザーIDに関連する投稿が存在しない場合、空の配列が返されること", async () => {
  // Arrange
  const useCase = new GetPostsByUserUseCase(mockPostRepository);
  (
    mockPostRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));

  // Act
  const result = await useCase.execute("user-456");

  // Assert
  expect(result.isOk()).toBe(true);
  const posts = result._unsafeUnwrap();
  expect(posts).toHaveLength(0);
  expect(posts).toEqual([]);

  // リポジトリのfindByUserIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findByUserId).toHaveBeenCalledWith("user-456");
});

test("リポジトリでエラーが発生した場合はそのエラーがそのまま返されること", async () => {
  // Arrange
  const useCase = new GetPostsByUserUseCase(mockPostRepository);
  const repositoryError = {
    name: "RepositoryError",
    type: "DATABASE_ERROR",
    message: "Failed to connect to database",
  };
  (
    mockPostRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(repositoryError));

  // Act
  const result = await useCase.execute("user-123");

  // Assert
  expect(result.isErr()).toBe(true);
  const error = result._unsafeUnwrapErr();
  expect(error).toEqual(repositoryError);
  expect(error.name).toBe("RepositoryError");
  expect(error.type).toBe("DATABASE_ERROR");
  expect(error.message).toBe("Failed to connect to database");
});

test("無効なユーザーIDフォーマットを指定した場合もリポジトリに渡されること", async () => {
  // Arrange
  const useCase = new GetPostsByUserUseCase(mockPostRepository);
  (
    mockPostRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const invalidUserId = "invalid-user-id"; // UUIDフォーマットではない

  // Act
  const result = await useCase.execute(invalidUserId);

  // Assert
  expect(result.isOk()).toBe(true);
  const posts = result._unsafeUnwrap();
  expect(posts).toHaveLength(0);

  // リポジトリのfindByUserIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findByUserId).toHaveBeenCalledWith(invalidUserId);
  expect(mockPostRepository.findByUserId).toHaveBeenCalledTimes(1);
});

test("空文字列のユーザーIDを指定した場合もリポジトリに渡されること", async () => {
  // Arrange
  const useCase = new GetPostsByUserUseCase(mockPostRepository);
  (
    mockPostRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const emptyUserId = "";

  // Act
  const result = await useCase.execute(emptyUserId);

  // Assert
  expect(result.isOk()).toBe(true);
  const posts = result._unsafeUnwrap();
  expect(posts).toHaveLength(0);

  // リポジトリのfindByUserIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findByUserId).toHaveBeenCalledWith(emptyUserId);
  expect(mockPostRepository.findByUserId).toHaveBeenCalledTimes(1);
});
