# テスト戦略の詳細化

このドキュメントでは、AT-MDプロジェクトのテスト戦略について詳細に記述します。テスト駆動開発（TDD）の原則に基づき、各レイヤーでのテスト方法と具体的な例を提供します。

## 1. ドメインレイヤーのテスト

ドメインレイヤーのテストでは、エンティティ、値オブジェクト、集約、ドメインサービスの振る舞いを検証します。

### 1.1 エンティティと値オブジェクトのテスト

```typescript
// 値オブジェクトのテスト例
describe('ContentMetadata', () => {
  test('有効なタグが設定できること', () => {
    // Arrange
    const tags = ['markdown', 'programming', 'web'];
    
    // Act
    const metadata = new ContentMetadata({
      tags,
      categories: [],
      language: 'ja'
    });
    
    // Assert
    expect(metadata.tags).toEqual(tags);
  });
  
  test('無効なタグが設定できないこと', () => {
    // Arrange
    const invalidTags = ['', ' ', 'tag with space'];
    
    // Act & Assert
    expect(() => {
      new ContentMetadata({
        tags: invalidTags,
        categories: [],
        language: 'ja'
      });
    }).toThrow('Invalid tags format');
  });
});
```

### 1.2 集約のテスト

```typescript
// コンテンツ集約のテスト例
describe('ContentAggregate', () => {
  test('新規コンテンツが正しく作成されること', () => {
    // Arrange
    const userId = 'user-1';
    const repositoryId = 'repo-1';
    const path = 'articles/test.md';
    const title = 'テスト記事';
    const body = '# テスト記事\n\nこれはテスト記事です。';
    const metadata = { tags: ['test'], categories: ['article'], language: 'ja' };
    
    // Act
    const contentAggregate = ContentAggregate.create(
      userId, repositoryId, path, title, body, metadata
    );
    
    // Assert
    expect(contentAggregate.getContent().title).toBe(title);
    expect(contentAggregate.getContent().body).toBe(body);
    expect(contentAggregate.getContent().status).toBe('draft');
    expect(contentAggregate.isPublished()).toBe(false);
  });
  
  test('公開状態に変更できること', () => {
    // Arrange
    const content = createTestContent('draft');
    const contentAggregate = new ContentAggregate(content);
    
    // Act
    contentAggregate.publish();
    
    // Assert
    expect(contentAggregate.getContent().status).toBe('published');
    expect(contentAggregate.isPublished()).toBe(true);
    expect(contentAggregate.getContent().metadata.publishedAt).toBeDefined();
  });
  
  test('公開済みコンテンツをアーカイブできること', () => {
    // Arrange
    const content = createTestContent('published');
    const contentAggregate = new ContentAggregate(content);
    
    // Act
    contentAggregate.archive();
    
    // Assert
    expect(contentAggregate.getContent().status).toBe('archived');
    expect(contentAggregate.isPublished()).toBe(false);
  });
});
```

### 1.3 ドメインサービスのテスト

```typescript
describe('VersioningService', () => {
  test('コンテンツの変更が正しくバージョン管理されること', () => {
    // Arrange
    const versioningService = new VersioningService();
    const contentId = 'content-1';
    const commitId = 'commit-1';
    const changes = {
      title: 'Updated Title',
      body: 'Updated Body'
    };
    
    // Act
    const version = versioningService.createVersion(contentId, commitId, changes);
    
    // Assert
    expect(version.contentId).toBe(contentId);
    expect(version.commitId).toBe(commitId);
    expect(version.changes).toEqual(changes);
  });
});
```

## 2. アプリケーションレイヤーのテスト

アプリケーションレイヤーのテストでは、ユースケースの実行とアプリケーションサービスの振る舞いを検証します。

### 2.1 コマンドハンドラーのテスト

