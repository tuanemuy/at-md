import { ContentMetadata } from "./content-metadata.ts";
import { ContentId } from "../entities/content.ts";
import { Result, ok, err } from "../deps.ts";
import { DomainValidationError } from "../entities/content.ts";

/**
 * バージョンIDの型
 * 文字列リテラル型を使用して型安全性を向上
 */
export type VersionId = string & { readonly __brand: unique symbol };

/**
 * コミットIDの型
 * 文字列リテラル型を使用して型安全性を向上
 */
export type CommitId = string & { readonly __brand: unique symbol };

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
  readonly id: VersionId;
  /** 関連するコンテンツID */
  readonly contentId: ContentId;
  /** GitHubのコミットID */
  readonly commitId: CommitId;
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
  contentId: ContentId;
  commitId: string;
  createdAt: Date;
  changes: ContentChanges;
}

/**
 * 文字列をVersionId型に変換する
 * @param id 文字列ID
 * @returns VersionId型のID
 */
export function createVersionId(id: string): Result<VersionId, DomainValidationError> {
  if (!id || id.trim() === "") {
    return err(new DomainValidationError("バージョンIDは空にできません"));
  }
  return ok(id as VersionId);
}

/**
 * 文字列をCommitId型に変換する
 * @param id 文字列ID
 * @returns CommitId型のID
 */
export function createCommitId(id: string): Result<CommitId, DomainValidationError> {
  if (!id || id.trim() === "") {
    return err(new DomainValidationError("コミットIDは空にできません"));
  }
  return ok(id as CommitId);
}

/**
 * Versionを作成する
 * @param params Versionのパラメータ
 * @returns 不変なVersionオブジェクト
 * @throws IDが空の場合はエラー
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

  // 変更内容が空かどうかをチェック
  if (!params.changes || Object.keys(params.changes).length === 0) {
    throw new Error("変更内容は少なくとも1つ以上必要です");
  }

  const version: Version = {
    id: params.id as VersionId,
    contentId: params.contentId,
    commitId: params.commitId as CommitId,
    createdAt: params.createdAt,
    changes: { ...params.changes }
  };

  return Object.freeze(version);
} 