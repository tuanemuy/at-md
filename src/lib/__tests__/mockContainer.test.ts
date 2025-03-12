import { expect, test, vi } from "vitest";
import {
  createMockUserRepository,
  createMockAuthService,
  createMockDocumentRepository,
  createMockGitHubRepoRepository,
  createMockTagRepository,
  createMockSyncService,
  createMockPostRepository,
  createMockPostService,
  createMockContainer,
  createMockContainerWithOverrides
} from "../mockContainer";

test("createMockUserRepositoryが正しいモックを作成すること", () => {
  const mockRepo = createMockUserRepository();
  
  expect(mockRepo.findById).toBeDefined();
  expect(mockRepo.findByDid).toBeDefined();
  expect(mockRepo.save).toBeDefined();
  expect(mockRepo.addGitHubConnection).toBeDefined();
});

test("createMockAuthServiceが正しいモックを作成すること", () => {
  const mockService = createMockAuthService();
  
  expect(mockService.authenticateWithBluesky).toBeDefined();
  expect(mockService.connectGitHub).toBeDefined();
});

test("createMockDocumentRepositoryが正しいモックを作成すること", () => {
  const mockRepo = createMockDocumentRepository();
  
  expect(mockRepo.findById).toBeDefined();
  expect(mockRepo.findByGitHubRepoAndPath).toBeDefined();
  expect(mockRepo.findByGitHubRepo).toBeDefined();
  expect(mockRepo.save).toBeDefined();
});

test("createMockGitHubRepoRepositoryが正しいモックを作成すること", () => {
  const mockRepo = createMockGitHubRepoRepository();
  
  expect(mockRepo.findById).toBeDefined();
  expect(mockRepo.findByFullName).toBeDefined();
  expect(mockRepo.findByUserId).toBeDefined();
  expect(mockRepo.save).toBeDefined();
});

test("createMockTagRepositoryが正しいモックを作成すること", () => {
  const mockRepo = createMockTagRepository();
  
  expect(mockRepo.findById).toBeDefined();
  expect(mockRepo.findBySlug).toBeDefined();
  expect(mockRepo.findByUserId).toBeDefined();
  expect(mockRepo.findByDocumentId).toBeDefined();
  expect(mockRepo.save).toBeDefined();
  expect(mockRepo.delete).toBeDefined();
});

test("createMockSyncServiceが正しいモックを作成すること", () => {
  const mockService = createMockSyncService();
  
  expect(mockService.fetchFile).toBeDefined();
  expect(mockService.fetchFiles).toBeDefined();
  expect(mockService.syncFile).toBeDefined();
  expect(mockService.syncAllFiles).toBeDefined();
});

test("createMockPostRepositoryが正しいモックを作成すること", () => {
  const mockRepo = createMockPostRepository();
  
  expect(mockRepo.findById).toBeDefined();
  expect(mockRepo.findByDocumentId).toBeDefined();
  expect(mockRepo.findByUserId).toBeDefined();
  expect(mockRepo.save).toBeDefined();
  expect(mockRepo.updateStatus).toBeDefined();
  expect(mockRepo.delete).toBeDefined();
});

test("createMockPostServiceが正しいモックを作成すること", () => {
  const mockService = createMockPostService();
  
  expect(mockService.createPost).toBeDefined();
  expect(mockService.getPostStatus).toBeDefined();
});

test("createMockContainerが正しいモックコンテナを作成すること", () => {
  const container = createMockContainer();
  
  expect(container.userRepository).toBeDefined();
  expect(container.authService).toBeDefined();
  expect(container.documentRepository).toBeDefined();
  expect(container.githubRepoRepository).toBeDefined();
  expect(container.tagRepository).toBeDefined();
  expect(container.syncService).toBeDefined();
  expect(container.postRepository).toBeDefined();
  expect(container.postService).toBeDefined();
});

test("createMockContainerWithOverridesが正しくオーバーライドされたコンテナを作成すること", () => {
  const customUserRepo = createMockUserRepository();
  customUserRepo.findById = vi.fn().mockReturnValue("カスタム値");
  
  const container = createMockContainerWithOverrides({
    userRepository: customUserRepo
  });
  
  expect(container.userRepository).toBe(customUserRepo);
  expect(container.userRepository.findById("dummy-id")).toBe("カスタム値");
  
  // 他のリポジトリとサービスはデフォルトのままであることを確認
  expect(container.authService).toBeDefined();
  expect(container.documentRepository).toBeDefined();
  expect(container.githubRepoRepository).toBeDefined();
  expect(container.tagRepository).toBeDefined();
  expect(container.syncService).toBeDefined();
  expect(container.postRepository).toBeDefined();
  expect(container.postService).toBeDefined();
}); 