```typescript
describe('CreateContentCommandHandler', () => {
  test('有効なコマンドでコンテンツが作成されること', async () => {
    // Arrange
    const mockContentRepository = createMockContentRepository();
    const handler = new CreateContentCommandHandler(mockContentRepository);
    const command = {
      userId: 'user-1',
      repositoryId: 'repo-1',
      path: 'test.md',
      title: 'Test Content',
      body: '# Test Content',
      metadata: {
        tags: ['test'],
        categories: [],
        language: 'ja'
      }
    };
    
    // Act
    const result = await handler.execute(command);
    
    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockContentRepository.save).toHaveBeenCalledTimes(1);
    const savedContent = mockContentRepository.save.mock.calls[0][0];
    expect(savedContent.getContent().title).toBe(command.title);
  });
  
  test('無効なコマンドでエラーが返されること', async () => {
    // Arrange
    const mockContentRepository = createMockContentRepository();
    const handler = new CreateContentCommandHandler(mockContentRepository);
    const command = {
      userId: 'user-1',
      repositoryId: 'repo-1',
      path: '', // 無効なパス
      title: 'Test Content',
      body: '# Test Content',
      metadata: {
        tags: ['test'],
        categories: [],
        language: 'ja'
      }
    };
    
    // Act
    const result = await handler.execute(command);
    
    // Assert
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('Invalid path');
    expect(mockContentRepository.save).not.toHaveBeenCalled();
  });
});
```

### 2.2 クエリハンドラーのテスト

```typescript
describe('GetContentByIdQueryHandler', () => {
  test('存在するコンテンツIDで正しく取得できること', async () => {
    // Arrange
    const mockContentRepository = createMockContentRepository();
    const contentId = 'content-1';
    const content = createTestContent('published', contentId);
    mockContentRepository.findById.mockResolvedValue(new ContentAggregate(content));
    
    const handler = new GetContentByIdQueryHandler(mockContentRepository);
    
    // Act
    const result = await handler.execute({ contentId });
    
    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.value.id).toBe(contentId);
    expect(mockContentRepository.findById).toHaveBeenCalledWith(contentId);
  });
  
  test('存在しないコンテンツIDでエラーが返されること', async () => {
    // Arrange
    const mockContentRepository = createMockContentRepository();
    mockContentRepository.findById.mockResolvedValue(null);
    
    const handler = new GetContentByIdQueryHandler(mockContentRepository);
    
    // Act
    const result = await handler.execute({ contentId: 'non-existent' });
    
    // Assert
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe('Content not found');
  });
});
```

### 2.3 アプリケーションサービスのテスト

```typescript
describe('ContentSyncService', () => {
  test('GitHubからコンテンツが正しく同期されること', async () => {
    // Arrange
    const mockGitHubClient = createMockGitHubClient();
    const mockContentRepository = createMockContentRepository();
    const service = new ContentSyncService(mockGitHubClient, mockContentRepository);
    const repositoryId = 'repo-1';
    
    // GitHubからのレスポンスをモック
    mockGitHubClient.getContents.mockResolvedValue([
      { path: 'articles/test.md', content: 'base64encoded...', sha: 'commit1' }
    ]);
    
    // Act
    await service.syncRepository(repositoryId);
    
    // Assert
    expect(mockContentRepository.save).toHaveBeenCalledTimes(1);
    const savedContent = mockContentRepository.save.mock.calls[0][0];
    expect(savedContent.getContent().path).toBe('articles/test.md');
  });
  
  test('GitHubとの同期中にエラーが発生した場合の処理', async () => {
    // Arrange
    const mockGitHubClient = createMockGitHubClient();
    const mockContentRepository = createMockContentRepository();
    const service = new ContentSyncService(mockGitHubClient, mockContentRepository);
    const repositoryId = 'repo-1';
    
    // GitHubからのエラーをモック
    mockGitHubClient.getContents.mockRejectedValue(new Error('API rate limit exceeded'));
    
    // Act & Assert
    await expect(service.syncRepository(repositoryId)).rejects.toThrow('GitHub同期中にエラーが発生しました');
  });
});
```

