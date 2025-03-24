# 投稿管理コンテキスト

このファイルでは、投稿管理コンテキストのドメインモデルを定義します。対応する型定義は[投稿管理コンテキスト型定義](../domain-types/post.md)を参照してください。

## ユビキタス言語

| 用語 | 定義 |
|------|------|
| 投稿 | ノートをBlueskyに公開するアクション、またはその結果としてのBluesky上のコンテンツ。 |
| 投稿ステータス | 投稿の状態（投稿済み、エラーなど）を表す。 |
| Bluesky | 分散型ソーシャルネットワークプラットフォーム。ATプロトコルを使用。 |
| エンゲージメント | Blueskyからの反応（いいね、リポストなど）。 |

## 責務

- ノートのBlueskyへの投稿処理
- 投稿メタデータの管理
- 投稿ステータスの追跡
- エンゲージメント情報の取得

## ドメイン層

### エンティティ

- 投稿: [Post](../domain-types/post.md#投稿)
  - id, userId, noteId, status, createdAt, updatedAt
- エンゲージメント: [Engagement](../domain-types/post.md#エンゲージメント)
  - likes, reposts, quotes, replies
  - Blueskyからの反応情報（いいね、リポスト、引用、返信など）

### リポジトリ

- 投稿リポジトリ: [PostRepository](../domain-types/post.md#リポジトリインターフェース)

### アダプターインターフェース

#### Blueskyアダプター: [BlueskyPostProvider](../domain-types/post.md#blueskyアダプター)

- `createPost(did: DID, text: string): Promise<Result<BlueskyPost, ExternalServiceError>>`
- `getEngagement(did: DID, uri: string): Promise<Result<Engagement, ExternalServiceError>>`

## アプリケーション層

### ユースケース

#### ノートを投稿する

- 実装: [PostNoteUseCase](../domain-types/post.md#ノートを投稿する)
- 入力: [PostNoteInput](../domain-types/post.md#ノートを投稿する)
  - userId, noteId, text
- 出力: Result<Post, PostError>
- 処理: ノートをBlueskyに投稿し、投稿情報を保存

#### エンゲージメントを取得する

- 実装: [GetEngagementUseCase](../domain-types/post.md#エンゲージメントを取得する)
- 入力: [GetEngagementInput](../domain-types/post.md#エンゲージメントを取得する)
  - noteId
- 出力: Result<Engagement, PostError>
- 処理: ノートに紐づいた投稿のエンゲージメント情報をBlueskyから取得する

#### 投稿のステータスを確認する

- 実装: [CheckPostStatusUseCase](../domain-types/post.md#投稿のステータスを確認する)
- 入力: [CheckPostStatusInput](../domain-types/post.md#投稿のステータスを確認する)
  - noteId
- 出力: Result<PostStatus, PostError>
- 処理: ノートに紐づいた投稿の現在のステータスを確認

#### 投稿を再試行する
 
- 実装: [RetryPostUseCase](../domain-types/post.md#投稿を再試行する)
- 入力: [RetryPostInput](../domain-types/post.md#投稿を再試行する)
  - userId, noteId
- 出力: Result<Post, PostError>
- 処理: 失敗した投稿を再試行する

## エラー処理

投稿管理コンテキストでは、以下のエラーを定義しています：

- 投稿管理エラー: [PostError](../domain-types/post.md#投稿管理エラー)
