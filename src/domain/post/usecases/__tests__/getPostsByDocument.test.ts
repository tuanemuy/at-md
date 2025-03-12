import { expect, test, vi, beforeEach } from "vitest";
import { ok, err } from "neverthrow";
import { GetPostsByDocumentUseCase } from "../getPostsByDocument";
import type { Post } from "../../models/post";
import type { PostRepository } from "../../repositories/post";

// モックの投稿リポジトリを作成
const mockPostRepository: PostRepository = {
  findById: vi.fn(),
  findByDocumentId: vi.fn(),
  findByUserId: vi.fn(),
  save: vi.fn(),
  updateStatus: vi.fn(),
  delete: vi.fn()
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
  userId: "user-123"
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("文書IDに関連する投稿が存在する場合、その投稿が取得できること", async () => {
  // Arrange
  const useCase = new GetPostsByDocumentUseCase(mockPostRepository);
  (mockPostRepository.findByDocumentId as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockPost));
  
  // Act
  const result = await useCase.execute("doc-123");
  
  // Assert
  expect(result.isOk()).toBe(true);
  const posts = result._unsafeUnwrap();
  expect(posts).toHaveLength(1);
  expect(posts[0].id).toBe("post-123");
  expect(posts[0].documentId).toBe("doc-123");
  
  // リポジトリのfindByDocumentIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findByDocumentId).toHaveBeenCalledWith("doc-123");
  expect(mockPostRepository.findByDocumentId).toHaveBeenCalledTimes(1);
});

test("文書IDに関連する投稿が存在しない場合、空の配列が返されること", async () => {
  // Arrange
  const useCase = new GetPostsByDocumentUseCase(mockPostRepository);
  (mockPostRepository.findByDocumentId as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  
  // Act
  const result = await useCase.execute("doc-456");
  
  // Assert
  expect(result.isOk()).toBe(true);
  const posts = result._unsafeUnwrap();
  expect(posts).toHaveLength(0);
  expect(posts).toEqual([]);
  
  // リポジトリのfindByDocumentIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findByDocumentId).toHaveBeenCalledWith("doc-456");
});

test("リポジトリでエラーが発生した場合はそのエラーがそのまま返されること", async () => {
  // Arrange
  const useCase = new GetPostsByDocumentUseCase(mockPostRepository);
  const repositoryError = {
    name: "RepositoryError",
    type: "DATABASE_ERROR",
    message: "Failed to connect to database"
  };
  (mockPostRepository.findByDocumentId as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  
  // Act
  const result = await useCase.execute("doc-123");
  
  // Assert
  expect(result.isErr()).toBe(true);
  const error = result._unsafeUnwrapErr();
  expect(error).toEqual(repositoryError);
  expect(error.name).toBe("RepositoryError");
  expect(error.type).toBe("DATABASE_ERROR");
  expect(error.message).toBe("Failed to connect to database");
});

test("無効なドキュメントIDフォーマットを指定した場合もリポジトリに渡されること", async () => {
  // Arrange
  const useCase = new GetPostsByDocumentUseCase(mockPostRepository);
  (mockPostRepository.findByDocumentId as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const invalidDocumentId = "invalid-doc-id"; // UUIDフォーマットではない
  
  // Act
  const result = await useCase.execute(invalidDocumentId);
  
  // Assert
  expect(result.isOk()).toBe(true);
  const posts = result._unsafeUnwrap();
  expect(posts).toHaveLength(0);
  
  // リポジトリのfindByDocumentIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findByDocumentId).toHaveBeenCalledWith(invalidDocumentId);
  expect(mockPostRepository.findByDocumentId).toHaveBeenCalledTimes(1);
});

test("空文字列のドキュメントIDを指定した場合もリポジトリに渡されること", async () => {
  // Arrange
  const useCase = new GetPostsByDocumentUseCase(mockPostRepository);
  (mockPostRepository.findByDocumentId as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const emptyDocumentId = "";
  
  // Act
  const result = await useCase.execute(emptyDocumentId);
  
  // Assert
  expect(result.isOk()).toBe(true);
  const posts = result._unsafeUnwrap();
  expect(posts).toHaveLength(0);
  
  // リポジトリのfindByDocumentIdメソッドが正しく呼び出されたことを確認
  expect(mockPostRepository.findByDocumentId).toHaveBeenCalledWith(emptyDocumentId);
  expect(mockPostRepository.findByDocumentId).toHaveBeenCalledTimes(1);
}); 