# アカウント管理コンテキストの型定義

このファイルでは、[アカウント管理コンテキスト](../domains/account.md)で定義されたドメインモデルの型定義を提供します。

## ドメイン層

### エンティティ・値オブジェクト

#### ユーザー

```typescript
export const userSchema = z.object({
  id: idSchema,
  did: z.string().nonempty(),
  profile: userProfileSchema,
  metadata: metadataSchema,
  gitHubConnections: z.array(gitHubConnectionSchema).default([])
});
export type User = z.infer<typeof userSchema>;
```

#### DID

```typescript
export const didSchema = z.string().nonempty();
export type DID = z.infer<typeof didSchema>;
```

#### ユーザープロファイル

```typescript
export const userProfileSchema = z.object({
  displayName: z.string().nonempty(),
  avatarUrl: z.string().url().nullable(),
  bannerUrl: z.string().url().nullable(),
  description: z.string().nullable(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;
```

#### GitHub連携情報

```typescript
export const gitHubConnectionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  installationId: z.string().nonempty(),
  accessToken: z.string().nonempty().nullable(),
  metadata: metadataSchema
});
export type GitHubConnection = z.infer<typeof gitHubConnectionSchema>;
```

#### GitHubInstallationId

```typescript
export const gitHubInstallationIdSchema = z.string().nonempty();
export type GitHubInstallationId = z.infer<typeof gitHubInstallationIdSchema>;
```

#### セッション

```typescript
export const sessionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  token: sessionTokenSchema,
  expiresAt: dateSchema,
  metadata: metadataSchema
});
export type Session = z.infer<typeof sessionSchema>;
```

#### セッショントークン

```typescript
export const sessionTokenSchema = z.string().nonempty();
export type SessionToken = z.infer<typeof sessionTokenSchema>;
```

### リポジトリインターフェース

#### ユーザーリポジトリ

```typescript
export interface UserRepository {
  findById(id: ID): Promise<Result<User | null, RepositoryError>>;
  findByDid(did: string): Promise<Result<User | null, RepositoryError>>;
  save(user: User): Promise<Result<User, RepositoryError>>;
  addGitHubConnection(userId: ID, connection: GitHubConnection): Promise<Result<GitHubConnection, RepositoryError>>;
  delete(id: ID): Promise<Result<void, RepositoryError>>;
}
```

#### セッションリポジトリ

```typescript
export interface SessionRepository {
  findById(id: ID): Promise<Result<Session | null, RepositoryError>>;
  findByToken(token: SessionToken): Promise<Result<Session | null, RepositoryError>>;
  findByUserId(userId: ID): Promise<Result<Session[], RepositoryError>>;
  save(session: Session): Promise<Result<Session, RepositoryError>>;
  delete(id: ID): Promise<Result<void, RepositoryError>>;
  deleteExpired(): Promise<Result<number, RepositoryError>>;
}
```

### ドメインサービスインターフェース

#### 認証サービス

```typescript
export interface AuthService {
  authenticateWithBluesky(did: string, jwt: string): Promise<Result<User, AuthenticationError>>;
  authorize(userId: ID, action: string, resource: string): Promise<Result<boolean, AuthorizationError>>;
}
```

#### GitHub連携サービス

```typescript
export interface GitHubService {
  connectGitHub(userId: ID, installationId: string): Promise<Result<GitHubConnection, ExternalServiceError>>;
  disconnectGitHub(connectionId: ID): Promise<Result<void, ExternalServiceError>>;
  getAccessToken(connectionId: ID): Promise<Result<string, ExternalServiceError>>;
  refreshAccessToken(connectionId: ID): Promise<Result<string, ExternalServiceError>>;
  validateConnection(connectionId: ID): Promise<Result<boolean, ExternalServiceError>>;
}
```

#### セッション管理サービス

```typescript
export interface SessionService {
  createSession(userId: ID): Promise<Result<Session, AuthenticationError>>;
  validateSession(token: SessionToken): Promise<Result<Session, AuthenticationError>>;
  invalidateSession(sessionId: ID): Promise<Result<void, AuthenticationError>>;
  cleanExpiredSessions(): Promise<Result<number, AuthenticationError>>;
}
```

## アプリケーション層

### ユースケース入力/出力の型定義

#### ユーザー登録入力

```typescript
export const registerUserInputSchema = z.object({
  did: z.string().nonempty(),
  jwt: z.string().nonempty(),
  profile: userProfileSchema.optional()
});
export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;
```

#### ログイン入力

```typescript
export const loginWithBlueskyInputSchema = z.object({
  did: z.string().nonempty(),
  jwt: z.string().nonempty()
});
export type LoginWithBlueskyInput = z.infer<typeof loginWithBlueskyInputSchema>;
```

#### GitHub連携入力

```typescript
export const connectGitHubInputSchema = z.object({
  userId: idSchema,
  installationId: z.string().nonempty()
});
export type ConnectGitHubInput = z.infer<typeof connectGitHubInputSchema>;
```

