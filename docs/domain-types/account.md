# アカウント管理コンテキストの型定義

このファイルでは、[アカウント管理コンテキスト](../domains/account.md)で定義されたドメインモデルの型定義を提供します。

## ドメイン層

### エンティティ

#### ユーザー

```typescript
export const userSchema = z.object({
  id: idSchema,
  did: z.string().nonempty(),
  profile: profileSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema
});
export type User = z.infer<typeof userSchema>;
```

#### AuthSession

```typescript
export const authSessionSchema = z.object({
  id: idSchema,
  key: z.string().noempty(),
  session: z.string().noempty()
});
export type AuthSession = z.infer<typeof authSessionSchema>;
```

#### AuthState

```typescript
export const authStateSchema = z.object({
  id: idSchema,
  key: z.string().noempty(),
  state: z.string().noempty()
});
export type AuthState = z.infer<authStateSchema>;
```

#### GitHub接続情報

```typescript
export const gitHubConnectionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  accessToken: z.string().nonempty(),
  refreshToken: z.string().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema
});
export type GitHubConnection = z.infer<typeof gitHubConnectionSchema>;
```

### 値オブジェクト

#### Profile

```typescript
export const profileSchema = z.object({
  displayName: z.string().max(64).nullable(),
  description: z.string().max(256).nullable(),
  avatarUrl: z.string().url().nullable(),
  bannerUrl: z.string().url().nullable()
});
export type Profile = z.infer<typeof profileSchema>;
```

### エラー

#### アカウント管理エラー

```typescript
export const accountErrorCodeSchema = z.enum([
  // 認証関連
  "INVALID_HANDLE",
  "AUTHORIZATION_FAILED",
  "CALLBACK_FAILED",
  // セッション関連
  "SESSION_CREATION_FAILED",
  "SESSION_VALIDATION_FAILED",
  "SESSION_REFRESH_FAILED",
  "SESSION_REVOCATION_FAILED",
  // GitHub連携関連
  "GITHUB_CONNECTION_FAILED",
  "GITHUB_DISCONNECTION_FAILED",
  "GITHUB_INSTALLATION_NOT_FOUND",
  // ユーザー関連
  "USER_NOT_FOUND",
  "USER_ALREADY_EXISTS",
  "PROFILE_UPDATE_FAILED"
]);
export type AccountErrorCode = z.infer<typeof accountErrorCodeSchema>;

export interface AccountError extends AnyError {
  name: "AccountError";
  type: AccountErrorCode;
  message: string;
  cause?: Error;
}
```

### DTOs

#### SessionData

```typescript
export const sessionDataSchema = z.object({
  did: z.string().nonempty(),
});
export type SessionData = z.infer<typeof sessionSchema>;
```

#### GitHubInstallation

```typescript
export const gitHubInstallationSchema = z.object({
  id: z.number(),
  account: z.object({
    login: z.string(),
    type: z.enum(["User", "Organization"])
  }),
  repositorySelection: z.enum(["all", "selected"])
});
export type GitHubInstallation = z.infer<typeof gitHubInstallationSchema>;
```

### アダプターインターフェース

#### セッションマネージャーアダプター

```typescript
export interface SessionManager {
  set(context: RequestContext, data: SessionData): Promise<Result<void, ExternalServiceError>>;
  get(context: RequestContext): Promise<Result<SessionData, ExternalServiceError>>;
  remove(context: RequestContext): Promise<Result<void, ExternalServiceError>>;
}
```

#### Bluesky認証アダプター

```typescript
export interface BlueskyAuthProvider {
  authorize(handle: string, options: AuthorizeOptions): Promise<Result<URL, ExternalServiceError>>;
  callback(params: URLSearchParams): Promise<Result<OAuthSession, ExternalServiceError>>;
  getUserProfile(did: string): Promise<Result<Profile, ExternalServiceError>>;
  getAgent(did: string): Promise<Result<Agent, ExternalServiceError>>;
}

export interface AuthorizeOptions {
  scope: string;
}
```

#### GitHub連携アダプター

