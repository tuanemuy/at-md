/**
 * エラーメトリクスクラス
 * エラーの発生頻度や種類を監視するためのメトリクス収集
 */
export class ErrorMetrics {
  private static errorCounts: Record<string, number> = {};
  
  /**
   * エラーを記録する
   * @param errorType エラーの種類
   */
  static recordError(errorType: string): void {
    if (!this.errorCounts[errorType]) {
      this.errorCounts[errorType] = 0;
    }
    
    this.errorCounts[errorType]++;
  }
  
  /**
   * メトリクスを取得する
   * @returns エラー種類ごとの発生回数
   */
  static getMetrics(): Record<string, number> {
    return { ...this.errorCounts };
  }
  
  /**
   * メトリクスをリセットする
   */
  static resetMetrics(): void {
    this.errorCounts = {};
  }
  
  /**
   * 特定のエラー種類の発生回数を取得する
   * @param errorType エラーの種類
   * @returns 発生回数
   */
  static getErrorCount(errorType: string): number {
    return this.errorCounts[errorType] || 0;
  }
  
  /**
   * 全エラーの合計発生回数を取得する
   * @returns 合計発生回数
   */
  static getTotalErrorCount(): number {
    return Object.values(this.errorCounts).reduce((sum, count) => sum + count, 0);
  }
} 