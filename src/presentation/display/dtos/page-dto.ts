/**
 * ページDTOの定義
 */

import { Page, PageMetadata } from "./deps.ts";

/**
 * ページDTOのインターフェース
 */
export interface PageDto {
  id: string;
  slug: string;
  title: string;
  description?: string;
  contentId?: string;
  templateId?: string;
  metadata?: {
    description?: string;
    ogImage?: string;
    keywords?: string[];
    canonicalUrl?: string;
    publishedAt?: string;
    updatedAt?: string;
    content?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * ページエンティティからDTOに変換する
 * @param page ページエンティティ
 * @returns ページDTO
 */
export function toPageDto(page: Page): PageDto {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    contentId: page.contentId,
    templateId: page.templateId,
    metadata: {
      description: page.metadata?.description,
      ogImage: page.metadata?.ogImage,
      keywords: page.metadata?.keywords,
      canonicalUrl: page.metadata?.canonicalUrl,
      publishedAt: page.metadata?.publishedAt?.toISOString(),
      updatedAt: page.metadata?.updatedAt?.toISOString(),
      content: page.content
    },
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString()
  };
}

/**
 * ページDTOからページメタデータを作成する
 * @param dto ページDTO
 * @returns ページメタデータ
 */
export function createPageMetadataFromDto(dto: Partial<PageDto>): PageMetadata {
  return new PageMetadata({
    description: dto.metadata?.description,
    ogImage: dto.metadata?.ogImage,
    keywords: dto.metadata?.keywords,
    canonicalUrl: dto.metadata?.canonicalUrl,
    publishedAt: dto.metadata?.publishedAt ? new Date(dto.metadata.publishedAt) : undefined,
    updatedAt: dto.metadata?.updatedAt ? new Date(dto.metadata.updatedAt) : undefined
  });
} 