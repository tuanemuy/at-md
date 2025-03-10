/**
 * テンプレートDTOの定義
 */

import type { ViewTemplate, TemplateLayout, TemplateComponent } from "./deps.ts";

/**
 * テンプレートDTOのインターフェース
 */
export interface TemplateDto {
  id: string;
  name: string;
  description?: string;
  content?: string;
  metadata?: {
    layout?: string;
    components?: Array<{
      id: string;
      type: string;
      props: Record<string, unknown>;
    }>;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * テンプレートエンティティからDTOに変換する
 * @param template テンプレートエンティティ
 * @returns テンプレートDTO
 */
export function toTemplateDto(template: ViewTemplate): TemplateDto {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    metadata: {
      layout: template.layout,
      components: template.components
    },
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString()
  };
} 