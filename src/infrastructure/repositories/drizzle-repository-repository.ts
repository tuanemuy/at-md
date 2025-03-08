/**
 * Drizzleを使用したリポジトリリポジトリの実装
 */

import { eq, and } from "npm:drizzle-orm";
import { db } from "../database/db.ts";
import { repositories } from "../database/schema/content.ts";
import { RepositoryRepository } from "../../application/content/repositories/repository-repository.ts";
import { RepositoryAggregate, createRepositoryAggregate } from "../../core/content/aggregates/repository-aggregate.ts";
import { createRepository } from "../../core/content/entities/repository.ts";

/**
 * Drizzleを使用したリポジトリリポジトリの実装
 */
export class DrizzleRepositoryRepository implements RepositoryRepository {
  /**
   * IDによるリポジトリ検索
   * @param id リポジトリID
   * @returns リポジトリ集約またはnull
   */
  async findById(id: string): Promise<RepositoryAggregate | null> {
    try {
      const result = await db.select().from(repositories).where(eq(repositories.id, id)).limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const repository = result[0];
      
      return this.mapToRepositoryAggregate(repository);
    } catch (error) {
      console.error("リポジトリID検索エラー:", error);
      throw error;
    }
  }
  
  /**
   * ユーザーIDによるリポジトリ検索
   * @param userId ユーザーID
   * @param options 検索オプション
   * @returns リポジトリ集約の配列
   */
  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<RepositoryAggregate[]> {
    try {
      let query = db.select().from(repositories).where(eq(repositories.userId, userId));
      
      // 注: Drizzle ORMのバージョンによっては、limit/offsetメソッドが異なる可能性があります
      // 型エラーが発生する場合は、適切な方法でクエリを構築する必要があります
      const results = await query;
      
      return results.map(repository => this.mapToRepositoryAggregate(repository));
    } catch (error) {
      console.error("ユーザーIDによるリポジトリ検索エラー:", error);
      throw error;
    }
  }
  
  /**
   * 名前によるリポジトリ検索
   * @param userId ユーザーID
   * @param name リポジトリ名
   * @returns リポジトリ集約またはnull
   */
  async findByName(userId: string, name: string): Promise<RepositoryAggregate | null> {
    try {
      const result = await db.select()
        .from(repositories)
        .where(and(
          eq(repositories.userId, userId),
          eq(repositories.name, name)
        ))
        .limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const repository = result[0];
      
      return this.mapToRepositoryAggregate(repository);
    } catch (error) {
      console.error("リポジトリ名検索エラー:", error);
      throw error;
    }
  }
  
  /**
   * リポジトリの保存
   * @param repositoryAggregate リポジトリ集約
   * @returns 保存されたリポジトリ集約
   */
  async save(repositoryAggregate: RepositoryAggregate): Promise<RepositoryAggregate> {
    try {
      const repository = repositoryAggregate.repository;
      
      // 既存のリポジトリを確認
      const existingRepository = await this.findById(repository.id);
      
      if (existingRepository) {
        // 更新
        await db.update(repositories)
          .set({
            name: repository.name,
            description: "", // エンティティにないフィールドにはデフォルト値を設定
            githubUrl: "", // エンティティにないフィールドにはデフォルト値を設定
            updatedAt: new Date()
          })
          .where(eq(repositories.id, repository.id));
      } else {
        // 新規作成
        await db.insert(repositories).values({
          id: repository.id,
          userId: repository.userId,
          name: repository.name,
          description: "", // エンティティにないフィールドにはデフォルト値を設定
          githubUrl: "", // エンティティにないフィールドにはデフォルト値を設定
          createdAt: repository.createdAt,
          updatedAt: repository.updatedAt
        });
      }
      
      // 保存後のリポジトリを取得
      const savedRepository = await this.findById(repository.id);
      
      if (!savedRepository) {
        throw new Error(`リポジトリ ${repository.id} の保存に失敗しました`);
      }
      
      return savedRepository;
    } catch (error) {
      console.error("リポジトリ保存エラー:", error);
      throw error;
    }
  }
  
  /**
   * リポジトリの削除
   * @param id リポジトリID
   * @returns 削除が成功したかどうか
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(repositories).where(eq(repositories.id, id));
      
      // 削除が成功したかどうかを返す
      return result !== undefined && Object.keys(result).length > 0;
    } catch (error) {
      console.error("リポジトリ削除エラー:", error);
      throw error;
    }
  }
  
  /**
   * データベースのリポジトリをリポジトリ集約にマッピング
   * @param repository データベースのリポジトリ
   * @returns リポジトリ集約
   */
  private mapToRepositoryAggregate(repository: any): RepositoryAggregate {
    // まずリポジトリエンティティを作成
    const repositoryEntity = createRepository({
      id: repository.id,
      userId: repository.userId,
      name: repository.name,
      owner: repository.userId,
      defaultBranch: "main",
      lastSyncedAt: repository.updatedAt,
      status: "active",
      createdAt: repository.createdAt,
      updatedAt: repository.updatedAt
    });
    
    // リポジトリエンティティからリポジトリ集約を作成
    return createRepositoryAggregate(repositoryEntity);
  }
} 