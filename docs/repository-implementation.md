# リポジトリ実装ドキュメント

## 概要

このドキュメントでは、AT-MDプロジェクトにおけるリポジトリレイヤーの実装について説明します。リポジトリパターンを採用し、ドメイン駆動設計（DDD）の原則に従って実装されています。

## アーキテクチャ

プロジェクトは以下のレイヤーで構成されています：

1. **ドメインレイヤー**：ビジネスロジックとドメインモデルを含む
   - エンティティ（例：`Content`）
   - 値オブジェクト（例：`ContentMetadata`）
   - 集約（例：`ContentAggregate`）

2. **アプリケーションレイヤー**：ユースケースとリポジトリインターフェースを含む
   - リポジトリインターフェース（例：`ContentRepository`）
   - ユースケース（例：コンテンツの作成、更新、削除）

3. **インフラストラクチャレイヤー**：外部システムとの連携を担当
   - リポジトリ実装（例：`DrizzleContentRepository`）
   - データベース接続（例：`DrizzleClient`）

## リポジトリインターフェース

リポジトリインターフェースは、アプリケーションレイヤーで定義され、ドメインモデルの永続化を抽象化します。

```typescript
export interface ContentRepository {
  findById(id: string): Promise<ContentAggregate | null>;
  findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<ContentAggregate | null>;
  findByUserId(userId: string, options?: { limit?: number; offset?: number; status?: string; }): Promise<ContentAggregate[]>;
  findByRepositoryId(repositoryId: string, options?: { limit?: number; offset?: number; status?: string; }): Promise<ContentAggregate[]>;
  save(contentAggregate: ContentAggregate): Promise<ContentAggregate>;
  delete(id: string): Promise<boolean>;
}
```

## リポジトリ実装

### DrizzleContentRepository

`DrizzleContentRepository`は、Drizzle ORMを使用してPostgreSQLデータベースとの連携を実装しています。

#### 主な特徴

1. **トランザクション管理**：
   - `save`メソッドと`delete`メソッドでは、トランザクションを使用して複数のテーブル操作を一貫性を持って実行します。

2. **エラーハンドリング**：
   - 各メソッドは適切なエラーハンドリングを実装し、リポジトリ固有のエラー型（`RepositoryError`）を使用します。
   - エラーには、コード、メッセージ、原因が含まれます。

3. **型安全性**：
   - TypeScriptの型システムを活用して、データの整合性を確保します。
   - Drizzle ORMのスキーマ定義と連携して、型安全なデータベース操作を実現します。

#### 実装例

```typescript
export class DrizzleContentRepository implements ContentRepository {
  private db: NodePgDatabase<any>;
  
  constructor(db: NodePgDatabase<any>) {
    this.db = db;
  }
  
  async findById(id: string): Promise<ContentAggregate | null> {
    try {
      // コンテンツを検索
      const contentResult = await this.db.select()
        .from(contents)
        .where(eq(contents.id, id))
        .limit(1);
      
      if (contentResult.length === 0) {
        return null;
      }
      
      // メタデータを検索
      const metadataResult = await this.db.select()
        .from(contentMetadata)
        .where(eq(contentMetadata.contentId, id))
        .limit(1);
      
      // コンテンツエンティティと集約を作成して返す
      // ...
    } catch (error) {
      // エラーハンドリング
      // ...
    }
  }
  
  // 他のメソッド実装...
}
```

## テスト戦略

リポジトリの実装は、以下の2種類のテストで検証されています：

### 1. 単体テスト（モックを使用）

`drizzle-content-repository.test.ts`では、実際のデータベースに依存せず、インメモリのモックリポジトリを使用してテストを行います。

#### 特徴

- 外部依存がなく、高速で安定したテスト実行
- `MockContentRepository`クラスを使用してインメモリでデータを管理
- エラーケースのテストも容易に実装可能

#### テストケース

- コンテンツの保存と取得
- リポジトリIDとパスによる検索
- ユーザーIDによる検索
- コンテンツの削除
- 存在しないコンテンツの検索
- エラーハンドリング

### 2. 統合テスト（実際のデータベースを使用）

`drizzle-content-repository.integration.test.ts`では、実際のPostgreSQLデータベースに接続してテストを行います。

#### 特徴

- 実際のデータベース操作を検証
- 環境変数`DATABASE_URL`で接続先を指定
- データベースが利用できない場合はテストをスキップ
- テスト前後にテーブルをクリアして独立性を確保
- 共有のデータベース接続を使用してリソース効率を向上

#### テストケース

- 実際のデータベースでのコンテンツ保存と取得
- 実際のデータベースでのリポジトリIDとパスによる検索
- 実際のデータベースでのユーザーIDによる検索
- 実際のデータベースでのコンテンツ削除
- トランザクションの動作確認

## リソース管理

テスト実行時のリソースリークを防ぐため、以下の対策を実装しています：

1. **データベース接続の共有**：
   - テスト全体で1つのデータベース接続を共有し、接続の作成と破棄の回数を減らす

2. **適切なクリーンアップ**：
   - `afterAll`フックで確実にデータベース接続を閉じる
   - `beforeEach`と`afterEach`フックでテストデータをクリア

3. **エラーハンドリング**：
   - クリーンアップ処理でのエラーを適切に処理し、テスト実行に影響を与えないようにする

## 今後の課題と改善点

1. **パフォーマンス最適化**：
   - N+1問題の解決
   - クエリの最適化

2. **機能拡張**：
   - 全文検索機能の追加
   - ページネーション機能の改善

3. **テスト改善**：
   - テストカバレッジの向上
   - プロパティベーステストの導入検討

## 結論

リポジトリパターンとDDDの原則に従った実装により、以下の利点が得られています：

1. **関心の分離**：ドメインロジックとデータアクセスロジックの明確な分離
2. **テスト容易性**：モックを使用した単体テストと実際のデータベースを使用した統合テストの両方が可能
3. **保守性**：明確なインターフェースと責任の分離により、コードの保守が容易
4. **拡張性**：新しいデータストアへの切り替えが容易（インターフェースの実装を変更するだけ）

これらの実装とテスト戦略により、AT-MDプロジェクトのデータアクセス層は堅牢で保守性の高いものとなっています。 