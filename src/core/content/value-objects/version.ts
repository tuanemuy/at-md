import { Result, err, ok } from "../deps.ts";
import { DomainError } from "../../errors/mod.ts";
import { ContentMetadata } from "./content-metadata.ts";
import { versionSchema, contentChangesSchema, ContentChangesSchema } from "../schemas/content-schemas.ts";

/**
 * コンテンツの変更内容を表す型
 */
export type ContentChanges = ContentChangesSchema;

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
 * バージョン作成エラー
 */
export class VersionCreationError extends DomainError {
  constructor(message: string) {
    super(`バージョンの作成に失敗しました: ${message}`);
  }
}

/**
 * Versionを作成する
 * @param params Versionのパラメータ
 * @returns 不変なVersionオブジェクトを含むResult、またはエラー
 */
export function createVersion(params: VersionParams): Result<Version, DomainError> {
  // Zodスキーマを使用してバリデーション
  const validationResult = versionSchema.safeParse(params);
  
  if (!validationResult.success) {
    return err(new VersionCreationError(validationResult.error.message));
  }

  // 変更内容のバリデーション
  const changesValidation = contentChangesSchema.safeParse(params.changes);
  if (!changesValidation.success) {
    return err(new VersionCreationError(`変更内容が無効です: ${changesValidation.error.message}`));
  }

  const version: Version = {
    id: params.id,
    contentId: params.contentId,
    commitId: params.commitId,
    createdAt: params.createdAt,
    changes: { ...params.changes },
  };

  return ok(Object.freeze(version));
} 