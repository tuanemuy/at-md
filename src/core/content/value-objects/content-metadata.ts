import { Result, err, ok } from "../deps.ts";
import { DomainError } from "../../errors/base.ts";
import { contentMetadataSchema } from "../schemas/content-schemas.ts";

/**
 * コンテンツのメタデータを表す値オブジェクト
 */
export interface ContentMetadata {
  /** タグのリスト */
  readonly tags: string[];
  /** カテゴリのリスト */
  readonly categories: string[];
  /** 公開日時 */
  readonly publishedAt?: Date;
  /** 最終公開日時 */
  readonly lastPublishedAt?: Date;
  /** 抜粋 */
  readonly excerpt?: string;
  /** アイキャッチ画像のURL */
  readonly featuredImage?: string;
  /** 言語コード（例: 'ja', 'en'） */
  readonly language: string;
  /** 読了時間（分） */
  readonly readingTime?: number;
}

/**
 * ContentMetadataを作成するための入力パラメータ
 */
export interface ContentMetadataParams {
  tags: string[];
  categories: string[];
  publishedAt?: Date;
  lastPublishedAt?: Date;
  excerpt?: string;
  featuredImage?: string;
  language: string;
  readingTime?: number;
}

/**
 * メタデータ作成エラー
 */
export class MetadataCreationError extends DomainError {
  constructor(message: string) {
    super(`メタデータの作成に失敗しました: ${message}`);
  }
}

/**
 * ContentMetadataを作成する
 * @param params ContentMetadataのパラメータ
 * @returns 不変なContentMetadataオブジェクトを含むResult、またはエラー
 */
export function createContentMetadata(params: ContentMetadataParams): Result<ContentMetadata, DomainError> {
  // Zodスキーマを使用してバリデーション
  const validationResult = contentMetadataSchema.safeParse(params);
  
  if (!validationResult.success) {
    return err(new MetadataCreationError(validationResult.error.message));
  }

  const metadata: ContentMetadata = {
    tags: [...params.tags],
    categories: [...params.categories],
    publishedAt: params.publishedAt,
    lastPublishedAt: params.lastPublishedAt,
    excerpt: params.excerpt,
    featuredImage: params.featuredImage,
    language: params.language,
    readingTime: params.readingTime,
  };

  return ok(Object.freeze(metadata));
} 