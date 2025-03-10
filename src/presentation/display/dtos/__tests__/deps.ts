/**
 * DTOのテストファイル用の依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";

// 内部依存関係 - コアドメイン
import { DomainError, ApplicationError } from "../../../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../../../core/errors/application.ts";

// 表示関連のエンティティとバリューオブジェクト
import { Page } from "../../../../core/display/entities/page.ts";
import { ViewTemplate } from "../../../../core/display/entities/view-template.ts";
import type { TemplateLayout, TemplateComponent } from "../../../../core/display/entities/view-template.ts";
import { PageMetadata } from "../../../../core/display/value-objects/page-metadata.ts";
import { PageAggregate } from "../../../../core/display/aggregates/page-aggregate.ts";

// 値のエクスポート
export {
  // 外部依存関係
  Result,
  ok,
  err,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  ApplicationError,
  ValidationError,
  EntityNotFoundError,
  
  // 表示関連のエンティティとバリューオブジェクト
  Page,
  ViewTemplate,
  PageMetadata,
  PageAggregate
};

// 型のエクスポート
export type {
  TemplateLayout,
  TemplateComponent
}; 