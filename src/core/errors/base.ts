/**
 * ドメインエラーの基底クラス
 * ドメインルールに違反する操作が行われた場合に発生するエラー
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/**
 * アプリケーションエラーの基底クラス
 * アプリケーションレイヤーでの処理中に発生するエラー
 */
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationError";
  }
}

/**
 * インフラストラクチャエラーの基底クラス
 * データベースアクセスや外部システム連携時に発生するエラー
 */
export class InfrastructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InfrastructureError";
  }
}

/**
 * プレゼンテーションエラーの基底クラス
 * ユーザーインターフェースレイヤーでの処理中に発生するエラー
 */
export class PresentationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PresentationError";
  }
} 