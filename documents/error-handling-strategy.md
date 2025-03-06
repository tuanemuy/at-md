# エラーハンドリング戦略

このドキュメントでは、AT-MDプロジェクトのエラーハンドリング戦略について詳細に記述します。ドメイン駆動設計の各レイヤーにおけるエラー処理方法と、外部システム連携時の障害対応戦略を提供します。

## 1. エラー分類

AT-MDシステムで発生しうるエラーを以下のように分類します：

### 1.1 ドメインエラー

ドメインルールに違反する操作が行われた場合に発生するエラーです。

```typescript
// ドメインエラーの基底クラス
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

// 具体的なドメインエラー
export class InvalidContentStateError extends DomainError {
  constructor(currentState: string, attemptedOperation: string) {
    super(`Cannot perform ${attemptedOperation} on content in ${currentState} state`);
    this.name = 'InvalidContentStateError';
  }
}

export class InvalidMetadataError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMetadataError';
  }
}
```

### 1.2 アプリケーションエラー

アプリケーションレイヤーでの処理中に発生するエラーです。

```typescript
// アプリケーションエラーの基底クラス
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationError';
  }
}

// 具体的なアプリケーションエラー
export class EntityNotFoundError extends ApplicationError {
  constructor(entityType: string, id: string) {
    super(`${entityType} with id ${id} not found`);
    this.name = 'EntityNotFoundError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
```

### 1.3 インフラストラクチャエラー

データベースアクセスや外部システム連携時に発生するエラーです。

```typescript
// インフラストラクチャエラーの基底クラス
export class InfrastructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InfrastructureError';
  }
}

// 具体的なインフラストラクチャエラー
export class DatabaseError extends InfrastructureError {
  constructor(operation: string, detail: string) {
    super(`Database error during ${operation}: ${detail}`);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends InfrastructureError {
  constructor(service: string, operation: string, detail: string) {
    super(`Error in ${service} during ${operation}: ${detail}`);
    this.name = 'ExternalServiceError';
  }
}
```

### 1.4 プレゼンテーションエラー

ユーザーインターフェースレイヤーでの処理中に発生するエラーです。

```typescript
// プレゼンテーションエラーの基底クラス
export class PresentationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PresentationError';
  }
}

// 具体的なプレゼンテーションエラー
export class ValidationError extends PresentationError {
  constructor(fieldName: string, message: string) {
    super(`Validation error for ${fieldName}: ${message}`);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends PresentationError {
  constructor() {
    super('Unauthorized access');
    this.name = 'UnauthorizedError';
  }
}
```

## 2. レイヤー別エラーハンドリング戦略

### 2.1 ドメインレイヤー

ドメインレイヤーでは、ビジネスルールに違反する操作に対して明示的なエラーをスローします。

```typescript
class ContentAggregate {
  // ...
  
  publish(): void {
    if (this.content.status === 'published') {
      throw new InvalidContentStateError('published', 'publish');
    }
    
    if (this.content.status === 'archived') {
      throw new InvalidContentStateError('archived', 'publish');
    }
    
    this.content.status = 'published';
    this.content.metadata.publishedAt = new Date();
  }
  
  archive(): void {
    if (this.content.status === 'archived') {
      throw new InvalidContentStateError('archived', 'archive');
    }
    
    this.content.status = 'archived';
  }
}
```

### 2.2 アプリケーションレイヤー

アプリケーションレイヤーでは、Result型を使用してエラーを表現し、呼び出し元に伝播します。

