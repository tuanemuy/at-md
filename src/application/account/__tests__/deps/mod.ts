/**
 * accountドメイン用のテスト依存関係をエクスポートするモジュール
 */

// 外部依存関係
import { Result, ok, err } from "npm:neverthrow";
import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { spy } from "@std/testing/mock";

// 内部依存関係 - コアドメイン
import { DomainError } from "../../../../core/errors/base.ts";
import { ApplicationError } from "../../../../core/errors/base.ts";
import { InfrastructureError } from "../../../../core/errors/base.ts";
import { ValidationError, EntityNotFoundError } from "../../../../core/errors/application.ts";

// ユーザー関連
import { UserAggregate, createUserAggregate } from "../../../../core/account/aggregates/user-aggregate.ts";
import type { User } from "../../../../core/account/entities/user.ts";
import type { UserRepository } from "../../../../application/account/repositories/user-repository.ts";
import { Email, Username, AtIdentifier } from "../../../../core/account/value-objects/mod.ts";

// クエリ
import { GetUserByIdQuery, GetUserByIdQueryHandler } from "../../../../application/account/queries/get-user-by-id-query.ts";
import { GetUserByUsernameQuery, GetUserByUsernameQueryHandler } from "../../../../application/account/queries/get-user-by-username-query.ts";
import { GetUserByEmailQuery, GetUserByEmailQueryHandler } from "../../../../application/account/queries/get-user-by-email-query.ts";

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
  spy,
  
  // 内部依存関係 - コアドメイン
  DomainError,
  ApplicationError,
  InfrastructureError,
  ValidationError,
  EntityNotFoundError,
  
  // ユーザー関連
  UserAggregate,
  createUserAggregate,
  Email,
  Username,
  AtIdentifier,
  
  // クエリ
  GetUserByIdQuery,
  GetUserByIdQueryHandler,
  GetUserByUsernameQuery,
  GetUserByUsernameQueryHandler,
  GetUserByEmailQuery,
  GetUserByEmailQueryHandler
};

// 型のエクスポート
export type {
  // ユーザー関連
  User,
  UserRepository
}; 