/**
 * メールアドレス値オブジェクト
 * ユーザーのメールアドレスを表します。
 */

/**
 * メールアドレスの値オブジェクト
 */
export interface Email {
  /**
   * メールアドレスの値
   */
  readonly value: string;
}

/**
 * メールアドレスの値オブジェクトを作成する
 * @param email メールアドレス
 * @returns メールアドレスの値オブジェクト
 * @throws {Error} 無効なメールアドレスの場合
 */
export function createEmail(email: string): Email {
  // バリデーション
  validateEmail(email);
  
  // 不変オブジェクトとして返す
  return Object.freeze({
    value: email.toLowerCase() // メールアドレスは小文字に正規化
  });
}

/**
 * メールアドレスのバリデーション
 * @param email メールアドレス
 * @throws {Error} 無効なメールアドレスの場合
 */
function validateEmail(email: string): void {
  // メールアドレスが空でないことを確認
  if (!email) {
    throw new Error("メールアドレスは必須です");
  }
  
  // メールアドレスの形式を確認
  // RFC 5322に準拠した正規表現
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    throw new Error("無効なメールアドレス形式です");
  }
  
  // メールアドレスの長さを確認
  if (email.length > 254) {
    throw new Error("メールアドレスが長すぎます");
  }
} 