# ノート管理コンテキストの型定義

このファイルでは、[ノート管理コンテキスト](../domains/note.md)で定義されたドメインモデルの型定義を提供します。

## ドメイン層

### エンティティ・値オブジェクト

#### ノート

```typescript
export const noteSchema = z.object({
  id: idSchema,
  userId: idSchema,
  bookId: idSchema,
  path: z.string().nonempty(),
  title: z.string().nonempty(),
  body: z.string(),
  tags: z.array(tagSchema).default([]),
  metadata: metadataSchema,
  lastSyncedAt: dateSchema.nullable().default(null)
});
export type Note = z.infer<typeof noteSchema>;
```

#### パース済みコンテンツ

```typescript
export const parsedContentSchema = z.object({
  title: z.string().nonempty(),
  body: z.string(),
  tags: z.array(z.string().nonempty())
});
export type ParsedContent = z.infer<typeof parsedContentSchema>;
```

#### ブック

```typescript
export const bookSchema = z.object({
  id: idSchema,
  userId: idSchema,
  gitHubConnectionId: idSchema,
  owner: z.string().nonempty(),
  repository: z.string().nonempty(),
  details: bookDetailsSchema,
  syncStatus: syncStatusSchema,
  metadata: metadataSchema
});
export type Book = z.infer<typeof bookSchema>;
```

#### ブック詳細情報

```typescript
export const bookDetailsSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().nullable(),
});
export type BookDetails = z.infer<typeof bookDetailsSchema>;
```

#### 同期状態

```typescript
export const syncStatusSchema = z.object({
  lastSyncedAt: dateSchema.nullable(),
  status: z.enum(["IDLE", "SYNCING", "ERROR"]),
  error: z.string().nullable()
});
export type SyncStatus = z.infer<typeof syncStatusSchema>;
```

#### タグ

```typescript
export const tagSchema = z.object({
  id: idSchema,
  name: z.string().nonempty(),
  userId: idSchema,
  metadata: metadataSchema
});
export type Tag = z.infer<typeof tagSchema>;
```

#### タグ名

```typescript
export const tagNameSchema = z.string().nonempty();
export type TagName = z.infer<typeof tagNameSchema>;
```

### リポジトリインターフェース

#### ノートリポジトリ

```typescript
export interface NoteRepository {
  findById(id: ID): Promise<Result<Note | null, RepositoryError>>;
  findByUserIdAndPath(userId: ID, bookId: ID, path: string): Promise<Result<Note | null, RepositoryError>>;
  findByUserId(userId: ID): Promise<Result<Note[], RepositoryError>>;
  findByUserIdAndTag(userId: ID, tag: string): Promise<Result<Note[], RepositoryError>>;
  save(note: Note): Promise<Result<Note, RepositoryError>>;
  delete(id: ID): Promise<Result<void, RepositoryError>>;
}
```

#### ブックリポジトリ

```typescript
export interface BookRepository {
  findById(id: ID): Promise<Result<Book | null, RepositoryError>>;
  findByUserId(userId: ID): Promise<Result<Book[], RepositoryError>>;
  findByRepositoryId(repositoryId: ID): Promise<Result<Book | null, RepositoryError>>;
  save(book: Book): Promise<Result<Book, RepositoryError>>;
  delete(id: ID): Promise<Result<void, RepositoryError>>;
}
```

#### タグリポジトリ

```typescript
export interface TagRepository {
  findById(id: ID): Promise<Result<Tag | null, RepositoryError>>;
  findByName(name: string, userId: ID): Promise<Result<Tag | null, RepositoryError>>;
  findByUserId(userId: ID): Promise<Result<Tag[], RepositoryError>>;
  save(tag: Tag): Promise<Result<Tag, RepositoryError>>;
  delete(id: ID): Promise<Result<void, RepositoryError>>;
}
```

### ドメインサービスインターフェース

#### 同期サービス

