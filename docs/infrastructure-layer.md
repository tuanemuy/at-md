# インフラストラクチャ層の実装パターン

インフラストラクチャ層は、ドメイン層とアプリケーション層を支える技術的な実装を提供します。この層は、データベース、外部API、ロギング、認証などの技術的な詳細を抽象化し、ドメインモデルに依存せずにシステムを動作させるための基盤を提供します。

## 1. 依存関係の逆転

インフラストラクチャ層はドメイン層に依存し、ドメイン層で定義されたインターフェースを実装します。これにより、ドメイン層はインフラストラクチャの詳細に依存せず、純粋なビジネスロジックに集中できます。

## 2. アダプターパターン

外部システムとの連携には、アダプターパターンを使用します。これにより、外部システムの変更がドメインに影響を与えないようにします。

## 3. Zodによる型変換

データベースモデルとドメインモデル間の変換には、Zodを利用します。

## 4. コンテキストパターン

アプリケーション全体で必要な依存関係は、コンテキストオブジェクトとして提供します。これにより、グローバル変数を使わずに依存関係を管理できます。

```typescript
// アプリケーションコンテキスト
export interface AppContext {
  logger: Logger;
  repositories: {
    userRepository: UserRepository;
    sessionRepository: SessionRepository;
    // ...
  };
  apiClients: {
    githubClient: GitHubApiClient;
    blueskyClient: BlueskyApiClient;
  };
  // ...
}

// コンテキスト作成関数
export const createAppContext = (config: AppConfig): AppContext => {
  const logger = createLogger(config.logging);
  const db = createDatabase(config.database);
  const repositories = createRepositories(db);
  const apiClients = createApiClients(config.api);
  
  return {
    logger,
    repositories,
    apiClients
  };
};
```
