import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Cookieをパースする関数
 */
export function parseCookies(request: IncomingMessage): Record<string, string> {
  const cookieHeader = request.headers.cookie || '';
  const cookies: Record<string, string> = {};
  
  for (const cookie of cookieHeader.split(';')) {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[key] = decodeURIComponent(value);
    }
  }
  
  return cookies;
}

/**
 * Cookieを設定する関数
 */
export function setCookie(
  response: ServerResponse,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    maxAge?: number;
    path?: string;
  } = {}
): void {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  
  if (options.httpOnly) {
    cookie += '; HttpOnly';
  }
  
  if (options.secure) {
    cookie += '; Secure';
  }
  
  if (options.maxAge) {
    cookie += `; Max-Age=${options.maxAge}`;
  }
  
  if (options.path) {
    cookie += `; Path=${options.path}`;
  }
  
  // 既存のSet-Cookieヘッダーがあれば配列、なければ空配列として処理
  const existingCookies = response.getHeader('Set-Cookie');
  const cookiesArray = existingCookies
    ? Array.isArray(existingCookies) 
      ? [...existingCookies, cookie] 
      : [existingCookies.toString(), cookie]
    : [cookie];
  
  response.setHeader('Set-Cookie', cookiesArray);
}

/**
 * Cookieを削除する関数
 */
export function clearCookie(response: ServerResponse, name: string, path = '/'): void {
  setCookie(response, name, '', {
    maxAge: -1,
    path
  });
}

/**
 * リクエストコンテキスト型
 */
export interface RequestContext {
  req: IncomingMessage;
  res: ServerResponse;
} 
