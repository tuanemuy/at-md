# 共通型定義

## 基本型

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
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
  total: z.number().int().nonnegative()
});
export type Pagination = z.infer<typeof paginationSchema>;
```

## 値オブジェクト

### メタデータ

```typescript
export const metadataSchema = z.object({
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.nullable()
});
export type Metadata = z.infer<typeof metadataSchema>;
```

### 検索クエリ

```typescript
export const searchQuerySchema = z.object({
  query: z.string().nonempty(),
  filters: z.record(z.unknown()).optional(),
  pagination: paginationSchema
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;
```

## エラー型

### 基本エラー

```typescript
export interface AnyError {
  name: string;
  type: string;
  message: string;
  cause?: Error;
}
```

### リポジトリエラー

```typescript
export const repositoryErrorCodeSchema = z.enum([
  "CONNECTION_ERROR",
  "QUERY_ERROR",
  "CONSTRAINT_ERROR",
  "NOT_FOUND",
  "INVALID_ID",
  "DUPLICATE_ENTRY",
  "OPTIMISTIC_LOCK_ERROR"
]);
export type RepositoryErrorCode = z.infer<typeof repositoryErrorCodeSchema>;

export interface RepositoryError extends AnyError {
  name: "RepositoryError";
  type: RepositoryErrorCode;
  message: string;
  cause?: Error;
}
```

### バリデーションエラー

```typescript
export const validationErrorCodeSchema = z.enum([
  "INVALID_INPUT",
  "MISSING_REQUIRED_FIELD",
  "INVALID_FORMAT",
  "OUT_OF_RANGE",
  "INVALID_ENUM_VALUE"
]);
export type ValidationErrorCode = z.infer<typeof validationErrorCodeSchema>;

export interface ValidationError extends AnyError {
  name: "ValidationError";
  type: ValidationErrorCode;
  message: string;
  cause?: Error;
}
```

### 認証エラー

```typescript
export const authenticationErrorCodeSchema = z.enum([
  "UNAUTHORIZED",
  "TOKEN_EXPIRED",
  "INVALID_TOKEN",
  "MISSING_TOKEN",
  "INVALID_CREDENTIALS"
]);
export type AuthenticationErrorCode = z.infer<typeof authenticationErrorCodeSchema>;

export interface AuthenticationError extends AnyError {
  name: "AuthenticationError";
  type: AuthenticationErrorCode;
  message: string;
  cause?: Error;
}
```

### 認可エラー

```typescript
export const authorizationErrorCodeSchema = z.enum([
  "FORBIDDEN",
  "INSUFFICIENT_PERMISSIONS",
  "RESOURCE_ACCESS_DENIED"
]);
export type AuthorizationErrorCode = z.infer<typeof authorizationErrorCodeSchema>;

export interface AuthorizationError extends AnyError {
  name: "AuthorizationError";
  type: AuthorizationErrorCode;
  message: string;
  cause?: Error;
}
```

### 外部サービスエラー

```typescript
export const externalServiceErrorCodeSchema = z.enum([
  "SERVICE_UNAVAILABLE",
  "RATE_LIMITED",
  "TIMEOUT",
  "NETWORK_ERROR",
  "API_ERROR"
]);
export type ExternalServiceErrorCode = z.infer<typeof externalServiceErrorCodeSchema>;

export interface ExternalServiceError extends AnyError {
  name: "ExternalServiceError";
  type: ExternalServiceErrorCode;
  message: string;
  cause?: Error;
}
```