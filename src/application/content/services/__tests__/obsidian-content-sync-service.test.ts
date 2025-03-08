import { assertEquals, assertInstanceOf } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { spy, assertSpyCalls, assertSpyCall } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { Result, ok, err } from "npm:neverthrow";
import { ObsidianContentSyncService } from "../obsidian-content-sync-service.ts";
import { ContentRepository } from "../../repositories/content-repository.ts";
import { RepositoryRepository } from "../../repositories/repository-repository.ts";
import { ObsidianAdapter, ObsidianNote, ObsidianFolder, ObsidianVault, ObsidianError } from "../../../../infrastructure/adapters/obsidian/obsidian-adapter.ts";
import { ContentAggregate } from "../../../../core/content/aggregates/content-aggregate.ts";
import { RepositoryAggregate } from "../../../../core/content/aggregates/repository-aggregate.ts";
import { Repository } from "../../../../core/content/entities/repository.ts";
import { Content } from "../../../../core/content/entities/content.ts";
import { ContentMetadata } from "../../../../core/content/value-objects/content-metadata.ts";

// モックの作成
class MockContentRepository implements ContentRepository {
  findById = spy(async (_id: string): Promise<ContentAggregate | null> => null);
  findByRepositoryIdAndPath = spy(async (_repositoryId: string, _path: string): Promise<ContentAggregate | null> => null);
  findByUserId = spy(async (_userId: string, _options?: { limit?: number; offset?: number; status?: string; }): Promise<ContentAggregate[]> => []);
  findByRepositoryId = spy(async (_repositoryId: string, _options?: { limit?: number; offset?: number; status?: string; }): Promise<ContentAggregate[]> => []);
  save = spy(async (contentAggregate: ContentAggregate): Promise<ContentAggregate> => contentAggregate);
  delete = spy(async (_id: string): Promise<boolean> => true);
}

class MockRepositoryRepository implements RepositoryRepository {
  findById = spy(async (_id: string): Promise<RepositoryAggregate | null> => null);
  findByUserId = spy(async (_userId: string, _options?: { limit?: number; offset?: number; }): Promise<RepositoryAggregate[]> => []);
  findByName = spy(async (_userId: string, _name: string): Promise<RepositoryAggregate | null> => null);
  save = spy(async (repositoryAggregate: RepositoryAggregate): Promise<RepositoryAggregate> => repositoryAggregate);
  delete = spy(async (_id: string): Promise<boolean> => true);
}

class MockObsidianAdapter implements ObsidianAdapter {
  openVault = spy(async (_path: string) => ok({
    path: "/path/to/vault",
    name: "Test Vault",
    rootFolders: ["folder1", "folder2"],
    rootNotes: ["note1.md", "note2.md"]
  }));
  
  getNote = spy(async (_path: string) => ok({
    path: "test.md",
    name: "Test Note",
    content: "# Test Note\n\nThis is a test note.",
    frontMatter: { tags: ["test"] },
    tags: ["test"],
    links: [],
    backlinks: [],
    createdAt: new Date(),
    modifiedAt: new Date()
  }));
  
  saveNote = spy(async (_path: string, _content: string, _frontMatter?: Record<string, unknown>) => ok({
    path: "test.md",
    name: "Test Note",
    content: "# Test Note\n\nThis is a test note.",
    frontMatter: { tags: ["test"] },
    tags: ["test"],
    links: [],
    backlinks: [],
    createdAt: new Date(),
    modifiedAt: new Date()
  }));
  
  deleteNote = spy(async (_path: string) => ok(undefined));
  
  getFolder = spy(async (_path: string) => ok({
    path: "folder1",
    name: "Folder 1",
    subfolders: ["folder1/subfolder1"],
    notes: ["folder1/note1.md", "folder1/note2.md"]
  }));
  
  createFolder = spy(async (_path: string) => ok({
    path: "folder1",
    name: "Folder 1",
    subfolders: [],
    notes: []
  }));
  
  deleteFolder = spy(async (_path: string, _recursive?: boolean) => ok(undefined));
  
  getBacklinks = spy(async (_path: string) => ok([]));
  
  searchByTag = spy(async (_tag: string) => ok([]));
  
  searchByText = spy(async (_query: string) => ok([]));
}

// モックのリポジトリ集約を作成する関数
function createMockRepositoryAggregate(id: string, userId: string): RepositoryAggregate {
  const repository: Repository = {
    id,
    userId,
    name: "test-repo",
    owner: "test-owner",
    defaultBranch: "main",
    lastSyncedAt: new Date(),
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    changeStatus: function(status) { return this; },
    updateLastSyncedAt: function(date) { return this; },
    changeDefaultBranch: function(branch) { return this; }
  };

  return {
    repository,
    updateName: () => ({ repository } as RepositoryAggregate),
    changeDefaultBranch: () => ({ repository } as RepositoryAggregate),
    startSync: () => ({ repository } as RepositoryAggregate),
    completeSync: () => ({ repository } as RepositoryAggregate),
    deactivate: () => ({ repository } as RepositoryAggregate),
    activate: () => ({ repository } as RepositoryAggregate)
  };
}

