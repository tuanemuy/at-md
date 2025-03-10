/**
 * ページのメタデータを表す値オブジェクト
 * 
 * 説明、OGイメージ、キーワード、正規URL、公開日時、更新日時などのプロパティを持つ
 * すべてのプロパティはオプショナル
 */
export class PageMetadata {
  readonly description?: string;
  readonly ogImage?: string;
  readonly ogTitle?: string;
  readonly ogDescription?: string;
  readonly twitterCard?: string;
  readonly twitterImage?: string;
  readonly twitterTitle?: string;
  readonly twitterDescription?: string;
  readonly keywords?: string[];
  readonly canonicalUrl?: string;
  readonly publishedAt?: Date;
  readonly updatedAt?: Date;
  readonly noIndex?: boolean;
  readonly slug?: string;
  readonly title?: string;

  /**
   * PageMetadataを作成する
   * 
   * @param params ページメタデータのパラメータ
   */
  constructor(params: {
    description?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    twitterCard?: string;
    twitterImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
    publishedAt?: Date;
    updatedAt?: Date;
    noIndex?: boolean;
    slug?: string;
    title?: string;
  }) {
    this.description = params.description;
    this.ogImage = params.ogImage;
    this.ogTitle = params.ogTitle;
    this.ogDescription = params.ogDescription;
    this.twitterCard = params.twitterCard;
    this.twitterImage = params.twitterImage;
    this.twitterTitle = params.twitterTitle;
    this.twitterDescription = params.twitterDescription;
    this.keywords = params.keywords ? [...params.keywords] : undefined;
    this.canonicalUrl = params.canonicalUrl;
    this.publishedAt = params.publishedAt;
    this.updatedAt = params.updatedAt;
    this.noIndex = params.noIndex;
    this.slug = params.slug;
    this.title = params.title;

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
    ogTitle?: string;
    ogDescription?: string;
    twitterCard?: string;
    twitterImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
    publishedAt?: Date;
    updatedAt?: Date;
    noIndex?: boolean;
    slug?: string;
    title?: string;
  }): PageMetadata {
    return new PageMetadata({
      description: params.description ?? this.description,
      ogImage: params.ogImage ?? this.ogImage,
      ogTitle: params.ogTitle ?? this.ogTitle,
      ogDescription: params.ogDescription ?? this.ogDescription,
      twitterCard: params.twitterCard ?? this.twitterCard,
      twitterImage: params.twitterImage ?? this.twitterImage,
      twitterTitle: params.twitterTitle ?? this.twitterTitle,
      twitterDescription: params.twitterDescription ?? this.twitterDescription,
      keywords: params.keywords ?? this.keywords,
      canonicalUrl: params.canonicalUrl ?? this.canonicalUrl,
      publishedAt: params.publishedAt ?? this.publishedAt,
      updatedAt: params.updatedAt ?? this.updatedAt,
      noIndex: params.noIndex ?? this.noIndex,
      slug: params.slug ?? this.slug,
      title: params.title ?? this.title,
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
    if (this.ogTitle !== other.ogTitle) return false;
    if (this.ogDescription !== other.ogDescription) return false;
    if (this.twitterCard !== other.twitterCard) return false;
    if (this.twitterImage !== other.twitterImage) return false;
    if (this.twitterTitle !== other.twitterTitle) return false;
    if (this.twitterDescription !== other.twitterDescription) return false;
    if (this.canonicalUrl !== other.canonicalUrl) return false;
    if (this.noIndex !== other.noIndex) return false;
    if (this.slug !== other.slug) return false;
    if (this.title !== other.title) return false;
    
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