```typescript
export interface GitHubAppProvider {
  getAccessToken(code: string): Promise<Result<{ accessToken: string; refreshToken?: string }, ExternalServiceError>>;
  getInstallations(accessToken: string): Promise<Result<GitHubInstallation[], ExternalServiceError>>;
}
```

#### セッション管理アダプター

### リポジトリインターフェース

```typescript
export interface UserRepository {
  save(user: CreateUser): Promise<Result<User, RepositoryError>>;
  findById(id: string): Promise<Result<User, RepositoryError>>;
  findByDid(did: string): Promise<Result<User, RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
}

export interface AuthSessionRepository {
  save(authSession: CreateAuthSession): Promise<Result<AuthSession, RepositoryError>>;
  findByKey(key: string): Promise<Result<AuthSession, RepositoryError>>;
  deleteByKey(key: string): Promise<Result<void, RepositoryError>>;
}

export interface AuthStateRepository {
  save(authState: CreateAuthState): Promise<Result<AuthState, RepositoryError>>;
  findByKey(key: string): Promise<Result<AuthState, RepositoryError>>;
  deleteByKey(key: string): Promise<Result<void, RepositoryError>>;
}

export interface GitHubConnectionRepository {
  save(connection: CreateGitHubConnection): Promise<Result<GitHubConnection, RepositoryError>>;
  findByUserId(userId: string): Promise<Result<GitHubConnection[], RepositoryError>>;
  delete(id: string): Promise<Result<void, RepositoryError>>;
  deleteByUserId(userId: string): Promise<Result<void, RepositoryError>>;
}
```

### ユースケース

#### Bluesky認証を開始する

```typescript
export interface StartBlueskyAuthInput {
  handle: string;
}

export interface StartBlueskyAuthUseCase {
  execute(input: StartBlueskyAuthInput): Promise<Result<URL, AccountError>>;
}
```

#### Bluesky認証のコールバックを処理する

```typescript
export interface HandleBlueskyAuthCallbackInput {
  params: URLSearchParams;
}

export interface HandleBlueskyAuthCallbackUseCase {
  execute(input: HandleBlueskyAuthCallbackInput): Promise<Result<string, AccountError>>;
}
```

#### セッションを検証する

```typescript
export interface ValidateSessionInput {
  context: RequestContext;
}

export interface ValidateSessionUseCase {
  execute(input: ValidateSessionInput): Promise<Result<SessionData, AccountError>>;
}
```

#### ログアウトする

```typescript
export interface LogoutInput {
  context: RequestContext;
}

export interface LogoutUseCase {
  execute(input: LogoutInput): Promise<Result<void, AccountError>>;
}
```

#### GitHubと連携する

```typescript
export interface ConnectGitHubInput {
  userId: string;
  code: string;
}

export interface ConnectGitHubUseCase {
  execute(input: ConnectGitHubInput): Promise<Result<void, AccountError>>;
}
```

#### GitHubとの連携を解除する

```typescript
export interface DisconnectGitHubInput {
  userId: string;
  githubConnectionId: string;
}

export interface DisconnectGitHubUseCase {
  execute(input: DisconnectGitHubInput): Promise<Result<void, AccountError>>;
}
```

#### ユーザー情報を取得する

```typescript
export interface GetUserByIdInput {
  userId: string;
}

export interface GetUserByIdUseCase {
  execute(input: GetUserByIdInput): Promise<Result<User, AccountError>>;
}
```

#### プロフィールを更新する

```typescript
export interface UpdateProfileInput {
  userId: string;
  displayName: string | null;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
}

export interface UpdateProfileUseCase {
  execute(input: UpdateProfileInput): Promise<Result<User, AccountError>>;
}
```

#### ユーザーを削除する

```typescript
export interface DeleteUserInput {
  userId: string;
}

export interface DeleteUserUseCase {
  execute(input: DeleteUserInput): Promise<Result<void, AccountError>>;
}
```

#### ユーザーのGitHub連携一覧を取得する

```typescript
export interface ListGitHubConnectionsInput {
  userId: string;
}

export interface ListGitHubConnectionsUseCase {
  execute(input: ListGitHubConnectionsInput): Promise<Result<GitHubConnection[], AccountError>>;
}
```
