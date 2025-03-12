import { expect, test } from "vitest";
import { createGitHubRepo, updateGitHubRepo, type GitHubRepo, gitHubRepoSchema } from "../githubRepo";

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

// エッジケースのテスト
test("非常に長いオーナー名を持つGitHubリポジトリを作成できること", () => {
  // Arrange
  const longOwner = "a".repeat(1000); // 非常に長いオーナー名
  const name = "hello-world";
  const installationId = "inst-123";
  const userId = "user-123";
  
  // Act
  const result = createGitHubRepo(longOwner, name, installationId, userId);
  
  // Assert
  expect(result.owner).toBe(longOwner);
  expect(result.fullName).toBe(`${longOwner}/${name}`);
  expect(result.fullName.length).toBeGreaterThan(1000);
});

test("非常に長いリポジトリ名を持つGitHubリポジトリを作成できること", () => {
  // Arrange
  const owner = "octocat";
  const longName = "a".repeat(1000); // 非常に長いリポジトリ名
  const installationId = "inst-123";
  const userId = "user-123";
  
  // Act
  const result = createGitHubRepo(owner, longName, installationId, userId);
  
  // Assert
  expect(result.name).toBe(longName);
  expect(result.fullName).toBe(`${owner}/${longName}`);
  expect(result.fullName.length).toBeGreaterThan(1000);
});

test("非常に長いWebhookシークレットを持つGitHubリポジトリを作成できること", () => {
  // Arrange
  const owner = "octocat";
  const name = "hello-world";
  const installationId = "inst-123";
  const userId = "user-123";
  const longWebhookSecret = "s".repeat(1000); // 非常に長いWebhookシークレット
  
  // Act
  const result = createGitHubRepo(owner, name, installationId, userId, longWebhookSecret);
  
  // Assert
  expect(result.webhookSecret).toBe(longWebhookSecret);
  expect(result.webhookSecret?.length).toBe(1000);
});

// 境界条件のテスト
test("空のWebhookシークレットを持つGitHubリポジトリを作成できること", () => {
  // Arrange
  const owner = "octocat";
  const name = "hello-world";
  const installationId = "inst-123";
  const userId = "user-123";
  const emptyWebhookSecret = "";
  
  // Act
  const result = createGitHubRepo(owner, name, installationId, userId, emptyWebhookSecret);
  
  // Assert
  expect(result.webhookSecret).toBe(emptyWebhookSecret);
});

test("特殊文字を含むオーナー名とリポジトリ名を持つGitHubリポジトリを作成できること", () => {
  // Arrange
  const owner = "octo-cat_123";
  const name = "hello.world-123";
  const installationId = "inst-123";
  const userId = "user-123";
  
  // Act
  const result = createGitHubRepo(owner, name, installationId, userId);
  
  // Assert
  expect(result.owner).toBe(owner);
  expect(result.name).toBe(name);
  expect(result.fullName).toBe(`${owner}/${name}`);
});

// 無効な入力のテスト
test("空のオーナー名を持つGitHubリポジトリはスキーマバリデーションに失敗すること", () => {
  // Arrange
  const emptyOwner = "";
  const name = "hello-world";
  const installationId = "inst-123";
  const userId = "user-123";
  
  // Act
  const result = createGitHubRepo(emptyOwner, name, installationId, userId);
  
  // Assert
  expect(() => gitHubRepoSchema.parse({
    id: "repo-123",
    ...result
  })).toThrow();
});

test("空のリポジトリ名を持つGitHubリポジトリはスキーマバリデーションに失敗すること", () => {
  // Arrange
  const owner = "octocat";
  const emptyName = "";
  const installationId = "inst-123";
  const userId = "user-123";
  
  // Act
  const result = createGitHubRepo(owner, emptyName, installationId, userId);
  
  // Assert
  expect(() => gitHubRepoSchema.parse({
    id: "repo-123",
    ...result
  })).toThrow();
});

test("空のインストールIDを持つGitHubリポジトリはスキーマバリデーションに失敗すること", () => {
  // Arrange
  const owner = "octocat";
  const name = "hello-world";
  const emptyInstallationId = "";
  const userId = "user-123";
  
  // Act
  const result = createGitHubRepo(owner, name, emptyInstallationId, userId);
  
  // Assert
  expect(() => gitHubRepoSchema.parse({
    id: "repo-123",
    ...result
  })).toThrow();
});

test("異なるユーザーIDでGitHubリポジトリを更新しても元のユーザーIDが維持されること", () => {
  // Arrange
  const originalRepo: GitHubRepo = {
    id: "repo-123",
    owner: "octocat",
    name: "hello-world",
    fullName: "octocat/hello-world",
    installationId: "inst-123",
    webhookSecret: "secret-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123"
  };

  // 悪意のあるユーザーIDを含む更新データ
  // 注意: updateGitHubRepo関数はuserIdの更新を許可していないため、
  // このテストでは意図的に不正な入力を作成しています
  const maliciousUpdates = {
    installationId: "inst-456",
    webhookSecret: "new-secret-456",
  };

  // 悪意のあるユーザーID（テスト用）
  const maliciousUserId = "attacker-user-456";

  // Act
  // 実際のアプリケーションでは型チェックによりuserIdの更新は防止されるが、
  // 仮に型チェックをバイパスした場合でも、関数の実装によりuserIdは更新されないことを確認
  const result = updateGitHubRepo(originalRepo, {
    ...maliciousUpdates,
    // @ts-ignore - テスト目的で意図的に型チェックを無視
    userId: maliciousUserId
  });

  // Assert
  // userIdは更新されず、元の値が維持されることを確認
  expect(result.userId).toBe(originalRepo.userId);
  expect(result.userId).not.toBe(maliciousUserId);
  // updateGitHubRepo関数は、userIdフィールドの更新を許可していないことを確認
}); 