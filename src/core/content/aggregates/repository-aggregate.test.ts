import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { RepositoryAggregate, createRepositoryAggregate } from "./repository-aggregate.ts";
import { Repository, createRepository } from "../entities/repository.ts";

describe("RepositoryAggregate", () => {
  // テスト用のリポジトリを作成するヘルパー関数
  function createTestRepository(
    id: string = "repo-123",
    status: "active" | "inactive" | "syncing" = "active"
  ): Repository {
    return createRepository({
      id,
      userId: "user-456",
      name: `test-repository-${id}`,
      owner: "test-owner",
      defaultBranch: "main",
      lastSyncedAt: new Date("2023-01-01T00:00:00Z"),
      status,
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-01T00:00:00Z")
    });
  }

  it("リポジトリから集約を作成できること", () => {
    // 準備
    const repository = createTestRepository();
    
    // 操作
    const aggregate = createRepositoryAggregate(repository);
    
    // 検証
    expect(aggregate.repository).toEqual(repository);
  });

  it("リポジトリ名を更新できること", () => {
    // 準備
    const repository = createTestRepository();
    const aggregate = createRepositoryAggregate(repository);
    const newName = "new-repository-name";
    
    // 操作
    const updatedAggregate = aggregate.updateName(newName);
    
    // 検証
    expect(updatedAggregate.repository.name).toBe(newName);
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
  });

  it("デフォルトブランチを変更できること", () => {
    // 準備
    const repository = createTestRepository();
    const aggregate = createRepositoryAggregate(repository);
    const newBranch = "develop";
    
    // 操作
    const updatedAggregate = aggregate.changeDefaultBranch(newBranch);
    
    // 検証
    expect(updatedAggregate.repository.defaultBranch).toBe(newBranch);
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
  });

  it("同期を開始できること", () => {
    // 準備
    const repository = createTestRepository();
    const aggregate = createRepositoryAggregate(repository);
    
    // 操作
    const updatedAggregate = aggregate.startSync();
    
    // 検証
    expect(updatedAggregate.repository.status).toBe("syncing");
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
  });

  it("同期を完了できること", () => {
    // 準備
    const repository = createTestRepository("repo-123", "syncing");
    const aggregate = createRepositoryAggregate(repository);
    const syncDate = new Date("2023-01-02T00:00:00Z");
    
    // 操作
    const updatedAggregate = aggregate.completeSync(syncDate);
    
    // 検証
    expect(updatedAggregate.repository.status).toBe("active");
    expect(updatedAggregate.repository.lastSyncedAt).toEqual(syncDate);
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
  });

  it("リポジトリを非アクティブにできること", () => {
    // 準備
    const repository = createTestRepository();
    const aggregate = createRepositoryAggregate(repository);
    
    // 操作
    const updatedAggregate = aggregate.deactivate();
    
    // 検証
    expect(updatedAggregate.repository.status).toBe("inactive");
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
  });

  it("リポジトリをアクティブにできること", () => {
    // 準備
    const repository = createTestRepository("repo-123", "inactive");
    const aggregate = createRepositoryAggregate(repository);
    
    // 操作
    const updatedAggregate = aggregate.activate();
    
    // 検証
    expect(updatedAggregate.repository.status).toBe("active");
    expect(updatedAggregate).not.toBe(aggregate); // 新しいインスタンスが返されること
  });
}); 