#### GitHub連携解除入力

```typescript
export const disconnectGitHubInputSchema = z.object({
  userId: idSchema,
  connectionId: idSchema
});
export type DisconnectGitHubInput = z.infer<typeof disconnectGitHubInputSchema>;
```

#### ユーザー情報取得入力

```typescript
export const getUserByIdInputSchema = z.object({
  userId: idSchema
});
export type GetUserByIdInput = z.infer<typeof getUserByIdInputSchema>;
```

#### ユーザー情報更新入力

```typescript
export const updateUserInputSchema = z.object({
  userId: idSchema,
  profile: userProfileSchema.partial()
});
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
```

#### ユーザー削除入力

```typescript
export const deleteUserInputSchema = z.object({
  userId: idSchema
});
export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;
```

#### GitHub連携一覧取得入力

```typescript
export const listGitHubConnectionsInputSchema = z.object({
  userId: idSchema
});
export type ListGitHubConnectionsInput = z.infer<typeof listGitHubConnectionsInputSchema>;
```

#### セッション検証入力

```typescript
export const validateSessionInputSchema = z.object({
  token: sessionTokenSchema
});
export type ValidateSessionInput = z.infer<typeof validateSessionInputSchema>;
```

#### ログアウト入力

```typescript
export const logoutInputSchema = z.object({
  sessionId: idSchema
});
export type LogoutInput = z.infer<typeof logoutInputSchema>;
```

### ユースケースインターフェース

#### ユーザー登録ユースケース

```typescript
export interface RegisterUserUseCase {
  execute(input: RegisterUserInput): Promise<Result<User, RegisterUserError>>;
}
```

#### ログインユースケース

```typescript
export interface LoginWithBlueskyUseCase {
  execute(input: LoginWithBlueskyInput): Promise<Result<{ user: User, session: Session }, AuthenticationError>>;
}
```

#### GitHub連携ユースケース

```typescript
export interface ConnectGitHubUseCase {
  execute(input: ConnectGitHubInput): Promise<Result<GitHubConnection, ConnectGitHubError>>;
}
```

#### GitHub連携解除ユースケース

```typescript
export interface DisconnectGitHubUseCase {
  execute(input: DisconnectGitHubInput): Promise<Result<void, ConnectGitHubError>>;
}
```

#### ユーザー情報取得ユースケース

```typescript
export interface GetUserByIdUseCase {
  execute(input: GetUserByIdInput): Promise<Result<User, RepositoryError>>;
}
```

#### ユーザー情報更新ユースケース

```typescript
export interface UpdateUserUseCase {
  execute(input: UpdateUserInput): Promise<Result<User, RepositoryError | ValidationError>>;
}
```

#### ユーザー削除ユースケース

```typescript
export interface DeleteUserUseCase {
  execute(input: DeleteUserInput): Promise<Result<void, RepositoryError>>;
}
```

#### GitHub連携一覧取得ユースケース

```typescript
export interface ListGitHubConnectionsUseCase {
  execute(input: ListGitHubConnectionsInput): Promise<Result<GitHubConnection[], RepositoryError>>;
}
```

#### セッション検証ユースケース

```typescript
export interface ValidateSessionUseCase {
  execute(input: ValidateSessionInput): Promise<Result<Session, AuthenticationError>>;
}
```

#### ログアウトユースケース

```typescript
export interface LogoutUseCase {
  execute(input: LogoutInput): Promise<Result<void, SessionError>>;
}
```

### アプリケーションエラー

#### ユーザー登録エラー

```typescript
export const registerUserErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "USER_ALREADY_EXISTS",
  "BLUESKY_AUTH_FAILED",
  "REPOSITORY_ERROR"
]);
export type RegisterUserErrorCode = z.infer<typeof registerUserErrorCodeSchema>;

export interface RegisterUserError extends AnyError {
  name: "RegisterUserError";
  type: RegisterUserErrorCode;
  message: string;
  cause?: Error;
}
```

#### GitHub連携エラー

```typescript
export const connectGitHubErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "USER_NOT_FOUND",
  "GITHUB_CONNECTION_FAILED",
  "REPOSITORY_ERROR"
]);
export type ConnectGitHubErrorCode = z.infer<typeof connectGitHubErrorCodeSchema>;

export interface ConnectGitHubError extends AnyError {
  name: "ConnectGitHubError";
  type: ConnectGitHubErrorCode;
  message: string;
  cause?: Error;
}
```

#### セッションエラー

```typescript
export const sessionErrorCodeSchema = z.enum([
  "INVALID_SESSION",
  "SESSION_EXPIRED",
  "SESSION_NOT_FOUND",
  "REPOSITORY_ERROR"
]);
export type SessionErrorCode = z.infer<typeof sessionErrorCodeSchema>;

export interface SessionError extends AnyError {
  name: "SessionError";
  type: SessionErrorCode;
  message: string;
  cause?: Error;
}
``` 