```typescript
import { Result, ok, err } from 'neverthrow';

class PublishContentUseCase {
  constructor(private contentRepository: ContentRepository) {}
  
  async execute(contentId: string, userId: string): Promise<Result<void, ApplicationError | DomainError>> {
    try {
      // コンテンツの取得
      const contentAggregate = await this.contentRepository.findById(contentId);
      
      if (!contentAggregate) {
        return err(new EntityNotFoundError('Content', contentId));
      }
      
      // 権限チェック
      if (contentAggregate.getContent().userId !== userId) {
        return err(new AuthorizationError('User is not authorized to publish this content'));
      }
      
      try {
        // ドメインロジックの実行
        contentAggregate.publish();
      } catch (error) {
        if (error instanceof DomainError) {
          return err(error);
        }
        throw error; // 予期しないエラーは再スロー
      }
      
      // 永続化
      await this.contentRepository.save(contentAggregate);
      
      return ok(undefined);
    } catch (error) {
      // 予期しないエラーはログに記録し、適切なエラーに変換
      console.error('Unexpected error in PublishContentUseCase:', error);
      return err(new ApplicationError('Failed to publish content due to an unexpected error'));
    }
  }
}
```

### 2.3 インフラストラクチャレイヤー

インフラストラクチャレイヤーでは、外部システムのエラーを適切に変換し、上位レイヤーに伝播します。

```typescript
class DrizzleContentRepository implements ContentRepository {
  constructor(private db: PostgresJsDatabase) {}
  
  async findById(id: string): Promise<ContentAggregate | null> {
    try {
      const contentData = await this.db.select()
        .from(contents)
        .where(eq(contents.id, id))
        .limit(1);
      
      if (contentData.length === 0) {
        return null;
      }
      
      // コンテンツメタデータの取得
      const metadataData = await this.db.select()
        .from(contentMetadata)
        .where(eq(contentMetadata.contentId, id))
        .limit(1);
      
      // ContentAggregateの構築と返却
      // ...
    } catch (error) {
      console.error('Database error in findById:', error);
      throw new DatabaseError('findById', error.message);
    }
  }
  
  async save(contentAggregate: ContentAggregate): Promise<void> {
    const content = contentAggregate.getContent();
    
    try {
      await this.db.transaction(async (tx) => {
        // コンテンツの保存
        await tx.insert(contents)
          .values({
            id: content.id,
            userId: content.userId,
            repositoryId: content.repositoryId,
            path: content.path,
            title: content.title,
            body: content.body,
            status: content.status
          })
          .onConflictDoUpdate({
            target: contents.id,
            set: {
              title: content.title,
              body: content.body,
              status: content.status,
              updatedAt: new Date()
            }
          });
        
        // メタデータの保存
        // ...
      });
    } catch (error) {
      console.error('Database error in save:', error);
      throw new DatabaseError('save', error.message);
    }
  }
}
```

### 2.4 プレゼンテーションレイヤー

プレゼンテーションレイヤーでは、下位レイヤーからのエラーを適切なHTTPレスポンスに変換します。

```typescript
// Honoミドルウェアでのエラーハンドリング
const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error('Unhandled error:', error);
    
    if (error instanceof DomainError) {
      return c.json({ error: error.message }, 400);
    }
    
    if (error instanceof EntityNotFoundError) {
      return c.json({ error: error.message }, 404);
    }
    
    if (error instanceof AuthorizationError) {
      return c.json({ error: error.message }, 403);
    }
    
    if (error instanceof UnauthorizedError) {
      return c.json({ error: error.message }, 401);
    }
    
    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }
    
    if (error instanceof DatabaseError || error instanceof ExternalServiceError) {
      return c.json({ error: 'Internal server error' }, 500);
    }
    
    // その他の予期しないエラー
    return c.json({ error: 'Internal server error' }, 500);
  }
};

// APIルートでの使用
const app = new Hono();
app.use('*', errorHandler);

app.post('/api/contents/:id/publish', async (c) => {
  const contentId = c.req.param('id');
  const userId = c.get('userId'); // 認証ミドルウェアで設定されたユーザーID
  
  const useCase = new PublishContentUseCase(contentRepository);
  const result = await useCase.execute(contentId, userId);
  
  if (result.isErr()) {
    const error = result.error;
    
    if (error instanceof EntityNotFoundError) {
      return c.json({ error: error.message }, 404);
    }
    
    if (error instanceof AuthorizationError) {
      return c.json({ error: error.message }, 403);
    }
    
    if (error instanceof DomainError) {
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ error: 'Failed to publish content' }, 500);
  }
  
  return c.json({ success: true }, 200);
});
```

