# リファクタリング実装詳細

このドキュメントでは、AT-MDプロジェクトのリファクタリングの実装詳細を記録します。

## フェーズ1: 基盤整備

### 1.1 Zodの導入と基本スキーマ定義

#### 実装内容

1. **Zodライブラリの追加**

```bash
deno add npm:zod
```

2. **deps.tsの更新**

```typescript
// src/deps.ts
// ...既存のインポート

// バリデーション
export { z } from "npm:zod";
```

3. **基本スキーマの定義**

`src/core/common/schemas/base-schemas.ts`を作成し、基本的なスキーマを定義しました。

```typescript
import { z } from "../../../deps.ts";

// ID用のスキーマ
export const idSchema = z.string().min(1).brand<"ID">();
export type ID = z.infer<typeof idSchema>;

// ユーザーID用のスキーマ
export const userIdSchema = idSchema.brand<"UserID">();
export type UserID = z.infer<typeof userIdSchema>;

// リポジトリID用のスキーマ
export const repositoryIdSchema = idSchema.brand<"RepositoryID">();
export type RepositoryID = z.infer<typeof repositoryIdSchema>;

// コンテンツID用のスキーマ
export const contentIdSchema = idSchema.brand<"ContentID">();
export type ContentID = z.infer<typeof contentIdSchema>;

// 日付用のスキーマ
export const dateSchema = z.date();
export type DateType = z.infer<typeof dateSchema>;

// パス用のスキーマ
export const pathSchema = z.string().min(1).refine(
  (path) => !path.includes("..") && !path.startsWith("/"),
  { message: "Invalid file path" }
).brand<"Path">();
export type Path = z.infer<typeof pathSchema>;

// タイトル用のスキーマ
export const titleSchema = z.string().min(1).max(100).brand<"Title">();
export type Title = z.infer<typeof titleSchema>;

// 本文用のスキーマ
export const bodySchema = z.string().brand<"Body">();
export type Body = z.infer<typeof bodySchema>;

// タグ用のスキーマ
export const tagSchema = z.string().min(1).max(30).brand<"Tag">();
export type Tag = z.infer<typeof tagSchema>;
export const tagsSchema = z.array(tagSchema);
export type Tags = z.infer<typeof tagsSchema>;

// カテゴリ用のスキーマ
export const categorySchema = z.string().min(1).max(30).brand<"Category">();
export type Category = z.infer<typeof categorySchema>;
export const categoriesSchema = z.array(categorySchema);
export type Categories = z.infer<typeof categoriesSchema>;

// 言語用のスキーマ
export const languageSchema = z.string().min(2).max(5).brand<"Language">();
export type Language = z.infer<typeof languageSchema>;

// 読了時間用のスキーマ
export const readingTimeSchema = z.number().int().min(0).brand<"ReadingTime">();
export type ReadingTime = z.infer<typeof readingTimeSchema>;
```

4. **コンテンツスキーマの定義**

`src/core/content/schemas/content-schemas.ts`を作成し、コンテンツ関連のスキーマを定義しました。

```typescript
import { z } from "../../../deps.ts";
import {
  contentIdSchema,
  userIdSchema,
  repositoryIdSchema,
  pathSchema,
  titleSchema,
  bodySchema,
  tagsSchema,
  categoriesSchema,
  languageSchema,
  readingTimeSchema,
  dateSchema
} from "../../common/schemas/base-schemas.ts";

// コンテンツの公開範囲を表すスキーマ
export const contentVisibilitySchema = z.enum(["private", "unlisted", "public"]);
export type ContentVisibilitySchema = z.infer<typeof contentVisibilitySchema>;

// コンテンツメタデータのスキーマ
export const contentMetadataSchema = z.object({
  tags: tagsSchema,
  categories: categoriesSchema,
  language: languageSchema,
  readingTime: readingTimeSchema
});
export type ContentMetadataSchema = z.infer<typeof contentMetadataSchema>;

// バージョンのスキーマ
export const versionSchema = z.object({
  id: z.string().min(1),
  commitId: z.string().min(1),
  message: z.string(),
  createdAt: dateSchema
});
export type VersionSchema = z.infer<typeof versionSchema>;

// コンテンツエンティティのスキーマ
export const contentSchema = z.object({
  id: contentIdSchema,
  userId: userIdSchema,
  repositoryId: repositoryIdSchema,
  path: pathSchema,
  title: titleSchema,
  body: bodySchema,
  metadata: contentMetadataSchema,
  versions: z.array(versionSchema),
  visibility: contentVisibilitySchema,
  createdAt: dateSchema,
  updatedAt: dateSchema
});
export type ContentSchema = z.infer<typeof contentSchema>;

// コンテンツ作成パラメータのスキーマ
export const createContentParamsSchema = contentSchema;
export type CreateContentParamsSchema = z.infer<typeof createContentParamsSchema>;

// コンテンツ更新パラメータのスキーマ
export const updateContentParamsSchema = z.object({
  title: titleSchema.optional(),
  body: bodySchema.optional(),
  metadata: contentMetadataSchema.optional(),
  visibility: contentVisibilitySchema.optional()
});
export type UpdateContentParamsSchema = z.infer<typeof updateContentParamsSchema>;
```

