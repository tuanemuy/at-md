import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { AtProtocolError } from "../atproto-adapter.ts";

describe("AtProtocolError", () => {
  it("正しい名前とメッセージでエラーを作成できること", () => {
    const error = new AtProtocolError("Test error message");
    
    expect(error.name).toBe("AtProtocolError");
    expect(error.message).toBe("Test error message");
    expect(error.cause).toBeUndefined();
  });

  it("原因となるエラーを含めて作成できること", () => {
    const cause = new Error("Original error");
    const error = new AtProtocolError("Test error message", cause);
    
    expect(error.name).toBe("AtProtocolError");
    expect(error.message).toBe("Test error message");
    expect(error.cause).toBe(cause);
  });
}); 