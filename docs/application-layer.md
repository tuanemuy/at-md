# アプリケーション層の実装パターン

本システムでは、ユースケースをアプリケーション層のインターフェースとして定義し、アプリケーションサービスで実装します。

## 1. 単一責任の原則

各ユースケースは1つの機能のみを担当します。これにより、コードの理解性と保守性が向上します。

例：

- `AuthenticateWithBlueskyUseCase` - Blueskyでの認証のみを担当
- `ConnectGitHubUseCase` - GitHubとの連携のみを担当

## 2. 入出力の明確化

各ユースケースは明確な入力と出力を持ちます：

```typescript
export class AuthenticateWithBlueskyUseCase {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthDomainService
  ) {}

  async execute(input: AuthenticateWithBlueskyInput): Promise<Result<User, AuthError>> {
    // 実装
  }
}
```

## 3. 依存性注入

ドメインサービスやリポジトリはコンストラクタで注入され、テスト容易性を高めます：

```typescript
constructor(
  private userRepository: UserRepository,
  private authService: AuthService
) {}
```

## 4. Result型の使用

操作の結果は成功または失敗を明示的に表現するResult型を使用します：

```typescript
async execute(input: SyncDocumentInput): Promise<Result<Document, SyncError>> {
  // 成功の場合
  return ok(document);
  
  // 失敗の場合
  return err(new SyncError("FILE_NOT_FOUND", "ファイルが見つかりません"));
}
```

## 5. トランザクション境界

アプリケーションサービスはトランザクションの境界となり、複数のエンティティやリポジトリの操作を調整します：

```typescript
async execute(input: CreatePostInput): Promise<Result<Post, PostError>> {
  // トランザクション開始
  const documentResult = await this.documentRepository.findById(input.documentId);
  if (documentResult.isErr()) return err(/* エラー */);
  
  const document = documentResult.value;
  if (!document) return err(/* エラー */);
  
  const post = Post.create(/* パラメータ */);
  const saveResult = await this.postRepository.save(post);
  if (saveResult.isErr()) return err(/* エラー */);
  
  // トランザクション完了
  return ok(saveResult.value);
}
```

これらのパターンに従うことで、アプリケーション層はドメイン層のビジネスロジックを活用しながら、システムの機能を実現します。

