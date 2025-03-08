/**
 * ページのメタデータを表す値オブジェクト
 * 
 * 説明、OGイメージ、キーワード、正規URL、公開日時、更新日時などのプロパティを持つ
 * すべてのプロパティはオプショナル
 */
export class PageMetadata {
  readonly description?: string;
  readonly ogImage?: string;
  readonly keywords?: string[];
  readonly canonicalUrl?: string;
  readonly publishedAt?: Date;
  readonly updatedAt?: Date;

  /**
   * PageMetadataを作成する
   * 
   * @param params ページメタデータのパラメータ
   */
  constructor(params: {
    description?: string;
    ogImage?: string;
    keywords?: string[];
    canonicalUrl?: string;
    publishedAt?: Date;
    updatedAt?: Date;
  }) {
    this.description = params.description;
    this.ogImage = params.ogImage;
    this.keywords = params.keywords ? [...params.keywords] : undefined;
    this.canonicalUrl = params.canonicalUrl;
    this.publishedAt = params.publishedAt;
    this.updatedAt = params.updatedAt;

    // キーワード配列を凍結
    if (this.keywords) {
      Object.freeze(this.keywords);
    }

    // 不変性を保証するためにオブジェクトをフリーズする
    Object.freeze(this);
  }

  /**
   * 新しいメタデータで更新したPageMetadataを返す
   * 
   * @param params 更新するパラメータ
   * @returns 更新されたPageMetadata
   */
  update(params: {
    description?: string;
    ogImage?: string;
    keywords?: string[];
    canonicalUrl?: string;
    publishedAt?: Date;
    updatedAt?: Date;
  }): PageMetadata {
    return new PageMetadata({
      description: params.description ?? this.description,
      ogImage: params.ogImage ?? this.ogImage,
      keywords: params.keywords ?? this.keywords,
      canonicalUrl: params.canonicalUrl ?? this.canonicalUrl,
      publishedAt: params.publishedAt ?? this.publishedAt,
      updatedAt: params.updatedAt ?? this.updatedAt,
    });
  }

  /**
   * 値オブジェクトの等価性を比較する
   * 
   * @param other 比較対象のPageMetadata
   * @returns 等しい場合はtrue、そうでない場合はfalse
   */
  equals(other: PageMetadata): boolean {
    if (this.description !== other.description) return false;
    if (this.ogImage !== other.ogImage) return false;
    if (this.canonicalUrl !== other.canonicalUrl) return false;
    
    // 日付の比較
    if (this.publishedAt?.getTime() !== other.publishedAt?.getTime()) return false;
    if (this.updatedAt?.getTime() !== other.updatedAt?.getTime()) return false;
    
    // キーワードの比較
    if (!this.keywords && other.keywords) return false;
    if (this.keywords && !other.keywords) return false;
    if (this.keywords && other.keywords) {
      if (this.keywords.length !== other.keywords.length) return false;
      return this.keywords.every((keyword, index) => keyword === other.keywords![index]);
    }
    
    return true;
  }
} 