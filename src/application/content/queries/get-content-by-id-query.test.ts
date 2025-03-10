/**
 * コンテンツ取得クエリのテスト
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { GetContentByIdQuery, GetContentByIdQueryHandler } from "./get-content-by-id-query.ts";
import { ContentRepository } from "../repositories/mod.ts";
import { ContentAggregate, Content, ContentMetadata } from "../../../core/content/mod.ts";
import { Result, ok } from "npm:neverthrow";
import { DomainError } from "../../../core/errors/mod.ts";

describe("GetContentByIdQueryHandler", () => {
  // モックリポジトリ
  let mockContentRepository: ContentRepository;
  let handler: GetContentByIdQueryHandler;
  
  // テスト用のクエリ
  const validQuery: GetContentByIdQuery = {
    name: "GetContentById",
    id: "content-123"
  };
  
  // テスト用のコンテンツ
  const mockContent: Content = {
    id: "content-123",
    userId: "user-123",
    repositoryId: "repo-123",
    path: "test/path.md",
    title: "テストコンテンツ",
    body: "# テストコンテンツ\n\nこれはテストです。",
    metadata: {
      tags: ["test", "markdown"],
      categories: ["documentation"],
      language: "ja"
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
    updateTitle: () => mockContentAggregate,
    updateBody: () => mockContentAggregate,
    updateMetadata: () => mockContentAggregate,
    publish: () => mockContentAggregate,
    makePrivate: () => mockContentAggregate,
    makeUnlisted: () => mockContentAggregate
  };
  
  beforeEach(() => {
    // モックリポジトリの作成
    mockContentRepository = {
      findById: (id) => {
        if (id === "content-123") {
          return Promise.resolve(mockContentAggregate);
        }
        return Promise.resolve(null);
      },
      findByRepositoryIdAndPath: () => Promise.resolve(null),
      findByUserId: () => Promise.resolve([]),
      findByRepositoryId: () => Promise.resolve([]),
      save: (contentAggregate) => Promise.resolve(contentAggregate),
      saveWithTransaction: (contentAggregate, _context) => Promise.resolve(ok(contentAggregate)),
      delete: () => Promise.resolve(true),
      deleteWithTransaction: (_id, _context) => Promise.resolve(ok(true))
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
      expect(result.value.content.id).toBe(validQuery.id);
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
    mockContentRepository.findById = () => {
      return Promise.reject(new Error("データベースエラー"));
    };
    
    // クエリ実行
    const result = await handler.execute(validQuery);
    
    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("データベースエラー");
    }
  });
  
  it("存在しないコンテンツIDでnullが返されること", async () => {
    // モックの設定
    mockContentRepository.findById = () => {
      return Promise.resolve(null);
    };
    
    // クエリ実行
    const result = await handler.execute(validQuery);
    
    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("コンテンツが見つかりません");
    }
  });
}); 