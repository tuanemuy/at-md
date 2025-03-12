# ドメインモデルの型定義

この資料では、ドメインモデルの詳細な型定義またはZodスキーマを提供します。

## 共通型

### 共通の識別子型

```typescript
export const idSchema = z.string().uuid() // UUID v7
export type ID = z.infer<typeof idSchema>;
```

### 結果型

```typescript
export type { Result } from "neverthrow";
```

### 共通エラー型

```typescript
export interface AnyError extends Error {
  name: string;
  type: string;
  message: string;
  cause?: Error;
}
```

## エンティティ・値オブジェクト

### ユーザー

```typescript
export const userSchema = z.object({
  id: idSchema,
  name: z.string().nonempty(),
  did: z.string().nonempty(),
  createdAt: z.date(),
  updatedAt: z.date(),
  gitHubConnections: z.array(gitHubConnectionSchema).default([])
})
export type User = z.infer<typeof userSchema>;
```

### GitHub連携情報

```typescript
export const gitHubConnectionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  installationId: z.string().nonempty(),
  accessToken: z.string().nonempty().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type GitHubConnection = z.infer<typeof gitHubConnectionSchema>;
```

### 文書公開

```typescript
export const documentScopeSchema = z.enum([
  "private",
  "public",
  "limited"
]);
export type DocumentScope = z.infer<typeof documentScopeSchema>;
```

### 文書

```typescript
export const documentSchema = z.object({
  id: idSchema,
  gitHubRepoId: idSchema,
  path: z.string().nonempty(),
  title: z.string().nonempty(),
  description: z.string().optional(),
  document: z.string().nonempty(), // Markdown
  scope: documentScopeSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: idSchema
});
export type Document = z.infer<typeof documentSchema>;
```

### タグ

```typescript
export const tagSchema = z.object({
  id: idSchema,
  name: z.string().nonempty(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: idSchema
});
export type Tag = z.infer<typeof tagSchema>;
```

### 文書タグ関連（Many to Many）

```typescript
export const documentTagSchema = z.object({
  id: idSchema,
  documentId: idSchema,
  tagId: idSchema,
  createdAt: z.date()
});
export type DocumentTag = z.infer<typeof documentTagSchema>;
```

### GitHubリポジトリ

```typescript
export const gitHubRepoSchema = z.object({
  id: idSchema,
  owner: z.string().nonempty(),
  name: z.string().nonempty(),
  fullName: z.string().nonempty(), // owner/name
  installationId: z.string().nonempty(),
  webhookSecret: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: idSchema
});
export type GitHubRepo = z.infer<typeof gitHubRepoSchema>;
```

### 投稿ステータス

```typescript
export const postStatusSchema = z.enum([
  "pending",
  "published",
  "failed"
]);
export type PostStatus = z.infer<typeof postStatusSchema>;
```

### 投稿

```typescript
export const postSchema = z.object({
  id: idSchema,
  documentId: idSchema,
  uri: z.string().default(""), // Bluesky投稿URI
  status: postStatusSchema.default("pending"),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type Post = z.infer<typeof postSchema>;
```

## リポジトリインターフェース

### ユーザーリポジトリ

```typescript
export interface UserRepository {
  findById(id: ID): Promise<Result<User | null, RepositoryError>>;
  findByDid(did: string): Promise<Result<User | null, RepositoryError>>;
  save(user: User): Promise<Result<User, RepositoryError>>;
  addGitHubConnection(userId: ID, connection: GitHubConnection): Promise<Result<GitHubConnection, RepositoryError>>;
}
```

### 文書リポジトリ

```typescript
export interface DocumentRepository {
  findById(id: ID): Promise<Result<Document | null, RepositoryError>>;
  findByGitHubRepoAndPath(gitHubRepoId: ID, path: string): Promise<Result<Document | null, RepositoryError>>;
  findByGitHubRepo(gitHubRepoId: ID): Promise<Result<Document[], RepositoryError>>;
  save(document: Document): Promise<Result<Document, RepositoryError>>;
}
```

### GitHubリポジトリリポジトリ

```typescript
export interface GitHubRepoRepository {
  findById(id: ID): Promise<Result<GitHubRepo | null, RepositoryError>>;
  findByFullName(fullName: string): Promise<Result<GitHubRepo | null, RepositoryError>>;
  findByUserId(userId: ID): Promise<Result<GitHubRepo[], RepositoryError>>;
  save(gitHubRepo: GitHubRepo): Promise<Result<GitHubRepo, RepositoryError>>;
}
```

### 投稿リポジトリ

```typescript
export interface PostRepository {
  findById(id: ID): Promise<Result<Post | null, RepositoryError>>;
  findByDocumentId(documentId: ID): Promise<Result<Post | null, RepositoryError>>;
  save(post: Post): Promise<Result<Post, RepositoryError>>;
  updateStatus(id: ID, status: PostStatus, error?: string): Promise<Result<Post, RepositoryError>>;
}
```

### タグリポジトリ

```typescript
export interface TagRepository {
  findById(id: ID): Promise<Result<Tag | null, RepositoryError>>;
  findBySlug(slug: string): Promise<Result<Tag | null, RepositoryError>>;
  findByUserId(userId: ID): Promise<Result<Tag[], RepositoryError>>;
  findByDocumentId(documentId: ID): Promise<Result<Tag[], RepositoryError>>;
  save(tag: Tag): Promise<Result<Tag, RepositoryError>>;
}
```

