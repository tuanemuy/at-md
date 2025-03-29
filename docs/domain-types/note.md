# ノート管理コンテキストの型定義

このファイルでは、[ノート管理コンテキスト](../domains/note.md)で定義されたドメインモデルの型定義を提供します。

## ドメイン層

### エンティティ

#### ノート

```typescript
export const noteScopeSchema = z.enum(["public", "private", "limited"]);
export type NoteScope = z.infer<typeof noteSchema>;

export const noteSchema = z.object({
  id: idSchema,
  userId: idSchema,
  bookId: idSchema,
  path: z.string().nonempty(),
  title: z.string().nonempty(),
  body: z.string(),
  scope: noteScopeSchema,
  tags: z.array(tagSchema).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Note = z.infer<typeof noteSchema>;
```

#### ブック

```typescript
export const bookSchema = z.object({
  id: idSchema,
  userId: idSchema,
  owner: z.string().nonempty(),
  repo: z.string().nonempty(),
  details: bookDetailsSchema,
  syncStatus: syncStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date()
});
export type Book = z.infer<typeof bookSchema>;
```

#### タグ

```typescript
export const tagSchema = z.object({
  id: idSchema,
  name: z.string().nonempty(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type Tag = z.infer<typeof tagSchema>;
```

### 値オブジェクト

#### BookDetails

```typescript
export const bookDetailsSchema = z.object({
  name: z.string().nonempty(),
  description: z.string()
});
export type BookDetails = z.infer<typeof bookDetailsSchema>;
```

#### SyncStatus

```typescript
export const syncStatusSchema = z.object({
  lastSyncedAt: dateSchema.nullable(),
  status: z.enum(["SYNCING", "SYNCED", "ERROR"])
});
export type SyncStatus = z.infer<typeof syncStatusSchema>;
```

### エラー

#### ノート管理エラー

```typescript
export const noteErrorCodeSchema = z.enum([
  // 同期関連
  "SYNC_IN_PROGRESS",
  "SYNC_FAILED",
  "INVALID_CONTENT",
  "PARSE_ERROR",
  // ブック関連
  "BOOK_NOT_FOUND",
  "BOOK_ALREADY_EXISTS",
  "INVALID_REPOSITORY",
  "WEBHOOK_SETUP_FAILED",
  // タグ関連
  "TAG_NOT_FOUND",
  "TAG_ALREADY_EXISTS",
  "INVALID_TAG_NAME",
  // ノート関連
  "NOTE_NOT_FOUND",
  "NOTE_ALREADY_EXISTS",
  "INVALID_NOTE_FORMAT",
  // 検索関連
  "SEARCH_FAILED",
  "INVALID_QUERY"
]);
export type NoteErrorCode = z.infer<typeof noteErrorCodeSchema>;

export interface NoteError extends AnyError {
  name: "NoteError";
  type: NoteErrorCode;
  message: string;
  cause?: Error;
}
```

### アダプターインターフェース

#### GitHub連携アダプター

```typescript
export interface GitHubContentProvider {
  listRepositories(accessToken: string): Promise<Result<GitHubRepository[], ExternalServiceError>>;
  getContent(accessToken: string, owner: string, repo: string, path: string): Promise<Result<string, ExternalServiceError>>;
  listPaths(accessToken: string, owner: string, repo: string): Promise<Result<string[], ExternalServiceError>>;
  setupWebhook(accessToken: string, owner: string, repo: string): Promise<Result<number, ExternalServiceError>>;
}
```

### リポジトリインターフェース