5. **モジュールからのエクスポート**

`src/core/common/schemas/mod.ts`と`src/core/content/schemas/mod.ts`を作成し、スキーマをエクスポートしました。

```typescript
// src/core/common/schemas/mod.ts
export * from "./base-schemas.ts";

// src/core/content/schemas/mod.ts
export * from "./content-schemas.ts";
```

また、各モジュールの`mod.ts`ファイルを更新して、スキーマをエクスポートするようにしました。

```typescript
// src/core/common/mod.ts
// ID関連の型とユーティリティ
export * from "./id.ts";

// スキーマ
export * from "./schemas/mod.ts";

// src/core/content/mod.ts
// ...既存のエクスポート

// スキーマ
export * from "./schemas/mod.ts";
```

### 1.2 テストヘルパーとファクトリの整備

#### 実装内容

1. **テストデータファクトリの作成**

`tests/helpers/test-data-factory.ts`を作成し、テスト用のデータを生成するファクトリ関数を実装しました。

```typescript
import { ContentMetadata, createContentMetadata } from "../../src/core/content/value-objects/content-metadata.ts";
import { Version, VersionParams, createVersion, ContentChanges } from "../../src/core/content/value-objects/version.ts";
import { Content, ContentParams, createContent } from "../../src/core/content/entities/content.ts";
import { Repository, RepositoryParams, createRepository, RepositoryStatus } from "../../src/core/content/entities/repository.ts";
import { ContentAggregate, createContentAggregate } from "../../src/core/content/aggregates/content-aggregate.ts";

// コンテンツメタデータを作成する
export function createTestContentMetadata(overrides: Partial<ContentMetadata> = {}): ContentMetadata {
  return createContentMetadata({
    tags: ["test", "markdown"],
    categories: ["tech"],
    language: "ja",
    readingTime: 3,
    ...overrides
  });
}

// バージョンを作成する
export function createTestVersion(overrides: Partial<VersionParams> = {}): Version {
  return createVersion({
    id: "version-123",
    contentId: "content-123",
    commitId: "commit-456",
    createdAt: new Date("2023-01-01T00:00:00Z"),
    changes: {
      title: "更新されたタイトル",
      body: "更新された本文",
      metadata: {
        tags: ["updated"]
      }
    },
    ...overrides
  });
}

// コンテンツを作成する
export function createTestContent(overrides: Partial<ContentParams> = {}): Content {
  return createContent({
    id: "content-123",
    userId: "user-456",
    repositoryId: "repo-789",
    path: "path/to/content.md",
    title: "テストコンテンツ",
    body: "# テストコンテンツ\n\nこれはテストです。",
    metadata: createTestContentMetadata(),
    versions: [],
    visibility: "private",
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-02T00:00:00Z"),
    ...overrides
  });
}

// リポジトリを作成する
export function createTestRepository(overrides: Partial<RepositoryParams> = {}): Repository {
  return createRepository({
    id: "repo-123",
    userId: "user-456",
    name: "test-repo",
    owner: "test-user",
    defaultBranch: "main",
    lastSyncedAt: new Date("2023-01-01T00:00:00Z"),
    status: "active" as RepositoryStatus,
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-02T00:00:00Z"),
    ...overrides
  });
}

// コンテンツ集約を作成する
export function createTestContentAggregate(content: Content = createTestContent()): ContentAggregate {
  return createContentAggregate(content);
}
```

2. **モックヘルパーの作成**

`tests/helpers/mock-helpers.ts`を作成し、テスト用のモックオブジェクトを生成するヘルパー関数を実装しました。