### 文書タグリポジトリ

```typescript
export interface DocumentTagRepository {
  findByDocumentId(documentId: ID): Promise<Result<DocumentTag[], RepositoryError>>;
  findByTagId(tagId: ID): Promise<Result<DocumentTag[], RepositoryError>>;
  save(documentTag: DocumentTag): Promise<Result<DocumentTag, RepositoryError>>;
  delete(id: ID): Promise<Result<void, RepositoryError>>;
  deleteByDocumentIdAndTagId(documentId: ID, tagId: ID): Promise<Result<void, RepositoryError>>;
}
```

## ドメインサービスインターフェース

### 認証サービス

```typescript
export interface AuthService {
  authenticateWithBluesky(did: string, jwt: string): Promise<Result<User, AuthError>>;
  connectGitHub(userId: ID, installationId: number): Promise<Result<GitHubConnection, AuthError>>;
}
```

### 認証エラー

```typescript
export const authErrorCodeSchema = z.enum([
  "INVALID_CREDENTIALS",
  "UNAUTHORIZED",
  "CONNECTION_FAILED"
]);
export type AuthErrorCode = z.infer<typeof authErrorCodeSchema>;

export interface AuthError extends AnyError = {
  name: "AuthError";
  type: AuthErrorCode;
  message: string;
  cause?: Error;
}
```

### 同期サービス

```typescript
export interface SyncService {
  syncGitHubRepo(gitHubRepoId: ID): Promise<Result<Document[], SyncError>>;
  syncDocument(gitHubRepoId: ID, path: string): Promise<Result<Document, SyncError>>;
  parseMarkdown(document: string): Result<{ 
    title: string; 
    document: string; 
    description?: string;
    scope?: DocumentScope;
    tags?: string[];
  }, SyncError>;
}
```

### 同期エラー

```typescript
export const syncErrorCodeSchema = z.enum([
  "GITHUREPO_NOT_FOUND",
  "FILE_NOT_FOUND",
  "PARSE_ERROR",
  "API_ERROR"
]);
export type SyncErrorCode = z.infer<typeof syncErrorCodeSchema>;

export interface SyncError extends AnyError {
  name: "SyncError";
  type: SyncErrorCode;
  message: string;
  cause?: Error;
}
```

### 投稿サービス

```typescript
export interface PostService {
  createPost(documentId: ID): Promise<Result<Post, PostError>>;
  getPostStatus(postId: ID): Promise<Result<PostStatus, PostError>>;
}
```

### 投稿エラー

```typescript
export const postErrorCodeSchema = z.enum([
  "CONTENT_NOT_FOUND",
  "API_ERROR",
  "RATE_LIMIT"
]);
export type PostErrorCode = z.infer<typeof postErrorCodeSchema>;

export interface PostError extends AnyError {
  name: "PostError";
  type: PostErrorCode;
  message: string;
  cause?: Error;
}
```

## ユースケース入力/出力の型定義

### ユーザー登録入力

```typescript
export const registerUserInputSchema = z.object({
  did: z.string().nonempty(),
  jwt: z.string().nonempty(),
  name: z.string().nonempty()
});
export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;
```

### GitHub連携入力

```typescript
export const connectGitHubInputSchema = z.object({
  userId: idSchema,
  installationId: z.string().nonempty()
});
export type ConnectGitHubInput = z.infer<typeof connectGitHubInputSchema>;
```

### 文書同期入力

```typescript
export const syncDocumentInputSchema = z.object({
  gitHubRepoId: idSchema,
  path: z.string().nonempty()
});
export type SyncDocumentInput = z.infer<typeof syncDocumentInputSchema>;
```

### 投稿作成入力

```typescript
export const createPostInputSchema = z.object({
  documentId: idSchema
});
export type CreatePostInput = z.infer<typeof createPostInputSchema>;
```

### 文書表示入力

```typescript
export const viewDocumentInputSchema = z.object({
  id: idSchema
});
export type ViewDocumentInput = z.infer<typeof viewDocumentInputSchema>;
```

### 文書表示出力

```typescript
export const viewDocumentOutputSchema = z.object({
  document: documentSchema,
  tags: z.array(tagSchema).default([]),
  post: postSchema.optional()
});
export type ViewDocumentOutput = z.infer<typeof viewDocumentOutputSchema>;
```

## ユースケースインターフェース

### ユーザー登録ユースケース

```typescript
export interface RegisterUserUseCase {
  execute(input: RegisterUserInput): Promise<Result<User, RegisterUserError>>;
}
```

### GitHub連携ユースケース

```typescript
export interface ConnectGitHubUseCase {
  execute(input: ConnectGitHubInput): Promise<Result<GitHubConnection, ConnectGitHubError>>;
}
```

### 文書同期ユースケース

```typescript
export interface SyncDocumentUseCase {
  execute(input: SyncDocumentInput): Promise<Result<Document, SyncDocumentError>>;
}
```

### 投稿作成ユースケース

```typescript
export interface CreatePostUseCase {
  execute(input: CreatePostInput): Promise<Result<Post, CreatePostError>>;
}
```

### 文書表示ユースケース

```typescript
export interface ViewDocumentUseCase {
  execute(input: ViewDocumentInput): Promise<Result<ViewDocumentOutput, ViewDocumentError>>;
}
```
