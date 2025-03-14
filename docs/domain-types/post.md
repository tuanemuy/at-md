# 投稿管理コンテキストの型定義

このファイルでは、[投稿管理コンテキスト](../domains/post.md)で定義されたドメインモデルの型定義を提供します。

## ドメイン層

### エンティティ・値オブジェクト

#### 投稿

```typescript
export const postSchema = z.object({
  id: idSchema,
  userId: idSchema,
  noteId: idSchema,
  uri: blueskyURISchema,
  cid: z.string().nonempty(),
  status: postStatusSchema,
  postedAt: dateSchema.nullable().default(null),
  metadata: metadataSchema
});
export type Post = z.infer<typeof postSchema>;
```

#### 投稿ステータス

```typescript
export const postStatusSchema = z.enum([
  "POSTED",
  "FAILED"
]);
export type PostStatus = z.infer<typeof postStatusSchema>;
```

#### エンゲージメント

```typescript
export const engagementSchema = z.object({
  likes: z.number().int().nonnegative(),
  reposts: z.number().int().nonnegative(),
  replies: z.number().int().nonnegative(),
  quotes: z.number().int().nonnegative()
});
export type Engagement = z.infer<typeof engagementSchema>;
```

#### コメント

```typescript
export const commentSchema = z.object({
  uri: blueskyURISchema,
  content: z.string().nonempty(),
  from: z.string().nonempty(),
  createdAt: dateSchema
});
export type Comment = z.infer<typeof commentSchema>;
```

#### BlueskyURI

```typescript
export const blueskyURISchema = z.string().regex(/^at:\/\/[^/]+\/[^/]+\/[^/]+$/);
export type BlueskyURI = z.infer<typeof blueskyURISchema>;
```

### リポジトリインターフェース

#### 投稿リポジトリ

```typescript
export interface PostRepository {
  findById(id: ID): Promise<Result<Post | null, RepositoryError>>;
  findByNoteId(noteId: ID): Promise<Result<Post | null, RepositoryError>>;
  findByUserId(userId: ID): Promise<Result<Post[], RepositoryError>>;
  findByUserIdAndStatus(userId: ID, status: PostStatus): Promise<Result<Post[], RepositoryError>>;
  save(post: Post): Promise<Result<Post, RepositoryError>>;
  delete(id: ID): Promise<Result<void, RepositoryError>>;
}
```

### ドメインサービスインターフェース

#### 投稿サービス

```typescript
export interface PostingService {
  createPost(userId: ID, noteId: ID): Promise<Result<Post, PostError>>;
  updatePost(postId: ID, content: string): Promise<Result<Post, PostError>>;
  deletePost(postId: ID): Promise<Result<void, PostError>>;
}
```

#### エンゲージメント取得サービス

```typescript
export interface EngagementService {
  getEngagement(postUri: BlueskyURI): Promise<Result<Engagement, EngagementError>>;
  getComments(postUri: BlueskyURI, limit?: number): Promise<Result<Comment[], EngagementError>>;
}
```

## アプリケーション層

### ユースケース入力/出力の型定義

#### ノート投稿入力

```typescript
export const postNoteInputSchema = z.object({
  userId: idSchema,
  noteId: idSchema,
});
export type PostNoteInput = z.infer<typeof postNoteInputSchema>;
```

#### エンゲージメント取得入力

```typescript
export const getEngagementInputSchema = z.object({
  postUri: blueskyURISchema
});
export type GetEngagementInput = z.infer<typeof getEngagementInputSchema>;
```

#### 投稿ステータス確認入力

```typescript
export const checkPostStatusInputSchema = z.object({
  postId: idSchema
});
export type CheckPostStatusInput = z.infer<typeof checkPostStatusInputSchema>;
```

### ユースケースインターフェース

#### ノート投稿ユースケース

```typescript
export interface PostNoteUseCase {
  execute(input: PostNoteInput): Promise<Result<Post, PostError>>;
}
```

#### エンゲージメント取得ユースケース

```typescript
export interface GetEngagementUseCase {
  execute(input: GetEngagementInput): Promise<Result<Engagement, EngagementError>>;
}
```

#### 投稿ステータス確認ユースケース

```typescript
export interface CheckPostStatusUseCase {
  execute(input: CheckPostStatusInput): Promise<Result<Post, PostError>>;
}
```

### アプリケーションエラー

#### 投稿エラー

```typescript
export const postErrorCodeSchema = z.enum([
  "UNAUTHORIZED",
  "RATE_LIMITED",
  "CONTENT_REJECTED",
  "CONNECTION_ERROR",
  "UNKNOWN_ERROR"
]);
export type PostErrorCode = z.infer<typeof postErrorCodeSchema>;

export interface PostError extends AnyError {
  name: "PostError";
  type: PostErrorCode;
  message: string;
  cause?: Error;
}
```

#### エンゲージメント取得エラー

```typescript
export const engagementErrorCodeSchema = z.enum([
  "POST_NOT_FOUND",
  "CONNECTION_ERROR",
  "UNKNOWN_ERROR"
]);
export type EngagementErrorCode = z.infer<typeof engagementErrorCodeSchema>;

export interface EngagementError extends AnyError {
  name: "EngagementError";
  type: EngagementErrorCode;
  message: string;
  cause?: Error;
}
```
