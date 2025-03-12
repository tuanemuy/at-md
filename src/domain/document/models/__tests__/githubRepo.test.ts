import { expect, test } from "vitest";
import { createGitHubRepo, updateGitHubRepo, type GitHubRepo } from "../githubRepo";

test("必要なパラメータを指定してGitHubリポジトリを作成すると正しいオブジェクトが返されること", () => {
  // Arrange
  const owner = "octocat";
  const name = "hello-world";
  const installationId = "inst-123";
  const userId = "user-123";
  
  // Act
  const result = createGitHubRepo(owner, name, installationId, userId);
  
  // Assert
  expect(result).toEqual({
    owner,
    name,
    fullName: `${owner}/${name}`,
    installationId,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    userId
  });
});

test("オプションパラメータを指定してGitHubリポジトリを作成すると正しいオブジェクトが返されること", () => {
  // Arrange
  const owner = "octocat";
  const name = "hello-world";
  const installationId = "inst-123";
  const userId = "user-123";
  const webhookSecret = "secret123";
  
  // Act
  const result = createGitHubRepo(owner, name, installationId, userId, webhookSecret);
  
  // Assert
  expect(result).toEqual({
    owner,
    name,
    fullName: `${owner}/${name}`,
    installationId,
    webhookSecret,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    userId
  });
});

test("GitHubリポジトリを更新すると指定したフィールドだけが更新されること", () => {
  // Arrange
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  const originalRepo: GitHubRepo = {
    id: "repo-123",
    owner: "octocat",
    name: "hello-world",
    fullName: "octocat/hello-world",
    installationId: "old-inst-123",
    webhookSecret: "old-secret",
    createdAt: fiveMinutesAgo,
    updatedAt: fiveMinutesAgo,
    userId: "user-123"
  };
  
  const updates = {
    installationId: "new-inst-456",
    webhookSecret: "new-secret"
  };
  
  // Act
  const result = updateGitHubRepo(originalRepo, updates);
  
  // Assert
  expect(result).toEqual({
    ...originalRepo,
    ...updates,
    updatedAt: expect.any(Date)
  });
  
  // 更新日時が変更されていることを確認
  expect(result.updatedAt.getTime()).toBeGreaterThan(originalRepo.updatedAt.getTime());
  
  // 他のフィールドが変更されていないことを確認
  expect(result.id).toBe(originalRepo.id);
  expect(result.owner).toBe(originalRepo.owner);
  expect(result.name).toBe(originalRepo.name);
  expect(result.fullName).toBe(originalRepo.fullName);
  expect(result.createdAt).toBe(originalRepo.createdAt);
  expect(result.userId).toBe(originalRepo.userId);
}); 