## 3. 外部システム連携のエラーハンドリング

### 3.1 GitHub API連携

GitHub APIとの連携時のエラーハンドリング戦略です。

```typescript
class GitHubApiAdapter implements GitHubClient {
  constructor(private octokit: Octokit) {}
  
  async getContents(owner: string, repo: string, path: string): Promise<GitHubContent[]> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path
      });
      
      // レスポンスの変換と返却
      // ...
    } catch (error) {
      // GitHub APIのエラーを適切に変換
      if (error.status === 404) {
        throw new ExternalServiceError('GitHub', 'getContents', 'Resource not found');
      }
      
      if (error.status === 403 && error.message.includes('rate limit')) {
        throw new ExternalServiceError('GitHub', 'getContents', 'API rate limit exceeded');
      }
      
      // その他のエラー
      throw new ExternalServiceError('GitHub', 'getContents', error.message);
    }
  }
  
  async createOrUpdateFile(owner: string, repo: string, path: string, content: string, message: string): Promise<string> {
    try {
      // 既存ファイルの確認
      let sha: string | undefined;
      try {
        const existingFile = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path
        });
        
        if (!Array.isArray(existingFile.data)) {
          sha = existingFile.data.sha;
        }
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
        // ファイルが存在しない場合は新規作成（shaは不要）
      }
      
      // ファイルの作成または更新
      const response = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha
      });
      
      return response.data.content.sha;
    } catch (error) {
      // エラーの変換
      if (error.status === 409) {
        throw new ExternalServiceError('GitHub', 'createOrUpdateFile', 'Conflict: The file has been modified since last retrieval');
      }
      
      throw new ExternalServiceError('GitHub', 'createOrUpdateFile', error.message);
    }
  }
}
```

### 3.2 AT Protocol連携

AT Protocolとの連携時のエラーハンドリング戦略です。

```typescript
class ATProtocolAdapter implements ATProtocolClient {
  constructor(private agent: BskyAgent) {}
  
  async publishPost(text: string, facets?: Facet[]): Promise<string> {
    try {
      const response = await this.agent.post({
        text,
        facets
      });
      
      return response.uri;
    } catch (error) {
      // AT Protocolのエラーを適切に変換
      if (error.status === 401) {
        throw new ExternalServiceError('AT Protocol', 'publishPost', 'Authentication failed');
      }
      
      if (error.status === 400) {
        throw new ExternalServiceError('AT Protocol', 'publishPost', `Invalid request: ${error.message}`);
      }
      
      // レート制限エラー
      if (error.status === 429) {
        throw new ExternalServiceError('AT Protocol', 'publishPost', 'Rate limit exceeded');
      }
      
      // その他のエラー
      throw new ExternalServiceError('AT Protocol', 'publishPost', error.message);
    }
  }
  
  async getTimeline(): Promise<TimelinePost[]> {
    try {
      const response = await this.agent.getTimeline();
      
      // レスポンスの変換と返却
      // ...
    } catch (error) {
      throw new ExternalServiceError('AT Protocol', 'getTimeline', error.message);
    }
  }
}
```

## 4. 非同期処理のエラーハンドリング

### 4.1 イベント駆動アーキテクチャでのエラー処理

イベント駆動アーキテクチャにおけるエラーハンドリング戦略です。

