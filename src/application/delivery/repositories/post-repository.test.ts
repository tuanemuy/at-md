/**
 * ポストリポジトリインターフェースのテスト
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { PostRepository } from "./post-repository.ts";
import { PostAggregate } from "../../../core/delivery/aggregates/post-aggregate.ts";

describe("PostRepository", () => {
  it("インターフェースが正しく定義されていること", () => {
    // このテストは型チェックのみを行うため、実際の実行は行いません
    // TypeScriptのコンパイル時に型エラーがなければ成功とみなします
    
    // モックリポジトリの型定義
    const mockRepository: PostRepository = {
      findById: async (id: string) => null,
      findByContentId: async (contentId: string) => null,
      findByUserId: async (userId: string, options) => [],
      save: async (postAggregate: PostAggregate) => postAggregate,
      delete: async (id: string) => true
    };
    
    // 型チェックが通ることを確認
    expect(typeof mockRepository.findById).toBe("function");
    expect(typeof mockRepository.findByContentId).toBe("function");
    expect(typeof mockRepository.findByUserId).toBe("function");
    expect(typeof mockRepository.save).toBe("function");
    expect(typeof mockRepository.delete).toBe("function");
  });
}); 