// モックのコンテンツ集約を作成する関数
function createMockContentAggregate(id: string, repositoryId: string, path: string): ContentAggregate {
  const metadata: ContentMetadata = {
    tags: ["test"],
    categories: [],
    language: "ja"
  };

  const content: Content = {
    id,
    userId: "user1",
    repositoryId,
    path,
    title: "Test Content",
    body: "# Test Content\n\nThis is a test content.",
    metadata,
    visibility: "private",
    versions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    addVersion: function() { return this; },
    changeVisibility: function() { return this; },
    updateMetadata: function() { return this; }
  };

  return {
    content,
    updateTitle: () => ({ content } as ContentAggregate),
    updateBody: () => ({ content } as ContentAggregate),
    updateMetadata: () => ({ content } as ContentAggregate),
    publish: () => ({ content } as ContentAggregate),
    makePrivate: () => ({ content } as ContentAggregate),
    makeUnlisted: () => ({ content } as ContentAggregate)
  };
}

Deno.test("ObsidianContentSyncService", async (t) => {
  await t.step("syncRepository - リポジトリが見つからない場合はエラーを返す", async () => {
    // モックの準備
    const contentRepository = new MockContentRepository();
    const repositoryRepository = new MockRepositoryRepository();
    const obsidianAdapter = new MockObsidianAdapter();
    
    // テスト対象のサービスを作成
    const service = new ObsidianContentSyncService(
      contentRepository,
      repositoryRepository,
      obsidianAdapter
    );
    
    // モックのリポジトリ集約を作成
    const repositoryAggregate = createMockRepositoryAggregate("repo1", "user1");
    
    // getExternalConfigをモック化（privateメソッドなのでテスト用に上書き）
    // @ts-ignore: privateメソッドへのアクセス
    service.getExternalConfig = () => null;
    
    // テスト実行
    const result = await service.syncRepository(repositoryAggregate);
    
    // 検証
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message, "リポジトリはObsidianと連携していません");
    }
  });
  
  await t.step("syncRepository - Obsidianボールトを開けない場合はエラーを返す", async () => {
    // モックの準備
    const contentRepository = new MockContentRepository();
    const repositoryRepository = new MockRepositoryRepository();
    const obsidianAdapter = new MockObsidianAdapter();
    
    // openVaultが失敗するようにモックを設定
    // @ts-ignore: 型の互換性の問題を無視
    obsidianAdapter.openVault = spy(async (path: string) => err(new ObsidianError("ボールトを開けませんでした")));
    
    // テスト対象のサービスを作成
    const service = new ObsidianContentSyncService(
      contentRepository,
      repositoryRepository,
      obsidianAdapter
    );
    
    // モックのリポジトリ集約を作成
    const repositoryAggregate = createMockRepositoryAggregate("repo1", "user1");
    
    // getExternalConfigをモック化
    // @ts-ignore: privateメソッドへのアクセス
    service.getExternalConfig = () => ({
      type: "obsidian",
      vaultPath: "/path/to/vault"
    });
    
    // テスト実行
    const result = await service.syncRepository(repositoryAggregate);
    
    // 検証
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message, "ボールトを開けませんでした");
    }
    
    // openVaultが呼ばれたことを確認
    assertSpyCalls(obsidianAdapter.openVault, 1);
    assertSpyCall(obsidianAdapter.openVault, 0, {
      args: ["/path/to/vault"]
    });
  });
  
  await t.step("syncContent - コンテンツが見つからない場合はエラーを返す", async () => {
    // モックの準備
    const contentRepository = new MockContentRepository();
    const repositoryRepository = new MockRepositoryRepository();
    const obsidianAdapter = new MockObsidianAdapter();
    
    // テスト対象のサービスを作成
    const service = new ObsidianContentSyncService(
      contentRepository,
      repositoryRepository,
      obsidianAdapter
    );
    
    // モックのコンテンツ集約を作成
    const contentAggregate = createMockContentAggregate("content1", "repo1", "test.md");
    
    // findByIdが失敗するようにモックを設定
    repositoryRepository.findById = spy(async (id: string) => null);
    
    // テスト実行
    const result = await service.syncContent(contentAggregate);
    
    // 検証
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message, "リポジトリが見つかりません: repo1");
    }
    
    // findByIdが呼ばれたことを確認
    assertSpyCalls(repositoryRepository.findById, 1);
    assertSpyCall(repositoryRepository.findById, 0, {
      args: ["repo1"]
    });
  });
}); 