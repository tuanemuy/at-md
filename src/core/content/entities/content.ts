import { Result, err, ok } from "../deps.ts";
import { ContentMetadata } from "../value-objects/content-metadata.ts";
import { Version } from "../value-objects/version.ts";
import { 
  contentSchema, 
  contentVisibilitySchema, 
  ContentVisibilitySchema 
} from "../schemas/content-schemas.ts";
import { DomainError } from "../../errors/mod.ts";

/**
 * コンテンツの公開範囲を表す型
 */
export type ContentVisibility = ContentVisibilitySchema;

/**
 * コンテンツエンティティを表すインターフェース
 */
export interface Content {
  /** コンテンツID */
  readonly id: string;
  /** ユーザーID */
  readonly userId: string;
  /** リポジトリID */
  readonly repositoryId: string;
  /** ファイルパス */
  readonly path: string;
  /** タイトル */
  readonly title: string;
  /** 本文 */
  readonly body: string;
  /** メタデータ */
  readonly metadata: ContentMetadata;
  /** バージョン履歴 */
  readonly versions: Version[];
  /** 公開範囲 */
  readonly visibility: ContentVisibility;
  /** 作成日時 */
  readonly createdAt: Date;
  /** 更新日時 */
  readonly updatedAt: Date;

  /**
   * バージョンを追加する
   * @param version 追加するバージョン
   * @returns 新しいContentインスタンス
   */
  addVersion(version: Version): Result<Content, DomainError>;

  /**
   * 公開範囲を変更する
   * @param visibility 新しい公開範囲
   * @returns 新しいContentインスタンス
   */
  changeVisibility(visibility: ContentVisibility): Result<Content, DomainError>;

  /**
   * メタデータを更新する
   * @param metadata 新しいメタデータ
   * @returns 新しいContentインスタンス
   */
  updateMetadata(metadata: ContentMetadata): Result<Content, DomainError>;
}

/**
 * Contentを作成するための入力パラメータ
 */
export interface ContentParams {
  id: string;
  userId: string;
  repositoryId: string;
  path: string;
  title: string;
  body: string;
  metadata: ContentMetadata;
  versions: Version[];
  visibility: ContentVisibility;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * コンテンツ作成エラー
 */
export class ContentCreationError extends DomainError {
  constructor(message: string) {
    super(`コンテンツの作成に失敗しました: ${message}`);
  }
}

/**
 * Contentを作成する
 * @param params Contentのパラメータ
 * @returns 不変なContentオブジェクトを含むResult、またはエラー
 */
export function createContent(params: ContentParams): Result<Content, DomainError> {
  // Zodスキーマを使用してバリデーション
  const validationResult = contentSchema.safeParse(params);
  
  if (!validationResult.success) {
    return err(new ContentCreationError(validationResult.error.message));
  }

  const content: Content = {
    id: params.id,
    userId: params.userId,
    repositoryId: params.repositoryId,
    path: params.path,
    title: params.title,
    body: params.body,
    metadata: params.metadata,
    versions: [...params.versions],
    visibility: params.visibility,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,

    addVersion(version: Version): Result<Content, DomainError> {
      return createContent({
        ...this,
        versions: [...this.versions, version],
        updatedAt: new Date()
      });
    },

    changeVisibility(visibility: ContentVisibility): Result<Content, DomainError> {
      // 公開範囲のバリデーション
      const validationResult = contentVisibilitySchema.safeParse(visibility);
      if (!validationResult.success) {
        return err(new ContentCreationError(`無効な公開範囲です: ${validationResult.error.message}`));
      }
      
      return createContent({
        ...this,
        visibility,
        updatedAt: new Date()
      });
    },

    updateMetadata(metadata: ContentMetadata): Result<Content, DomainError> {
      return createContent({
        ...this,
        metadata,
        updatedAt: new Date()
      });
    }
  };

  return ok(Object.freeze(content));
} 