```typescript
export interface NoteRepository {
  save(note: CreateNote): Promise<Result<Note, RepositoryError>>;
  findById(id: string): Promise<Result<Note, RepositoryError>>;
  findByBookId(bookId: string): Promise<Result<Note[], RepositoryError>>;
  findByTag(tagId: string): Promise<Result<Note[], RepositoryError>>;
  search(query: string): Promise<Result<Note[], RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}

export interface BookRepository {
  save(book: CreateBook): Promise<Result<Book, RepositoryError>>;
  findById(id: string): Promise<Result<Book, RepositoryError>>;
  findByUserId(userId: string): Promise<Result<Book[], RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}

export interface TagRepository {
  save(tag: CreateTag): Promise<Result<Tag, RepositoryError>>;
  findById(id: string): Promise<Result<Tag, RepositoryError>>;
  findByBookId(bookId: string): Promise<Result<Tag[], RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}
```

### ユースケース

#### リポジトリ一覧を取得する

```typescript
export interface ListRepositoriesInput {
  userId: string;
}

export interface ListRepositoriesUseCase {
  execute(input: ListRepositoriesInput): Promise<Result<GitHubRepository[], NoteError>>;
}
```

#### ブックを追加する

```typescript
export interface AddBookInput {
  userId: string;
  owner: string;
  repo: string;
}

export interface AddBookUseCase {
  execute(input: AddBookInput): Promise<Result<Book, NoteError>>;
}
```

#### ブック一覧を取得する

```typescript
export interface ListBooksInput {
  userId: string;
}

export interface ListBooksUseCase {
  execute(input: ListBooksInput): Promise<Result<Book[], NoteError>>;
}
```

#### ブック情報を取得する

```typescript
export interface GetBookInput {
  bookId: string;
}

export interface GetBookUseCase {
  execute(input: GetBookInput): Promise<Result<Book, NoteError>>;
}
```

#### ブックを削除する

```typescript
export interface DeleteBookInput {
  userId: string;
  bookId: string;
}

export interface DeleteBookUseCase {
  execute(input: DeleteBookInput): Promise<Result<void, NoteError>>;
}
```

#### GitHubのPushからノートを作成する

```typescript
export interface PushNotesInput {
  userId: string;
  owner: string;
  repo: string;
  installationId: number;
  commits: GitHubCommit[];
}

export interface PushNotesUseCase {
  execute(input: PushNotesInput): Promise<Result<Note[], NoteError>>;
}
```

#### ノートを同期する

```typescript
export interface SyncNotesInput {
  userId: string;
  commits: GitHubCommit[];
}

export interface SyncNotesUseCase {
  execute(input: SyncNotesInput): Promise<Result<Note[], NoteError>>;
}
```

#### ノート一覧を取得する

```typescript
export interface ListNotesInput {
  bookId: string;
  pagination: PaginationParams;
}

export interface ListNotesUseCase {
  execute(input: ListNotesInput): Promise<Result<Note[], NoteError>>;
}
```

#### ノートを検索する

```typescript
export interface SearchNotesInput {
  bookId: string;
  query: string;
  pagination: PaginationParams;
}

export interface SearchNotesUseCase {
  execute(input: SearchNotesInput): Promise<Result<Note[], NoteError>>;
}
```

#### ノート情報を取得する

```typescript
export interface GetNoteInput {
  noteId: string;
}

export interface GetNoteUseCase {
  execute(input: GetNoteInput): Promise<Result<Note, NoteError>>;
}
```

#### タグ一覧を取得する

```typescript
export interface ListTagsInput {
  bookId: string;
}

export interface ListTagsUseCase {
  execute(input: ListTagsInput): Promise<Result<Tag[], NoteError>>;
}
```

#### タグでノートをフィルタリングする

```typescript
export interface ListNotesByTagInput {
  bookId: string;
  tagId: string;
}

export interface ListNotesByTagUseCase {
  execute(input: ListNotesByTagInput): Promise<Result<Note[], NoteError>>;
}
```

#### ブックの同期状態を確認する

```typescript
export interface CheckBookSyncStatusInput {
  bookId: string;
}

export interface CheckBookSyncStatusUseCase {
  execute(input: CheckBookSyncStatusInput): Promise<Result<SyncStatus, NoteError>>;
}
```
