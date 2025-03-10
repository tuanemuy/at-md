import { 
  Result, 
  ok, 
  err, 
  type ContentRepository, 
  InfrastructureError, 
  type TransactionContext,
  PostgresTransactionContext,
  type ContentAggregate,
  type Content,
  type ContentParams,
  createContent,
  createContentAggregate,
  type ContentMetadata,
  type DomainEvent
} from "./deps.ts";
import { contents, eq, and } from "./deps.ts";
import type { Database } from "../../database/schema/mod.ts";

/**
 * クエリビルダーの型定義
 * Drizzle ORMのクエリビルダーの型を拡張して、limit/offsetメソッドを持つことを保証
 */
interface QueryBuilder<T> {
  limit(limit: number): QueryBuilder<T>;
  offset(offset: number): QueryBuilder<T>;
  where(condition: unknown): QueryBuilder<T>;
  then<U>(onfulfilled?: (value: T[]) => U | PromiseLike<U>): Promise<U>;
}

/**
 * コンテンツデータの型定義
 */
interface ContentData {
  id: string;
  userId: string;
  repositoryId: string | null;
  path: string | null;
  title: string;
  body: string;
  tags?: string;
  status?: string; // データベースのカラム名がstatusの場合
  visibility?: string; // マッピング用
  versions?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Drizzle ORMを使用したコンテンツリポジトリの実装
 */
export class DrizzleContentRepository implements ContentRepository {
  private domainEvents: DomainEvent[] = [];

  /**
   * コンストラクタ
   * @param db データベース接続
   */
  constructor(private readonly db: Database) {}

  /**
   * IDによってコンテンツを検索する
   * @param id コンテンツID
   * @returns コンテンツ集約、存在しない場合はnull
   */
  async findById(id: string): Promise<ContentAggregate | null> {
    try {
      const result = await this.db.select().from(contents).where(eq(contents.id, id)).limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const contentData = result[0] as unknown as ContentData;
      
      // コンテンツ集約の作成
      return this.mapToContentAggregate(contentData);
    } catch (error) {
      console.error("コンテンツ検索エラー:", error);
      return null;
    }
  }

  /**
   * リポジトリIDとパスによってコンテンツを検索する
   * @param repositoryId リポジトリID
   * @param path パス
   * @returns コンテンツ集約、存在しない場合はnull
   */
  async findByRepositoryIdAndPath(repositoryId: string, path: string): Promise<ContentAggregate | null> {
    try {
      // Drizzle ORMのクエリビルダーの型定義の問題により、型キャストを使用
      const baseQuery = this.db.select().from(contents);
      const whereQuery = baseQuery.where(eq(contents.repositoryId, repositoryId));
      const result = await whereQuery.where(eq(contents.path, path)).limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const contentData = result[0] as unknown as ContentData;
      
      // コンテンツ集約の作成
      return this.mapToContentAggregate(contentData);
    } catch (error) {
      console.error("リポジトリIDとパスによるコンテンツ検索エラー:", error);
      return null;
    }
  }

