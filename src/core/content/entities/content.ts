import { ContentMetadata } from "../value-objects/content-metadata.ts";
import { Version } from "../value-objects/version.ts";
import { 
  contentSchema, 
  ContentSchema, 
  contentVisibilitySchema,
  CreateContentParamsSchema
} from "../schemas/content-schemas.ts";
import { Result, ok, err } from "../deps.ts";
import { DomainError } from "../../errors/base.ts";
import { generateId } from "../../common/id.ts";

/**
 * ドメインバリデーションエラー
 * Zodによるバリデーションエラーを扱うためのエラークラス
 */
export class DomainValidationError extends DomainError {
  readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "DomainValidationError";
    this.details = details;
  }
}

/**
 * コンテンツIDの型
 * 文字列リテラル型を使用して型安全性を向上
 */
export type ContentId = string & { readonly __brand: unique symbol };

/**
 * コンテンツの公開範囲を表す型
 * 文字列リテラル型を使用して型安全性を向上
 */
export type ContentVisibility = "private" | "unlisted" | "public";

/**
 * コンテンツエンティティを表すインターフェース
 */
export interface Content {
  /** コンテンツID */
  readonly id: ContentId;
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
  addVersion(version: Version): Content;

  /**
   * 公開範囲を変更する
   * @param visibility 新しい公開範囲
   * @returns 新しいContentインスタンス
   */
  changeVisibility(visibility: ContentVisibility): Content;

  /**
   * メタデータを更新する
   * @param metadata 新しいメタデータ
   * @returns 新しいContentインスタンス
   */
  updateMetadata(metadata: ContentMetadata): Content;
}

/**
 * コンテンツエンティティのパラメータ
 */
export type ContentParams = {
  id: ContentId;
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
};

/**
 * 文字列をContentId型に変換する
 * @param id 文字列ID
 * @returns ContentId型のID
 */
export function createContentId(id: string): Result<ContentId, DomainValidationError> {
  if (!id || id.trim() === "") {
    return err(new DomainValidationError("コンテンツIDは空にできません"));
  }
  return ok(id as ContentId);
}

/**
 * 新しいContentIdを生成する
 * @returns ContentId型のID
 */
export function generateContentId(): Result<ContentId, DomainValidationError> {
  const id = generateId();
  return createContentId(id);
}

/**
 * コンテンツエンティティを作成する
 * @param params コンテンツパラメータ
 * @returns コンテンツエンティティ
 */
export function createContent(params: ContentParams): Result<Content, DomainValidationError> {
  // 基本的なバリデーション
  if (!params.id) {
    return err(new DomainValidationError("コンテンツIDは必須です"));
  }

  const validVisibilities: ContentVisibility[] = ["private", "unlisted", "public"];
  if (!validVisibilities.includes(params.visibility)) {
    return err(new DomainValidationError("無効な公開範囲です"));
  }

  // コンテンツエンティティの実装
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

    addVersion(version: Version): Content {
      const result = createContent({
        ...this,
        versions: [...this.versions, version],
        updatedAt: new Date()
      });
      
      if (result.isErr()) {
        throw result.error;
      }
      
      return result.value;
    },

    changeVisibility(visibility: ContentVisibility): Content {
      // 公開範囲のバリデーション
      if (!validVisibilities.includes(visibility)) {
        throw new DomainValidationError("無効な公開範囲です");
      }

      const result = createContent({
        ...this,
        visibility,
        updatedAt: new Date()
      });
      
      if (result.isErr()) {
        throw result.error;
      }
      
      return result.value;
    },

    updateMetadata(metadata: ContentMetadata): Content {
      const result = createContent({
        ...this,
        metadata,
        updatedAt: new Date()
      });
      
      if (result.isErr()) {
        throw result.error;
      }
      
      return result.value;
    }
  };

  return ok(content);
}

/**
 * コンテンツエンティティを検証する
 * @param content 検証対象のコンテンツ
 * @returns 検証結果
 */
export function validateContent(content: unknown): Result<Content, DomainValidationError> {
  if (typeof content !== 'object' || content === null) {
    return err(new DomainValidationError("コンテンツの検証に失敗しました: オブジェクトではありません"));
  }
  
  // 必須プロパティの存在チェック
  const requiredProps = ['id', 'userId', 'repositoryId', 'path', 'title', 'body', 'metadata', 'versions', 'visibility', 'createdAt', 'updatedAt'];
  for (const prop of requiredProps) {
    if (!(prop in content)) {
      return err(new DomainValidationError(`コンテンツの検証に失敗しました: ${prop}プロパティがありません`));
    }
  }
  
  // Content型として扱う
  const contentObj = content as Content;
  
  // 公開範囲のバリデーション
  const validVisibilities: ContentVisibility[] = ["private", "unlisted", "public"];
  if (!validVisibilities.includes(contentObj.visibility)) {
    return err(new DomainValidationError("無効な公開範囲です"));
  }
  
  return ok(contentObj);
} 