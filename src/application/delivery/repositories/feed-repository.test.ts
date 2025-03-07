/**
 * フィードリポジトリインターフェースのテスト
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { FeedRepository } from "./feed-repository.ts";
import { FeedAggregate } from "../../../core/delivery/aggregates/feed-aggregate.ts";

describe("FeedRepository", () => {
  it("インターフェースが正しく定義されていること", () => {
    // このテストは型チェックのみを行うため、実際の実行は行いません
    // TypeScriptのコンパイル時に型エラーがなければ成功とみなします
    
    // モックリポジトリの型定義
    const mockRepository: FeedRepository = {
      findById: async (id: string) => null,
      findByUserId: async (userId: string, options?: {
        limit?: number;
        offset?: number;
      }) => [],
      findByName: async (userId: string, name: string) => null,
      save: async (feedAggregate: FeedAggregate) => feedAggregate,
      delete: async (id: string) => true
    };
    
    // 型チェックが通ることを確認
    expect(typeof mockRepository.findById).toBe("function");
    expect(typeof mockRepository.findByUserId).toBe("function");
    expect(typeof mockRepository.findByName).toBe("function");
    expect(typeof mockRepository.save).toBe("function");
    expect(typeof mockRepository.delete).toBe("function");
  });
}); 