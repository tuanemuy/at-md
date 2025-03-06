import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { ErrorMetrics } from "./error-metrics.ts";

describe("エラーメトリクス", () => {
  it("エラーを記録して回数をカウントすること", () => {
    // 準備: メトリクスをリセット
    ErrorMetrics.resetMetrics();
    
    // 操作: エラーを記録
    ErrorMetrics.recordError("ValidationError");
    ErrorMetrics.recordError("ValidationError");
    ErrorMetrics.recordError("NetworkError");
    
    // アサーション
    const metrics = ErrorMetrics.getMetrics();
    expect(metrics.ValidationError).toBe(2);
    expect(metrics.NetworkError).toBe(1);
  });
  
  it("存在しないエラータイプのカウントは0を返すこと", () => {
    // 準備: メトリクスをリセット
    ErrorMetrics.resetMetrics();
    
    // 操作: 存在しないエラータイプのカウントを取得
    const count = ErrorMetrics.getErrorCount("NonExistentError");
    
    // アサーション
    expect(count).toBe(0);
  });
  
  it("特定のエラータイプのカウントを正しく取得すること", () => {
    // 準備: メトリクスをリセット
    ErrorMetrics.resetMetrics();
    
    // 操作: エラーを記録
    ErrorMetrics.recordError("ValidationError");
    ErrorMetrics.recordError("ValidationError");
    ErrorMetrics.recordError("NetworkError");
    
    // アサーション
    const validationErrorCount = ErrorMetrics.getErrorCount("ValidationError");
    const networkErrorCount = ErrorMetrics.getErrorCount("NetworkError");
    
    expect(validationErrorCount).toBe(2);
    expect(networkErrorCount).toBe(1);
  });
  
  it("合計エラー数を正しく計算すること", () => {
    // 準備: メトリクスをリセット
    ErrorMetrics.resetMetrics();
    
    // 操作: エラーを記録
    ErrorMetrics.recordError("ValidationError");
    ErrorMetrics.recordError("ValidationError");
    ErrorMetrics.recordError("NetworkError");
    ErrorMetrics.recordError("DatabaseError");
    
    // アサーション
    const totalCount = ErrorMetrics.getTotalErrorCount();
    expect(totalCount).toBe(4);
  });
  
  it("メトリクスを正しくリセットすること", () => {
    // 準備: メトリクスをリセットしてからエラーを記録
    ErrorMetrics.resetMetrics();
    ErrorMetrics.recordError("ValidationError");
    ErrorMetrics.recordError("NetworkError");
    
    // 操作: メトリクスをリセット
    ErrorMetrics.resetMetrics();
    
    // アサーション
    const metrics = ErrorMetrics.getMetrics();
    const totalCount = ErrorMetrics.getTotalErrorCount();
    
    expect(Object.keys(metrics).length).toBe(0);
    expect(totalCount).toBe(0);
  });
}); 