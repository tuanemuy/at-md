/**
 * コンテンツ取得クエリのテスト
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { GetContentByIdQuery, GetContentByIdQueryHandler } from "./get-content-by-id-query.ts";
import { ContentRepository } from "../repositories/content-repository.ts";
import { ContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { Content, createContentId, ContentId, DomainValidationError } from "../../../core/content/entities/content.ts";
import { ContentMetadata, createTag, createCategory, createLanguageCode } from "../../../core/content/value-objects/content-metadata.ts";
import { Result, ok } from "../deps.ts";

describe("GetContentByIdQueryHandler", () => {
  // モックリポジトリ
  let mockContentRepository: ContentRepository;
  let handler: GetContentByIdQueryHandler;
  
  // テスト用のクエリ
  const validQuery: GetContentByIdQuery = {
    name: "GetContentById",
    id: "content-123"
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
  const mockContent: Content = {
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
  const mockContentAggregate: ContentAggregate = {
    content: mockContent,
    updateTitle: () => ok(mockContentAggregate),
    updateBody: () => ok(mockContentAggregate),
    updateMetadata: () => ok(mockContentAggregate),
    publish: () => ok(mockContentAggregate),
    makePrivate: () => ok(mockContentAggregate),
    makeUnlisted: () => ok(mockContentAggregate)
  };
  
  beforeEach(() => {
    // モックリポジトリの作成
    mockContentRepository = {
      findById: async (id) => {
        if (id === "content-123") {
          return mockContentAggregate;
        }
        return null;
      },
      findByRepositoryIdAndPath: async () => null,
      findByUserId: async () => [],
      findByRepositoryId: async () => [],
      save: async (contentAggregate) => contentAggregate,
      delete: async () => true
    };
    
    // ハンドラーの作成
    handler = new GetContentByIdQueryHandler(mockContentRepository);
  });
  
  it("存在するIDでコンテンツが取得できること", async () => {
    // クエリ実行
    const result = await handler.execute(validQuery);
    
    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.content.id).toBe(contentId);
      expect(result.value.content.title).toBe(mockContent.title);
    }
  });
  
  it("存在しないIDでエラーが返されること", async () => {
    // 存在しないIDのクエリ
    const invalidQuery: GetContentByIdQuery = {
      name: "GetContentById",
      id: "non-existent"
    };
    
    // クエリ実行
    const result = await handler.execute(invalidQuery);
    
    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("コンテンツが見つかりません");
    }
  });
  
  it("リポジトリでエラーが発生した場合にエラーが返されること", async () => {
    // モックの設定
    mockContentRepository.findById = async () => {
      throw new Error("データベースエラー");
    };
    
    // クエリ実行
    const result = await handler.execute(validQuery);
    
    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("データベースエラー");
    }
  });
}); 