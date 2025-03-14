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

## 外部システムとの関係

- **Bluesky**: ATプロトコルを通じた投稿先のプラットフォーム

## ドメイン層

### エンティティ

- 投稿
  - 型定義: [Post型](../domain-types/post.md#投稿)

### 値オブジェクト

- PostStatus
  - 型定義: [PostStatus型](../domain-types/post.md#PostStatus)
  - 説明: 投稿の状態を表す値オブジェクト
- BlueskyURI
  - 型定義: [BlueskyURI型](../domain-types/post.md#BlueskyURI)
- Engagement
  - 型定義: [Engagement型](../domain-types/post.md#Engagement)
  - 説明: Blueskyからの反応情報（いいね、リポスト、引用、返信など）を表す値オブジェクト
- Comment
  - 型定義: [Comment型](../domain-types/post.md#Comment)

### 集約

- 投稿集約
  - ルートエンティティ: Post
  - 責務: 投稿情報の管理

### リポジトリ

- 投稿リポジトリ
  - 責務: 投稿エンティティの永続化と取得
  - 型定義: [PostRepository](../domain-types/post.md#投稿リポジトリ)

### ドメインサービス

- 投稿サービス（PostingService）
  - 責務: Blueskyへの投稿処理
  - 型定義: [PostingService](../domain-types/post.md#投稿サービス)
- エンゲージメント取得サービス（EngagementService）
  - 責務: Blueskyからのエンゲージメント情報取得処理
  - 型定義: [EngagementService](../domain-types/post.md#エンゲージメント取得サービス)

## アプリケーション層

### ユースケース

#### 1. ノートを投稿する

- 実装: `PostNoteUseCase`
- 入力: ユーザーID、ノートID
- 出力: 作成された投稿情報
- 処理: ノートをBlueskyに投稿し、投稿情報を保存
- 型定義: [PostNoteUseCase](../domain-types/post.md#ノート投稿ユースケース)

#### 2. エンゲージメントを取得する

- 実装: `GetEngagementUseCase`
- 入力: 投稿URI
- 出力: 取得したエンゲージメント情報
- 処理: 特定のノートに紐づく投稿のエンゲージメント情報をBlueskyから取得する
- 型定義: [GetEngagementUseCase](../domain-types/post.md#エンゲージメント取得ユースケース)

#### 3. 投稿のステータスを確認する

- 実装: `CheckPostStatusUseCase`
- 入力: 投稿ID
- 出力: 投稿ステータス情報
- 処理: 投稿の現在のステータスを確認
- 型定義: [CheckPostStatusUseCase](../domain-types/post.md#投稿ステータス確認ユースケース)

## エラー処理

投稿管理コンテキストでは、以下のエラーを定義しています：

- 投稿エラー
  - 型定義: [PostError](../domain-types/post.md#投稿エラー)
- エンゲージメント取得エラー
  - 型定義: [EngagementError](../domain-types/post.md#エンゲージメント取得エラー)
