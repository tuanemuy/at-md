# アカウント管理コンテキスト

このファイルでは、アカウント管理コンテキストのドメインモデルを定義します。対応する型定義は[アカウント管理コンテキスト型定義](../domain-types/account.md)を参照してください。

## ユビキタス言語

| 用語 | 定義 |
|------|------|
| ユーザー | システムを利用する人。認証情報と権限を持つ。 |
| DID | Blueskyで使用される分散型識別子。ユーザーの一意な識別子として使用。 |
| 認証 | ユーザーの身元を確認するプロセス。Bluesky SSOを使用。 |
| 認可 | ユーザーが特定の操作を実行する権限を持っているかを確認するプロセス。 |
| 連携 | ユーザーとGitHubアカウントの紐付け。GitHub Appsを使用。 |
| インストール | GitHub Appsをユーザーのリポジトリにインストールするプロセス。ブックのソースとなる。 |

## 責務

- ユーザー認証と認可を管理
- BlueskyのSSOを利用したアカウント連携
- GitHubとの連携設定（GitHub Appsインストール）

## 外部システムとの関係

- **Bluesky**: SSOによる認証を提供
- **GitHub**: GitHub Appsを通じたリポジトリアクセスを提供

## ドメイン層

### エンティティ

- ユーザー
  - 型定義: [User型](../domain-types/account.md#ユーザー)
- GitHub連携情報
  - 型定義: [GitHubConnection型](../domain-types/account.md#github連携情報)
- セッション
  - 型定義: [Session型](../domain-types/account.md#セッション)

### 値オブジェクト

- DID
  - 型定義: [DID型](../domain-types/account.md#DID)
- GitHubInstallationId
  - 型定義: [GitHubInstallationId型](../domain-types/account.md#GitHubInstallationId)
- UserProfile
  - 型定義: [UserProfile型](../domain-types/account.md#UserProfile)
- SessionToken
  - 型定義: [SessionToken型](../domain-types/account.md#SessionToken)

### 集約

- ユーザー集約
  - ルートエンティティ: User
  - 責務: ユーザー情報とGitHub連携の管理
- セッション集約
  - ルートエンティティ: Session
  - 責務: ユーザーセッションの管理

### リポジトリ

- ユーザーリポジトリ
  - 責務: ユーザーエンティティの永続化と取得
  - 型定義: [UserRepository](../domain-types/account.md#ユーザーリポジトリ)
- セッションリポジトリ
  - 責務: セッションエンティティの永続化と取得
  - 型定義: [SessionRepository](../domain-types/account.md#セッションリポジトリ)

### ドメインサービス

- 認証サービス
  - 認証ロジックの実装
  - 認可ルールの適用
  - 型定義: [AuthService](../domain-types/account.md#認証サービス)
- GitHub連携サービス
  - GitHub Appsのインストール
  - アクセストークンの取得と更新
  - 型定義: [GitHubService](../domain-types/account.md#github連携サービス)
- セッション管理サービス
  - セッションの作成、検証、無効化
  - 型定義: [SessionService](../domain-types/account.md#セッション管理サービス)

## アプリケーション層

### ユースケース

#### 1. Blueskyでアカウント登録する

- 実装: `AuthenticateWithBlueskyUseCase`
- 入力: Blueskyの認証情報（DID、JWT）
- 出力: 登録されたユーザー情報
- 処理: Blueskyの認証情報を検証し、新規ユーザーを作成
- 型定義: [RegisterUserUseCase](../domain-types/account.md#ユーザー登録ユースケース)

#### 2. Blueskyでログインする

- 実装: `LoginWithBlueskyUseCase`
- 入力: Blueskyの認証情報（DID、JWT）
- 出力: 認証されたユーザー情報とセッション
- 処理: Blueskyの認証情報を検証し、既存ユーザーを認証

#### 3. GitHubと連携する

- 実装: `ConnectGitHubUseCase`
- 入力: ユーザーID、GitHubインストールID
- 出力: GitHub連携情報
- 処理: GitHub Appsのインストール情報を保存し、アクセストークンを取得
- 型定義: [ConnectGitHubUseCase](../domain-types/account.md#github連携ユースケース)

#### 4. GitHubとの連携を解除する

- 実装: `DisconnectGitHubUseCase`
- 入力: ユーザーID、GitHub連携ID
- 出力: なし
- 処理: GitHub Appsのインストール情報とアクセストークンを削除
- 型定義: [DisconnectGitHubUseCase](../domain-types/account.md#github連携解除ユースケース)

#### 5. ユーザー情報を取得する

- 実装: `GetUserByIdUseCase`
- 入力: ユーザーID
- 出力: ユーザー情報
- 処理: 指定されたIDのユーザー情報を取得

#### 6. ユーザー情報を更新する

- 実装: `UpdateUserUseCase`
- 入力: ユーザーID、更新情報
- 出力: 更新されたユーザー情報
- 処理: ユーザー情報を更新して保存

#### 7. ユーザーを削除する

- 実装: `DeleteUserUseCase`
- 入力: ユーザーID
- 出力: 削除結果
- 処理: ユーザーとその関連データを削除する
- 型定義: [DeleteUserUseCase](../domain-types/account.md#ユーザー削除ユースケース)

#### 8. ユーザーのGitHub連携一覧を取得する

- 実装: `ListGitHubConnectionsUseCase`
- 入力: ユーザーID
- 出力: GitHub連携情報のリスト
- 処理: ユーザーに紐づくGitHub連携情報を取得する
- 型定義: [ListGitHubConnectionsUseCase](../domain-types/account.md#github連携一覧取得ユースケース)

#### 9. セッションを検証する

- 実装: `ValidateSessionUseCase`
- 入力: セッショントークン
- 出力: 検証結果（有効なユーザー情報または無効）
- 処理: セッショントークンの有効性を検証し、対応するユーザー情報を返す
- 型定義: [ValidateSessionUseCase](../domain-types/account.md#セッション検証ユースケース)

#### 10. ログアウトする

- 実装: `LogoutUseCase`
- 入力: セッションID
- 出力: ログアウト結果
- 処理: セッションを無効化する
- 型定義: [LogoutUseCase](../domain-types/account.md#ログアウトユースケース)

## エラー処理

アカウント管理コンテキストでは、以下のエラーを定義しています：

- 認証エラー
  - 型定義: [AuthError](../domain-types/account.md#認証エラー)
- ユーザー登録エラー
  - 型定義: [RegisterUserError](../domain-types/account.md#ユーザー登録エラー)
- GitHub連携エラー
  - 型定義: [ConnectGitHubError](../domain-types/account.md#github連携エラー)
- セッションエラー
  - 型定義: [SessionError](../domain-types/account.md#セッションエラー)
