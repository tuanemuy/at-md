import { ContentMetadata } from "./content-metadata.ts";

/**
 * コンテンツの変更内容を表す型
 */
export interface ContentChanges {
  /** タイトルの変更 */
  title?: string;
  /** 本文の変更 */
  body?: string;
  /** メタデータの変更（部分的な変更も可能） */
  metadata?: Partial<ContentMetadata>;
}

/**
 * コンテンツのバージョンを表す値オブジェクト
 */
export interface Version {
  /** バージョンID */
  readonly id: string;
  /** 関連するコンテンツID */
  readonly contentId: string;
  /** GitHubのコミットID */
  readonly commitId: string;
  /** 作成日時 */
  readonly createdAt: Date;
  /** 変更内容 */
  readonly changes: ContentChanges;
}

/**
 * Versionを作成するための入力パラメータ
 */
export interface VersionParams {
  id: string;
  contentId: string;
  commitId: string;
  createdAt: Date;
  changes: ContentChanges;
}

/**
 * Versionを作成する
 * @param params Versionのパラメータ
 * @returns 不変なVersionオブジェクト
 * @throws IDが空、コンテンツIDが空、コミットIDが空、または変更内容が空の場合はエラー
 */
export function createVersion(params: VersionParams): Version {
  if (!params.id) {
    throw new Error("バージョンIDは必須です");
  }

  if (!params.contentId) {
    throw new Error("コンテンツIDは必須です");
  }

  if (!params.commitId) {
    throw new Error("コミットIDは必須です");
  }

  if (!params.changes || Object.keys(params.changes).length === 0) {
    throw new Error("変更内容は少なくとも1つ以上必要です");
  }

  return Object.freeze({
    id: params.id,
    contentId: params.contentId,
    commitId: params.commitId,
    createdAt: params.createdAt,
    changes: { ...params.changes },
  });
} 