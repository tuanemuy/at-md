/**
 * コンテンツコントローラーのテスト
 */

import { assertEquals, assertRejects } from "https://deno.land/std/assert/mod.ts";
import { beforeEach, describe, it } from "https://deno.land/std/testing/bdd.ts";
import { spy, assertSpyCalls } from "https://deno.land/std/testing/mock.ts";

import {
  Result,
  ok,
  err,
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  generateId,
  type ContentAggregate,
  type Content,
  type ContentMetadata,
  type ContentRepository,
  type RepositoryAggregate,
  type Repository,
  type RepositoryRepository,
  type GetContentByIdQuery,
  type CreateContentCommand,
  createContentAggregate,
  GetContentByIdQueryHandler,
  CreateContentCommandHandler
} from "./deps.ts";

// テスト用にGetContentByIdQueryの型を定義（拡張ではなく新しい型として定義）
interface TestGetContentByIdQuery {
  id: string;
  name: string;
}

// テスト用にCreateContentCommandの型を定義
interface TestCreateContentCommand {
  userId: string;
  repositoryId: string;
  path: string;
  title: string;
  body: string;
  tags?: string[];
  categories?: string[];
  language?: string;
  visibility?: string;
}

// テスト用にContentControllerインターフェースを定義
interface ContentController {
  getContentById(id: string): Promise<Result<ContentDto, ApplicationError>>;
  createContent(data: TestCreateContentCommand): Promise<Result<ContentDto, ApplicationError>>;
}

// ContentDtoインターフェースを定義
interface ContentDto {
  id: string;
  userId: string;
  repositoryId: string;
  path: string;
  title: string;
  body: string;
  metadata: ContentMetadata;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
}

// テスト用にContentControllerImplを定義
class ContentControllerImpl implements ContentController {
  constructor(
    private readonly getContentByIdQueryHandler: MockGetContentByIdQueryHandler,
    private readonly createContentCommandHandler: MockCreateContentCommandHandler
  ) {}

  async getContentById(id: string): Promise<Result<ContentDto, ApplicationError>> {
    if (!id) {
      return err(new ValidationError("コンテンツIDは必須です", "id"));
    }

    // テスト用にクエリオブジェクトを作成
    const query: TestGetContentByIdQuery = { id, name: "GetContentById" };
    const result = await this.getContentByIdQueryHandler.execute(query);
    if (result.isErr()) {
      return err(result.error);
    }

    const content = result.value;
    const contentDto: ContentDto = {
      id: content.content.id,
      userId: content.content.userId,
      repositoryId: content.content.repositoryId,
      path: content.content.path,
      title: content.content.title,
      body: content.content.body,
      metadata: content.content.metadata,
      visibility: content.content.visibility,
      createdAt: content.content.createdAt,
      updatedAt: content.content.updatedAt
    };

    return ok(contentDto);
  }

  async createContent(data: TestCreateContentCommand): Promise<Result<ContentDto, ApplicationError>> {
    // テスト用にコマンドオブジェクトを作成
    const command: TestCreateContentCommand = {
      userId: data.userId,
      repositoryId: data.repositoryId,
      path: data.path,
      title: data.title,
      body: data.body,
      tags: data.tags,
      categories: data.categories,
      language: data.language,
      visibility: data.visibility
    };

    const result = await this.createContentCommandHandler.execute(command);
    if (result.isErr()) {
      return err(result.error);
    }

    const content = result.value;
    const contentDto: ContentDto = {
      id: content.content.id,
      userId: content.content.userId,
      repositoryId: content.content.repositoryId,
      path: content.content.path,
      title: content.content.title,
      body: content.content.body,
      metadata: content.content.metadata,
      visibility: content.content.visibility,
      createdAt: content.content.createdAt,
      updatedAt: content.content.updatedAt
    };

    return ok(contentDto);
  }
}

// モックリポジトリの作成
class MockContentRepository {
  private contents: Record<string, ContentAggregate> = {};

  findById(id: string): ContentAggregate | null {
    return this.contents[id] || null;
  }

  findByRepositoryIdAndPath(repositoryId: string, path: string): ContentAggregate | null {
    const found = Object.values(this.contents).find(
      content => content.content.repositoryId === repositoryId && content.content.path === path
    );
    return found || null;
  }

  findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): ContentAggregate[] {
    let contents = Object.values(this.contents).filter(
      content => content.content.userId === userId
    );
    
    if (options?.status) {
      contents = contents.filter(content => content.content.visibility === options.status);
    }
    
    if (options?.offset) {
      contents = contents.slice(options.offset);
    }
    
    if (options?.limit) {
      contents = contents.slice(0, options.limit);
    }
    
    return contents;
  }

  findByRepositoryId(repositoryId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): ContentAggregate[] {
    let contents = Object.values(this.contents).filter(
      content => content.content.repositoryId === repositoryId
    );
    
    if (options?.status) {
      contents = contents.filter(content => content.content.visibility === options.status);
    }
    
    if (options?.offset) {
      contents = contents.slice(options.offset);
    }
    
    if (options?.limit) {
      contents = contents.slice(0, options.limit);
    }
    
    return contents;
  }

  save(contentAggregate: ContentAggregate): ContentAggregate {
    this.contents[contentAggregate.content.id] = contentAggregate;
    return contentAggregate;
  }

  delete(id: string): boolean {
    if (this.contents[id]) {
      delete this.contents[id];
      return true;
    }
    return false;
  }

  saveWithTransaction(contentAggregate: ContentAggregate, context: unknown): Result<ContentAggregate, DomainError> {
    this.contents[contentAggregate.content.id] = contentAggregate;
    return ok(contentAggregate);
  }

  deleteWithTransaction(id: string, context: unknown): Result<boolean, DomainError> {
    if (this.contents[id]) {
      delete this.contents[id];
      return ok(true);
    }
    return ok(false);
  }

  addContent(content: ContentAggregate): void {
    this.contents[content.content.id] = content;
  }

  clear(): void {
    this.contents = {};
  }
}

class MockRepositoryRepository {
  private repositories: Record<string, RepositoryAggregate> = {};

  findById(id: string): RepositoryAggregate | null {
    return this.repositories[id] || null;
  }

  findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): RepositoryAggregate[] {
    let repositories = Object.values(this.repositories).filter(
      repo => repo.repository.userId === userId
    );
    
    if (options?.offset) {
      repositories = repositories.slice(options.offset);
    }
    
    if (options?.limit) {
      repositories = repositories.slice(0, options.limit);
    }
    
    return repositories;
  }

  findByName(userId: string, name: string): RepositoryAggregate | null {
    const found = Object.values(this.repositories).find(
      repo => repo.repository.userId === userId && repo.repository.name === name
    );
    return found || null;
  }

  save(repositoryAggregate: RepositoryAggregate): RepositoryAggregate {
    this.repositories[repositoryAggregate.repository.id] = repositoryAggregate;
    return repositoryAggregate;
  }

  delete(id: string): boolean {
    if (this.repositories[id]) {
      delete this.repositories[id];
      return true;
    }
    return false;
  }

  saveWithTransaction(repositoryAggregate: RepositoryAggregate, context: unknown): Result<RepositoryAggregate, DomainError> {
    this.repositories[repositoryAggregate.repository.id] = repositoryAggregate;
    return ok(repositoryAggregate);
  }

  deleteWithTransaction(id: string, context: unknown): Result<boolean, DomainError> {
    if (this.repositories[id]) {
      delete this.repositories[id];
      return ok(true);
    }
    return ok(false);
  }

  addRepository(repository: RepositoryAggregate): void {
    this.repositories[repository.repository.id] = repository;
  }

  clear(): void {
    this.repositories = {};
  }
}

// モッククエリハンドラーの作成
class MockGetContentByIdQueryHandler {
  constructor(private repository: MockContentRepository) {}

  execute(query: TestGetContentByIdQuery): Promise<Result<ContentAggregate, ApplicationError>> {
    return Promise.resolve().then(() => {
      const content = this.repository.findById(query.id);
      
      if (!content) {
        return err(new EntityNotFoundError("Content", query.id));
      }
      
      return ok(content);
    });
  }
}

// モックコマンドハンドラーの作成
class MockCreateContentCommandHandler {
  constructor(
    private contentRepository: MockContentRepository,
    private repositoryRepository: MockRepositoryRepository
  ) {}

