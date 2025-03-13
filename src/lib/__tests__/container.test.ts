import { expect, test, beforeEach, afterEach } from "vitest";
import {
  type Container,
  ContainerImpl,
  initializeContainer,
  getContainer,
  resetContainer,
} from "../container";
import { vi } from "vitest";

// モックリポジトリとサービスを作成
const mockUserRepository = {
  findById: vi.fn(),
  findByDid: vi.fn(),
  save: vi.fn(),
  addGitHubConnection: vi.fn(),
  delete: vi.fn(),
};

const mockAuthService = {
  authenticateWithBluesky: vi.fn(),
  connectGitHub: vi.fn(),
};

const mockDocumentRepository = {
  findById: vi.fn(),
  findByGitHubRepoAndPath: vi.fn(),
  findByGitHubRepo: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

const mockGitHubRepoRepository = {
  findById: vi.fn(),
  findByFullName: vi.fn(),
  findByUserId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

const mockTagRepository = {
  findById: vi.fn(),
  findBySlug: vi.fn(),
  findByUserId: vi.fn(),
  findByDocumentId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

const mockSyncService = {
  fetchFile: vi.fn(),
  fetchFiles: vi.fn(),
  syncFile: vi.fn(),
  syncAllFiles: vi.fn(),
};

const mockPostRepository = {
  findById: vi.fn(),
  findByDocumentId: vi.fn(),
  findByUserId: vi.fn(),
  save: vi.fn(),
  updateStatus: vi.fn(),
  delete: vi.fn(),
};

const mockPostService = {
  createPost: vi.fn(),
  getPostStatus: vi.fn(),
};

// テスト用のコンテナを作成
const createTestContainer = (): Container => {
  return new ContainerImpl({
    userRepository: mockUserRepository,
    authService: mockAuthService,
    documentRepository: mockDocumentRepository,
    githubRepoRepository: mockGitHubRepoRepository,
    tagRepository: mockTagRepository,
    syncService: mockSyncService,
    postRepository: mockPostRepository,
    postService: mockPostService,
  });
};

// 各テスト前にコンテナをリセット
beforeEach(() => {
  resetContainer();
});

// 各テスト後にコンテナをリセット
afterEach(() => {
  resetContainer();
});

test("コンテナが正しく初期化されること", () => {
  // Arrange
  const container = createTestContainer();

  // Act
  initializeContainer(container);
  const retrievedContainer = getContainer();

  // Assert
  expect(retrievedContainer).toBe(container);
  expect(retrievedContainer.userRepository).toBe(mockUserRepository);
  expect(retrievedContainer.authService).toBe(mockAuthService);
  expect(retrievedContainer.documentRepository).toBe(mockDocumentRepository);
  expect(retrievedContainer.githubRepoRepository).toBe(
    mockGitHubRepoRepository,
  );
  expect(retrievedContainer.tagRepository).toBe(mockTagRepository);
  expect(retrievedContainer.syncService).toBe(mockSyncService);
  expect(retrievedContainer.postRepository).toBe(mockPostRepository);
  expect(retrievedContainer.postService).toBe(mockPostService);
});

test("コンテナが初期化されていない場合にエラーがスローされること", () => {
  // Act & Assert
  expect(() => getContainer()).toThrow("Container is not initialized");
});

test("コンテナがリセットされた後に再初期化できること", () => {
  // Arrange
  const container1 = createTestContainer();
  initializeContainer(container1);

  // Act
  resetContainer();

  // Assert
  expect(() => getContainer()).toThrow("Container is not initialized");

  // 再初期化
  const container2 = createTestContainer();
  initializeContainer(container2);
  const retrievedContainer = getContainer();

  // 再初期化後の検証
  expect(retrievedContainer).toBe(container2);
  expect(retrievedContainer).not.toBe(container1);
});

test("ContainerImplが正しく依存関係を保持すること", () => {
  // Arrange & Act
  const container = new ContainerImpl({
    userRepository: mockUserRepository,
    authService: mockAuthService,
    documentRepository: mockDocumentRepository,
    githubRepoRepository: mockGitHubRepoRepository,
    tagRepository: mockTagRepository,
    syncService: mockSyncService,
    postRepository: mockPostRepository,
    postService: mockPostService,
  });

  // Assert
  expect(container.userRepository).toBe(mockUserRepository);
  expect(container.authService).toBe(mockAuthService);
  expect(container.documentRepository).toBe(mockDocumentRepository);
  expect(container.githubRepoRepository).toBe(mockGitHubRepoRepository);
  expect(container.tagRepository).toBe(mockTagRepository);
  expect(container.syncService).toBe(mockSyncService);
  expect(container.postRepository).toBe(mockPostRepository);
  expect(container.postService).toBe(mockPostService);
});
