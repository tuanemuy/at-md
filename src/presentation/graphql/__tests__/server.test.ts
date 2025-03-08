/**
 * GraphQLサーバーのテスト
 * 
 * GraphQLサーバーが正しく動作するかテストします。
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createGraphQLServer } from "../server.ts";
import { mockQueryHandlers, mockCommandHandlers } from "./mocks/handlers.ts";

describe("GraphQLサーバーのテスト", () => {
  it("GraphQLサーバーが正しく作成できること", () => {
    const yoga = createGraphQLServer(mockQueryHandlers, mockCommandHandlers);
    
    expect(yoga).toBeDefined();
    expect(typeof yoga.fetch).toBe("function");
  });
}); 