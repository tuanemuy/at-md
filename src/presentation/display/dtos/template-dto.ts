import { ViewTemplate, TemplateComponent, TemplateLayout } from "../../../core/display/entities/view-template.ts";

/**
 * テンプレートコンポーネントのDTO
 */
export type TemplateComponentDto = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

/**
 * テンプレートのDTO
 */
export type TemplateDto = {
  id: string;
  name: string;
  description?: string;
  layout: string;
  components: TemplateComponentDto[];
  createdAt: string;
  updatedAt: string;
};

/**
 * テンプレートエンティティをDTOに変換する
 * 
 * @param template テンプレートエンティティ
 * @returns テンプレートDTO
 */
export function toTemplateDto(template: ViewTemplate): TemplateDto {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    layout: template.layout,
    components: template.components.map(component => ({
      id: component.id,
      type: component.type,
      props: component.props,
    })),
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
} 