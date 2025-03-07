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
 * ContentMetadataを作成する
 * @param params ContentMetadataのパラメータ
 * @returns 不変なContentMetadataオブジェクト
 * @throws 言語が空文字列の場合はエラー
 */
export function createContentMetadata(params: ContentMetadataParams): ContentMetadata {
  if (!params.language) {
    throw new Error("言語は必須です");
  }

  return Object.freeze({
    tags: [...params.tags],
    categories: [...params.categories],
    publishedAt: params.publishedAt,
    lastPublishedAt: params.lastPublishedAt,
    excerpt: params.excerpt,
    featuredImage: params.featuredImage,
    language: params.language,
    readingTime: params.readingTime,
  });
} 