## 3. インフラストラクチャレイヤーのテスト

インフラストラクチャレイヤーのテストでは、リポジトリの実装、外部サービスとのインテグレーション、永続化メカニズムを検証します。

### 3.1 リポジトリ実装のテスト

```typescript
describe('DrizzleContentRepository', () => {
  // テスト用のデータベース接続
  let db: PostgresJsDatabase;
  
  beforeAll(async () => {
    // テスト用DBのセットアップ
    db = drizzle(new Pool({
      connectionString: process.env.TEST_DATABASE_URL
    }));
    
    // マイグレーション実行
    await migrate(db, { migrationsFolder: './drizzle' });
  });
  
  beforeEach(async () => {
    // 各テスト前にテーブルをクリア
    await db.delete(contents);
    await db.delete(contentMetadata);
  });
  
  test('コンテンツが正しく保存されること', async () => {
    // Arrange
    const repository = new DrizzleContentRepository(db);
    const content = createTestContent('draft');
    const contentAggregate = new ContentAggregate(content);
    
    // Act
    await repository.save(contentAggregate);
    
    // Assert
    const savedContent = await db.select().from(contents).where(eq(contents.id, content.id));
    expect(savedContent.length).toBe(1);
    expect(savedContent[0].title).toBe(content.title);
  });
  
  test('IDによるコンテンツ取得が正しく動作すること', async () => {
    // Arrange
    const repository = new DrizzleContentRepository(db);
    const content = createTestContent('published');
    
    // テストデータ挿入
    await db.insert(contents).values({
      id: content.id,
      userId: content.userId,
      repositoryId: content.repositoryId,
      path: content.path,
      title: content.title,
      body: content.body,
      status: content.status
    });
    
    // Act
    const result = await repository.findById(content.id);
    
    // Assert
    expect(result).not.toBeNull();
    expect(result?.getContent().id).toBe(content.id);
    expect(result?.getContent().title).toBe(content.title);
  });
});
```

### 3.2 外部サービス連携のテスト

```typescript
describe('GitHubApiAdapter', () => {
  // 実際のGitHub APIを呼び出さないようにモック
  let mockOctokit: jest.Mocked<typeof Octokit>;
  
  beforeEach(() => {
    mockOctokit = jest.fn().mockImplementation(() => ({
      rest: {
        repos: {
          getContent: jest.fn()
        }
      }
    })) as any;
  });
  
  test('リポジトリのコンテンツが正しく取得できること', async () => {
    // Arrange
    const adapter = new GitHubApiAdapter(mockOctokit);
    const owner = 'testuser';
    const repo = 'testrepo';
    const path = 'articles';
    
    // モックレスポンスの設定
    const mockResponse = {
      data: [
        { name: 'test.md', path: 'articles/test.md', type: 'file' }
      ]
    };
    
    mockOctokit.prototype.rest.repos.getContent.mockResolvedValue(mockResponse as any);
    
    // Act
    const result = await adapter.getContents(owner, repo, path);
    
    // Assert
    expect(result.length).toBe(1);
    expect(result[0].path).toBe('articles/test.md');
    expect(mockOctokit.prototype.rest.repos.getContent).toHaveBeenCalledWith({
      owner,
      repo,
      path
    });
  });
  
  test('APIエラーが適切に処理されること', async () => {
    // Arrange
    const adapter = new GitHubApiAdapter(mockOctokit);
    const owner = 'testuser';
    const repo = 'testrepo';
    const path = 'articles';
    
    // APIエラーのモック
    const error = new Error('Not Found');
    (error as any).status = 404;
    mockOctokit.prototype.rest.repos.getContent.mockRejectedValue(error);
    
    // Act & Assert
    await expect(adapter.getContents(owner, repo, path)).rejects.toThrow('GitHub APIエラー: Not Found');
  });
});
```

## 4. インテグレーションテスト

インテグレーションテストでは、複数のコンポーネントやレイヤーが連携して動作することを検証します。