  /**
   * リポジトリIDによってコンテンツを検索する
   * @param repositoryId リポジトリID
   * @param options 検索オプション
   * @returns コンテンツ集約の配列
   */
  async findByRepositoryId(repositoryId: string, options?: { 
    limit?: number; 
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    try {
      // Drizzle ORMのクエリビルダーの型定義の問題により、型キャストを使用
      // 将来的にはカスタム型定義を作成して対応することが望ましい
      const baseQuery = this.db.select().from(contents).where(eq(contents.repositoryId, repositoryId));
      const query = baseQuery as unknown as QueryBuilder<ContentData>;
      
      if (options?.limit) {
        query.limit(options.limit);
      }
      
      if (options?.offset) {
        query.offset(options.offset);
      }
      
      // statusによるフィルタリングがあれば追加
      if (options?.status) {
        query.where(eq(contents.status, options.status));
      }
      
      const results = await query;
      
      return results.map((contentData: unknown) => this.mapToContentAggregate(contentData as ContentData));
    } catch (error) {
      console.error("リポジトリIDによるコンテンツ検索エラー:", error);
      return [];
    }
  }

  /**
   * ユーザーIDによってコンテンツを検索する
   * @param userId ユーザーID
   * @param options 検索オプション
   * @returns コンテンツ集約の配列
   */
  async findByUserId(userId: string, options?: { 
    limit?: number; 
    offset?: number;
    status?: string;
  }): Promise<ContentAggregate[]> {
    try {
      // Drizzle ORMのクエリビルダーの型定義の問題により、型キャストを使用
      // 将来的にはカスタム型定義を作成して対応することが望ましい
      const baseQuery = this.db.select().from(contents).where(eq(contents.userId, userId));
      const query = baseQuery as unknown as QueryBuilder<ContentData>;
      
      if (options?.limit) {
        query.limit(options.limit);
      }
      
      if (options?.offset) {
        query.offset(options.offset);
      }
      
      // statusによるフィルタリングがあれば追加
      if (options?.status) {
        query.where(eq(contents.status, options.status));
      }
      
      const results = await query;
      
      return results.map((contentData: unknown) => this.mapToContentAggregate(contentData as ContentData));
    } catch (error) {
      console.error("ユーザーIDによるコンテンツ検索エラー:", error);
      return [];
    }
  }

  /**
   * コンテンツを保存する
   * @param contentAggregate コンテンツ集約
   * @returns 保存されたコンテンツ集約
   */
  async save(contentAggregate: ContentAggregate): Promise<ContentAggregate> {
    const content = contentAggregate.content;
    
    try {
      // コンテンツデータの作成
      const contentData = {
        id: content.id,
        userId: content.userId,
        repositoryId: content.repositoryId,
        path: content.path,
        title: content.title,
        body: content.body,
        tags: JSON.stringify(content.metadata.tags),
        createdAt: content.createdAt,
        updatedAt: content.updatedAt
      };
      
      // 既存のコンテンツを確認
      const existingContent = await this.findById(content.id);
      
      if (existingContent) {
        // 更新
        await this.db.update(contents)
          .set(contentData)
          .where(eq(contents.id, content.id));
      } else {
        // 新規作成
        await this.db.insert(contents).values(contentData);
      }
      
      return contentAggregate;
    } catch (error) {
      console.error("コンテンツ保存エラー:", error);
      throw new Error(`コンテンツの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * トランザクション内でコンテンツを保存する
   * @param contentAggregate コンテンツ集約
   * @param context トランザクションコンテキスト
   * @returns 保存されたコンテンツ集約の結果
   */
  async saveWithTransaction(
    contentAggregate: ContentAggregate, 
    context: TransactionContext
  ): Promise<Result<ContentAggregate, InfrastructureError>> {
    const content = contentAggregate.content;
    
    try {
      if (!(context instanceof PostgresTransactionContext)) {
        return err(new InfrastructureError("無効なトランザクションコンテキストです"));
      }
      
      // コンテンツデータの作成
      const contentData = {
        id: content.id,
        userId: content.userId,
        repositoryId: content.repositoryId,
        path: content.path,
        title: content.title,
        body: content.body,
        tags: JSON.stringify(content.metadata.tags),
        createdAt: content.createdAt,
        updatedAt: content.updatedAt
      };
      
      // 既存のコンテンツを確認
      const existingContent = await this.findById(content.id);
      
      if (existingContent) {
        // 更新
        await context.client.query(
          `UPDATE contents SET 
            user_id = $1, 
            repository_id = $2, 
            path = $3,
            title = $4, 
            body = $5, 
            tags = $6, 
            created_at = $7, 
            updated_at = $8 
          WHERE id = $9`,
          [
            contentData.userId,
            contentData.repositoryId,
            contentData.path,
            contentData.title,
            contentData.body,
            contentData.tags,
            contentData.createdAt,
            contentData.updatedAt,
            contentData.id
          ]
        );
      } else {
        // 新規作成
        await context.client.query(
          `INSERT INTO contents (
            id, user_id, repository_id, path, title, body, tags, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            contentData.id,
            contentData.userId,
            contentData.repositoryId,
            contentData.path,
            contentData.title,
            contentData.body,
            contentData.tags,
            contentData.createdAt,
            contentData.updatedAt
          ]
        );
      }
      
      return ok(contentAggregate);
    } catch (error) {
      return err(new InfrastructureError(`コンテンツの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * コンテンツを削除する
   * @param id コンテンツID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.db.delete(contents).where(eq(contents.id, id));
      return true;
    } catch (error) {
      console.error("コンテンツ削除エラー:", error);
      return false;
    }
  }

  /**
   * トランザクション内でコンテンツを削除する
   * @param id コンテンツID
   * @param context トランザクションコンテキスト
   * @returns 削除結果
   */
  async deleteWithTransaction(
    id: string, 
    context: TransactionContext
  ): Promise<Result<boolean, InfrastructureError>> {
    try {
      if (!(context instanceof PostgresTransactionContext)) {
        return err(new InfrastructureError("無効なトランザクションコンテキストです"));
      }
      
      await context.client.query("DELETE FROM contents WHERE id = $1", [id]);
      return ok(true);
    } catch (error) {
      return err(new InfrastructureError(`コンテンツの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * コンテンツデータをコンテンツ集約にマッピングする
   * @param contentData コンテンツデータ
   * @returns コンテンツ集約
   */
  private mapToContentAggregate(contentData: ContentData): ContentAggregate {
    try {
      // タグの解析
      const tags = contentData.tags ? JSON.parse(contentData.tags) : [];
      
      // 公開範囲の決定（visibilityまたはstatusから取得、デフォルトはprivate）
      const visibility = (contentData.visibility || contentData.status || "private") as "private" | "unlisted" | "public";
      
      // コンテンツパラメータの作成
      const contentParams: ContentParams = {
        id: contentData.id,
        userId: contentData.userId,
        repositoryId: contentData.repositoryId || "",
        path: contentData.path || "",
        title: contentData.title,
        body: contentData.body,
        metadata: {
          tags: tags,
          categories: [],
          language: "ja"
        },
        visibility: visibility,
        versions: [],
        createdAt: contentData.createdAt,
        updatedAt: contentData.updatedAt
      };
      
      // コンテンツエンティティの作成
      const contentResult = createContent(contentParams);
      if (contentResult.isErr()) {
        throw new Error(`コンテンツエンティティの作成に失敗しました: ${contentResult.error.message}`);
      }
      
      // コンテンツ集約の作成
      const aggregateResult = createContentAggregate(contentResult.value);
      if (aggregateResult.isErr()) {
        throw new Error(`コンテンツ集約の作成に失敗しました: ${aggregateResult.error.message}`);
      }
      
      return aggregateResult.value;
    } catch (error) {
      console.error("コンテンツデータのマッピング中にエラーが発生しました:", error);
      throw new Error(`コンテンツデータのマッピングに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 