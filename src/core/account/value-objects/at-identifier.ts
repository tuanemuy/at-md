/**
 * ATプロトコル識別子値オブジェクト
 * ATプロトコルのユーザー識別子（DID）を表します。
 */

/**
 * ATプロトコル識別子の値オブジェクト
 */
export interface AtIdentifier {
  /**
   * 識別子の値（DID）
   */
  readonly value: string;
  
  /**
   * ハンドル（@username.bsky.social形式）
   */
  readonly handle?: string;
}

/**
 * ATプロトコル識別子の値オブジェクトを作成する
 * @param did DID形式の識別子
 * @param handle オプションのハンドル
 * @returns ATプロトコル識別子の値オブジェクト
 * @throws {Error} 無効な識別子の場合
 */
export function createAtIdentifier(did: string, handle?: string): AtIdentifier {
  // バリデーション
  validateDid(did);
  if (handle) {
    validateHandle(handle);
  }
  
  // 不変オブジェクトとして返す
  return Object.freeze({
    value: did,
    handle
  });
}

/**
 * DIDのバリデーション
 * @param did DID形式の識別子
 * @throws {Error} 無効なDIDの場合
 */
function validateDid(did: string): void {
  // DIDが空でないことを確認
  if (!did) {
    throw new Error("DIDは必須です");
  }
  
  // DIDの形式を確認
  // did:プレフィックスで始まることを確認
  if (!did.startsWith("did:")) {
    throw new Error("DIDは'did:'で始まる必要があります");
  }
  
  // DIDの形式を確認（簡易的な検証）
  // 例: did:plc:abcdefghijklmnopqrstuvwxyz
  const didRegex = /^did:[a-z]+:[a-zA-Z0-9.%-]+$/;
  
  if (!didRegex.test(did)) {
    throw new Error("無効なDID形式です");
  }
}

/**
 * ハンドルのバリデーション
 * @param handle ハンドル
 * @throws {Error} 無効なハンドルの場合
 */
function validateHandle(handle: string): void {
  // ハンドルが空でないことを確認
  if (!handle) {
    throw new Error("ハンドルは必須です");
  }
  
  // ハンドルの形式を確認
  // @で始まることを確認
  if (!handle.startsWith("@")) {
    throw new Error("ハンドルは'@'で始まる必要があります");
  }
  
  // ハンドルの形式を確認（簡易的な検証）
  // 例: @username.bsky.social
  const handleRegex = /^@[a-zA-Z0-9_-]+\.[a-zA-Z0-9.-]+$/;
  
  if (!handleRegex.test(handle)) {
    throw new Error("無効なハンドル形式です");
  }
} 