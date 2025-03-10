/**
 * コンテンツ作成コマンドのテスト
 */

import {
  Result,
  ok,
  err,
  expect,
  describe,
  it,
  beforeEach,
  ContentAggregate,
  RepositoryAggregate,
  createContentAggregate,
  createRepositoryAggregate,
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError
} from "../__tests__/deps/mod.ts";

import type {
  Content,
  Repository,
  ContentRepository,
  RepositoryRepository
} from "../__tests__/deps/mod.ts";

import { CreateContentCommand, CreateContentCommandHandler } from "./create-content-command.ts";

describe("CreateContentCommandHandler", () => {
  // モックリポジトリ
  let mockContentRepository: ContentRepository;
  let mockRepositoryRepository: RepositoryRepository;
  let handler: CreateContentCommandHandler;
  
  // テスト用のコマンド
  const validCommand: CreateContentCommand = {
    name: "CreateContent",
    userId: "user-123",
    repositoryId: "repo-123",
    path: "test/path.md",
    title: "テストコンテンツ",
    body: "# テストコンテンツ\n\nこれはテストです。",
    metadata: {
      tags: ["test", "markdown"],
      categories: ["documentation"],
      language: "ja"
    }
  };
  
  beforeEach(() => {
    // モックリポジトリの作成
    mockContentRepository = {
      findById: () => Promise.resolve(null),
      findByRepositoryIdAndPath: () => Promise.resolve(null),
      findByUserId: () => Promise.resolve([]),
      findByRepositoryId: () => Promise.resolve([]),
      save: (contentAggregate) => Promise.resolve(contentAggregate),
      saveWithTransaction: (contentAggregate, _context) => Promise.resolve(ok(contentAggregate)),
      delete: () => Promise.resolve(true),
      deleteWithTransaction: (_id, _context) => Promise.resolve(ok(true))
    };
    
    mockRepositoryRepository = {
      findById: (id) => {
        if (id === "repo-123") {
          return Promise.resolve({} as RepositoryAggregate); // 簡易的なモック
        }
        return Promise.resolve(null);
      },
      findByUserId: () => Promise.resolve([]),
      findByName: () => Promise.resolve(null),
      save: (repositoryAggregate) => Promise.resolve(repositoryAggregate),
      saveWithTransaction: (repositoryAggregate, _context) => Promise.resolve(ok(repositoryAggregate)),
      delete: () => Promise.resolve(true),
      deleteWithTransaction: (_id, _context) => Promise.resolve(ok(true))
    };
    
    // ハンドラーの作成
    handler = new CreateContentCommandHandler(
      mockContentRepository,
      mockRepositoryRepository
    );
  });
  
  it("有効なコマンドでコンテンツが作成されること", async () => {
    // モックの設定
    let savedContent: ContentAggregate | null = null;
    mockContentRepository.save = (contentAggregate) => {
      savedContent = contentAggregate;
      return Promise.resolve(contentAggregate);
    };
    
    // コマンド実行
    const result = await handler.execute(validCommand);
    
    // 検証
    expect(result.isOk()).toBe(true);
    expect(savedContent).not.toBeNull();
    if (result.isOk()) {
      const content = result.value.content;
      expect(content.title).toBe(validCommand.title);
      expect(content.body).toBe(validCommand.body);
      expect(content.userId).toBe(validCommand.userId);
      expect(content.repositoryId).toBe(validCommand.repositoryId);
      expect(content.path).toBe(validCommand.path);
      expect(content.metadata.tags).toEqual(validCommand.metadata!.tags);
    }
  });
  
  it("存在しないリポジトリIDでエラーが返されること", async () => {
    // モックの設定
    mockRepositoryRepository.findById = () => Promise.resolve(null);
    
    // コマンド実行
    const result = await handler.execute(validCommand);
    
    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("リポジトリが見つかりません");
    }
  });
  
  it("既存のパスでエラーが返されること", async () => {
    // モックの設定
    mockContentRepository.findByRepositoryIdAndPath = () => {
      return Promise.resolve({} as ContentAggregate); // 既存のコンテンツがあるとする
    };
    
    // コマンド実行
    const result = await handler.execute(validCommand);
    
    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("指定されたパスにコンテンツが既に存在します");
    }
  });
}); 