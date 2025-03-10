/**
 * フィードリポジトリインターフェースのテスト
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { FeedRepository, TransactionContext } from "./mod.ts";
import { FeedAggregate } from "../../../core/delivery/mod.ts";
import { Result, ok } from "npm:neverthrow";
import { DomainError } from "../../../core/errors/mod.ts";

describe("FeedRepository", () => {
  it("インターフェースが正しく定義されていること", () => {
    // このテストは型チェックのみを行うため、実際の実行は行いません
    // TypeScriptのコンパイル時に型エラーがなければ成功とみなします
    
    // モックリポジトリの型定義
    const mockRepository: FeedRepository = {
      findById: (id: string) => Promise.resolve(null),
      findByUserId: (userId: string, options?: {
        limit?: number;
        offset?: number;
      }) => Promise.resolve([]),
      findByName: (userId: string, name: string) => Promise.resolve(null),
      save: (feedAggregate: FeedAggregate) => Promise.resolve(feedAggregate),
      saveWithTransaction: (feedAggregate: FeedAggregate, context: TransactionContext): Promise<Result<FeedAggregate, DomainError>> => Promise.resolve(ok(feedAggregate)),
      delete: (id: string) => Promise.resolve(true),
      deleteWithTransaction: (id: string, context: TransactionContext): Promise<Result<boolean, DomainError>> => Promise.resolve(ok(true))
    };

    // 型チェックが通ればOK
    expect(mockRepository).toBeDefined();
  });
}); 