# ノート管理コンテキスト

このファイルでは、ノート管理コンテキストのドメインモデルを定義します。対応する型定義は[ノート管理コンテキスト型定義](../domain-types/note.md)を参照してください。

## ユビキタス言語

| 用語 | 定義 |
|------|------|
| ノート | GitHubリポジトリに保存されたMarkdownテキスト。システムで管理される基本単位。 |
| ブック | GitHubリポジトリに紐づいたノートの集合。 |
| タグ | ノートを分類するためのラベル。複数のノートに付与可能。 |
| 同期 | GitHubリポジトリから最新のノートを取得し、データベースに反映するプロセス。 |
| Webhook | GitHubからの変更通知を受け取るための仕組み。 |

## 責務

- GitHubからのノート取得（Webhook経由）
- ノートの保存
- ブックの管理
- タグの管理
- ブックの取得
- ノートの取得

## ドメイン層

### エンティティ

- ノート: [Note](../domain-types/note.md#ノート)
  - id, userId, bookId, path, title, body, scope, tags, createdAt, updatedAt
- ブック: [Book](../domain-types/note.md#ブック)
  - id, userId, owner, repo, details, syncStatus, createdAt, updatedAt
- タグ: [Tag](../domain-types/note.md#タグ)
  - id, name, createdAt, updatedAt

### 値オブジェクト

- [BookDetails](../domain-types/note.md#BookDetails)
  - ブックの詳細
  - name, description
- [SyncStatus](../domain-types/note.md#SyncStatus)
  - ブックの同期状況
  - status, lastSyncedAt

### DTOs

- [GitHubRepository](../domain-types/account.md#GitHubRepository)
  - GitHubリポジトリ情報

### リポジトリ

- ノートリポジトリ: [NoteRepository](../domain-types/note.md#リポジトリインターフェース)
- ブックリポジトリ: [BookRepository](../domain-types/note.md#リポジトリインターフェース)
- タグリポジトリ: [TagRepository](../domain-types/note.md#リポジトリインターフェース)

### アダプターインターフェース

#### GitHub連携アダプター: [GitHubContentProvider](../domain-types/note.md#github連携アダプター)

- `listRepositories(): Promise<Result<GitHubRepository[], ExternalServiceError>>`
- `getContent(owner: string, repo: string, path: string): Promise<Result<string, ExternalServiceError>>`
- `listPaths(owner: string, repo: string): Promise<Result<string[], ExternalServiceError>>`
- `setupWebhook(owner: string, repo: string): Promise<Result<GitHubWebhook, ExternalServiceError>>`

## アプリケーション層

### ユースケース

#### リポジトリ一覧を取得する

- 実装: [ListRepositoriesUseCase](../domain-types/note.md#リポジトリ一覧を取得する)
- 入力: [ListRepositoriesInput](../domain-types/note.md#リポジトリ一覧を取得する)
  - userId
- 出力: Result<GitHubRepository[], NoteError>
- 処理: ブックとして追加できるGitHubリポジトリの一覧を取得する

#### ブックを追加する

- 実装: [AddBookUseCase](../domain-types/note.md#ブックを追加する)
- 入力: [AddBookInput](../domain-types/note.md#ブックを追加する)
  - userId, owner, repo
- 出力: Result<Book, NoteError>
- 処理: 指定されたリポジトリの情報を取得し、ブック情報の登録とWebhookの設定を行う

#### ブック一覧を取得する

- 実装: [ListBooksUseCase](../domain-types/note.md#ブック一覧を取得する)
- 入力: [ListBooksInput](../domain-types/note.md#ブック一覧を取得する)
  - userId
- 出力: Result<Book[], NoteError>
- 処理: ブック情報一覧を取得

#### ブック情報を取得する

- 実装: [GetBookUseCase](../domain-types/note.md#ブック情報を取得する)
- 入力: [GetBookInput](../domain-types/note.md#ブック情報を取得する)
  - bookId
- 出力: Result<Book, NoteError>
- 処理: 指定されたIDのブック情報を取得

#### ブックを削除する

- 実装: [DeleteBookUseCase](../domain-types/note.md#ブックを削除する)
- 入力: [DeleteBookInput](../domain-types/note.md#ブックを削除する)
  - userId, bookId
- 出力: Result<void, NoteError>
- 処理: ブック情報を削除

#### ノートを同期する

- 実装: [SyncNotesUseCase](../domain-types/note.md#ノートを同期する)
- 入力: [SyncNotesInput](../domain-types/note.md#ノートを同期する)
  - commits
- 出力: Result<Note[], NoteError>
- 処理: GitHubのコミット情報を基にGitHubからファイルを取得し、パースしてデータベースに保存。タグも解析してデータベースに保存

#### ノート一覧を取得する

- 実装: [ListNotesUseCase](../domain-types/note.md#ノート一覧を取得する)
- 入力: [ListNotesInput](../domain-types/note.md#ノート一覧を取得する)
  - bookId, pagination
- 出力: Result<Note[], NoteError>
- 処理: ノート一覧を取得

#### ノートを検索する

- 実装: [SearchNotesUseCase](../domain-types/note.md#ノートを検索する)
- 入力: [SearchNotesInput](../domain-types/note.md#ノートを検索する)
  - bookId, query, pagination
- 出力: Result<Note[], NoteError>
- 処理: 検索クエリで絞り込んだノート一覧を取得

#### ノート情報を取得する

- 実装: [GetNoteUseCase](../domain-types/note.md#ノート情報を取得する)
- 入力: [GetNoteInput](../domain-types/note.md#ノート情報を取得する)
  - noteId
- 出力: Result<Note, NoteError>
- 処理: ノート情報を取得

#### タグ一覧を取得する

- 実装: [ListTagsUseCase](../domain-types/note.md#タグ一覧を取得する)
- 入力: [ListTagsInput](../domain-types/note.md#タグ一覧を取得する)
  - bookId
- 出力: Result<Tag[], NoteError>
- 処理: ブックに使われているタグ一覧を取得

#### タグでノートをフィルタリングする

- 実装: [ListNotesByTagUseCase](../domain-types/note.md#タグでノートをフィルタリングする)
- 入力: [ListNotesByTagInput](../domain-types/note.md#タグでノートをフィルタリングする)
  - bookId, tagId
- 出力: Result<Note[], NoteError>
- 処理: 指定されたタグを持つノート一覧を取得

#### ブックの同期状態を確認する

- 実装: [CheckBookSyncStatusUseCase](../domain-types/note.md#ブックの同期状態を確認する)
- 入力: [CheckBookSyncStatusInput](../domain-types/note.md#ブックの同期状態を確認する)
  - bookId
- 出力: Result<SyncStatus, NoteError>
- 処理: ブックの同期状態を確認

## エラー処理

ノート管理コンテキストでは、以下のエラーを定義しています：

- ノート管理エラー: [NoteError](../domain-types/note.md#ノート管理エラー)