```typescript
export interface SyncService {
  syncRepository(repositoryId: ID): Promise<Result<SyncResult, SyncError>>;
  syncFile(fileId: ID): Promise<Result<Note, SyncError>>;
  parseMarkdown(content: string): Promise<Result<ParsedContent, ParseError>>;
  handleWebhook(payload: WebhookPayload): Promise<Result<WebhookResult, WebhookError>>;
  validateWebhookSignature(payload: string, signature: string): Promise<Result<boolean, WebhookError>>;
}
```

#### タグ管理サービス

```typescript
export interface TagService {
  extractTags(content: string): Promise<Result<Tag[], TagError>>;
  associateTagsWithNote(noteId: ID, tagIds: ID[]): Promise<Result<void, TagError>>;
}
```

## アプリケーション層

### ユースケース入力/出力の型定義

#### ブック追加入力

```typescript
export const addBookInputSchema = z.object({
  userId: idSchema,
  gitHubConnectionId: idSchema,
  owner: z.string().nonempty(),
  repository: z.string().nonempty(),
  details: bookDetailsSchema
});
export type AddBookInput = z.infer<typeof addBookInputSchema>;
```

#### ブック一覧取得入力

```typescript
export const listBooksInputSchema = z.object({
  userId: idSchema
});
export type ListBooksInput = z.infer<typeof listBooksInputSchema>;
```

#### ブック取得入力

```typescript
export const getBookInputSchema = z.object({
  bookId: idSchema
});
export type GetBookInput = z.infer<typeof getBookInputSchema>;
```

#### ブック削除入力

```typescript
export const deleteBookInputSchema = z.object({
  bookId: idSchema
});
export type DeleteBookInput = z.infer<typeof deleteBookInputSchema>;
```

#### ノート同期入力

```typescript
export const syncNotesInputSchema = z.object({
  userId: idSchema,
  bookId: idSchema
});
export type SyncNotesInput = z.infer<typeof syncNotesInputSchema>;
```

#### ノート一覧取得入力

```typescript
export const listNotesInputSchema = z.object({
  userId: idSchema,
  bookId: idSchema,
  pagination: paginationSchema.optional()
});
export type ListNotesInput = z.infer<typeof listNotesInputSchema>;
```

#### ノート検索入力

```typescript
export const searchNotesInputSchema = z.object({
  userId: idSchema,
  query: searchQuerySchema,
  filters: z.record(z.unknown()).optional()
});
export type SearchNotesInput = z.infer<typeof searchNotesInputSchema>;
```

#### ノート取得入力

```typescript
export const getNoteInputSchema = z.object({
  noteId: idSchema
});
export type GetNoteInput = z.infer<typeof getNoteInputSchema>;
```

#### タグ一覧取得入力

```typescript
export const listTagsInputSchema = z.object({
  userId: idSchema.optional(),
  bookId: idSchema.optional()
});
export type ListTagsInput = z.infer<typeof listTagsInputSchema>;
```

#### タグフィルタリング入力

```typescript
export const filterNotesByTagInputSchema = z.object({
  tagIds: z.array(idSchema),
  pagination: paginationSchema.optional()
});
export type FilterNotesByTagInput = z.infer<typeof filterNotesByTagInputSchema>;
```

#### 同期状態確認入力

```typescript
export const checkBookSyncStatusInputSchema = z.object({
  bookId: idSchema
});
export type CheckBookSyncStatusInput = z.infer<typeof checkBookSyncStatusInputSchema>;
```

#### Webhook処理入力

```typescript
export const processWebhookInputSchema = z.object({
  payload: z.unknown(),
  signature: z.string().nonempty()
});
export type ProcessWebhookInput = z.infer<typeof processWebhookInputSchema>;
```

### ユースケースインターフェース

#### ブック追加ユースケース

```typescript
export interface AddBookUseCase {
  execute(input: AddBookInput): Promise<Result<Book, BookError>>;
}
```

#### ブック一覧取得ユースケース

```typescript
export interface ListBooksUseCase {
  execute(input: ListBooksInput): Promise<Result<Book[], RepositoryError>>;
}
```

#### ブック取得ユースケース

```typescript
export interface GetBookUseCase {
  execute(input: GetBookInput): Promise<Result<Book, RepositoryError>>;
}
```