```typescript
// イベントハンドラーの基本構造
abstract class EventHandler<T extends DomainEvent> {
  abstract handle(event: T): Promise<void>;
  
  async execute(event: T): Promise<void> {
    try {
      await this.handle(event);
    } catch (error) {
      // エラーログの記録
      console.error(`Error handling event ${event.constructor.name}:`, error);
      
      // 失敗イベントの発行
      await this.publishFailureEvent(event, error);
      
      // 特定のエラーは再スロー
      if (error instanceof CriticalError) {
        throw error;
      }
    }
  }
  
  private async publishFailureEvent(event: T, error: Error): Promise<void> {
    const failureEvent = new EventHandlingFailed(
      event.constructor.name,
      event,
      error.message,
      new Date()
    );
    
    await eventBus.publish(failureEvent);
  }
}

// 具体的なイベントハンドラー
class ContentPublishedHandler extends EventHandler<ContentPublished> {
  constructor(private postRepository: PostRepository) {
    super();
  }
  
  async handle(event: ContentPublished): Promise<void> {
    // イベント処理ロジック
    // ...
  }
}
```

### 4.2 リトライ戦略

一時的な障害に対するリトライ戦略です。

```typescript
// 指数バックオフを使用したリトライ関数
async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    retryableErrors: (error: Error) => boolean;
  }
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, retryableErrors } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // リトライ可能なエラーかチェック
      if (!retryableErrors(error)) {
        throw error;
      }
      
      // 最大リトライ回数に達した場合
      if (attempt === maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} retries: ${error.message}`);
      }
      
      // 指数バックオフによる待機
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 100; // ジッターを追加して競合を減らす
      
      console.log(`Retrying operation in ${delay + jitter}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError;
}

// 使用例
async function syncWithGitHub(repositoryId: string): Promise<void> {
  await withRetry(
    async () => {
      // GitHub同期処理
      // ...
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      retryableErrors: (error) => {
        // リトライ可能なエラーの判定
        if (error instanceof ExternalServiceError) {
          // レート制限エラーはリトライ可能
          if (error.message.includes('rate limit')) {
            return true;
          }
          
          // 一時的なネットワークエラーはリトライ可能
          if (error.message.includes('network') || error.message.includes('timeout')) {
            return true;
          }
        }
        
        return false;
      }
    }
  );
}
```

### 4.3 サーキットブレーカーパターン

外部システムの障害時に連続した呼び出しを防ぐサーキットブレーカーパターンの実装です。

```typescript
enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  
  constructor(
    private readonly failureThreshold: number,
    private readonly resetTimeout: number
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // 回復時間を経過したかチェック
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit is open');
      }
    }
    
    try {
      const result = await operation();
      
      // 成功した場合
      if (this.state === CircuitState.HALF_OPEN) {
        this.reset();
      }
      
      return result;
    } catch (error) {
      // 失敗した場合
      this.recordFailure();
      throw error;
    }
  }
  
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }
  
  private reset(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }
}

// 使用例
const githubCircuitBreaker = new CircuitBreaker(5, 60000); // 5回の失敗で開き、60秒後に半開状態

async function getGitHubContents(owner: string, repo: string, path: string): Promise<GitHubContent[]> {
  return await githubCircuitBreaker.execute(async () => {
    return await githubClient.getContents(owner, repo, path);
  });
}
```

## 5. エラーログとモニタリング

### 5.1 構造化ロギング

エラーの詳細を構造化された形式でログに記録します。

```typescript
interface ErrorLogData {
  timestamp: string;
  errorType: string;
  message: string;
  stackTrace?: string;
  userId?: string;
  requestId?: string;
  context?: Record<string, any>;
}

function logError(error: Error, context?: {
  userId?: string;
  requestId?: string;
  additionalContext?: Record<string, any>;
}): void {
  const logData: ErrorLogData = {
    timestamp: new Date().toISOString(),
    errorType: error.constructor.name,
    message: error.message,
    stackTrace: error.stack,
    ...context
  };
  
  // 本番環境ではスタックトレースを含めない
  if (process.env.NODE_ENV === 'production') {
    delete logData.stackTrace;
  }
  
  // JSONとして出力
  console.error(JSON.stringify(logData));
}
```

### 5.2 エラーメトリクスの収集

エラーの発生頻度や種類を監視するためのメトリクス収集です。

```typescript
class ErrorMetrics {
  private static errorCounts: Record<string, number> = {};
  
  static recordError(errorType: string): void {
    if (!this.errorCounts[errorType]) {
      this.errorCounts[errorType] = 0;
    }
    
    this.errorCounts[errorType]++;
  }
  
  static getMetrics(): Record<string, number> {
    return { ...this.errorCounts };
  }
  
  static resetMetrics(): void {
    this.errorCounts = {};
  }
}

// エラーハンドラーでの使用
function globalErrorHandler(error: Error): void {
  // エラーログの記録
  logError(error);
  
  // メトリクスの更新
  ErrorMetrics.recordError(error.constructor.name);
}
```

## 6. ユーザー向けエラーメッセージ

### 6.1 エラーメッセージのローカライズ

ユーザー向けエラーメッセージの多言語対応です。

```typescript
const errorMessages = {
  ja: {
    'InvalidContentStateError': 'コンテンツの状態が無効です',
    'EntityNotFoundError': '指定されたリソースが見つかりません',
    'AuthorizationError': 'この操作を実行する権限がありません',
    'ValidationError': '入力データが無効です',
    'DatabaseError': 'データベースエラーが発生しました',
    'ExternalServiceError': '外部サービスとの通信中にエラーが発生しました',
    'UnexpectedError': '予期しないエラーが発生しました'
  },
  en: {
    'InvalidContentStateError': 'Invalid content state',
    'EntityNotFoundError': 'Resource not found',
    'AuthorizationError': 'You do not have permission to perform this action',
    'ValidationError': 'Invalid input data',
    'DatabaseError': 'Database error occurred',
    'ExternalServiceError': 'Error occurred while communicating with external service',
    'UnexpectedError': 'An unexpected error occurred'
  }
};

function getLocalizedErrorMessage(error: Error, locale: string = 'ja'): string {
  const errorType = error.constructor.name;
  const messages = errorMessages[locale] || errorMessages.en;
  
  return messages[errorType] || messages.UnexpectedError;
}
```

### 6.2 ユーザーフレンドリーなエラー表示

フロントエンドでのエラー表示コンポーネントです。

```tsx
interface ErrorDisplayProps {
  error: Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onDismiss }) => {
  if (!error) return null;
  
  const message = getLocalizedErrorMessage(error);
  
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <div className="error-message">{message}</div>
      <div className="error-actions">
        {onRetry && (
          <button className="retry-button" onClick={onRetry}>
            再試行
          </button>
        )}
        {onDismiss && (
          <button className="dismiss-button" onClick={onDismiss}>
            閉じる
          </button>
        )}
      </div>
    </div>
  );
};
```

## 7. エラーハンドリングのベストプラクティス

1. **早期検出、遅延伝播**: エラーは発生した場所で早期に検出し、適切な形に変換してから上位レイヤーに伝播させる

2. **型安全なエラーハンドリング**: Result型やEither型を使用して、エラーを型安全に扱う

3. **詳細なログ記録**: エラーの詳細情報をログに記録し、デバッグを容易にする

4. **ユーザーフレンドリーなメッセージ**: 技術的な詳細を隠し、ユーザーにわかりやすいメッセージを表示する

5. **リトライ戦略の実装**: 一時的な障害に対しては適切なリトライ戦略を実装する

6. **障害の分離**: サーキットブレーカーパターンを使用して、障害の連鎖を防ぐ

7. **監視とアラート**: エラーの発生パターンを監視し、異常を検出したらアラートを発生させる

## 8. まとめ

AT-MDプロジェクトのエラーハンドリング戦略は、ドメイン駆動設計の各レイヤーに適したエラー処理方法を提供します。型安全なエラーハンドリング、適切なリトライ戦略、サーキットブレーカーパターンの実装により、システムの堅牢性と回復力を高めます。

また、構造化されたエラーログ記録とメトリクス収集により、問題の早期発見と解決を支援します。ユーザーフレンドリーなエラーメッセージの提供により、ユーザー体験も向上させます。

これらの戦略を実装することで、AT-MDシステムは予期せぬ障害に対しても適切に対応し、高い可用性を維持することができます。 