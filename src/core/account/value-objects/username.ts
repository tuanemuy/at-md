/**
 * ユーザー名値オブジェクト
 * ユーザーの表示名を表します。
 */

/**
 * ユーザー名の値オブジェクト
 */
export interface Username {
  /**
   * ユーザー名の値
   */
  readonly value: string;
}

/**
 * ユーザー名の値オブジェクトを作成する
 * @param username ユーザー名
 * @returns ユーザー名の値オブジェクト
 * @throws {Error} 無効なユーザー名の場合
 */
export function createUsername(username: string): Username {
  // バリデーション
  validateUsername(username);
  
  // 不変オブジェクトとして返す
  return Object.freeze({
    value: username
  });
}

/**
 * ユーザー名のバリデーション
 * @param username ユーザー名
 * @throws {Error} 無効なユーザー名の場合
 */
function validateUsername(username: string): void {
  // ユーザー名が空でないことを確認
  if (!username) {
    throw new Error("ユーザー名は必須です");
  }
  
  // ユーザー名の長さを確認
  if (username.length < 3) {
    throw new Error("ユーザー名は3文字以上である必要があります");
  }
  
  if (username.length > 50) {
    throw new Error("ユーザー名が長すぎます");
  }
  
  // ユーザー名の形式を確認
  // 英数字、アンダースコア、ハイフンのみを許可
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  
  if (!usernameRegex.test(username)) {
    throw new Error("ユーザー名には英数字、アンダースコア、ハイフンのみ使用できます");
  }
} 