/**
 * テストデータファクトリ
 * 
 * テスト用のデータを生成するためのファクトリ関数を提供します。
 */

import { ContentMetadata, createContentMetadata } from "../../src/core/content/value-objects/content-metadata.ts";
import { Version, VersionParams, createVersion, ContentChanges } from "../../src/core/content/value-objects/version.ts";
import { Content, ContentParams, createContent } from "../../src/core/content/entities/content.ts";
import { Repository, RepositoryParams, createRepository, RepositoryStatus } from "../../src/core/content/entities/repository.ts";
import { ContentAggregate, createContentAggregate } from "../../src/core/content/aggregates/content-aggregate.ts";
import { RepositoryAggregate, createRepositoryAggregate } from "../../src/core/content/aggregates/repository-aggregate.ts";
import { Result, ok } from "../../src/deps.ts";
import { DomainError } from "../../src/core/errors/base.ts";
import { 
  titleSchema, 
  bodySchema, 
  tagSchema, 
  categorySchema, 
  languageSchema,
  readingTimeSchema
} from "../../src/core/common/schemas/base-schemas.ts";

/**
 * コンテンツメタデータを作成する
 * @param overrides 上書きするプロパティ
 * @returns コンテンツメタデータ
 */
export function createTestContentMetadata(overrides: Partial<ContentMetadata> = {}): ContentMetadata {
  const metadataResult = createContentMetadata({
    tags: ["test", "markdown"],
    categories: ["tech"],
    language: "ja",
    readingTime: 3,
    ...overrides
  });
  
  if (metadataResult.isErr()) {
    throw new Error(`メタデータの作成に失敗しました: ${metadataResult.error.message}`);
  }
  
  return metadataResult.value;
}

/**
 * バージョンを作成する
 * @param overrides 上書きするプロパティ
 * @returns バージョン
 */
export function createTestVersion(overrides: Partial<VersionParams> = {}): Version {
  // 型安全なデータを作成
  const title = titleSchema.parse("更新されたタイトル");
  const body = bodySchema.parse("更新された本文");
  const tags = [tagSchema.parse("updated")];
  
  const versionResult = createVersion({
    id: "version-123",
    contentId: "content-123",
    commitId: "commit-456",
    createdAt: new Date("2023-01-01T00:00:00Z"),
    changes: {
      title,
      body,
      metadata: {
        tags
      }
    },
    ...overrides
  });
  
  if (versionResult.isErr()) {
    throw new Error(`バージョンの作成に失敗しました: ${versionResult.error.message}`);
  }
  
  return versionResult.value;
}

/**
 * コンテンツを作成する
 * @param overrides 上書きするプロパティ
 * @returns コンテンツ
 */
export function createTestContent(overrides: Partial<ContentParams> = {}): Content {
  // 型安全なデータを作成
  const title = titleSchema.parse("テストコンテンツ");
  const body = bodySchema.parse("# テストコンテンツ\n\nこれはテストです。");
  const metadata = createTestContentMetadata();
  
  const contentResult = createContent({
    id: "content-123",
    userId: "user-456",
    repositoryId: "repo-789",
    path: "path/to/content.md",
    title,
    body,
    metadata,
    versions: [],
    visibility: "private",
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-02T00:00:00Z"),
    ...overrides
  });
  
  if (contentResult.isErr()) {
    throw new Error(`コンテンツの作成に失敗しました: ${contentResult.error.message}`);
  }
  
  return contentResult.value;
}

/**
 * リポジトリを作成する
 * @param overrides 上書きするプロパティ
 * @returns リポジトリ
 */
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

/**
 * コンテンツ集約を作成する
 * @param content コンテンツ
 * @returns コンテンツ集約
 */
export function createTestContentAggregate(content: Content = createTestContent()): ContentAggregate {
  return createContentAggregate(content);
}

/**
 * リポジトリ集約を作成する
 * @param repository リポジトリ
 * @returns リポジトリ集約
 */
export function createTestRepositoryAggregate(repository: Repository = createTestRepository()): RepositoryAggregate {
  return createRepositoryAggregate(repository);
} 