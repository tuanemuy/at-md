import { spy } from "jsr:@std/testing@0.218.2/mock";
import { describe, it, beforeEach } from "jsr:@std/testing@0.218.2/bdd";
import { expect } from "jsr:@std/expect@0.218.2";
import { ok, Result, err } from "npm:neverthrow";

import { GitHubContentSyncService } from "../github-content-sync-service.ts";
import { ContentRepository } from "../../repositories/content-repository.ts";
import { RepositoryRepository } from "../../repositories/repository-repository.ts";
import { GitHubApiAdapter, GitHubApiError } from "../../../../infrastructure/adapters/github/github-api-adapter.ts";
import { ContentAggregate } from "../../../../core/content/aggregates/content-aggregate.ts";
import { RepositoryAggregate } from "../../../../core/content/aggregates/repository-aggregate.ts";
import { Content, createContentId } from "../../../../core/content/entities/content.ts";
import { ContentMetadata, createTag, createLanguageCode } from "../../../../core/content/value-objects/content-metadata.ts";
import { assertEquals, assertInstanceOf } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { assertSpyCalls, assertSpyCall } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { Repository } from "../../../../core/content/entities/repository.ts";

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

// @ts-ignore: 型の互換性の問題を無視
class MockGitHubApiAdapter implements GitHubApiAdapter {
  getRepositories = spy(async (_username: string) => ok([]));
  getRepository = spy(async (_owner: string, _repo: string) => ok({ id: 1, name: "test-repo", fullName: "owner/test-repo", description: null, defaultBranch: "main", private: false, owner: { login: "owner", id: 1 }, htmlUrl: "", apiUrl: "", updatedAt: "" }));
  getContent = spy(async (_owner: string, _repo: string, _path: string, _ref?: string) => ok({ name: "test.md", path: "test.md", sha: "abc123", size: 100, type: "file" as const, content: "SGVsbG8gV29ybGQ=", encoding: "base64" as const, htmlUrl: "", downloadUrl: "", url: "" }));
  getContents = spy(async (_owner: string, _repo: string, _path: string, _ref?: string) => ok([{ name: "test.md", path: "test.md", sha: "abc123", size: 100, type: "file" as const, htmlUrl: "", downloadUrl: "", url: "" }]));
  getCommits = spy(async (_owner: string, _repo: string, _path?: string, _ref?: string) => ok([]));
  getContentAtCommit = spy(async (_owner: string, _repo: string, _path: string, _sha: string) => ok({ name: "test.md", path: "test.md", sha: "abc123", size: 100, type: "file" as const, content: "SGVsbG8gV29ybGQ=", encoding: "base64" as const, htmlUrl: "", downloadUrl: "", url: "" }));
  verifyWebhook = spy((_payload: string, _signature: string, _secret: string) => ok(true));
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
  // コンテンツIDを作成
  const contentIdResult = createContentId(id);
  if (contentIdResult.isErr()) {
    throw new Error(`Failed to create content ID: ${contentIdResult.error.message}`);
  }
  const contentId = contentIdResult._unsafeUnwrap();

  // タグを作成
  const tagResult = createTag("test");
  if (tagResult.isErr()) {
    throw new Error(`Failed to create tag: ${tagResult.error.message}`);
  }
  const tag = tagResult._unsafeUnwrap();

  // 言語コードを作成
  const languageResult = createLanguageCode("ja");
  if (languageResult.isErr()) {
    throw new Error(`Failed to create language code: ${languageResult.error.message}`);
  }
  const language = languageResult._unsafeUnwrap();

  const metadata: ContentMetadata = {
    tags: [tag],
    categories: [],
    language: language
  };

  const content: Content = {
    id: contentId,
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
    addVersion: () => content,
    changeVisibility: () => content,
    updateMetadata: () => content
  };

  return {
    content,
    updateTitle: () => ok({ content } as ContentAggregate),
    updateBody: () => ok({ content } as ContentAggregate),
    updateMetadata: () => ok({ content } as ContentAggregate),
    publish: () => ok({ content } as ContentAggregate),
    makePrivate: () => ok({ content } as ContentAggregate),
    makeUnlisted: () => ok({ content } as ContentAggregate)
  };
}

Deno.test("GitHubContentSyncService", async (t) => {
  await t.step("syncRepository - リポジトリが見つからない場合はエラーを返す", async () => {
    // モックの準備
    const contentRepository = new MockContentRepository();
    const repositoryRepository = new MockRepositoryRepository();
    const githubApiAdapter = new MockGitHubApiAdapter();
    
    // テスト対象のサービスを作成
    // @ts-ignore: 型の互換性の問題を無視
    const service = new GitHubContentSyncService(
      contentRepository,
      repositoryRepository,
      githubApiAdapter
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
      assertEquals(result.error.message, "リポジトリはGitHubと連携していません");
    }
  });
  
  await t.step("syncRepository - GitHubからのファイル取得に失敗した場合はエラーを返す", async () => {
    // モックの準備
    const contentRepository = new MockContentRepository();
    const repositoryRepository = new MockRepositoryRepository();
    const githubApiAdapter = new MockGitHubApiAdapter();
    
    // getContentsが失敗するようにモックを設定
    // @ts-ignore: 型の互換性の問題を無視
    githubApiAdapter.getContents = spy(async (_owner: string, _repo: string, _path: string, _ref?: string) => err(new Error("API error")));
    
    // テスト対象のサービスを作成
    // @ts-ignore: 型の互換性の問題を無視
    const service = new GitHubContentSyncService(
      contentRepository,
      repositoryRepository,
      githubApiAdapter
    );
    
    // モックのリポジトリ集約を作成
    const repositoryAggregate = createMockRepositoryAggregate("repo1", "user1");
    
    // getExternalConfigをモック化
    // @ts-ignore: privateメソッドへのアクセス
    service.getExternalConfig = () => ({
      type: "github",
      owner: "test-owner",
      repo: "test-repo",
      branch: "main"
    });
    
    // テスト実行
    const result = await service.syncRepository(repositoryAggregate);
    
    // 検証
    assertEquals(result.isErr(), true);
    if (result.isErr()) {
      assertEquals(result.error.message, "API error");
    }
    
    // getContentsが呼ばれたことを確認
    assertSpyCalls(githubApiAdapter.getContents, 1);
  });
  
  await t.step("syncContent - コンテンツが見つからない場合はエラーを返す", async () => {
    // モックの準備
    const contentRepository = new MockContentRepository();
    const repositoryRepository = new MockRepositoryRepository();
    const githubApiAdapter = new MockGitHubApiAdapter();
    
    // テスト対象のサービスを作成
    // @ts-ignore: 型の互換性の問題を無視
    const service = new GitHubContentSyncService(
      contentRepository,
      repositoryRepository,
      githubApiAdapter
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