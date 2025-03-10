import { Result, ok, err } from "../deps.ts";
import { DomainValidationError } from "../entities/content.ts";

/**
 * タグの型
 * 文字列リテラル型を使用して型安全性を向上
 */
export type Tag = string & { readonly __brand: unique symbol };

/**
 * カテゴリの型
 * 文字列リテラル型を使用して型安全性を向上
 */
export type Category = string & { readonly __brand: unique symbol };

/**
 * 言語コードの型
 * 文字列リテラル型を使用して型安全性を向上
 */
export type LanguageCode = string & { readonly __brand: unique symbol };

/**
 * コンテンツのメタデータを表す値オブジェクト
 */
export interface ContentMetadata {
  /** タグのリスト */
  readonly tags: Tag[];
  /** カテゴリのリスト */
  readonly categories: Category[];
  /** 公開日時 */
  readonly publishedAt?: Date;
  /** 最終公開日時 */
  readonly lastPublishedAt?: Date;
  /** 抜粋 */
  readonly excerpt?: string;
  /** アイキャッチ画像のURL */
  readonly featuredImage?: string;
  /** 言語コード（例: 'ja', 'en'） */
  readonly language: LanguageCode;
  /** 読了時間（分） */
  readonly readingTime?: number;
}

/**
 * ContentMetadataを作成するための入力パラメータ
 */
export interface ContentMetadataParams {
  tags: string[] | Tag[];
  categories: string[] | Category[];
  publishedAt?: Date;
  lastPublishedAt?: Date;
  excerpt?: string;
  featuredImage?: string;
  language: string | LanguageCode;
  readingTime?: number;
}

/**
 * 文字列をTag型に変換する
 * @param tag 文字列タグ
 * @returns Tag型のタグ
 */
export function createTag(tag: string): Result<Tag, DomainValidationError> {
  if (!tag || tag.trim() === "") {
    return err(new DomainValidationError("タグは空にできません"));
  }
  return ok(tag as Tag);
}

/**
 * 文字列をCategory型に変換する
 * @param category 文字列カテゴリ
 * @returns Category型のカテゴリ
 */
export function createCategory(category: string): Result<Category, DomainValidationError> {
  if (!category || category.trim() === "") {
    return err(new DomainValidationError("カテゴリは空にできません"));
  }
  return ok(category as Category);
}

/**
 * 文字列をLanguageCode型に変換する
 * @param language 文字列言語コード
 * @returns LanguageCode型の言語コード
 */
export function createLanguageCode(language: string): Result<LanguageCode, DomainValidationError> {
  if (!language || language.trim() === "") {
    return err(new DomainValidationError("言語コードは空にできません"));
  }
  
  // 言語コードの形式チェック（例: 'ja', 'en'）
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(language)) {
    return err(new DomainValidationError("言語コードの形式が不正です"));
  }
  
  return ok(language as LanguageCode);
}

/**
 * ContentMetadataを作成する
 * @param params ContentMetadataのパラメータ
 * @returns 不変なContentMetadataオブジェクト
 */
export function createContentMetadata(params: ContentMetadataParams): ContentMetadata {
  // タグをTag型に変換
  const tags: Tag[] = params.tags.map(tag => {
    if (!tag) {
      throw new Error("タグは空にできません");
    }
    // 型変換
    return tag as Tag;
  });

  // カテゴリをCategory型に変換
  const categories: Category[] = params.categories.map(category => {
    if (!category) {
      throw new Error("カテゴリは空にできません");
    }
    // 型変換
    return category as Category;
  });

  // 言語コードをLanguageCode型に変換
  if (!params.language) {
    throw new Error("言語コードは必須です");
  }
  
  // 型変換
  const language = params.language as LanguageCode;

  const metadata: ContentMetadata = {
    tags,
    categories,
    publishedAt: params.publishedAt,
    lastPublishedAt: params.lastPublishedAt,
    excerpt: params.excerpt,
    featuredImage: params.featuredImage,
    language,
    readingTime: params.readingTime
  };

  return Object.freeze(metadata);
} 