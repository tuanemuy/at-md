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
| セッション | ユーザーの認証状態を表す不変な値。アクセストークンとその有効期限を含む。 |

## 責務

- ユーザー認証と認可を管理
- BlueskyのSSOを利用したアカウント連携
- GitHubとの連携設定（GitHub Appsインストール）
- セッションのライフサイクル管理

## ドメイン層

### エンティティ

- ユーザー: [User](../domain-types/account.md#ユーザー)
  - id, DID, profile, createdAt, updatedAt
- GitHub連携情報: [GitHubConnection](../domain-types/account.md#github連携情報)
  - id, userId, accessToken, refreshToken, expiresAt, scope, createdAt, updatedAt

### 値オブジェクト

- [Profile](../domain-types/account.md#Profile)
  - displayName, description, avatarUrl, bannerUrl
  - ユーザープロフィール
- [Session](../domain-types/account.md#Session)
  - did

### DTOs

- [GitHubInstallation](../domain-types/account.md#GitHubInstallation)
  - GitHubアプリのインストール情報

### リポジトリ

- ユーザーリポジトリ: [UserRepository](../domain-types/account.md#ユーザーリポジトリ)
- GitHub連携リポジトリ: [GitHubConnectionRepository](../domain-types/account.md#リポジトリインターフェース)

### アダプターインターフェース

#### Bluesky OAuthアダプター: [BlueskyAuthProvider](../domain-types/account.md#bluesky認証アダプター)

- `authorize(handle: string, options: AuthorizeOptions): Promise<Result<URL, ExternalServiceError>>`
- `callback(params: URLSearchParams): Promise<Result<Session, ExternalServiceError>>`
- `getUserProfile(did: string): Promise<Result<UserProfile, ExternalServiceError>>`

#### GitHub連携アダプター: [GitHubAppProvider](../domain-types/account.md#github連携アダプター)

- `getInstallations(accessToken: string): Promise<Result<GitHubInstallation[], ExternalServiceError>>`
## アプリケーション層

### ユースケース

#### Bluesky認証を開始する

- 実装: [StartBlueskyAuthUseCase](../domain-types/account.md#bluesky認証を開始する)
- 入力: [StartBlueskyAuthInput](../domain-types/account.md#bluesky認証を開始する)
  - handle
- 出力: Result<URL, AccountError>
- 処理: Bluesky OAuthのURLを取得

#### Bluesky認証のコールバックを処理する

- 実装: [HandleBlueskyAuthCallbackUseCase](../domain-types/account.md#bluesky認証のコールバックを処理する)
- 入力: [HandleBlueskyAuthCallbackInput](../domain-types/account.md#bluesky認証のコールバックを処理する)
  - params: URLSearchParams
- 出力: Result<Session, AccountError>
- 処理: セッションを作成する。必要に応じてアカウントを作成

#### セッションを検証する

- 実装: [ValidateSessionUseCase](../domain-types/account.md#セッションを検証する)
- 入力: [ValidateSessionInput](../domain-types/account.md#セッションを検証する)
  - token: string
- 出力: Result<Session, AccountError>
- 処理: アクセストークンの有効性を検証

#### セッションを更新する

- 実装: [RefreshSessionUseCase](../domain-types/account.md#セッションを更新する)
- 入力: [RefreshSessionInput](../domain-types/account.md#セッションを更新する)
  - token: string
- 出力: Result<Session, AccountError>
- 処理: 新しいセッションを作成して返却

#### ログアウトする

- 実装: [LogoutUseCase](../domain-types/account.md#ログアウトする)
- 入力: [LogoutInput](../domain-types/account.md#ログアウトする)
  - token: string
- 出力: Result<void, AccountError>
- 処理: セッションを無効化

#### GitHubと連携する

- 実装: [ConnectGitHubUseCase](../domain-types/account.md#githubと連携する)
- 入力: [ConnectGitHubInput](../domain-types/account.md#githubと連携する)
  - userId, code
- 出力: Result<void, AccountError>
- 処理: codeからアクセストークンを取得し、GitHub連携情報を保存

#### GitHubとの連携を解除する

- 実装: [DisconnectGitHubUseCase](../domain-types/account.md#githubとの連携を解除する)
- 入力: [DisconnectGitHubInput](../domain-types/account.md#githubとの連携を解除する)
  - userId, githubConnectionId
- 出力: Result<void, AccountError>
- 処理: GitHub連携情報を削除

#### ユーザー情報を取得する

- 実装: [GetUserByIdUseCase](../domain-types/account.md#ユーザー情報を取得する)
- 入力: [GetUserByIdInput](../domain-types/account.md#ユーザー情報を取得する)
  - userId
- 出力: Result<User, AccountError>
- 処理: 指定されたIDのユーザー情報を取得

#### プロフィールを更新する

- 実装: [UpdateProfileUseCase](../domain-types/account.md#プロフィールを更新する)
- 入力: [UpdateProfileInput](../domain-types/account.md#プロフィールを更新する)
  - userId, displayName, description, avatarUrl, bannerUrl
- 出力: Result<User, AccountError>
- 処理: ユーザープロフィールを更新して保存

#### ユーザーを削除する

- 実装: [DeleteUserUseCase](../domain-types/account.md#ユーザーを削除する)
- 入力: [DeleteUserInput](../domain-types/account.md#ユーザーを削除する)
  - userId
- 出力: Result<void, AccountError>
- 処理: ユーザーとその関連データを削除する

#### ユーザーのGitHub連携一覧を取得する

- 実装: [ListGitHubConnectionsUseCase](../domain-types/account.md#ユーザーのgithub連携一覧を取得する)
- 入力: [ListGitHubConnectionsInput](../domain-types/account.md#ユーザーのgithub連携一覧を取得する)
  - userId
- 出力: Result<GitHubConnection[], AccountError>
- 処理: ユーザーに紐づくGitHub連携情報を取得する

## エラー処理

アカウント管理コンテキストでは、以下のエラーを定義しています：

- アカウント管理エラー
  - 型定義: [AccountError](../domain-types/account.md#アカウント管理エラー)