#### ブック削除ユースケース

```typescript
export interface DeleteBookUseCase {
  execute(input: DeleteBookInput): Promise<Result<void, RepositoryError>>;
}
```

#### ノート同期ユースケース

```typescript
export interface SyncNotesUseCase {
  execute(input: SyncNotesInput): Promise<Result<Note[], SyncError>>;
}
```

#### ノート一覧取得ユースケース

```typescript
export interface ListNotesUseCase {
  execute(input: ListNotesInput): Promise<Result<Note[], RepositoryError>>;
}
```

#### ノート検索ユースケース

```typescript
export interface SearchNotesUseCase {
  execute(input: SearchNotesInput): Promise<Result<Note[], SearchError>>;
}
```

#### ノート取得ユースケース

```typescript
export interface GetNoteUseCase {
  execute(input: GetNoteInput): Promise<Result<Note, RepositoryError>>;
}
```

#### タグ一覧取得ユースケース

```typescript
export interface ListTagsUseCase {
  execute(input: ListTagsInput): Promise<Result<Tag[], RepositoryError>>;
}
```

#### タグフィルタリングユースケース

```typescript
export interface FilterNotesByTagUseCase {
  execute(input: FilterNotesByTagInput): Promise<Result<Note[], RepositoryError>>;
}
```

#### 同期状態確認ユースケース

```typescript
export interface CheckBookSyncStatusUseCase {
  execute(input: CheckBookSyncStatusInput): Promise<Result<SyncStatus, RepositoryError>>;
}
```

#### Webhook処理ユースケース

```typescript
export interface ProcessWebhookUseCase {
  execute(input: ProcessWebhookInput): Promise<Result<WebhookResult, WebhookError>>;
}
```

### アプリケーションエラー

#### ブック管理エラー

```typescript
export const bookErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "BOOK_NOT_FOUND",
  "DUPLICATE_BOOK",
  "INVALID_REPOSITORY",
  "REPOSITORY_ERROR"
]);
export type BookErrorCode = z.infer<typeof bookErrorCodeSchema>;

export interface BookError extends AnyError {
  name: "BookError";
  type: BookErrorCode;
  message: string;
  cause?: Error;
}
```

#### 同期エラー

```typescript
export const syncErrorCodeSchema = z.enum([
  "API_ERROR",
  "FILE_NOT_FOUND",
  "REPOSITORY_NOT_FOUND",
  "PARSE_ERROR",
  "ACCESS_DENIED",
  "RATE_LIMITED",
  "CONNECTION_ERROR"
]);
export type SyncErrorCode = z.infer<typeof syncErrorCodeSchema>;

export interface SyncError extends AnyError {
  name: "SyncError";
  type: SyncErrorCode;
  message: string;
  cause?: Error;
}
```

#### 検索エラー

```typescript
export const searchErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "INVALID_QUERY",
  "REPOSITORY_ERROR"
]);
export type SearchErrorCode = z.infer<typeof searchErrorCodeSchema>;

export interface SearchError extends AnyError {
  name: "SearchError";
  type: SearchErrorCode;
  message: string;
  cause?: Error;
}
```

#### タグ管理エラー

```typescript
export const tagErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "TAG_NOT_FOUND",
  "INVALID_TAG_NAME",
  "REPOSITORY_ERROR"
]);
export type TagErrorCode = z.infer<typeof tagErrorCodeSchema>;

export interface TagError extends AnyError {
  name: "TagError";
  type: TagErrorCode;
  message: string;
  cause?: Error;
}
```

#### Webhookエラー

```typescript
export const webhookErrorCodeSchema = z.enum([
  "INVALID_PAYLOAD",
  "INVALID_SIGNATURE",
  "UNSUPPORTED_EVENT",
  "PROCESSING_FAILED"
]);
export type WebhookErrorCode = z.infer<typeof webhookErrorCodeSchema>;

export interface WebhookError extends AnyError {
  name: "WebhookError";
  type: WebhookErrorCode;
  message: string;
  cause?: Error;
}
```

