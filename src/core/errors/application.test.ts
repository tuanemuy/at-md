import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { ApplicationError } from "./base.ts";
import {
  EntityNotFoundError,
  AuthorizationError,
  ValidationError
} from "./application.ts";

describe("アプリケーションエラー", () => {
  it("正しい名前とメッセージでEntityNotFoundErrorを作成すること", () => {
    // 期待する結果
    const entityType = "User";
    const id = "123";
    const expectedMessage = `${entityType} with id ${id} not found`;
    
    // 操作
    const error = new EntityNotFoundError(entityType, id);
    
    // アサーション
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toBeInstanceOf(EntityNotFoundError);
    expect(error.name).toBe("EntityNotFoundError");
    expect(error.message).toBe(expectedMessage);
  });

  it("正しい名前とメッセージでAuthorizationErrorを作成すること", () => {
    // 期待する結果
    const errorMessage = "User is not authorized to perform this action";
    
    // 操作
    const error = new AuthorizationError(errorMessage);
    
    // アサーション
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.name).toBe("AuthorizationError");
    expect(error.message).toBe(errorMessage);
  });

  it("正しい名前とメッセージでValidationErrorを作成すること", () => {
    // 期待する結果
    const field = "email";
    const reason = "Invalid email format";
    const expectedMessage = `Validation failed for field '${field}': ${reason}`;
    
    // 操作
    const error = new ValidationError(field, reason);
    
    // アサーション
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.name).toBe("ValidationError");
    expect(error.message).toBe(expectedMessage);
  });
}); 