```typescript
import { ContentRepository } from "../../src/application/content/repositories/content-repository.ts";
import { RepositoryRepository } from "../../src/application/content/repositories/repository-repository.ts";
import { ContentAggregate, createContentAggregate } from "../../src/core/content/aggregates/content-aggregate.ts";
import { RepositoryAggregate } from "../../src/core/content/aggregates/repository-aggregate.ts";
import { createTestContent, createTestRepository, createTestContentAggregate } from "./test-data-factory.ts";

// モックコンテンツリポジトリを作成する
export function createMockContentRepository(
  overrides: Partial<ContentRepository> = {}
): ContentRepository {
  return {
    findById: async (id: string): Promise<ContentAggregate | null> => {
      return createTestContentAggregate(createTestContent({ id }));
    },
    findByRepositoryIdAndPath: async (repositoryId: string, path: string): Promise<ContentAggregate | null> => {
      return createTestContentAggregate(createTestContent({ repositoryId, path }));
    },
    findByUserId: async (userId: string, options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }): Promise<ContentAggregate[]> => {
      return [createTestContentAggregate(createTestContent({ userId }))];
    },
    findByRepositoryId: async (repositoryId: string, options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }): Promise<ContentAggregate[]> => {
      return [createTestContentAggregate(createTestContent({ repositoryId }))];
    },
    save: async (contentAggregate: ContentAggregate): Promise<ContentAggregate> => {
      return contentAggregate;
    },
    delete: async (id: string): Promise<boolean> => {
      return true;
    },
    ...overrides
  };
}

// モックリポジトリリポジトリを作成する
export function createMockRepositoryRepository(
  overrides: Partial<RepositoryRepository> = {}
): RepositoryRepository {
  // RepositoryAggregateのモック作成
  const createMockRepositoryAggregate = (repository = createTestRepository()): RepositoryAggregate => {
    return {
      repository,
      updateName: () => createMockRepositoryAggregate(),
      changeDefaultBranch: () => createMockRepositoryAggregate(),
      startSync: () => createMockRepositoryAggregate(),
      completeSync: () => createMockRepositoryAggregate(),
      deactivate: () => createMockRepositoryAggregate(),
      activate: () => createMockRepositoryAggregate()
    };
  };

  return {
    findById: async (id: string): Promise<RepositoryAggregate | null> => {
      return createMockRepositoryAggregate(createTestRepository({ id }));
    },
    findByUserId: async (userId: string, options?: {
      limit?: number;
      offset?: number;
    }): Promise<RepositoryAggregate[]> => {
      return [createMockRepositoryAggregate(createTestRepository({ userId }))];
    },
    findByName: async (userId: string, name: string): Promise<RepositoryAggregate | null> => {
      return createMockRepositoryAggregate(createTestRepository({ userId, name }));
    },
    save: async (repositoryAggregate: RepositoryAggregate): Promise<RepositoryAggregate> => {
      return repositoryAggregate;
    },
    delete: async (id: string): Promise<boolean> => {
      return true;
    },
    ...overrides
  };
}
```

3. **テストヘルパーのモジュールファイルの作成**

`tests/helpers/mod.ts`を作成し、テストヘルパーをエクスポートしました。

```typescript
// テストデータファクトリ
export * from "./test-data-factory.ts";

// モックヘルパー
export * from "./mock-helpers.ts";
```

### 1.3 依存関係管理の改善

#### 実装内容

1. **各コンテキストごとの`deps.ts`ファイルの作成**

各レイヤーとコンテキストごとに`deps.ts`ファイルを作成し、依存関係を明示的に管理するようにしました。

```typescript
// src/core/content/deps.ts
// 共通モジュール
export * from "../common/mod.ts";

// 外部依存
export { z } from "../../deps.ts";
export { Result, ok, err } from "../../deps.ts";

// src/application/content/deps.ts
// コアドメイン
export * from "../../core/content/mod.ts";

// 外部依存
export { Result, ok, err } from "../../deps.ts";

// src/infrastructure/content/deps.ts
// アプリケーション層
export * from "../../application/content/mod.ts";

// 外部依存
export { Result, ok, err } from "../../deps.ts";
export { eq, and, or, desc, asc, sql, inArray } from "../../deps.ts";
export type { NodePgDatabase } from "../../deps.ts";
```

2. **依存関係の方向性を明示するドキュメントの作成**

`documents/dependency-management.md`を作成し、依存関係の管理方法と方向性を明示しました。

3. **循環参照を検出するスクリプトの作成**

`scripts/check_circular_deps.ts`を作成し、プロジェクト内の循環参照を検出するスクリプトを実装しました。

