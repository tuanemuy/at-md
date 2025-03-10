/**
 * エラーハンドリングユーティリティ
 * 
 * REST APIのエラーハンドリングに関するユーティリティ関数を提供します。
 */

import { Context } from "../deps.ts";
import { DomainError, ApplicationError, ValidationError, EntityNotFoundError, Status } from "../deps.ts";

/**
 * エラーをHTTPレスポンスに変換する
 * @param error エラーオブジェクト
 * @returns HTTPレスポンス
 */
export function handleError(error: unknown): Response {
  console.error(`エラー発生: ${error instanceof Error ? error.message : String(error)}`);
  
  // エラーの種類に応じてステータスコードを決定
  let statusCode = 500;
  let errorMessage = "サーバーエラーが発生しました";
  
  if (error instanceof ValidationError) {
    statusCode = 400;
    errorMessage = error.message;
  } else if (error instanceof EntityNotFoundError) {
    statusCode = 404;
    errorMessage = error.message;
  } else if (error instanceof ApplicationError) {
    statusCode = 400;
    errorMessage = error.message;
  } else if (error instanceof DomainError) {
    statusCode = 400;
    errorMessage = error.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = String(error);
  }
  
  return new Response(JSON.stringify({ 
    error: errorMessage 
  }), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Honoコンテキストを使用してエラーをHTTPレスポンスに変換する
 * @param c Honoコンテキスト
 * @param error エラーオブジェクト
 * @returns HTTPレスポンス
 */
export function handleErrorWithContext(c: Context, error: unknown): Response {
  console.error(`エラー発生: ${error instanceof Error ? error.message : String(error)}`);
  
  // エラーの種類に応じてステータスコードを決定
  let statusCode: Status = 500;
  let errorMessage = "サーバーエラーが発生しました";
  
  if (error instanceof ValidationError) {
    statusCode = 400;
    errorMessage = error.message;
  } else if (error instanceof EntityNotFoundError) {
    statusCode = 404;
    errorMessage = error.message;
  } else if (error instanceof ApplicationError) {
    statusCode = 400;
    errorMessage = error.message;
  } else if (error instanceof DomainError) {
    statusCode = 400;
    errorMessage = error.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = String(error);
  }
  
  return c.json({ error: errorMessage }, statusCode);
} 