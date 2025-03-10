import { Result, ok, err } from "npm:neverthrow";
import { assertEquals, assertExists } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { describe, it, beforeEach } from "https://deno.land/std@0.220.1/testing/bdd.ts";
import { PublishContentCommand, PublishContentCommandHandler } from "./publish-content-command.ts";
import { ContentRepository } from "../../content/repositories/content-repository.ts";
import { Content } from "../../../core/content/entities/content.ts";
import { ContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { Post } from "../../../core/delivery/entities/post.ts";
import { PostAggregate } from "../../../core/delivery/aggregates/post-aggregate.ts";
import { PostRepository } from "../repositories/post-repository.ts";
import { ContentMetadata } from "../../../core/content/value-objects/content-metadata.ts";
import { createPublishStatus } from "../../../core/delivery/value-objects/publish-status.ts";

// 型安全な値オブジェクトを使用するためのモック関数
function createContentId(id: string) {
  return ok(id as any);
}

function createTag(name: string) {
  return ok(name as any);
}

function createCategory(name: string) {
  return ok(name as any);
}

function createLanguageCode(code: string) {
  return ok(code as any);
}

describe("PublishContentCommandHandler", () => {
  let command: PublishContentCommand;
  let mockPost: Post;
  let mockContent: Content;
  let mockContentAggregate: ContentAggregate;
  let mockPostRepository: PostRepository;
  let mockContentRepository: ContentRepository;
  let handler: PublishContentCommandHandler;

  beforeEach(() => {
    // テスト用のコマンド
    command = {
      name: "PublishContent",
      contentId: "content-123",
      userId: "user-123"
    };
    
    // テスト用のコンテンツID
    const contentIdResult = createContentId("content-123");
    if (contentIdResult.isErr()) {
      throw new Error("Failed to create content ID");
    }
    const contentId = contentIdResult._unsafeUnwrap();
    
    // テスト用のタグとカテゴリ
    const tag1Result = createTag("test");
    const tag2Result = createTag("markdown");
    const categoryResult = createCategory("documentation");
    const languageResult = createLanguageCode("ja");
    
    if (tag1Result.isErr() || tag2Result.isErr() || categoryResult.isErr() || languageResult.isErr()) {
      throw new Error("Failed to create tags, categories, or language code");
    }
    
    const tag1 = tag1Result._unsafeUnwrap();
    const tag2 = tag2Result._unsafeUnwrap();
    const category = categoryResult._unsafeUnwrap();
    const language = languageResult._unsafeUnwrap();
    
    // テスト用のコンテンツ
    mockContent = {
      id: contentId,
      userId: "user-123",
      repositoryId: "repo-123",
      path: "test/path.md",
      title: "テストコンテンツ",
      body: "# テストコンテンツ\n\nこれはテストです。",
      metadata: {
        tags: [tag1, tag2],
        categories: [category],
        language: language
      } as ContentMetadata,
      visibility: "public",
      versions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      addVersion: () => mockContent,
      changeVisibility: () => mockContent,
      updateMetadata: () => mockContent
    };
    
    // テスト用のコンテンツ集約
    mockContentAggregate = {
      content: mockContent,
      updateTitle: () => ok(mockContentAggregate),
      updateBody: () => ok(mockContentAggregate),
      updateMetadata: () => ok(mockContentAggregate),
      publish: () => ok(mockContentAggregate),
      makePrivate: () => ok(mockContentAggregate),
      makeUnlisted: () => ok(mockContentAggregate)
    };
    
    // テスト用のポスト
    mockPost = {
      id: "post-123",
      userId: "user-123",
      contentId: "content-123",
      feedId: "feed-123",
      slug: "test-content",
      publishStatus: createPublishStatus({ type: "published", publishedAt: new Date() }),
      createdAt: new Date(),
      updatedAt: new Date(),
      updatePublishStatus: () => mockPost,
      makeDraft: () => mockPost,
      schedulePublication: () => mockPost,
      publish: () => mockPost,
      archive: () => mockPost,
      updateSlug: () => mockPost
    };
    
    // モックリポジトリ
    mockPostRepository = {
      findById: async () => null,
      findByContentId: async () => null,
      findByUserId: async () => [],
      save: async (post: PostAggregate) => post,
      delete: async () => true
    };

    mockContentRepository = {
      findById: async () => mockContentAggregate,
      findByRepositoryIdAndPath: async () => mockContentAggregate,
      findByUserId: async () => [mockContentAggregate],
      findByRepositoryId: async () => [mockContentAggregate],
      save: async (contentAggregate: ContentAggregate) => contentAggregate,
      delete: async () => true
    };
    
    // ハンドラーの作成
    handler = new PublishContentCommandHandler(
      mockPostRepository,
      mockContentRepository
    );
  });

  it("コンテンツが存在しない場合はエラーを返す", async () => {
    // モックの設定を変更
    mockContentRepository.findById = async () => null;
    
    // コマンド実行
    const result = await handler.execute(command);
    
    // 検証
    assertEquals(result.isErr(), true);
  });
  
  it("コンテンツが存在する場合は投稿を作成して保存する", async () => {
    // モックの設定
    let findByIdCalled = false;
    let saveCalled = false;
    
    mockContentRepository.findById = async (id) => {
      findByIdCalled = true;
      assertEquals(id, command.contentId);
      return mockContentAggregate;
    };
    
    mockPostRepository.findByContentId = async (id) => {
      assertEquals(id, command.contentId);
      return null; // 新規作成のためnullを返す
    };
    
    mockPostRepository.save = async (post) => {
      saveCalled = true;
      return post;
    };
    
    // コマンド実行
    const result = await handler.execute(command);
    
    // 検証
    if (result.isErr()) {
      console.error("Error:", result.error);
    }
    assertEquals(result.isOk(), true);
    assertEquals(findByIdCalled, true);
    assertEquals(saveCalled, true);
    
    if (result.isOk()) {
      // 結果の検証
      const postAggregate = result.value;
      assertExists(postAggregate);
      assertExists(postAggregate.post);
      assertEquals(postAggregate.post.contentId, command.contentId);
      assertEquals(postAggregate.post.userId, command.userId);
    }
  });
  
  it("フィードIDが指定されている場合はフィードIDを設定する", async () => {
    // フィードIDを持つコマンド
    const commandWithFeedId: PublishContentCommand = {
      ...command,
      feedId: "feed-123"
    };
    
    // モックの設定
    let saveCalled = false;
    
    mockContentRepository.findById = async (id) => {
      assertEquals(id, commandWithFeedId.contentId);
      return mockContentAggregate;
    };
    
    mockPostRepository.findByContentId = async (id) => {
      assertEquals(id, commandWithFeedId.contentId);
      return null; // 新規作成のためnullを返す
    };
    
    mockPostRepository.save = async (post) => {
      saveCalled = true;
      assertEquals(post.post.feedId, commandWithFeedId.feedId);
      return post;
    };
    
    // コマンド実行
    const result = await handler.execute(commandWithFeedId);
    
    // 検証
    if (result.isErr()) {
      console.error("Error:", result.error);
    }
    assertEquals(result.isOk(), true);
    assertEquals(saveCalled, true);
    
    if (result.isOk()) {
      // 結果の検証
      const postAggregate = result.value;
      assertExists(postAggregate);
      assertExists(postAggregate.post);
      assertEquals(postAggregate.post.contentId, commandWithFeedId.contentId);
      assertEquals(postAggregate.post.userId, commandWithFeedId.userId);
      assertEquals(postAggregate.post.feedId, commandWithFeedId.feedId);
    }
  });
}); 