### 4.1 コンテキスト間連携のテスト

```typescript
describe('コンテンツ作成から公開までのフロー', () => {
  // 必要なサービスとリポジトリ
  let contentService: ContentService;
  let publishingService: PublishingService;
  let contentRepository: ContentRepository;
  let postRepository: PostRepository;
  
  beforeAll(async () => {
    // テスト用のサービスとリポジトリをセットアップ
    // 実際のデータベースを使用するか、インメモリモックを使用
  });
  
  test('コンテンツを作成し、GitHubに同期し、AT Protocolに公開できること', async () => {
    // Arrange
    const user = await createTestUser();
    const repository = await createTestRepository(user.id);
    
    // Act - コンテンツ作成
    const content = await contentService.createContent({
      userId: user.id,
      repositoryId: repository.id,
      path: 'test.md',
      title: 'テスト',
      body: '# テスト',
      metadata: { tags: ['test'] }
    });
    
    // Act - GitHub同期
    await syncService.syncContent(content.id);
    
    // Act - 公開
    const post = await publishingService.publishContent(content.id);
    
    // Assert
    const updatedContent = await contentRepository.findById(content.id);
    expect(updatedContent.isPublished()).toBe(true);
    
    const publishedPost = await postRepository.findByContentId(content.id);
    expect(publishedPost.isPublished()).toBe(true);
    expect(publishedPost.getPost().atUri).toBeDefined();
  });
});
```

### 4.2 APIエンドポイントのテスト

```typescript
describe('コンテンツAPI', () => {
  // Honoアプリのセットアップ
  let app: Hono;
  
  beforeAll(() => {
    // テスト用のHonoアプリをセットアップ
    app = new Hono();
    // ルートの設定
    app.post('/api/contents', createContentHandler);
    app.get('/api/contents/:id', getContentHandler);
    // 他のルート設定...
  });
  
  test('コンテンツ作成APIが正しく動作すること', async () => {
    // Arrange
    const requestBody = {
      repositoryId: 'repo-1',
      path: 'test.md',
      title: 'APIテスト',
      body: '# APIテスト',
      metadata: {
        tags: ['api', 'test'],
        language: 'ja'
      }
    };
    
    // Act
    const res = await app.request('/api/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Assert
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe(requestBody.title);
    expect(data.id).toBeDefined();
  });
  
  test('認証なしでAPIアクセスするとエラーになること', async () => {
    // Act
    const res = await app.request('/api/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    // Assert
    expect(res.status).toBe(401);
  });
});
```

## 5. E2Eテスト

E2Eテストでは、実際のユーザーの視点からシステム全体の動作を検証します。

### 5.1 ユーザーフローのテスト

```typescript
// Playwright を使用したE2Eテスト例
test('ユーザーがコンテンツを作成して公開できること', async ({ page }) => {
  // ログイン
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // コンテンツ作成ページに移動
  await page.goto('/dashboard/contents/new');
  
  // フォーム入力
  await page.fill('input[name="title"]', 'E2Eテスト記事');
  await page.fill('textarea[name="body"]', '# E2Eテスト記事\n\nこれはE2Eテストです。');
  await page.selectOption('select[name="repositoryId"]', 'repo-1');
  await page.fill('input[name="path"]', 'e2e-test.md');
  
  // 保存
  await page.click('button:has-text("保存")');
  
  // 公開
  await page.click('button:has-text("公開")');
  
  // 公開状態の確認
  await expect(page.locator('.status-badge')).toHaveText('公開済み');
  
  // 公開されたページの確認
  await page.goto('/e2e-test');
  await expect(page.locator('h1')).toHaveText('E2Eテスト記事');
});
```

## 6. テスト実行環境

### 6.1 テストの種類と実行コマンド

