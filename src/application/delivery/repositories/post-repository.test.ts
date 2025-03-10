/**
 * ポストリポジトリインターフェースのテスト
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { PostRepository, TransactionContext } from "./mod.ts";
import { PostAggregate } from "../../../core/delivery/mod.ts";
import { Result, ok } from "npm:neverthrow";
import { DomainError } from "../../../core/errors/mod.ts";

describe("PostRepository", () => {
  it("インターフェースが正しく定義されていること", () => {
    // このテストは型チェックのみを行うため、実際の実行は行いません
    // TypeScriptのコンパイル時に型エラーがなければ成功とみなします
    
    // モックリポジトリの型定義
    const mockRepository: PostRepository = {
      findById: (id: string) => Promise.resolve(null),
      findByContentId: (contentId: string) => Promise.resolve(null),
      findByUserId: (userId: string, options) => Promise.resolve([]),
      save: (postAggregate: PostAggregate) => Promise.resolve(postAggregate),
      saveWithTransaction: (postAggregate: PostAggregate, context: TransactionContext): Promise<Result<PostAggregate, DomainError>> => Promise.resolve(ok(postAggregate)),
      delete: (id: string) => Promise.resolve(true),
      deleteWithTransaction: (id: string, context: TransactionContext): Promise<Result<boolean, DomainError>> => Promise.resolve(ok(true))
    };

    // 型チェックが通ればOK
    expect(mockRepository).toBeDefined();
  });
}); 