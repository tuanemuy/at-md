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

## 外部システムとの関係

- **GitHub**: ノートのソースとなるリポジトリを提供
  - Webhookによる変更通知
  - GitHub APIを通じたファイル取得

## ドメイン層

### エンティティ

- ノート
  - 型定義: [Note型](../domain-types/note.md#ノート)
- ブック
  - 型定義: [Book型](../domain-types/note.md#ブック)
- タグ
  - 型定義: [Tag型](../domain-types/note.md#タグ)

### 値オブジェクト

- BookDetails
  - 型定義: [BookDetails型](../domain-types/note.md#BookDetails)
- TagName
  - 型定義: [TagName型](../domain-types/note.md#TagName)

### 集約

- ノート集約
  - ルートエンティティ: Note
  - 責務: ノートの内容と関連メタデータの管理
- ブック集約
  - ルートエンティティ: Book
  - 責務: ブック情報の管理
- タグ集約
  - ルートエンティティ: Tag
  - 責務: タグ情報の管理

### リポジトリ

- ノートリポジトリ
  - 責務: ノートエンティティの永続化と取得
  - 型定義: [NoteRepository](../domain-types/note.md#ノートリポジトリ)
- ブックリポジトリ
  - 責務: ブックエンティティの永続化と取得
  - 型定義: [BookRepository](../domain-types/note.md#ブックリポジトリ)
- タグリポジトリ
  - 責務: タグエンティティの永続化と取得
  - 型定義: [TagRepository](../domain-types/note.md#タグリポジトリ)

### ドメインサービス

- 同期サービス（SyncService）
  - 責務: GitHubからのノート取得と同期
  - 型定義: [SyncService](../domain-types/note.md#同期サービス)
- タグ管理サービス（TagService）
  - 責務: ノートからのタグ抽出と管理
  - 型定義: [TagService](../domain-types/note.md#タグ管理サービス)

## アプリケーション層

### ユースケース

#### 1. ブックを追加する

- 実装: `AddBookUseCase`
- 入力: ユーザーID、GitHub連携情報ID、リポジトリ情報（オーナー名、リポジトリ名）
- 出力: 登録されたブック情報
- 処理: リポジトリの `README.md` を解析し、ブック情報を登録
- 型定義: [AddBookUseCase](../domain-types/note.md#ブック追加ユースケース)

#### 2. ブック一覧を取得する

- 実装: `ListBooksUseCase`
- 入力: ユーザーID
- 出力: 取得したブック一覧情報
- 処理: ブック情報一覧を取得
- 型定義: [ListBooksUseCase](../domain-types/note.md#ブック一覧取得ユースケース)

#### 3. ブック情報を取得する

- 実装: `GetBookUseCase`
- 入力: ブックID
- 出力: 取得したブック情報
- 処理: 指定されたIDのブック情報を取得
- 型定義: [GetBookUseCase](../domain-types/note.md#ブック取得ユースケース)

#### 4. ブックを削除する

- 実装: `DeleteBookUseCase`
- 入力: ブックID
- 出力: 削除されたブック情報
- 処理: ブック情報を削除
- 型定義: [DeleteBookUseCase](../domain-types/note.md#ブック削除ユースケース)

#### 5. ノートを同期する

- 実装: `SyncNotesUseCase`
- 入力: ユーザーID、ブックID
- 出力: 同期されたノートのリスト
- 処理: GitHubからファイルを取得し、パースしてデータベースに保存。タグも解析してデータベースに保存
- 型定義: [SyncNotesUseCase](../domain-types/note.md#ノート同期ユースケース)

#### 6. Webhookを処理する

- 実装: `ProcessWebhookUseCase`
- 入力: Webhookペイロード
- 出力: 処理結果
- 処理: GitHubからのWebhook通知を処理し、必要に応じてブック情報とノートを同期
- 型定義: [ProcessWebhookUseCase](../domain-types/note.md#webhook処理ユースケース)

#### 7. ノート一覧を取得する

- 実装: `ListNotesUseCase`
- 入力: ユーザーID、ブックID、ページネーション情報
- 出力: 取得したノート一覧
- 処理: ノート一覧を取得
- 型定義: [ListNotesUseCase](../domain-types/note.md#ノート一覧取得ユースケース)

#### 8. ノートを検索する

- 実装: `SearchNotesUseCase`
- 入力: 検索クエリ、ページネーション情報
- 出力: 取得したノート一覧
- 処理: 検索クエリで絞り込んだノート一覧を取得
- 型定義: [SearchNotesUseCase](../domain-types/note.md#ノート検索ユースケース)

#### 9. ノート情報を取得する

- 実装: `GetNoteUseCase`
- 入力: ノートID
- 出力: 取得したノート情報
- 処理: ノート情報を取得
- 型定義: [GetNoteUseCase](../domain-types/note.md#ノート取得ユースケース)

#### 10. タグ一覧を取得する

- 実装: `ListTagsUseCase`
- 入力: ユーザーID（オプション）、ブックID（オプション）
- 出力: 取得したタグ一覧
- 処理: 条件に合致するタグ一覧を取得
- 型定義: [ListTagsUseCase](../domain-types/note.md#タグ一覧取得ユースケース)

#### 11. タグでノートをフィルタリングする

- 実装: `FilterNotesByTagUseCase`
- 入力: タグID（複数可）、ページネーション情報
- 出力: フィルタリングされたノート一覧
- 処理: 指定されたタグを持つノート一覧を取得
- 型定義: [FilterNotesByTagUseCase](../domain-types/note.md#タグフィルタリングユースケース)

#### 12. ブックの同期状態を確認する

- 実装: `CheckBookSyncStatusUseCase`
- 入力: ブックID
- 出力: 同期状態情報（最終同期日時、同期状態など）
- 処理: ブックの同期状態を確認
- 型定義: [CheckBookSyncStatusUseCase](../domain-types/note.md#同期状態確認ユースケース)

## エラー処理

ノート管理コンテキストでは、以下のエラーを定義しています：

- 同期エラー
  - 型定義: [SyncError](../domain-types/note.md#同期エラー)
- ブック管理エラー
  - 型定義: [BookError](../domain-types/note.md#ブック管理エラー)
- タグ管理エラー
  - 型定義: [TagError](../domain-types/note.md#タグ管理エラー)
- Webhookエラー
  - 型定義: [WebhookError](../domain-types/note.md#webhookエラー)
