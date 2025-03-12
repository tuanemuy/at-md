import { vi } from "vitest";
import { type Container, ContainerImpl } from "./container";
import type { UserRepository } from "@/domain/account/repositories/user";
import type { AuthService } from "@/domain/account/services/auth";
import type { DocumentRepository } from "@/domain/document/repositories/document";
import type { GitHubRepoRepository } from "@/domain/document/repositories/githubRepo";
import type { TagRepository } from "@/domain/document/repositories/tag";
import type { SyncService } from "@/domain/document/services/sync";
import type { PostRepository } from "@/domain/post/repositories/post";
import type { PostService } from "@/domain/post/services/post";

/**
 * モックユーザーリポジトリを作成する
 * @returns モックユーザーリポジトリ
 */
export function createMockUserRepository(): UserRepository {
  return {
    findById: vi.fn(),
    findByDid: vi.fn(),
    save: vi.fn(),
    addGitHubConnection: vi.fn()
  };
}

/**
 * モック認証サービスを作成する
 * @returns モック認証サービス
 */
export function createMockAuthService(): AuthService {
  return {
    authenticateWithBluesky: vi.fn(),
    connectGitHub: vi.fn()
  };
}

/**
 * モック文書リポジトリを作成する
 * @returns モック文書リポジトリ
 */
export function createMockDocumentRepository(): DocumentRepository {
  return {
    findById: vi.fn(),
    findByGitHubRepoAndPath: vi.fn(),
    findByGitHubRepo: vi.fn(),
    save: vi.fn()
  };
}

/**
 * モックGitHubリポジトリリポジトリを作成する
 * @returns モックGitHubリポジトリリポジトリ
 */
export function createMockGitHubRepoRepository(): GitHubRepoRepository {
  return {
    findById: vi.fn(),
    findByFullName: vi.fn(),
    findByUserId: vi.fn(),
    save: vi.fn()
  };
}

/**
 * モックタグリポジトリを作成する
 * @returns モックタグリポジトリ
 */
export function createMockTagRepository(): TagRepository {
  return {
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findByUserId: vi.fn(),
    findByDocumentId: vi.fn(),
    save: vi.fn(),
    delete: vi.fn()
  };
}

/**
 * モック同期サービスを作成する
 * @returns モック同期サービス
 */
export function createMockSyncService(): SyncService {
  return {
    fetchFile: vi.fn(),
    fetchFiles: vi.fn(),
    syncFile: vi.fn(),
    syncAllFiles: vi.fn()
  };
}

/**
 * モック投稿リポジトリを作成する
 * @returns モック投稿リポジトリ
 */
export function createMockPostRepository(): PostRepository {
  return {
    findById: vi.fn(),
    findByDocumentId: vi.fn(),
    findByUserId: vi.fn(),
    save: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn()
  };
}

/**
 * モック投稿サービスを作成する
 * @returns モック投稿サービス
 */
export function createMockPostService(): PostService {
  return {
    createPost: vi.fn(),
    getPostStatus: vi.fn()
  };
}

/**
 * テスト用のモックコンテナを作成する
 * @returns モックコンテナ
 */
export function createMockContainer(): Container {
  return new ContainerImpl({
    userRepository: createMockUserRepository(),
    authService: createMockAuthService(),
    documentRepository: createMockDocumentRepository(),
    githubRepoRepository: createMockGitHubRepoRepository(),
    tagRepository: createMockTagRepository(),
    syncService: createMockSyncService(),
    postRepository: createMockPostRepository(),
    postService: createMockPostService()
  });
}

/**
 * 特定のモックを上書きしたモックコンテナを作成する
 * @param overrides 上書きするモック
 * @returns カスタマイズされたモックコンテナ
 */
export function createMockContainerWithOverrides(overrides: Partial<Container>): Container {
  const defaultContainer = createMockContainer();
  return {
    ...defaultContainer,
    ...overrides
  };
} 