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

/**
 * コンテンツメタデータを作成する
 * @param overrides 上書きするプロパティ
 * @returns コンテンツメタデータ
 */
export function createTestContentMetadata(overrides: Partial<ContentMetadata> = {}): ContentMetadata {
  return createContentMetadata({
    tags: ["test", "markdown"],
    categories: ["tech"],
    language: "ja",
    readingTime: 3,
    ...overrides
  });
}

/**
 * バージョンを作成する
 * @param overrides 上書きするプロパティ
 * @returns バージョン
 */
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

/**
 * コンテンツを作成する
 * @param overrides 上書きするプロパティ
 * @returns コンテンツ
 */
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