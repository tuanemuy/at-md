# 共通型定義

このファイルでは、複数のコンテキストで共有される共通の型定義を提供します。

## 共通型

### ID

```typescript
export const idSchema = z.string().uuid();
export type ID = z.infer<typeof idSchema>;
```

### 日時

```typescript
export const dateSchema = z.date();
export type Date = z.infer<typeof dateSchema>;
```

### ページネーション

```typescript
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(20)
});
export type Pagination = z.infer<typeof paginationSchema>;
```

## 共通エラー型

### 基本エラー

```typescript
export interface AnyError {
  name: string;
  message: string;
  cause?: Error;
}
```

### バリデーションエラー

```typescript
export const validationErrorCodeSchema = z.enum([
  "INVALID_INPUT",
  "MISSING_REQUIRED_FIELD",
  "TYPE_ERROR",
  "CONSTRAINT_VIOLATION"
]);
export type ValidationErrorCode = z.infer<typeof validationErrorCodeSchema>;

export interface ValidationError extends AnyError {
  name: "ValidationError";
  type: ValidationErrorCode;
  field?: string;
  message: string;
  cause?: Error;
}
```

### リポジトリエラー

```typescript
export const repositoryErrorCodeSchema = z.enum([
  "NOT_FOUND",
  "ALREADY_EXISTS",
  "CONFLICT",
  "CONNECTION_ERROR",
  "TRANSACTION_ERROR"
]);
export type RepositoryErrorCode = z.infer<typeof repositoryErrorCodeSchema>;

export interface RepositoryError extends AnyError {
  name: "RepositoryError";
  type: RepositoryErrorCode;
  entityName: string;
  message: string;
  cause?: Error;
}
```

### 認証エラー

```typescript
export const authErrorCodeSchema = z.enum([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "INVALID_CREDENTIALS",
  "SESSION_EXPIRED",
  "TOKEN_INVALID"
]);
export type AuthErrorCode = z.infer<typeof authErrorCodeSchema>;

export interface AuthError extends AnyError {
  name: "AuthError";
  type: AuthErrorCode;
  message: string;
  cause?: Error;
}
```

### 外部サービスエラー

```typescript
export const externalServiceErrorCodeSchema = z.enum([
  "API_ERROR",
  "CONNECTION_ERROR",
  "RATE_LIMIT",
  "TIMEOUT",
  "UNEXPECTED_RESPONSE"
]);
export type ExternalServiceErrorCode = z.infer<typeof externalServiceErrorCodeSchema>;

export interface ExternalServiceError extends AnyError {
  name: "ExternalServiceError";
  type: ExternalServiceErrorCode;
  service: string;
  message: string;
  cause?: Error;
}
```
