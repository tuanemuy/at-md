import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { PresentationError } from "./base.ts";
import {
  InvalidInputError,
  ResourceNotFoundError,
  UnauthenticatedError
} from "./presentation.ts";

describe("プレゼンテーションエラー", () => {
  it("正しい名前とメッセージでInvalidInputErrorを作成すること", () => {
    // 期待する結果
    const field = "username";
    const reason = "Must be at least 3 characters";
    const expectedMessage = `Invalid input for field '${field}': ${reason}`;
    
    // 操作
    const error = new InvalidInputError(field, reason);
    
    // アサーション
    expect(error).toBeInstanceOf(PresentationError);
    expect(error).toBeInstanceOf(InvalidInputError);
    expect(error.name).toBe("InvalidInputError");
    expect(error.message).toBe(expectedMessage);
  });
  
  it("正しい名前とメッセージでResourceNotFoundErrorを作成すること", () => {
    // 期待する結果
    const resource = "Post";
    const id = "123";
    const expectedMessage = `${resource} with id ${id} not found`;
    
    // 操作
    const error = new ResourceNotFoundError(resource, id);
    
    // アサーション
    expect(error).toBeInstanceOf(PresentationError);
    expect(error).toBeInstanceOf(ResourceNotFoundError);
    expect(error.name).toBe("ResourceNotFoundError");
    expect(error.message).toBe(expectedMessage);
  });
  
  it("正しい名前とメッセージでUnauthenticatedErrorを作成すること", () => {
    // 期待する結果
    const expectedMessage = "Authentication required to access this resource";
    
    // 操作
    const error = new UnauthenticatedError();
    
    // アサーション
    expect(error).toBeInstanceOf(PresentationError);
    expect(error).toBeInstanceOf(UnauthenticatedError);
    expect(error.name).toBe("UnauthenticatedError");
    expect(error.message).toBe(expectedMessage);
  });
}); 