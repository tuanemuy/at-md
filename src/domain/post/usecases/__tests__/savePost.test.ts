import { expect, test, vi, beforeEach } from "vitest";
import { ok, err } from "neverthrow";
import { SavePostUseCase } from "../savePost";
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
  uri: "",
  status: "pending",
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "user-123",
};

// 更新された投稿データ
const mockUpdatedPost: Post = {
  ...mockPost,
  uri: "at://user.bsky.app/post/123",
  status: "published",
  publishedAt: new Date(),
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("投稿を保存するとリポジトリに保存され保存された投稿が返されること", async () => {
  // Arrange
  const useCase = new SavePostUseCase(mockPostRepository);
  (mockPostRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(mockPost),
  );

  // Act
  const result = await useCase.execute(mockPost);

  // Assert
  expect(result.isOk()).toBe(true);
  const savedPost = result._unsafeUnwrap();
  expect(savedPost).toEqual(mockPost);
  expect(savedPost.id).toBe("post-123");
  expect(savedPost.uri).toBe("");
  expect(savedPost.status).toBe("pending");

  // リポジトリのsaveメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.save).toHaveBeenCalledWith(mockPost);
});

test("更新された投稿を保存すると更新内容が反映された投稿が返されること", async () => {
  // Arrange
  const useCase = new SavePostUseCase(mockPostRepository);
  (mockPostRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(mockUpdatedPost),
  );

  // Act
  const result = await useCase.execute(mockUpdatedPost);

  // Assert
  expect(result.isOk()).toBe(true);
  const savedPost = result._unsafeUnwrap();
  expect(savedPost).toEqual(mockUpdatedPost);
  expect(savedPost.id).toBe("post-123");
  expect(savedPost.uri).toBe("at://user.bsky.app/post/123");
  expect(savedPost.status).toBe("published");
  expect(savedPost.publishedAt).not.toBeNull();

  // リポジトリのsaveメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.save).toHaveBeenCalledWith(mockUpdatedPost);
});

test("リポジトリでエラーが発生した場合はそのエラーがそのまま返されること", async () => {
  // Arrange
  const useCase = new SavePostUseCase(mockPostRepository);
  const repositoryError = {
    name: "RepositoryError",
    type: "DATABASE_ERROR",
    message: "Failed to connect to database",
  };
  (mockPostRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    err(repositoryError),
  );

  // Act
  const result = await useCase.execute(mockPost);

  // Assert
  expect(result.isErr()).toBe(true);
  const error = result._unsafeUnwrapErr();
  expect(error).toEqual(repositoryError);
  expect(error.name).toBe("RepositoryError");
  expect(error.type).toBe("DATABASE_ERROR");
  expect(error.message).toBe("Failed to connect to database");
});

test("無効なIDフォーマットの投稿を保存してもリポジトリに渡されること", async () => {
  // Arrange
  const useCase = new SavePostUseCase(mockPostRepository);
  const invalidPost = {
    ...mockPost,
    id: "invalid-id", // UUIDフォーマットではない
  };
  (mockPostRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(invalidPost),
  );

  // Act
  const result = await useCase.execute(invalidPost);

  // Assert
  expect(result.isOk()).toBe(true);
  const savedPost = result._unsafeUnwrap();
  expect(savedPost.id).toBe("invalid-id");

  // リポジトリのsaveメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.save).toHaveBeenCalledWith(invalidPost);
  expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
});

test("空の内容の投稿を保存してもリポジトリに渡されること", async () => {
  // Arrange
  const useCase = new SavePostUseCase(mockPostRepository);
  const emptyContentPost = {
    ...mockPost,
    uri: "", // 空の内容
  };
  (mockPostRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(emptyContentPost),
  );

  // Act
  const result = await useCase.execute(emptyContentPost);

  // Assert
  expect(result.isOk()).toBe(true);
  const savedPost = result._unsafeUnwrap();
  expect(savedPost.uri).toBe("");

  // リポジトリのsaveメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.save).toHaveBeenCalledWith(emptyContentPost);
  expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
});

test("非常に長い内容の投稿も保存できること", async () => {
  // Arrange
  const useCase = new SavePostUseCase(mockPostRepository);
  const longContentPost = {
    ...mockPost,
    uri: "a".repeat(10000), // 非常に長いコンテンツ
  };
  (mockPostRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(longContentPost),
  );

  // Act
  const result = await useCase.execute(longContentPost);

  // Assert
  expect(result.isOk()).toBe(true);
  const savedPost = result._unsafeUnwrap();
  expect(savedPost.uri.length).toBe(10000);

  // リポジトリのsaveメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.save).toHaveBeenCalledWith(longContentPost);
  expect(mockPostRepository.save).toHaveBeenCalledTimes(1);
});