  execute(command: TestCreateContentCommand): Promise<Result<ContentAggregate, ApplicationError>> {
    return Promise.resolve().then(() => {
      // リポジトリの存在確認
      const repository = this.repositoryRepository.findById(command.repositoryId);
      if (!repository) {
        return err(new EntityNotFoundError("Repository", command.repositoryId));
      }

      // 同じパスのコンテンツが存在するか確認
      const existingContent = this.contentRepository.findByRepositoryIdAndPath(
        command.repositoryId,
        command.path
      );
      
      if (existingContent) {
        return err(new ValidationError(`指定されたパスのコンテンツは既に存在します: ${command.path}`, "path"));
      }

      // メタデータの作成
      const metadata: ContentMetadata = {
        tags: command.tags || [],
        categories: command.categories || [],
        language: command.language || "ja"
      };

      // コンテンツの作成用のデータを準備
      const contentData = {
        id: generateId(),
        userId: command.userId,
        repositoryId: command.repositoryId,
        path: command.path,
        title: command.title,
        body: command.body,
        metadata: metadata,
        visibility: command.visibility || "private",
        versions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        // Content型に必要なメソッドを追加
        addVersion: () => ({} as unknown as Result<Content, DomainError>),
        changeVisibility: () => ({} as unknown as Result<Content, DomainError>),
        updateMetadata: () => ({} as unknown as Result<Content, DomainError>)
      };
      
      // ContentAggregateを作成
      const contentAggregateResult = createContentAggregate(contentData as unknown as Content);
      
      if (contentAggregateResult.isErr()) {
        return err(new ApplicationError(`コンテンツの作成に失敗しました: ${contentAggregateResult.error.message}`));
      }
      
      const contentAggregate = contentAggregateResult.value;

      // コンテンツの保存
      this.contentRepository.save(contentAggregate);
      
      return ok(contentAggregate);
    });
  }
}

