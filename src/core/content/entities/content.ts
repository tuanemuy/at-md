import { ContentMetadata } from "../value-objects/content-metadata.ts";
import { Version } from "../value-objects/version.ts";

/**
 * コンテンツの公開範囲を表す型
 */
export type ContentVisibility = "private" | "unlisted" | "public";

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
 * Contentを作成する
 * @param params Contentのパラメータ
 * @returns 不変なContentオブジェクト
 * @throws IDが空、または無効な公開範囲の場合はエラー
 */
export function createContent(params: ContentParams): Content {
  if (!params.id) {
    throw new Error("コンテンツIDは必須です");
  }

  const validVisibilities: ContentVisibility[] = ["private", "unlisted", "public"];
  if (!validVisibilities.includes(params.visibility)) {
    throw new Error("無効な公開範囲です");
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

    addVersion(version: Version): Content {
      return createContent({
        ...this,
        versions: [...this.versions, version],
        updatedAt: new Date()
      });
    },

    changeVisibility(visibility: ContentVisibility): Content {
      return createContent({
        ...this,
        visibility,
        updatedAt: new Date()
      });
    },

    updateMetadata(metadata: ContentMetadata): Content {
      return createContent({
        ...this,
        metadata,
        updatedAt: new Date()
      });
    }
  };

  return Object.freeze(content);
} 