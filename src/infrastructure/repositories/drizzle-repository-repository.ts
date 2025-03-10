/**
 * Drizzle ORMを使用したリポジトリリポジトリの実装
 */

import {
  Result,
  ok,
  err,
  DomainError,
  db,
  eq,
  contentSchema,
  generateId,
  RepositoryAggregate,
  Repository,
  RepositoryRepository,
  PostgresUnitOfWork,
  TransactionContext,
  PostgresTransactionContext,
  and
} from "./deps.ts";
import type { Database } from "../database/schema/mod.ts";
import { pool } from "../database/db.ts";

/**
 * Drizzle ORMを使用したリポジトリリポジトリの実装
 */
export class DrizzleRepositoryRepository implements RepositoryRepository {
  private db: Database;
  
  /**
   * コンストラクタ
   * @param db データベース接続
   */
  constructor(db: Database) {
    this.db = db;
  }

  /**
   * IDによってリポジトリを検索する
   * @param id リポジトリID
   * @returns リポジトリ集約、存在しない場合はnull
   */
  async findById(id: string): Promise<RepositoryAggregate | null> {
    const result = await this.db.select()
      .from(contentSchema.repositories)
      .where(eq(contentSchema.repositories.id, id))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const repositoryData = result[0];
    
    // リポジトリ集約を作成して返す
    const aggregateResult = this.createRepositoryAggregateFromData(repositoryData);
    return aggregateResult ? aggregateResult : null;
  }
  
  /**
   * ユーザーIDによってリポジトリを検索する
   * @param userId ユーザーID
   * @returns リポジトリ集約の配列
   */
  async findByUserId(userId: string): Promise<RepositoryAggregate[]> {
    const result = await this.db.select()
      .from(contentSchema.repositories)
      .where(eq(contentSchema.repositories.userId, userId));
    
    if (result.length === 0) {
      return [];
    }
    
    // リポジトリ集約の配列を作成して返す
    const aggregates: RepositoryAggregate[] = [];
    
    for (const repositoryData of result) {
      const aggregate = this.createRepositoryAggregateFromData(repositoryData);
      if (aggregate) {
        aggregates.push(aggregate);
      }
    }
    
    return aggregates;
  }
  
  /**
   * リポジトリを保存する
   * @param repositoryAggregate リポジトリ集約
   * @returns 保存されたリポジトリ集約
   */
  async save(repositoryAggregate: RepositoryAggregate): Promise<RepositoryAggregate> {
    const repository = repositoryAggregate.repository;
    const isNew = !(await this.findById(repository.id));
    
    const repositoryData = {
      id: repository.id,
      userId: repository.userId,
      name: repository.name,
      description: repository.description || "",
      url: repository.url || "",
      provider: repository.provider,
      createdAt: repository.createdAt,
      updatedAt: new Date()
    };
    
    await this.db.insert(contentSchema.repositories)
      .values(repositoryData)
      .onConflictDoUpdate({
        target: contentSchema.repositories.id,
        set: {
          name: repositoryData.name,
          description: repositoryData.description,
          url: repositoryData.url,
          provider: repositoryData.provider,
          updatedAt: repositoryData.updatedAt
        }
      });
    
    return repositoryAggregate;
  }
  