describe("ContentController", () => {
  let contentRepository: MockContentRepository;
  let repositoryRepository: MockRepositoryRepository;
  let getContentByIdQueryHandler: MockGetContentByIdQueryHandler;
  let createContentCommandHandler: MockCreateContentCommandHandler;
  let controller: ContentController;
  let testContentId: string;
  let testRepositoryId: string;

  beforeEach(() => {
    // テスト用のリポジトリとハンドラーを作成
    contentRepository = new MockContentRepository();
    repositoryRepository = new MockRepositoryRepository();
    getContentByIdQueryHandler = new MockGetContentByIdQueryHandler(contentRepository);
    createContentCommandHandler = new MockCreateContentCommandHandler(contentRepository, repositoryRepository);
    
    // コントローラーの作成
    controller = new ContentControllerImpl(
      getContentByIdQueryHandler,
      createContentCommandHandler
    );
    
    // テスト用のIDを生成
    testContentId = generateId();
    testRepositoryId = generateId();
    
    // リポジトリをクリア
    contentRepository.clear();
    repositoryRepository.clear();
  });

  describe("getContentById", () => {
    it("存在するコンテンツIDを指定した場合、コンテンツを返す", async () => {
      // テスト用のコンテンツデータを作成
      const contentData = {
        id: testContentId,
        userId: "test-user-id",
        repositoryId: testRepositoryId,
        path: "test/path.md",
        title: "テストコンテンツ",
        body: "# テストコンテンツ\n\nこれはテストコンテンツです。",
        metadata: {
          tags: ["test", "markdown"],
          categories: ["documentation"],
          language: "ja"
        },
        visibility: "public",
        versions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        // Content型に必要なメソッドを追加
        addVersion: () => ({} as unknown as Result<Content, DomainError>),
        changeVisibility: () => ({} as unknown as Result<Content, DomainError>),
        updateMetadata: () => ({} as unknown as Result<Content, DomainError>)
      };
      
      // ContentAggregateを作成
      const contentAggregateResult = createContentAggregate(contentData as unknown as Content);
      if (contentAggregateResult.isErr()) {
        throw new Error(`テスト用コンテンツの作成に失敗しました: ${contentAggregateResult.error.message}`);
      }
      
      const contentAggregate = contentAggregateResult.value;
      
      // リポジトリにコンテンツを追加
      contentRepository.addContent(contentAggregate);
      
      // クエリハンドラーのexecuteメソッドをスパイ
      const executeSpy = spy(getContentByIdQueryHandler, "execute");
      
      // コントローラーのメソッドを呼び出す
      const result = await controller.getContentById(testContentId);
      
      // 結果を検証
      assertEquals(result.isOk(), true);
      
      // クエリハンドラーが正しく呼び出されたことを確認
      assertSpyCalls(executeSpy, 1);
      
      // 結果のコンテンツを検証
      result.map(content => {
        assertEquals(content.id, testContentId);
        assertEquals(content.title, "テストコンテンツ");
      });
    });

    it("存在しないコンテンツIDを指定した場合、エラーを返す", async () => {
      // クエリハンドラーのexecuteメソッドをスパイ
      const executeSpy = spy(getContentByIdQueryHandler, "execute");
      
      // 存在しないIDでコンテンツを取得
      const result = await controller.getContentById("non-existent-id");
      
      // 検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof EntityNotFoundError, true);
      }
      
      // クエリハンドラーが正しく呼び出されたことを確認
      assertSpyCalls(executeSpy, 1);
      assertEquals(executeSpy.calls[0].args[0].id, "non-existent-id");
    });
  });

  describe("createContent", () => {
    it("有効なデータでコンテンツを作成できる", async () => {
      // テスト用のリポジトリデータを作成
      const repositoryData = {
        id: "test-repo-id",
        userId: "test-user-id",
        name: "test-repo",
        owner: "test-owner",
        description: "テストリポジトリ",
        defaultBranch: "main",
        status: "active",
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        changeStatus: () => ({} as unknown as Result<RepositoryAggregate, DomainError>),
        updateLastSyncedAt: () => ({} as unknown as Result<RepositoryAggregate, DomainError>),
        changeDefaultBranch: () => ({} as unknown as Result<RepositoryAggregate, DomainError>)
      };
      
      // RepositoryAggregateを作成
      const repositoryAggregate: RepositoryAggregate = {
        repository: repositoryData as unknown as Repository,
        updateName(name: string): RepositoryAggregate {
          return {
            ...this,
            repository: {
              ...this.repository,
              name
            }
          } as unknown as RepositoryAggregate;
        },
        changeDefaultBranch(branch: string): RepositoryAggregate {
          return this;
        },
        startSync(): RepositoryAggregate {
          return this;
        },
        completeSync(): RepositoryAggregate {
          return this;
        },
        deactivate(): RepositoryAggregate {
          return this;
        },
        activate(): RepositoryAggregate {
          return this;
        }
      };
      
      // リポジトリを保存
      repositoryRepository.addRepository(repositoryAggregate);
      
      // テスト用のコンテンツを作成
      const content = {
        id: testContentId,
        userId: "test-user-id",
        repositoryId: testRepositoryId,
        path: "test/new-content.md",
        title: "新しいコンテンツ",
        body: "# 新しいコンテンツ\n\nこれは新しいコンテンツです。",
        metadata: {
          tags: ["new", "content"],
          categories: ["test"],
          language: "ja"
        },
        visibility: "public",
        versions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        // Content型に必要なメソッドを追加
        addVersion: () => ({} as unknown as Result<Content, DomainError>),
        changeVisibility: () => ({} as unknown as Result<Content, DomainError>),
        updateMetadata: () => ({} as unknown as Result<Content, DomainError>)
      };
      
      const contentAggregateResult = createContentAggregate(content as unknown as Content);
      if (contentAggregateResult.isErr()) {
        throw new Error(`テスト用コンテンツの作成に失敗しました: ${contentAggregateResult.error.message}`);
      }
      
      const contentAggregate = contentAggregateResult.value;
      
      // リポジトリにコンテンツを追加
      contentRepository.addContent(contentAggregate);
      
      // コマンドハンドラーのexecuteメソッドをスパイ
      const executeSpy = spy(createContentCommandHandler, "execute");
      
      // コントローラーのメソッドを呼び出す
      const result = await controller.createContent({
        userId: "test-user-id",
        repositoryId: testRepositoryId,
        path: "test/new-content2.md",
        title: "新しいコンテンツ2",
        body: "# 新しいコンテンツ2\n\nこれは新しいコンテンツ2です。",
        tags: ["new", "content"],
        categories: ["test"],
        language: "ja",
        visibility: "public"
      });
      
      // 結果を検証
      assertEquals(result.isOk(), true);
      
      // コマンドハンドラーが正しく呼び出されたことを確認
      assertSpyCalls(executeSpy, 1);
      
      // 結果のコンテンツを検証
      result.map(content => {
        assertEquals(content.title, "新しいコンテンツ2");
        assertEquals(content.path, "test/new-content2.md");
      });
    });

    it("存在しないリポジトリIDを指定した場合、エラーを返す", async () => {
      // コマンドハンドラーのexecuteメソッドをスパイ
      const executeSpy = spy(createContentCommandHandler, "execute");
      
      // コンテンツ作成リクエスト（存在しないリポジトリID）
      const createContentRequest = {
        userId: "test-user-id",
        repositoryId: "non-existent-repository-id",
        path: "test/new-content.md",
        title: "新しいコンテンツ",
        body: "# 新しいコンテンツ\n\nこれは新しいコンテンツです。",
        tags: ["new", "content"],
        categories: ["test"],
        language: "ja",
        visibility: "public"
      };
      
      // コンテンツを作成
      const result = await controller.createContent(createContentRequest);
      
      // 検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof EntityNotFoundError, true);
      }
      
      // コマンドハンドラーが正しく呼び出されたことを確認
      assertSpyCalls(executeSpy, 1);
      assertEquals(executeSpy.calls[0].args[0].repositoryId, "non-existent-repository-id");
    });
  });
}); 