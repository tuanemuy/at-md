# 表示コンテキストの型定義

このファイルでは、表示コンテキストで定義されたドメインモデルの型定義を提供します。

## ドメイン層

### エンティティ・値オブジェクト

#### 表示設定

```typescript
export const displaySettingSchema = z.object({
  id: idSchema,
  userId: idSchema,
  theme: themeSchema.default("LIGHT"),
  fontSize: z.number().int().positive().default(16),
  lineHeight: z.number().positive().default(1.5),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type DisplaySetting = z.infer<typeof displaySettingSchema>;
```

#### テーマ

```typescript
export const themeSchema = z.enum([
  "LIGHT",
  "DARK",
  "SYSTEM"
]);
export type Theme = z.infer<typeof themeSchema>;
```

#### レンダリング結果

```typescript
export const renderResultSchema = z.object({
  html: z.string(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    imageUrls: z.array(z.string()).default([])
  })
});
export type RenderResult = z.infer<typeof renderResultSchema>;
```

#### エンゲージメント表示

```typescript
export const engagementDisplaySchema = z.object({
  postUri: z.string().nonempty(),
  likes: z.number().int().nonnegative(),
  reposts: z.number().int().nonnegative(),
  replies: z.number().int().nonnegative(),
  lastUpdatedAt: z.date()
});
export type EngagementDisplay = z.infer<typeof engagementDisplaySchema>;
```

### リポジトリインターフェース

#### 表示設定リポジトリ

```typescript
export interface DisplaySettingRepository {
  findByUserId(userId: ID): Promise<Result<DisplaySetting | null, RepositoryError>>;
  save(setting: DisplaySetting): Promise<Result<DisplaySetting, RepositoryError>>;
}
```

#### エンゲージメント表示リポジトリ

```typescript
export interface EngagementDisplayRepository {
  findByPostUri(postUri: string): Promise<Result<EngagementDisplay | null, RepositoryError>>;
  save(engagement: EngagementDisplay): Promise<Result<EngagementDisplay, RepositoryError>>;
}
```

### ドメインサービスインターフェース

#### レンダリングサービス

```typescript
export interface RenderService {
  renderMarkdown(markdown: string): Result<RenderResult, RenderError>;
  renderPreview(markdown: string): Result<string, RenderError>;
}
```

### ドメインエラー

#### レンダリングエラー

```typescript
export const renderErrorCodeSchema = z.enum([
  "PARSE_ERROR",
  "INVALID_MARKDOWN",
  "RENDERING_FAILED"
]);
export type RenderErrorCode = z.infer<typeof renderErrorCodeSchema>;

export interface RenderError extends AnyError {
  name: "RenderError";
  type: RenderErrorCode;
  message: string;
  cause?: Error;
}
```

## アプリケーション層

### ユースケース入力/出力の型定義

#### 表示設定更新入力

```typescript
export const updateDisplaySettingInputSchema = z.object({
  userId: idSchema,
  theme: themeSchema.optional(),
  fontSize: z.number().int().positive().optional(),
  lineHeight: z.number().positive().optional()
});
export type UpdateDisplaySettingInput = z.infer<typeof updateDisplaySettingInputSchema>;
```

#### ドキュメントレンダリング入力

```typescript
export const renderDocumentInputSchema = z.object({
  documentId: idSchema,
  content: z.string()
});
export type RenderDocumentInput = z.infer<typeof renderDocumentInputSchema>;
```

#### エンゲージメント更新入力

```typescript
export const updateEngagementInputSchema = z.object({
  postUri: z.string().nonempty()
});
export type UpdateEngagementInput = z.infer<typeof updateEngagementInputSchema>;
```

### ユースケースインターフェース

#### 表示設定更新ユースケース

```typescript
export interface UpdateDisplaySettingUseCase {
  execute(input: UpdateDisplaySettingInput): Promise<Result<DisplaySetting, UpdateDisplaySettingError>>;
}
```

#### ドキュメントレンダリングユースケース

```typescript
export interface RenderDocumentUseCase {
  execute(input: RenderDocumentInput): Promise<Result<RenderResult, RenderDocumentError>>;
}
```

#### エンゲージメント更新ユースケース

```typescript
export interface UpdateEngagementUseCase {
  execute(input: UpdateEngagementInput): Promise<Result<EngagementDisplay, UpdateEngagementError>>;
}
```

### アプリケーションエラー

#### 表示設定更新エラー

```typescript
export const updateDisplaySettingErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "USER_NOT_FOUND",
  "REPOSITORY_ERROR"
]);
export type UpdateDisplaySettingErrorCode = z.infer<typeof updateDisplaySettingErrorCodeSchema>;

export interface UpdateDisplaySettingError extends AnyError {
  name: "UpdateDisplaySettingError";
  type: UpdateDisplaySettingErrorCode;
  message: string;
  cause?: Error;
}
```

#### ドキュメントレンダリングエラー

```typescript
export const renderDocumentErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "DOCUMENT_NOT_FOUND",
  "RENDERING_FAILED",
  "REPOSITORY_ERROR"
]);
export type RenderDocumentErrorCode = z.infer<typeof renderDocumentErrorCodeSchema>;

export interface RenderDocumentError extends AnyError {
  name: "RenderDocumentError";
  type: RenderDocumentErrorCode;
  message: string;
  cause?: Error;
}
``` 