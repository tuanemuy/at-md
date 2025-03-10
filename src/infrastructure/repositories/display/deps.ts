/**
 * 表示リポジトリの依存関係
 * 表示リポジトリで使用する依存関係をエクスポートします。
 */

// 外部依存関係
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// 内部依存関係 - コアドメイン
import { Result, ok, err } from "npm:neverthrow";
import { InfrastructureError, DomainError } from "../../../core/errors/base.ts";

// ページ関連
import type { PageRepository } from "../../../application/display/repositories/page-repository.ts";
import type { PageRepositoryError } from "../../../core/display/repositories/page-repository.ts";
import { PageAggregate } from "../../../core/display/aggregates/page-aggregate.ts";
import { Page } from "../../../core/display/entities/page.ts";
import { PageMetadata } from "../../../core/display/value-objects/page-metadata.ts";
import { RenderingOptions } from "../../../core/display/value-objects/rendering-options.ts";

// テンプレート関連
import type { TemplateRepository } from "../../../application/display/repositories/template-repository.ts";
import type { TemplateRepositoryError } from "../../../application/display/repositories/template-repository.ts";
import { ViewTemplate } from "../../../core/display/entities/view-template.ts";
import type { TemplateLayout, TemplateComponent } from "../../../core/display/entities/view-template.ts";

// データベース関連
import type { TransactionContext } from "../../../core/display/repositories/transaction-context.ts";
import { PostgresTransactionContext } from "../../database/postgres-unit-of-work.ts";
import { db } from "../../database/db.ts";
import { pages, templates } from "../../database/schema/display.ts";

// PageRepositoryErrorの実装クラス
class PageRepositoryErrorImpl extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "PageRepositoryError";
  }
}

// TemplateRepositoryErrorの実装クラス
class TemplateRepositoryErrorImpl extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "TemplateRepositoryError";
  }
}

// エクスポート
export {
  // 外部依存関係
  eq,
  
  // 内部依存関係 - コアドメイン
  Result,
  ok,
  err,
  InfrastructureError,
  
  // ページ関連
  PageRepositoryErrorImpl as PageRepositoryError,
  PageAggregate,
  Page,
  PageMetadata,
  RenderingOptions,
  
  // テンプレート関連
  TemplateRepositoryErrorImpl as TemplateRepositoryError,
  ViewTemplate,
  
  // データベース関連
  PostgresTransactionContext,
  db,
  pages,
  templates
};

export type {
  // 外部依存関係
  NodePgDatabase,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  
  // ページ関連
  PageRepository,
  
  // テンプレート関連
  TemplateRepository,
  TemplateLayout,
  TemplateComponent,
  
  // データベース関連
  TransactionContext
}; 