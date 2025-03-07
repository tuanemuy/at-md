/**
 * コンテンツ作成コマンドのテスト
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { CreateContentCommand, CreateContentCommandHandler } from "./create-content-command.ts";
import { ContentRepository } from "../repositories/content-repository.ts";
import { RepositoryRepository } from "../repositories/repository-repository.ts";
import { ContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { RepositoryAggregate } from "../../../core/content/aggregates/repository-aggregate.ts";

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
      findById: async () => null,
      findByRepositoryIdAndPath: async () => null,
      findByUserId: async () => [],
      findByRepositoryId: async () => [],
      save: async (contentAggregate) => contentAggregate,
      delete: async () => true
    };
    
    mockRepositoryRepository = {
      findById: async (id) => {
        if (id === "repo-123") {
          return {} as RepositoryAggregate; // 簡易的なモック
        }
        return null;
      },
      findByUserId: async () => [],
      findByName: async () => null,
      save: async (repositoryAggregate) => repositoryAggregate,
      delete: async () => true
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
    mockContentRepository.save = async (contentAggregate) => {
      savedContent = contentAggregate;
      return contentAggregate;
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
    mockRepositoryRepository.findById = async () => null;
    
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
    mockContentRepository.findByRepositoryIdAndPath = async () => {
      return {} as ContentAggregate; // 既存のコンテンツがあるとする
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