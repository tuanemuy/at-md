/**
 * ユニットオブワークの統合テスト
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach, beforeAll } from "@std/testing/bdd";
import { PostgresUnitOfWork } from "../../src/infrastructure/database/postgres-unit-of-work.ts";
import { DrizzleContentRepository } from "../../src/infrastructure/repositories/drizzle-content-repository.ts";
import { DrizzleRepositoryRepository } from "../../src/infrastructure/repositories/drizzle-repository-repository.ts";
import { 
  createTestContent, 
  createTestRepository, 
  createTestContentAggregate, 
  createTestRepositoryAggregate 
} from "../helpers/test-data-factory.ts";
import { createContentAggregate } from "../../src/core/content/aggregates/content-aggregate.ts";
import { createRepositoryAggregate } from "../../src/core/content/aggregates/repository-aggregate.ts";
import { ContentAggregate } from "../../src/core/content/aggregates/content-aggregate.ts";
import { RepositoryAggregate } from "../../src/core/content/aggregates/repository-aggregate.ts";
import { Result, ok, err, dotenvConfig, NodePgDatabase, pg, eq } from "../../src/deps.ts";
import { createDrizzleClient, closeDbConnection } from "../../src/infrastructure/database/client.ts";
import { contents, contentMetadata, repositories } from "../../src/infrastructure/database/schema/content.ts";
import { InfrastructureError } from "../../src/core/errors/base.ts";
import { logger } from "../../src/core/logging/logger.ts";
import { TransactionContext, TransactionError } from "../../src/infrastructure/database/unit-of-work.ts";
import { createRepository } from "../../src/core/content/entities/repository.ts";
import { createContent } from "../../src/core/content/entities/content.ts";
import { createContentMetadata } from "../../src/core/content/value-objects/content-metadata.ts";
import { RepositoryStatus } from "../../src/core/content/entities/repository.ts";

// .envファイルから環境変数を読み込む
try {
  dotenvConfig({ path: ".env" });
} catch (error) {
  console.warn(".envファイルが見つかりません。環境変数が設定されていることを確認してください。");
}

// 環境変数からデータベース接続情報を取得
const DATABASE_URL = Deno.env.get("DATABASE_URL");
const DB_HOST = Deno.env.get("DB_HOST");
const DB_PORT = Deno.env.get("DB_PORT") ? parseInt(Deno.env.get("DB_PORT")!) : undefined;
const DB_USER = Deno.env.get("DB_USER");
const DB_PASSWORD = Deno.env.get("DB_PASSWORD");
const DB_NAME = Deno.env.get("DB_NAME");

// データベース接続情報が揃っているかチェック
const hasDbConfig = DATABASE_URL || (DB_HOST && DB_PORT && DB_USER && DB_PASSWORD && DB_NAME);

if (hasDbConfig) {
  console.log("データベース接続情報が設定されています。");
} else {
  console.warn("データベース接続情報が不足しています。統合テストはスキップされます。");
}

// データベースが利用可能かどうかを確認する関数
async function isDatabaseAvailable(): Promise<boolean> {
  if (!hasDbConfig) {
    return false;
  }

  let pool: any = null;
  
  try {
    // 接続文字列が設定されていない場合は明示的にエラーを投げる
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL が設定されていません");
    }
    
    console.log(`接続文字列: ${DATABASE_URL}`);
    
    // 直接pg.Poolを使用して接続テスト
    const { Pool } = pg;
    pool = new Pool({
      connectionString: DATABASE_URL,
      connectionTimeoutMillis: 5000
    });
    
    console.log("プール作成完了");
    
    let client;
    try {
      console.log("クライアント接続開始");
      client = await pool.connect();
      console.log("クライアント接続成功");
      
      console.log("クエリ実行開始");
      const result = await client.query('SELECT 1 as result');
      console.log("クエリ実行成功");
      console.log("データベース接続テスト結果:", result.rows[0]);
      
      // テーブルの存在確認
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('repositories', 'contents', 'content_metadata')
      `);
      
      console.log("テーブル確認結果:", tablesResult.rows);
      
      // 必要なテーブルが全て存在するか確認
      const requiredTables = ['repositories', 'contents', 'content_metadata'];
      const existingTables = tablesResult.rows.map((row: { table_name: string }) => row.table_name);
      const allTablesExist = requiredTables.every(table => existingTables.includes(table));
      
      if (!allTablesExist) {
        console.warn("必要なテーブルが存在しません:", 
          requiredTables.filter(table => !existingTables.includes(table)));
        return false;
      }
      
      client.release();
      console.log("クライアント解放完了");
      
      console.log("データベースに接続できました。統合テストを実行します。");
      return true;
    } catch (innerError) {
      console.error("内部エラー:", innerError);
      if (client) {
        client.release();
      }
      throw innerError;
    }
  } catch (error) {
    console.error(`データベースに接続できません: ${error instanceof Error ? error.message : String(error)}`);
    console.error("エラーの詳細:", error);
    console.warn("統合テストはスキップされます。");
    return false;
  } finally {
    if (pool) {
      console.log("プール終了処理");
      try {
        await pool.end();
        console.log("プール終了完了");
      } catch (endError) {
        console.error("プール終了エラー:", endError);
      }
    }
  }
}

// テスト前にデータベース接続をチェック
let dbAvailable = false;

// テスト実行前にデータベース接続を確認
async function checkDatabaseAvailability() {
  dbAvailable = await isDatabaseAvailable();
}

describe("ユニットオブワークの統合テスト", () => {
  let unitOfWork: PostgresUnitOfWork | null = null;
  let contentRepository: DrizzleContentRepository | null = null;
  let repositoryRepository: DrizzleRepositoryRepository | null = null;
  let drizzleClient: ReturnType<typeof createDrizzleClient> | null = null;
  let pool: pg.Pool | null = null;
  
  // テスト全体の前にデータベース接続を確認
  beforeAll(async () => {
    // タイムアウト処理を設定（30秒）
    const timeout = setTimeout(() => {
      console.error("テスト実行がタイムアウトしました。強制終了します。");
      Deno.exit(1);
    }, 30000);
    
    try {
      await checkDatabaseAvailability();
      console.log("データベース接続確認完了。接続状態:", dbAvailable ? "利用可能" : "利用不可");
    } finally {
      clearTimeout(timeout);
    }
  });
  
  beforeEach(async () => {
    // データベースが利用できない場合はスキップ
    if (!dbAvailable) {
      return;
    }
    
    try {
      // DrizzleClientを取得（明示的に接続文字列を指定）
      drizzleClient = createDrizzleClient(DATABASE_URL!, logger);
      const db = drizzleClient.db;
      
      // PostgresUnitOfWork用のプールを作成
      const { Pool } = pg;
      pool = new Pool({ 
        connectionString: DATABASE_URL,
        max: 5, // テスト用に接続数を制限
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000
      });
      
      unitOfWork = new PostgresUnitOfWork(pool);
      contentRepository = new DrizzleContentRepository(db as NodePgDatabase<any>);
      repositoryRepository = new DrizzleRepositoryRepository(db as NodePgDatabase<any>);
      
      // テストデータをクリーンアップ
      await db.delete(contentMetadata);
      await db.delete(contents);
      await db.delete(repositories);
    } catch (error) {
      console.error(`テストのセットアップに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
      dbAvailable = false;
      
      // 接続を閉じる
      if (pool) {
        await pool.end();
        pool = null;
      }
      
      // DrizzleClientも閉じる
      if (drizzleClient) {
        await drizzleClient.close();
        drizzleClient = null;
      }
    }
  });
  
  afterEach(async () => {
    try {
      // テスト後のクリーンアップ
      if (drizzleClient) {
        console.log("DrizzleClientを閉じています...");
        await drizzleClient.close();
        drizzleClient = null;
        console.log("DrizzleClientを閉じました");
      }
      
      if (pool) {
        console.log("Poolを終了しています...");
        await pool.end();
        pool = null;
        console.log("Poolを終了しました");
      }
      
      unitOfWork = null;
      contentRepository = null;
      repositoryRepository = null;
    } catch (error) {
      console.error("afterEachでエラーが発生しました:", error);
    }
  });
  
  it("トランザクション内で複数のリポジトリ操作を実行できること", async () => {
    // データベースが利用できない場合はスキップ
    if (!dbAvailable || !unitOfWork || !contentRepository || !repositoryRepository || !drizzleClient) {
      console.log("データベースが利用できないためテストをスキップします");
      return;
    }
    
    try {
      // テストデータの作成
      const repository = createRepository({
        id: "repo-123",
        userId: "user-456",
        name: "test-repo",
        owner: "test-user",
        defaultBranch: "main",
        lastSyncedAt: new Date("2023-01-01T00:00:00Z"),
        status: "active" as RepositoryStatus,
        createdAt: new Date("2023-01-01T00:00:00Z"),
        updatedAt: new Date("2023-01-02T00:00:00Z")
      });
      
      const repositoryAggregate = createRepositoryAggregate(repository);
      
      // コンテンツエンティティを直接作成して日付を確実に設定
      const metadataResult = createContentMetadata({
        tags: ["test", "markdown"],
        categories: ["tech"],
        language: "ja",
        readingTime: 3
      });
      
      if (metadataResult.isErr()) {
        throw new Error(`メタデータの作成に失敗しました: ${metadataResult.error.message}`);
      }
      
      const contentResult = createContent({
        id: "content-123",
        userId: "user-456",
        repositoryId: repositoryAggregate.repository.id, // リポジトリIDを合わせる
        path: "path/to/content.md",
        title: "テストコンテンツ",
        body: "# テストコンテンツ\n\nこれはテストです。",
        metadata: metadataResult.value,
        versions: [],
        visibility: "private",
        createdAt: new Date("2023-01-01T00:00:00Z"),
        updatedAt: new Date("2023-01-02T00:00:00Z")
      });
      
      if (contentResult.isErr()) {
        throw new Error(`コンテンツの作成に失敗しました: ${contentResult.error.message}`);
      }
      
      // コンテンツ集約を作成
      const contentAggregate = createContentAggregate(contentResult.value);
      console.log("テストコンテンツ:", {
        id: contentAggregate.content.id,
        repositoryId: contentAggregate.content.repositoryId,
        metadata: contentAggregate.content.metadata,
        createdAt: contentAggregate.content.createdAt,
        updatedAt: contentAggregate.content.updatedAt
      });
      
      // トランザクション内で処理を実行
      const result = await unitOfWork.executeInTransaction<{ repository: RepositoryAggregate; content: ContentAggregate }>(async (context) => {
        // リポジトリを保存
        console.log("リポジトリ保存開始:", repositoryAggregate.repository.id);
        const repoResult = await repositoryRepository!.saveWithTransaction(repositoryAggregate, context);
        console.log("リポジトリ保存結果:", repoResult.isOk() ? "成功" : "失敗");
        
        if (repoResult.isErr()) {
          console.error("リポジトリ保存エラー:", repoResult.error);
          return err(repoResult.error);
        }
        
        // コンテンツを保存
        console.log("コンテンツ保存開始:", contentAggregate.content.id);
        const contentResult = await contentRepository!.saveWithTransaction(contentAggregate, context);
        console.log("コンテンツ保存結果:", contentResult.isOk() ? "成功" : "失敗");
        
        if (contentResult.isErr()) {
          console.error("コンテンツ保存エラー:", contentResult.error);
          return err(contentResult.error);
        }
        
        return ok({ repository: repositoryAggregate, content: contentAggregate });
      });
      
      // 結果を検証
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        // データベースに保存されていることを確認
        const db = drizzleClient.db;
        const savedRepo = await db.select().from(repositories).where(eq(repositories.id, repositoryAggregate.repository.id));
        const savedContent = await db.select().from(contents).where(eq(contents.id, contentAggregate.content.id));
        
        console.log("保存されたリポジトリ:", savedRepo);
        console.log("保存されたコンテンツ:", savedContent);
        
        // リポジトリとコンテンツが保存されているはず
        expect(savedRepo.length).toBeGreaterThan(0);
        expect(savedContent.length).toBeGreaterThan(0);
      }
    } catch (error) {
      console.error("テスト実行中にエラーが発生しました:", error);
      throw error;
    }
  });
  
  it("トランザクション内でエラーが発生した場合にロールバックされること", async () => {
    // データベースが利用できない場合はスキップ
    if (!dbAvailable || !unitOfWork || !contentRepository || !repositoryRepository || !drizzleClient) {
      console.log("データベースが利用できないためテストをスキップします");
      return;
    }
    
    try {
      // テストデータを準備
      const repository = createRepository({
        id: "repo-rollback-123",
        userId: "user-456",
        name: "test-repo-rollback",
        owner: "test-user",
        defaultBranch: "main",
        lastSyncedAt: new Date("2023-01-01T00:00:00Z"),
        status: "active" as RepositoryStatus,
        createdAt: new Date("2023-01-01T00:00:00Z"),
        updatedAt: new Date("2023-01-02T00:00:00Z")
      });
      
      const repositoryAggregate = createRepositoryAggregate(repository);
      
      // トランザクション内で処理を実行（エラーを発生させる）
      const result = await unitOfWork.executeInTransaction<RepositoryAggregate>(async (context) => {
        // リポジトリを保存
        const repoResult = await repositoryRepository!.saveWithTransaction(repositoryAggregate, context);
        
        if (repoResult.isErr()) {
          return err(repoResult.error);
        }
        
        // 意図的にエラーを発生させる
        return err(new InfrastructureError("テスト用のエラー"));
      });
      
      // 結果を検証
      expect(result.isErr()).toBe(true);
      
      // データベースに保存されていないことを確認（ロールバックされているはず）
      const db = drizzleClient.db;
      const savedRepo = await db.select().from(repositories).where(eq(repositories.id, repositoryAggregate.repository.id));
      
      console.log("保存されたリポジトリ:", savedRepo);
      
      // リポジトリは保存されていないはず（ロールバックされている）
      expect(savedRepo.length).toBe(0);
    } catch (error) {
      console.error("テスト実行中にエラーが発生しました:", error);
      throw error;
    }
  });
  
  it("明示的なトランザクション管理でコミットが成功すること", async () => {
    // データベースが利用できない場合はスキップ
    if (!dbAvailable || !unitOfWork || !contentRepository || !drizzleClient) {
      console.log("データベースが利用できないためテストをスキップします");
      return;
    }
    
    let context: TransactionContext | null = null;
    
    try {
      // テストデータを準備
      // コンテンツエンティティを直接作成して日付を確実に設定
      const metadataResult = createContentMetadata({
        tags: ["test", "markdown"],
        categories: ["tech"],
        language: "ja",
        readingTime: 3
      });
      
      if (metadataResult.isErr()) {
        throw new Error(`メタデータの作成に失敗しました: ${metadataResult.error.message}`);
      }
      
      const contentResult = createContent({
        id: "content-explicit-123",
        userId: "user-456",
        repositoryId: "repo-789",
        path: "path/to/content-explicit.md",
        title: "明示的トランザクションテスト",
        body: "# 明示的トランザクションテスト\n\nこれはテストです。",
        metadata: metadataResult.value,
        versions: [],
        visibility: "private",
        createdAt: new Date("2023-01-01T00:00:00Z"),
        updatedAt: new Date("2023-01-02T00:00:00Z")
      });
      
      if (contentResult.isErr()) {
        throw new Error(`コンテンツの作成に失敗しました: ${contentResult.error.message}`);
      }
      
      // コンテンツ集約を作成
      const contentAggregate = createContentAggregate(contentResult.value);
      console.log("テストコンテンツ（明示的トランザクション）:", {
        id: contentAggregate.content.id,
        repositoryId: contentAggregate.content.repositoryId,
        metadata: contentAggregate.content.metadata,
        createdAt: contentAggregate.content.createdAt,
        updatedAt: contentAggregate.content.updatedAt
      });
      
      // トランザクションを明示的に開始
      const beginResult = await unitOfWork.begin();
      expect(beginResult.isOk()).toBe(true);
      
      if (beginResult.isOk()) {
        context = beginResult.value;
        
        // コンテンツを保存
        const saveResult = await contentRepository!.saveWithTransaction(contentAggregate, context);
        expect(saveResult.isOk()).toBe(true);
        
        // トランザクションをコミット
        const commitResult = await unitOfWork.commit(context);
        expect(commitResult.isOk()).toBe(true);
        
        // データベースに保存されていることを確認
        const db = drizzleClient.db;
        const savedContent = await db.select().from(contents).where(eq(contents.id, contentAggregate.content.id));
        
        console.log("保存されたコンテンツ:", savedContent);
        
        // コンテンツが保存されているはず
        expect(savedContent.length).toBeGreaterThan(0);
        
        // コンテキストをクリア
        context = null;
      }
    } catch (error) {
      console.error("テスト実行中にエラーが発生しました:", error);
      
      // エラーが発生した場合はロールバック
      if (context && unitOfWork) {
        try {
          await unitOfWork.rollback(context);
        } catch (rollbackError) {
          console.error("ロールバック中にエラーが発生しました:", rollbackError);
        }
      }
      
      throw error;
    }
  });
  
  it("明示的なトランザクション管理でロールバックが成功すること", async () => {
    // データベースが利用できない場合はスキップ
    if (!dbAvailable || !unitOfWork || !contentRepository || !drizzleClient) {
      console.log("データベースが利用できないためテストをスキップします");
      return;
    }
    
    let context: TransactionContext | null = null;
    
    try {
      // テストデータを準備
      // コンテンツエンティティを直接作成して日付を確実に設定
      const metadataResult = createContentMetadata({
        tags: ["test", "markdown"],
        categories: ["tech"],
        language: "ja",
        readingTime: 3
      });
      
      if (metadataResult.isErr()) {
        throw new Error(`メタデータの作成に失敗しました: ${metadataResult.error.message}`);
      }
      
      const contentResult = createContent({
        id: "content-rollback-123",
        userId: "user-456",
        repositoryId: "repo-789",
        path: "path/to/content-rollback.md",
        title: "ロールバックテスト",
        body: "# ロールバックテスト\n\nこれはテストです。",
        metadata: metadataResult.value,
        versions: [],
        visibility: "private",
        createdAt: new Date("2023-01-01T00:00:00Z"),
        updatedAt: new Date("2023-01-02T00:00:00Z")
      });
      
      if (contentResult.isErr()) {
        throw new Error(`コンテンツの作成に失敗しました: ${contentResult.error.message}`);
      }
      
      // コンテンツ集約を作成
      const contentAggregate = createContentAggregate(contentResult.value);
      console.log("テストコンテンツ（ロールバック）:", {
        id: contentAggregate.content.id,
        repositoryId: contentAggregate.content.repositoryId,
        metadata: contentAggregate.content.metadata,
        createdAt: contentAggregate.content.createdAt,
        updatedAt: contentAggregate.content.updatedAt
      });
      
      // トランザクションを明示的に開始
      const beginResult = await unitOfWork.begin();
      expect(beginResult.isOk()).toBe(true);
      
      if (beginResult.isOk()) {
        context = beginResult.value;
        
        // コンテンツを保存
        const saveResult = await contentRepository!.saveWithTransaction(contentAggregate, context);
        expect(saveResult.isOk()).toBe(true);
        
        // トランザクションをロールバック
        const rollbackResult = await unitOfWork.rollback(context);
        expect(rollbackResult.isOk()).toBe(true);
        
        // データベースに保存されていないことを確認（ロールバックされているはず）
        const db = drizzleClient.db;
        const savedContent = await db.select().from(contents).where(eq(contents.id, contentAggregate.content.id));
        
        console.log("保存されたコンテンツ:", savedContent);
        
        // コンテンツは保存されていないはず（ロールバックされている）
        expect(savedContent.length).toBe(0);
        
        // コンテキストをクリア
        context = null;
      }
    } catch (error) {
      console.error("テスト実行中にエラーが発生しました:", error);
      
      // エラーが発生した場合はロールバック
      if (context && unitOfWork) {
        try {
          await unitOfWork.rollback(context);
        } catch (rollbackError) {
          console.error("ロールバック中にエラーが発生しました:", rollbackError);
        }
      }
      
      throw error;
    }
  });
}); 