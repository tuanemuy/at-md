import { ContentMetadata } from "../value-objects/content-metadata.ts";
import { Version } from "../value-objects/version.ts";

/**
 * コンテンツの状態を表す型
 */
export type ContentStatus = "draft" | "published" | "archived";

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
  /** ステータス */
  readonly status: ContentStatus;
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
   * ステータスを変更する
   * @param status 新しいステータス
   * @returns 新しいContentインスタンス
   */
  changeStatus(status: ContentStatus): Content;

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
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contentを作成する
 * @param params Contentのパラメータ
 * @returns 不変なContentオブジェクト
 * @throws IDが空、または無効なステータスの場合はエラー
 */
export function createContent(params: ContentParams): Content {
  if (!params.id) {
    throw new Error("コンテンツIDは必須です");
  }

  const validStatuses: ContentStatus[] = ["draft", "published", "archived"];
  if (!validStatuses.includes(params.status)) {
    throw new Error("無効なステータスです");
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
    status: params.status,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,

    addVersion(version: Version): Content {
      return createContent({
        ...this,
        versions: [...this.versions, version],
        updatedAt: new Date()
      });
    },

    changeStatus(status: ContentStatus): Content {
      return createContent({
        ...this,
        status,
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