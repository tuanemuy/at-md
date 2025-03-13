import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { generateId } from "@/domain/shared/models/id";
import { createUser } from "@/domain/account/models/user";
import { createGitHubRepo } from "@/domain/document/models/githubRepo";
import { DrizzleGitHubRepoRepository } from "../../repositories/document/githubRepo";
import { DrizzleUserRepository } from "../../repositories/account/user";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
} from "../setup";
import * as loggerModule from "@/lib/logger";

describe("DrizzleGitHubRepoRepository (Integration)", () => {
  const client = new PGlite();
  const db = getTestDatabase(client);
  const githubRepoRepository = new DrizzleGitHubRepoRepository(db);
  const userRepository = new DrizzleUserRepository(db);
  let userId: string;

  // テスト前にデータベースをセットアップ
  beforeAll(async () => {
    // ロガーをモック化
    vi.spyOn(loggerModule.logger, "debug").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "info").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "warn").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "error").mockImplementation(() => {});

    await setupTestDatabase(client);
  });

  // 各テスト前にデータベースをクリーンアップし、必要なデータを作成
  beforeEach(async () => {
    await cleanupTestDatabase(client);

    // テスト用ユーザーの作成
    userId = generateId();
    const userData = createUser("Test User", "did:example:123");
    const user = { id: userId, ...userData };
    await userRepository.save(user);
  });

  // テスト後にデータベース接続を閉じる
  afterAll(async () => {
    await closeTestDatabase(client);
    vi.restoreAllMocks();
  });

  it("新しいGitHubリポジトリを保存して取得できること", async () => {
    // テスト用GitHubリポジトリの作成
    const repoId = generateId();
    const repoData = createGitHubRepo(
      "testowner",
      "testrepo",
      "testowner/testrepo",
      userId,
    );
    const repo = { id: repoId, ...repoData };

    // リポジトリを保存
    const saveResult = await githubRepoRepository.save(repo);
    expect(saveResult.isOk()).toBe(true);

    // IDでリポジトリを取得
    const findByIdResult = await githubRepoRepository.findById(repoId);
    expect(findByIdResult.isOk()).toBe(true);
    if (findByIdResult.isOk()) {
      const foundRepo = findByIdResult.value;
      expect(foundRepo).not.toBeNull();
      expect(foundRepo?.id).toBe(repoId);
      expect(foundRepo?.owner).toBe("testowner");
      expect(foundRepo?.name).toBe("testrepo");
      expect(foundRepo?.fullName).toBe("testowner/testrepo");
      expect(foundRepo?.userId).toBe(userId);
    }
  });

  it("フルネームでGitHubリポジトリを検索できること", async () => {
    // テスト用GitHubリポジトリの作成と保存
    const repoId = generateId();
    const repoData = createGitHubRepo(
      "uniqueowner",
      "uniquerepo",
      "uniqueowner/uniquerepo",
      userId,
    );
    const repo = { id: repoId, ...repoData };
    await githubRepoRepository.save(repo);

    // フルネームでリポジトリを取得
    const findResult = await githubRepoRepository.findByFullName(
      "uniqueowner/uniquerepo",
    );
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const foundRepo = findResult.value;
      expect(foundRepo).not.toBeNull();
      expect(foundRepo?.id).toBe(repoId);
      expect(foundRepo?.owner).toBe("uniqueowner");
      expect(foundRepo?.name).toBe("uniquerepo");
    }
  });

  it("ユーザーIDでGitHubリポジトリを検索できること", async () => {
    // 複数のテスト用GitHubリポジトリを作成して保存
    const repo1Id = generateId();
    const repo1Data = createGitHubRepo(
      "owner1",
      "repo1",
      "owner1/repo1",
      userId,
    );
    const repo1 = { id: repo1Id, ...repo1Data };

    const repo2Id = generateId();
    const repo2Data = createGitHubRepo(
      "owner2",
      "repo2",
      "owner2/repo2",
      userId,
    );
    const repo2 = { id: repo2Id, ...repo2Data };

    await githubRepoRepository.save(repo1);
    await githubRepoRepository.save(repo2);

    // ユーザーIDでリポジトリを取得
    const findResult = await githubRepoRepository.findByUserId(userId);
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const repos = findResult.value;
      expect(repos.length).toBe(2);

      // 各リポジトリが正しく取得できていることを確認
      const names = repos.map((repo) => repo.name);
      expect(names).toContain("repo1");
      expect(names).toContain("repo2");
    }
  });

  it("存在しないIDでGitHubリポジトリを検索するとnullを返すこと", async () => {
    const nonExistentId = generateId();
    const result = await githubRepoRepository.findById(nonExistentId);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeNull();
    }
  });

  it("GitHubリポジトリ情報を更新できること", async () => {
    // テスト用GitHubリポジトリの作成と保存
    const repoId = generateId();
    const repoData = createGitHubRepo(
      "updateowner",
      "updaterepo",
      "original-installation-id",
      userId,
    );
    const repo = { id: repoId, ...repoData };
    await githubRepoRepository.save(repo);

    // リポジトリ情報を更新
    const updatedRepo = {
      ...repo,
      installationId: "updated-installation-id",
      webhookSecret: "new-webhook-secret",
    };

    const updateResult = await githubRepoRepository.save(updatedRepo);
    expect(updateResult.isOk()).toBe(true);

    // 更新されたリポジトリを取得して確認
    const findResult = await githubRepoRepository.findById(repoId);
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const foundRepo = findResult.value;
      expect(foundRepo).not.toBeNull();
      expect(foundRepo?.installationId).toBe("updated-installation-id");
      expect(foundRepo?.webhookSecret).toBe("new-webhook-secret");
      // 他のフィールドは変更されていないことを確認
      expect(foundRepo?.owner).toBe("updateowner");
      expect(foundRepo?.name).toBe("updaterepo");
    }
  });

  it("GitHubリポジトリを削除できること", async () => {
    // テスト用GitHubリポジトリの作成と保存
    const repoId = generateId();
    const repoData = createGitHubRepo(
      "deleteowner",
      "deleterepo",
      "delete-installation-id",
      userId,
    );
    const repo = { id: repoId, ...repoData };
    await githubRepoRepository.save(repo);

    // リポジトリが保存されていることを確認
    const findBeforeDeleteResult = await githubRepoRepository.findById(repoId);
    expect(findBeforeDeleteResult.isOk()).toBe(true);
    if (findBeforeDeleteResult.isOk()) {
      expect(findBeforeDeleteResult.value).not.toBeNull();
    }

    // リポジトリを削除
    const deleteResult = await githubRepoRepository.delete(repoId);
    expect(deleteResult.isOk()).toBe(true);

    // 削除後にリポジトリが存在しないことを確認
    const findAfterDeleteResult = await githubRepoRepository.findById(repoId);
    expect(findAfterDeleteResult.isOk()).toBe(true);
    if (findAfterDeleteResult.isOk()) {
      expect(findAfterDeleteResult.value).toBeNull();
    }
  });

  it("存在しないGitHubリポジトリを削除しても成功すること", async () => {
    const nonExistentId = generateId();
    
    // 存在しないリポジトリを削除
    const deleteResult = await githubRepoRepository.delete(nonExistentId);
    
    // 削除操作自体は成功する
    expect(deleteResult.isOk()).toBe(true);
  });
});
