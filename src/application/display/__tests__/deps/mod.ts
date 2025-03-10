/**
 * displayドメイン用のテスト依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";
import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";

// 内部依存関係 - コアドメイン
import { DomainError } from "../../../../core/errors/base.ts";
import { ApplicationError } from "../../../../core/errors/base.ts";
import { InfrastructureError } from "../../../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../../../core/errors/application.ts";

// ページ関連
import { PageAggregate } from "../../../../core/display/aggregates/page-aggregate.ts";
import type { Page } from "../../../../core/display/entities/page.ts";
import { PageMetadata } from "../../../../core/display/value-objects/page-metadata.ts";
import { RenderingOptions } from "../../../../core/display/value-objects/rendering-options.ts";
import type { PageRepository } from "../../../../application/display/repositories/page-repository.ts";

// テンプレート関連
import { ViewTemplate } from "../../../../core/display/entities/view-template.ts";
import type { TemplateLayout, TemplateComponent } from "../../../../core/display/entities/view-template.ts";
import type { TemplateRepository } from "../../../../application/display/repositories/template-repository.ts";

// 値のエクスポート
export {
  // 外部依存関係
  Result,
  ok,
  err,
  expect,
  describe,
  it,
  beforeEach,
  afterEach,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  ApplicationError,
  InfrastructureError,
  ValidationError,
  EntityNotFoundError,
  
  // ページ関連
  PageAggregate,
  PageMetadata,
  RenderingOptions,
  
  // テンプレート関連
  ViewTemplate
};

// 型のエクスポート
export type {
  // ページ関連
  Page,
  PageRepository,
  
  // テンプレート関連
  TemplateLayout,
  TemplateComponent,
  TemplateRepository
}; 