  /**
   * トランザクション内でリポジトリを保存する
   * @param repositoryAggregate リポジトリ集約
   * @param context トランザクションコンテキスト
   * @returns 保存されたリポジトリ集約の結果
   */
  async saveWithTransaction(
    repositoryAggregate: RepositoryAggregate, 
    context: TransactionContext
  ): Promise<Result<RepositoryAggregate, DomainError>> {
    try {
      // PostgresTransactionContextにキャスト
      const pgContext = context as PostgresTransactionContext;
      
      // リポジトリデータを作成
      const repository = repositoryAggregate.repository;
      const repositoryData = {
        id: repository.id,
        userId: repository.userId,
        name: repository.name,
        description: repository.description,
        url: repository.url,
        provider: repository.provider,
        createdAt: repository.createdAt,
        updatedAt: repository.updatedAt
      };
      
      // トランザクション内でリポジトリを保存
      await pgContext.client.query(
        `INSERT INTO repositories (id, user_id, name, description, url, provider, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE
         SET user_id = $2, name = $3, description = $4, url = $5, provider = $6, updated_at = $8`,
        [
          repositoryData.id,
          repositoryData.userId,
          repositoryData.name,
          repositoryData.description,
          repositoryData.url,
          repositoryData.provider,
          repositoryData.createdAt,
          repositoryData.updatedAt
        ]
      );
      
      return ok(repositoryAggregate);
    } catch (error) {
      return err(new DomainError(`リポジトリの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
  
  /**
   * リポジトリを削除する
   * @param id リポジトリID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(contentSchema.repositories)
      .where(eq(contentSchema.repositories.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  /**
   * トランザクション内でリポジトリを削除する
   * @param id リポジトリID
   * @param context トランザクションコンテキスト
   * @returns 削除結果
   */
  async deleteWithTransaction(
    id: string, 
    context: TransactionContext
  ): Promise<Result<boolean, DomainError>> {
    try {
      // PostgresTransactionContextにキャスト
      const pgContext = context as PostgresTransactionContext;
      
      // トランザクション内でリポジトリを削除
      const result = await pgContext.client.query(
        `DELETE FROM repositories WHERE id = $1`,
        [id]
      );
      
      return ok(result.rowCount !== null && result.rowCount > 0);
    } catch (error) {
      return err(new DomainError(`リポジトリの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * データベースから取得したデータからRepositoryAggregateを作成する
   * @param repositoryData データベースから取得したリポジトリデータ
   * @returns リポジトリ集約、または作成に失敗した場合はnull
   */
  private createRepositoryAggregateFromData(repositoryData: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    url: string | null;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
  }): RepositoryAggregate | null {
    try {
      // Repositoryエンティティを作成
      const repository: Repository = {
        id: repositoryData.id,
        userId: repositoryData.userId,
        name: repositoryData.name,
        description: repositoryData.description || "",
        url: repositoryData.url || "",
        provider: repositoryData.provider,
        owner: "owner", // 必要に応じて適切な値を設定
        defaultBranch: "main", // デフォルト値
        lastSyncedAt: new Date(), // 現在時刻をデフォルト値として使用
        status: "active" as const, // デフォルトのステータス
        createdAt: repositoryData.createdAt,
        updatedAt: repositoryData.updatedAt,
        
        changeStatus(status) {
          return { ...this, status, updatedAt: new Date() };
        },
        
        updateLastSyncedAt(lastSyncedAt) {
          return { ...this, lastSyncedAt, updatedAt: new Date() };
        },
        
        changeDefaultBranch(defaultBranch) {
          return { ...this, defaultBranch, updatedAt: new Date() };
        }
      };
      
      // RepositoryAggregateを作成
      const repositoryAggregate: RepositoryAggregate = {
        repository,
        
        updateName(name: string): RepositoryAggregate {
          const updatedRepository = { 
            ...this.repository, 
            name, 
            updatedAt: new Date() 
          };
          return { ...this, repository: updatedRepository };
        },
        
        changeDefaultBranch(defaultBranch: string): RepositoryAggregate {
          const updatedRepository = this.repository.changeDefaultBranch(defaultBranch);
          return { ...this, repository: updatedRepository };
        },
        
        startSync(): RepositoryAggregate {
          const updatedRepository = this.repository.changeStatus("syncing");
          return { ...this, repository: updatedRepository };
        },
        
        completeSync(syncDate: Date): RepositoryAggregate {
          const repositoryWithUpdatedSyncDate = this.repository.updateLastSyncedAt(syncDate);
          const updatedRepository = repositoryWithUpdatedSyncDate.changeStatus("active");
          return { ...this, repository: updatedRepository };
        },
        
        deactivate(): RepositoryAggregate {
          const updatedRepository = this.repository.changeStatus("inactive");
          return { ...this, repository: updatedRepository };
        },
        
        activate(): RepositoryAggregate {
          const updatedRepository = this.repository.changeStatus("active");
          return { ...this, repository: updatedRepository };
        }
      };
      
      return repositoryAggregate;
    } catch (error) {
      console.error(`リポジトリ集約の作成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 名前によってリポジトリを検索する
   * @param userId ユーザーID
   * @param name リポジトリ名
   * @returns リポジトリ集約、存在しない場合はnull
   */
  async findByName(userId: string, name: string): Promise<RepositoryAggregate | null> {
    const result = await this.db.select()
      .from(contentSchema.repositories)
      .where(
        eq(contentSchema.repositories.userId, userId) && 
        eq(contentSchema.repositories.name, name)
      )
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const repositoryData = result[0];
    
    // リポジトリ集約を作成して返す
    const aggregateResult = this.createRepositoryAggregateFromData(repositoryData);
    return aggregateResult ? aggregateResult : null;
  }
} 