| テストの種類 | 実行コマンド | 説明 |
|------------|------------|------|
| ユニットテスト | `npm run test:unit` | ドメインレイヤーとアプリケーションレイヤーの単体テスト |
| インテグレーションテスト | `npm run test:integration` | リポジトリと外部サービス連携のテスト |
| APIテスト | `npm run test:api` | Honoエンドポイントのテスト |
| E2Eテスト | `npm run test:e2e` | Playwrightを使用したブラウザテスト |

### 6.2 テストデータの管理

テストでは以下の方法でテストデータを管理します：

1. **ファクトリー関数**: テストデータを生成するためのヘルパー関数
   ```typescript
   function createTestContent(status: ContentStatus, id?: string): Content {
     return {
       id: id || 'test-content-id',
       userId: 'test-user-id',
       repositoryId: 'test-repo-id',
       path: 'test/path.md',
       title: 'Test Content',
       body: '# Test Content\n\nThis is a test content.',
       metadata: {
         tags: ['test'],
         categories: [],
         language: 'ja'
       },
       status,
       createdAt: new Date(),
       updatedAt: new Date()
     };
   }
   ```

2. **テスト用データベース**: 専用のテストデータベースを使用
   - 各テスト実行前に必要なテーブルをクリア
   - マイグレーションを実行して最新のスキーマを適用

3. **モック**: 外部依存をモック化
   ```typescript
   function createMockContentRepository(): jest.Mocked<ContentRepository> {
     return {
       findById: jest.fn(),
       findByPath: jest.fn(),
       findByUserId: jest.fn(),
       save: jest.fn()
     } as any;
   }
   ```

## 7. テストカバレッジ目標

| レイヤー | カバレッジ目標 | 重点領域 |
|---------|-------------|---------|
| ドメインレイヤー | 95%以上 | 集約のビジネスロジック、値オブジェクトのバリデーション |
| アプリケーションレイヤー | 90%以上 | コマンド/クエリハンドラー、アプリケーションサービス |
| インフラストラクチャレイヤー | 80%以上 | リポジトリ実装、外部サービスアダプター |
| インターフェースレイヤー | 70%以上 | APIエンドポイント、コントローラー |
| E2Eテスト | 主要ユーザーフロー | ユーザー登録、コンテンツ作成、公開フロー |

## 8. テスト駆動開発（TDD）の実践

AT-MDプロジェクトでは、テスト駆動開発（TDD）の原則に従って開発を進めます：

1. **Red**: まず失敗するテストを書く
   ```typescript
   test('コンテンツを公開するとステータスが変わること', () => {
     const content = createTestContent('draft');
     const contentAggregate = new ContentAggregate(content);
     
     contentAggregate.publish();
     
     expect(contentAggregate.isPublished()).toBe(true);
   });
   ```

2. **Green**: テストが通るように最小限の実装をする
   ```typescript
   class ContentAggregate {
     // ...
     
     publish(): void {
       this.content.status = 'published';
       this.content.metadata.publishedAt = new Date();
     }
     
     isPublished(): boolean {
       return this.content.status === 'published';
     }
   }
   ```

3. **Refactor**: コードをリファクタリングして改善する
   ```typescript
   class ContentAggregate {
     // ...
     
     publish(): void {
       if (this.content.status === 'published') {
         throw new Error('Content is already published');
       }
       
       this.content.status = 'published';
       this.content.metadata.publishedAt = new Date();
       this.content.metadata.lastPublishedAt = new Date();
     }
     
     isPublished(): boolean {
       return this.content.status === 'published';
     }
   }
   ```

## 9. まとめ

AT-MDプロジェクトのテスト戦略は、ドメイン駆動設計の各レイヤーに対応した包括的なテストアプローチを提供します。ドメインモデルの正確性を確保するためのユニットテストから、システム全体の動作を検証するE2Eテストまで、多層的なテスト戦略によって高品質なソフトウェアの開発を支援します。

テスト駆動開発の実践により、設計の妥当性を継続的に検証しながら開発を進めることができ、リファクタリングの安全性も確保されます。これにより、長期的なメンテナンス性と拡張性を持つシステムの構築が可能になります。 