# 投稿管理コンテキストの型定義

このファイルでは、[投稿管理コンテキスト](../domains/post.md)で定義されたドメインモデルの型定義を提供します。

## ドメイン層

### エンティティ

#### 投稿

```typescript
export const postStatusSchema = z.enum(["POSTED", "ERROR"]);
export type PostStatus = z.infer<typeof postStatusSchema>;

export const postSchema = z.object({
  id: idSchema,
  userId: idSchema,
  noteId: idSchema,
  status: postStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date()
});
export type Post = z.infer<typeof postSchema>;
```

#### エンゲージメント

```typescript
export const engagementSchema = z.object({
  likes: z.number().default(0),
  reposts: z.number().default(0),
  quotes: z.number().default(0),
  replies: z.number().default(0)
});
export type Engagement = z.infer<typeof engagementSchema>;
```

#### 投稿設定

```typescript
export const postSettingsSchema = z.object({
  id: idSchema,
  userId: idSchema,
  defaultStatus: postStatusSchema.default("DRAFT"),
  autoPublish: z.boolean().default(false),
  publishPlatforms: z.array(publishConfigSchema).default([]),
  metadata: metadataSchema
});
export type PostSettings = z.infer<typeof postSettingsSchema>;
```

### エラー

#### 投稿管理エラー

```typescript
export const postErrorCodeSchema = z.enum([
  // 投稿関連
  "POST_FAILED",
  "POST_NOT_FOUND",
  "INVALID_POST_CONTENT",
  // エンゲージメント関連
  "ENGAGEMENT_FETCH_FAILED",
  "INVALID_ENGAGEMENT_DATA",
  // 認証関連
  "UNAUTHORIZED",
  "AUTHENTICATION_FAILED"
]);
export type PostErrorCode = z.infer<typeof postErrorCodeSchema>;

export interface PostError extends AnyError {
  name: "PostError";
  type: PostErrorCode;
  message: string;
  cause?: Error;
}
```

### アダプターインターフェース

#### Blueskyアダプター

```typescript
export interface BlueskyPostProvider {
  createPost(repo: DID, text: string): Promise<Result<BlueskyPost, ExternalServiceError>>;
  getEngagement(uri: string): Promise<Result<Engagement, ExternalServiceError>>;
}

export interface BlueskyPost {
  uri: string;
  cid: string;
}
```

### リポジトリインターフェース

```typescript
export interface PostRepository {
  save(post: Post): Promise<Result<Post, RepositoryError>>;
  findById(id: string): Promise<Result<Post, RepositoryError>>;
  findByNoteId(noteId: string): Promise<Result<Post, RepositoryError>>;
  findByUserId(userId: string): Promise<Result<Post[], RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
```

### ユースケース

#### ノートを投稿する

```typescript
export interface PostNoteInput {
  userId: string;
  noteId: string;
  text: string;
}

export interface PostNoteUseCase {
  execute(input: PostNoteInput): Promise<Result<Post, PostError>>;
}
```

#### エンゲージメントを取得する

```typescript
export interface GetEngagementInput {
  noteId: string;
}

export interface GetEngagementUseCase {
  execute(input: GetEngagementInput): Promise<Result<Engagement, PostError>>;
}
```

#### 投稿のステータスを確認する

```typescript
export interface CheckPostStatusInput {
  noteId: string;
}

export interface CheckPostStatusUseCase {
  execute(input: CheckPostStatusInput): Promise<Result<PostStatus, PostError>>;
}
```

#### 投稿を再試行する

```typescript
export interface RetryPostInput {
  userId: string;
  noteId: string;
}

export interface RetryPostUseCase {
  execute(input: RetryPostInput): Promise<Result<Post, PostError>>;
}
```
