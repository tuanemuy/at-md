import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { Repository, RepositoryParams, RepositoryStatus, createRepository } from "./repository.ts";

describe("Repositoryエンティティ", () => {
  it("すべてのプロパティを指定して作成できること", () => {
    // 期待する結果
    const id = "repo-123";
    const userId = "user-456";
    const name = "test-repository";
    const owner = "test-owner";
    const defaultBranch = "main";
    const lastSyncedAt = new Date("2023-01-01T00:00:00Z");
    const status = "active";
    const createdAt = new Date("2023-01-01T00:00:00Z");
    const updatedAt = new Date("2023-01-02T00:00:00Z");

    // 操作
    const repository = createRepository({
      id,
      userId,
      name,
      owner,
      defaultBranch,
      lastSyncedAt,
      status,
      createdAt,
      updatedAt
    });

    // アサーション
    expect(repository.id).toBe(id);
    expect(repository.userId).toBe(userId);
    expect(repository.name).toBe(name);
    expect(repository.owner).toBe(owner);
    expect(repository.defaultBranch).toBe(defaultBranch);
    expect(repository.lastSyncedAt).toEqual(lastSyncedAt);
    expect(repository.status).toBe(status);
    expect(repository.createdAt).toEqual(createdAt);
    expect(repository.updatedAt).toEqual(updatedAt);
  });

  it("ステータスを変更できること", () => {
    // 準備
    const repository = createRepository({
      id: "repo-123",
      userId: "user-456",
      name: "test-repository",
      owner: "test-owner",
      defaultBranch: "main",
      lastSyncedAt: new Date("2023-01-01T00:00:00Z"),
      status: "active",
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-01T00:00:00Z")
    });

    // 操作
    const syncingRepository = repository.changeStatus("syncing");

    // アサーション
    expect(syncingRepository.status).toBe("syncing");
    expect(syncingRepository).not.toBe(repository); // 新しいインスタンスが返されること
  });

  it("最終同期日時を更新できること", () => {
    // 準備
    const repository = createRepository({
      id: "repo-123",
      userId: "user-456",
      name: "test-repository",
      owner: "test-owner",
      defaultBranch: "main",
      lastSyncedAt: new Date("2023-01-01T00:00:00Z"),
      status: "active",
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-01T00:00:00Z")
    });

    const newSyncDate = new Date("2023-01-02T00:00:00Z");

    // 操作
    const syncedRepository = repository.updateLastSyncedAt(newSyncDate);

    // アサーション
    expect(syncedRepository.lastSyncedAt).toEqual(newSyncDate);
    expect(syncedRepository).not.toBe(repository); // 新しいインスタンスが返されること
  });

  it("デフォルトブランチを変更できること", () => {
    // 準備
    const repository = createRepository({
      id: "repo-123",
      userId: "user-456",
      name: "test-repository",
      owner: "test-owner",
      defaultBranch: "main",
      lastSyncedAt: new Date("2023-01-01T00:00:00Z"),
      status: "active",
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-01T00:00:00Z")
    });

    // 操作
    const updatedRepository = repository.changeDefaultBranch("develop");

    // アサーション
    expect(updatedRepository.defaultBranch).toBe("develop");
    expect(updatedRepository).not.toBe(repository); // 新しいインスタンスが返されること
  });

  it("IDが指定されていない場合はエラーになること", () => {
    // 操作と検証
    expect(() => {
      createRepository({
        id: "",
        userId: "user-456",
        name: "test-repository",
        owner: "test-owner",
        defaultBranch: "main",
        lastSyncedAt: new Date(),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }).toThrow("リポジトリIDは必須です");
  });

  it("無効なステータスの場合はエラーになること", () => {
    // 操作と検証
    expect(() => {
      createRepository({
        id: "repo-123",
        userId: "user-456",
        name: "test-repository",
        owner: "test-owner",
        defaultBranch: "main",
        lastSyncedAt: new Date(),
        // 型チェックをバイパスするために型アサーションを使用
        status: "invalid-status" as unknown as RepositoryStatus,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }).toThrow("無効なステータスです");
  });

  it("無効なステータスの場合はエラーをスローする", () => {
    const repository = createRepository({
      id: "repo-1",
      userId: "user-1",
      name: "test-repo",
      owner: "test-owner",
      defaultBranch: "main",
      lastSyncedAt: new Date(),
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 無効なステータスを設定しようとするとエラーになる
    expect(() => {
      // 型チェックをバイパスするために型アサーションを使用
      repository.changeStatus("invalid-status" as unknown as RepositoryStatus);
    }).toThrow();
  });
}); 