```typescript
import { walk } from "@std/fs/walk";
import { resolve, dirname, relative } from "@std/path";

// 解析対象のディレクトリ
const SRC_DIR = resolve(Deno.cwd(), "src");

// 依存関係を格納するマップ
const dependencies = new Map<string, Set<string>>();

// ファイルを解析して依存関係を抽出する
async function analyzeDependencies() {
  for await (const entry of walk(SRC_DIR, { exts: [".ts"], skip: [/node_modules/, /\.git/] })) {
    if (entry.isFile) {
      const filePath = entry.path;
      const content = await Deno.readTextFile(filePath);
      
      // import文を抽出
      const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?["']([^"']+)["']/g;
      let match;
      
      const deps = new Set<string>();
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        // 相対パスのみを処理
        if (importPath.startsWith(".")) {
          const resolvedPath = resolve(dirname(filePath), importPath);
          
          // .tsや.jsが含まれていない場合は追加
          const normalizedPath = resolvedPath.endsWith(".ts") || resolvedPath.endsWith(".js")
            ? resolvedPath
            : `${resolvedPath}.ts`;
          
          deps.add(normalizedPath);
        }
      }
      
      dependencies.set(filePath, deps);
    }
  }
}

// 循環参照を検出する
function detectCircularDependencies() {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const circularDeps: [string, string][] = [];
  
  function dfs(file: string, path: string[] = []) {
    if (recursionStack.has(file)) {
      const cycleStart = path.findIndex(f => f === file);
      if (cycleStart >= 0) {
        const cycle = path.slice(cycleStart);
        cycle.push(file);
        
        // 循環参照を記録
        for (let i = 0; i < cycle.length - 1; i++) {
          circularDeps.push([cycle[i], cycle[i + 1]]);
        }
      }
      return;
    }
    
    if (visited.has(file)) {
      return;
    }
    
    visited.add(file);
    recursionStack.add(file);
    
    const deps = dependencies.get(file);
    if (deps) {
      for (const dep of deps) {
        dfs(dep, [...path, file]);
      }
    }
    
    recursionStack.delete(file);
  }
  
  // すべてのファイルに対してDFSを実行
  for (const file of dependencies.keys()) {
    dfs(file);
  }
  
  return circularDeps;
}

// 結果を表示する
function printResults(circularDeps: [string, string][]) {
  if (circularDeps.length === 0) {
    console.log("循環参照は見つかりませんでした。");
    return;
  }
  
  console.log(`${circularDeps.length}個の循環参照が見つかりました：`);
  
  // 循環参照をグループ化して表示
  const cycles = new Map<string, string[]>();
  
  for (const [from, to] of circularDeps) {
    const relFrom = relative(SRC_DIR, from);
    const relTo = relative(SRC_DIR, to);
    
    if (!cycles.has(relFrom)) {
      cycles.set(relFrom, []);
    }
    
    cycles.get(relFrom)!.push(relTo);
  }
  
  for (const [file, deps] of cycles.entries()) {
    console.log(`\n${file} は以下のファイルと循環参照しています：`);
    for (const dep of deps) {
      console.log(`  - ${dep}`);
    }
  }
}

// メイン処理
async function main() {
  console.log("依存関係を解析中...");
  await analyzeDependencies();
  
  console.log("循環参照を検出中...");
  const circularDeps = detectCircularDependencies();
  
  printResults(circularDeps);
}

main().catch(console.error);
```

## 次のフェーズの計画

### フェーズ2: コア改善

#### 2.1 ドメインモデルの型改善

1. **Zodスキーマを活用した型安全なドメインモデルの実装**
   - 既存のエンティティをZodスキーマを使用して検証するように修正
   - ファクトリ関数でのバリデーション処理の追加

2. **バリデーション処理の強化**
   - 入力値の検証処理を追加
   - エラーメッセージの改善

3. **型の厳格化**
   - 文字列リテラル型やブランド型の活用
   - 型ガードの追加

#### 2.2 ユニットテストの追加

1. **ドメインサービスのユニットテスト追加**
   - 各ドメインサービスのテストケース作成
   - エッジケースのテスト追加

2. **アプリケーションサービスのユニットテスト追加**
   - 各アプリケーションサービスのテストケース作成
   - モックを活用した依存関係の分離

#### 2.3 トランザクション管理の改善

1. **トランザクション管理の一貫性確保**
   - リポジトリ実装のトランザクション対応の統一
   - トランザクション境界の明確化

2. **ユニットオブワークパターンの導入検討**
   - ユニットオブワークインターフェースの設計
   - リポジトリとの連携方法の検討 