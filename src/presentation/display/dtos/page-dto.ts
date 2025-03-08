import { Page } from "../../../core/display/entities/page.ts";

/**
 * ページメタデータのDTO
 */
export type PageMetadataDto = {
  description?: string;
  ogImage?: string;
  keywords?: string[];
  canonicalUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
};

/**
 * ページのDTO
 */
export type PageDto = {
  id: string;
  contentId: string;
  slug: string;
  title: string;
  content: string;
  templateId: string;
  metadata: PageMetadataDto;
  createdAt: string;
  updatedAt: string;
};

/**
 * ページエンティティをDTOに変換する
 * 
 * @param page ページエンティティ
 * @returns ページDTO
 */
export function toPageDto(page: Page): PageDto {
  return {
    id: page.id,
    contentId: page.contentId,
    slug: page.slug,
    title: page.title,
    content: page.content,
    templateId: page.templateId,
    metadata: {
      description: page.metadata.description,
      ogImage: page.metadata.ogImage,
      keywords: page.metadata.keywords,
      canonicalUrl: page.metadata.canonicalUrl,
      publishedAt: page.metadata.publishedAt?.toISOString(),
      updatedAt: page.metadata.updatedAt?.toISOString(),
    },
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
} 