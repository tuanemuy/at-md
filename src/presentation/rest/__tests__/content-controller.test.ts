import { ContentController } from "../controllers/content-controller.ts";
import { ContentRepository } from "../../../application/content/repositories/content-repository.ts";
import { RepositoryRepository } from "../../../application/content/repositories/repository-repository.ts";
import { ContentAggregate, createContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { createContent } from "../../../core/content/entities/content.ts";
import { RepositoryAggregate } from "../../../core/content/aggregates/repository-aggregate.ts";
import { Result, ok, err } from "npm:neverthrow";
import { GetContentByIdQueryHandler } from "../../../application/content/queries/get-content-by-id-query.ts";
import { CreateContentCommandHandler } from "../../../application/content/commands/create-content-command.ts";

// 型安全な値オブジェクトを使用するためのモック関数
function createContentId(id: string) {
  return ok(id as any);
}

function createTag(name: string) {
  return ok(name as any);
}

function createLanguageCode(code: string) {
  return ok(code as any);
}

// モックリポジトリ
class MockContentRepository implements ContentRepository {
  private contents: Map<string, ContentAggregate> = new Map();
  
  constructor() {
    // テスト用のコンテンツを追加
    const contentIdResult = createContentId("content-1");
    if (contentIdResult.isErr()) {
      throw new Error("Failed to create content ID");
    }
    const contentId = contentIdResult._unsafeUnwrap();
    
    // タグを作成
    const tagResult = createTag("test");
    const tag2Result = createTag("markdown");
    if (tagResult.isErr() || tag2Result.isErr()) {
      throw new Error("Failed to create tags");
    }
    const tag = tagResult._unsafeUnwrap();
    const tag2 = tag2Result._unsafeUnwrap();
    
    // 言語コードを作成
    const languageResult = createLanguageCode("ja");
    if (languageResult.isErr()) {
      throw new Error("Failed to create language code");
    }
    const language = languageResult._unsafeUnwrap();
    
    const contentResult = createContent({
      id: contentId,
      userId: "user-1",
      repositoryId: "repo-1",
      path: "test/path.md",
      title: "テストコンテンツ",
      body: "# テストコンテンツ\n\nこれはテスト用のコンテンツです。",
      metadata: {
        tags: [tag, tag2],
        categories: [],
        language: language
      },
      versions: [],
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    if (contentResult.isErr()) {
      throw new Error("Failed to create content");
    }
    
    const content = contentResult._unsafeUnwrap();
    const contentAggregate = createContentAggregate(content);
    this.contents.set(String(content.id), contentAggregate);
  }
  
  async findById(id: string): Promise<ContentAggregate | null> {
    return this.contents.get(id) || null;
  }
  
  async findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<ContentAggregate | null> {
    for (const content of this.contents.values()) {
      if (content.content.repositoryId === repositoryId && content.content.path === path) {
        return content;
      }
    }
    return null;
  }
  
  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    const result: ContentAggregate[] = [];
    for (const content of this.contents.values()) {
      if (content.content.userId === userId) {
        result.push(content);
      }
    }
    return result;
  }
  
  async findByRepositoryId(repositoryId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    const result: ContentAggregate[] = [];
    for (const content of this.contents.values()) {
      if (content.content.repositoryId === repositoryId) {
        result.push(content);
      }
    }
    return result;
  }
  
  async save(contentAggregate: ContentAggregate): Promise<ContentAggregate> {
    this.contents.set(String(contentAggregate.content.id), contentAggregate);
    return contentAggregate;
  }
  
  async delete(id: string): Promise<boolean> {
    return this.contents.delete(id);
  }
}

// モッククエリハンドラー
class MockGetContentByIdQueryHandler {
  private contentRepository: ContentRepository;
  
  constructor(contentRepository: ContentRepository) {
    this.contentRepository = contentRepository;
  }
  
  async execute(query: { id: string }): Promise<Result<ContentAggregate, Error>> {
    const content = await this.contentRepository.findById(query.id);
    if (!content) {
      return err(new Error(`Content with ID ${query.id} not found`));
    }
    return ok(content);
  }
}

// モックコマンドハンドラー
class MockCreateContentCommandHandler {
  private contentRepository: ContentRepository;
  private repositoryRepository: RepositoryRepository;
  
  constructor(contentRepository: ContentRepository, repositoryRepository: RepositoryRepository) {
    this.contentRepository = contentRepository;
    this.repositoryRepository = repositoryRepository;
  }
  
  async execute(command: any): Promise<Result<ContentAggregate, Error>> {
    return ok({} as ContentAggregate);
  }
}

class MockRepositoryRepository implements RepositoryRepository {
  async findById(id: string): Promise<RepositoryAggregate | null> {
    return null;
  }
  
  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<RepositoryAggregate[]> {
    return [];
  }
  
  async findByName(userId: string, name: string): Promise<RepositoryAggregate | null> {
    return null;
  }
  
  async save(repositoryAggregate: RepositoryAggregate): Promise<RepositoryAggregate> {
    return repositoryAggregate;
  }
  
  async delete(id: string): Promise<boolean> {
    return true;
  }
}

// テスト
Deno.test("ContentController", async (t) => {
  await t.step("getContentById - 存在するIDの場合、コンテンツを返す", async () => {
    // モックリポジトリを作成
    const contentRepository = new MockContentRepository();
    const repositoryRepository = new MockRepositoryRepository();
    
    // モックハンドラーを作成
    const getContentByIdQueryHandler = new MockGetContentByIdQueryHandler(contentRepository);
    const createContentCommandHandler = new MockCreateContentCommandHandler(contentRepository, repositoryRepository);
    
    // コントローラーを作成
    const controller = new ContentController(
      getContentByIdQueryHandler as unknown as GetContentByIdQueryHandler,
      createContentCommandHandler as unknown as CreateContentCommandHandler
    );
    
    // Honoコンテキストをモック
    const c = {
      req: {
        param: (name: string) => name === "id" ? "content-1" : null
      },
      json: (data: any, status?: number) => {
        return new Response(JSON.stringify(data), {
          status: status || 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    };
    
    // コントローラーメソッドを実行
    const response = await controller.getContentById(c as any);
    
    // 結果を検証
    if (response.status !== 200) {
      throw new Error(`Expected status code 200, but got ${response.status}`);
    }
    
    const responseData = await response.json();
    if (!responseData) {
      throw new Error("No response data");
    }
  });
}); 