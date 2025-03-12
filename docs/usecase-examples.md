# ユースケース実装例

この資料では、主要なユースケースの実装例を提供します。

## 1. ユーザー登録ユースケース

```typescript
// src/application/account/usecases/register.ts
import { Result, ok, err } from 'neverthrow';
import { userSchema, User } from '@/domain/account/models/user';
import { AuthError } from '@/domain/account/models/errors';
import { UserRepository } from '@/domain/account/repositories/user';
import { AuthService } from '@/domain/account/services/auth';
import { IDGenerator } from '@/domain/shared/models/id';
import { logger } from '@/lib/logger';

export class RegisterUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthService,
    private idGenerator: IDGenerator
  ) {}

  async execute(did: string, jwt: string, name: string): Promise<Result<User, AuthError>> {
    logger.info('ユーザー登録開始', { did, name });
    
    // Blueskyで認証
    logger.debug('Bluesky認証開始', { did });
    const authResult = await this.authService.authenticateWithBluesky(did, jwt);
    
    if (authResult.isErr()) {
      logger.error('Bluesky認証失敗', authResult.error);
      return err(authResult.error);
    }
    
    logger.debug('Bluesky認証成功');
    
    // 既存ユーザーを確認
    logger.debug('既存ユーザー確認', { did });
    const existingUserResult = await this.userRepository.findByDid(did);
    
    if (existingUserResult.isErr()) {
      const error = { 
        name: "AuthError",
        type: 'CONNECTION_FAILED', 
        message: '認証中にエラーが発生しました' 
      };
      logger.error('ユーザー検索失敗', undefined, { error });
      return err(error);
    }
    
    if (existingUserResult.value) {
      logger.info('既存ユーザーを返却', { userId: existingUserResult.value.id });
      return ok(existingUserResult.value);
    }
    
    // 新規ユーザーを作成
    const userId = this.idGenerator.generate();
    logger.info('新規ユーザー作成', { userId, did, name });
    
    const newUser: User = {
      id: userId,
      name,
      did,
      createdAt: new Date(),
      updatedAt: new Date(),
      githubConnections: []
    };
    
    logger.debug('ユーザー保存開始');
    const saveResult = await this.userRepository.save(newUser);
    
    if (saveResult.isErr()) {
      const error = { 
        name: "AuthError",
        type: 'CONNECTION_FAILED', 
        message: 'ユーザー登録に失敗しました' 
      };
      logger.error('ユーザー保存失敗', undefined, { error });
      return err(error);
    }
    
    logger.info('ユーザー登録完了', { userId });
    return ok(saveResult.value);
  }
}
```

## 2. GitHub連携ユースケース

```typescript
// src/application/account/usecases/connect.ts
import { Result, ok, err } from 'neverthrow';
import { GitHubConnection } from '@/domain/account/models/user';
import { AuthError } from '@/domain/account/models/errors';
import { UserRepository } from '@/domain/account/repositories/user';
import { AuthService } from '@/domain/account/services/auth';
import { ID, IDGenerator } from '@/domain/shared/models/id';
import { logger } from '@/lib/logger';

export class ConnectGitHubUseCase {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthService,
    private idGenerator: IDGenerator
  ) {}

  async execute(userId: ID, installationId: number): Promise<Result<GitHubConnection, AuthError>> {
    logger.info('GitHub連携開始', { userId, installationId });
    
    // ユーザーの存在確認
    logger.debug('ユーザー存在確認', { userId });
    const userResult = await this.userRepository.findById(userId);
    
    if (userResult.isErr()) {
      const error = { 
        name: "AuthError",
        type: 'CONNECTION_FAILED', 
        message: 'ユーザー情報の取得に失敗しました' 
      };
      logger.error('ユーザー取得失敗', undefined, { error });
      return err(error);
    }
    
    if (!userResult.value) {
      const error = { 
        name: "AuthError",
        type: 'UNAUTHORIZED', 
        message: 'ユーザーが見つかりません' 
      };
      logger.error('ユーザーが存在しない', undefined, { error, userId });
      return err(error);
    }
    
    // GitHub連携を実行
    logger.debug('GitHub連携実行', { userId, installationId });
    const connectionResult = await this.authService.connectGitHub(userId, installationId);
    
    if (connectionResult.isErr()) {
      logger.error('GitHub連携失敗', connectionResult.error);
      return err(connectionResult.error);
    }
    
    logger.debug('GitHub連携成功', { connectionId: connectionResult.value.id });
    
    // ユーザーにGitHub連携情報を追加
    logger.debug('GitHub連携情報保存開始');
    const addConnectionResult = await this.userRepository.addGitHubConnection(
      userId,
      connectionResult.value
    );
    
    if (addConnectionResult.isErr()) {
      const error = { 
        name: "AuthError",
        type: 'CONNECTION_FAILED', 
        message: 'GitHub連携情報の保存に失敗しました' 
      };
      logger.error('GitHub連携情報保存失敗', undefined, { error });
      return err(error);
    }
    
    logger.info('GitHub連携完了', { 
      userId, 
      connectionId: addConnectionResult.value.id,
      installationId
    });
    return ok(addConnectionResult.value);
  }
}
```

## 3. 文書同期ユースケース

```typescript
// src/application/document/usecases/sync.ts
import { Result, ok, err } from 'neverthrow';
import { Document } from '@/domain/document/models/document';
import { SyncError, SyncDocumentError } from '@/domain/document/models/errors';
import { GitHubRepo } from '@/domain/document/models/githubRepo';
import { DocumentRepository } from '@/domain/document/repositories/document';
import { GitHubRepoRepository } from '@/domain/document/repositories/githubRepo';
import { SyncService } from '@/domain/document/services/sync';

export class SyncDocumentUseCase {
  constructor(
    private documentRepository: DocumentRepository,
    private gitHubRepoRepository: GitHubRepoRepository,
    private syncService: SyncService
  ) {}

  async execute(gitHubRepoId: string, path: string): Promise<Result<Document, SyncDocumentError>> {
    // GitHubリポジトリの存在確認
    const gitHubRepoResult = await this.gitHubRepoRepository.findById(gitHubRepoId);
    
    if (gitHubRepoResult.isErr()) {
      return err({
        name: "SyncDocumentError",
        type: "REPOSITORY_ERROR",
        message: "GitHubリポジトリの取得に失敗しました",
        cause: gitHubRepoResult.error
      });
    }
    
    const gitHubRepo = gitHubRepoResult.value;
    
    if (!gitHubRepo) {
      return err({
        name: "SyncDocumentError",
        type: "REPOSITORY_NOT_FOUND",
        message: `ID: ${gitHubRepoId} のGitHubリポジトリが見つかりません`
      });
    }
    
    // 同期サービスを使用して文書を同期
    const syncResult = await this.syncService.syncDocument(gitHubRepoId, path);
    
    if (syncResult.isErr()) {
      return err({
        name: "SyncDocumentError",
        type: "SYNC_FAILED",
        message: "文書の同期に失敗しました",
        cause: syncResult.error
      });
    }
    
    return ok(syncResult.value);
  }
}
```

## 4. 投稿作成ユースケース

```typescript
// src/application/post/usecases/post.ts
import { Result, ok, err } from 'neverthrow';
import { Post, PostStatus } from '@/domain/post/models/post';
import { PostError } from '@/domain/post/models/errors';
import { Document } from '@/domain/document/models/document';
import { PostRepository } from '@/domain/post/repositories/post';
import { DocumentRepository } from '@/domain/document/repositories/document';
import { PostService } from '@/domain/post/services/post';
import { ID, IDGenerator } from '@/domain/shared/models/id';

export class CreatePostUseCase {
  constructor(
    private postRepository: PostRepository,
    private documentRepository: DocumentRepository,
    private postService: PostService,
    private idGenerator: IDGenerator
  ) {}

  async execute(documentId: ID): Promise<Result<Post, PostError>> {
    // 文書の存在確認
    const documentResult = await this.documentRepository.findById(documentId);
    
    if (documentResult.isErr()) {
      return err({ 
        name: "PostError",
        type: 'CONTENT_NOT_FOUND', 
        message: '文書情報の取得に失敗しました' 
      });
    }
    
    if (!documentResult.value) {
      return err({ 
        name: "PostError",
        type: 'CONTENT_NOT_FOUND', 
        message: '文書が見つかりません' 
      });
    }
    
    const document = documentResult.value;
    
    // 既存の投稿を確認
    const existingPostResult = await this.postRepository.findByDocumentId(documentId);
    
    if (existingPostResult.isErr()) {
      return err({ 
        name: "PostError",
        type: 'API_ERROR', 
        message: '投稿情報の取得に失敗しました' 
      });
    }
    
    // 既存の投稿があれば返す
    if (existingPostResult.value) {
      return ok(existingPostResult.value);
    }
    
    // 新規投稿を作成
    const newPost: Post = {
      id: this.idGenerator.generate(),
      documentId,
      uri: '', // 投稿後に更新
      status: PostStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const saveResult = await this.postRepository.save(newPost);
    
    if (saveResult.isErr()) {
      return err({ 
        name: "PostError",
        type: 'API_ERROR', 
        message: '投稿の保存に失敗しました' 
      });
    }
    
    const post = saveResult.value;
    
    // Blueskyに投稿（非同期で実行）
    this.postToBluesky(post.id, document).catch(console.error);
    
    return ok(post);
  }

  private async postToBluesky(postId: ID, document: Document): Promise<void> {
    try {
      // Blueskyに投稿
      const postResult = await this.postService.createPost(document.id);
      
      if (postResult.isErr()) {
        // 投稿失敗を記録
        await this.postRepository.updateStatus(
          postId,
          PostStatus.FAILED,
          postResult.error.message
        );
        return;
      }
      
      // 投稿成功を記録
      await this.postRepository.updateStatus(
        postId,
        PostStatus.PUBLISHED
      );
    } catch (error) {
      // 予期せぬエラーを記録
      await this.postRepository.updateStatus(
        postId,
        PostStatus.FAILED,
        error instanceof Error ? error.message : '不明なエラー'
      );
    }
  }
}
```

## 5. 文書表示ユースケース

```typescript
// src/application/document/usecases/view.ts
import { Result, ok, err } from 'neverthrow';
import { Document } from '@/domain/document/models/document';
import { ViewDocumentError } from '@/domain/document/models/errors';
import { Post } from '@/domain/post/models/post';
import { Tag } from '@/domain/document/models/tag';
import { DocumentRepository } from '@/domain/document/repositories/document';
import { PostRepository } from '@/domain/post/repositories/post';
import { TagRepository } from '@/domain/document/repositories/tag';
import { ViewDocumentOutput } from '@/domain/document/contracts';

export class ViewDocumentUseCase {
  constructor(
    private documentRepository: DocumentRepository,
    private postRepository: PostRepository,
    private tagRepository: TagRepository
  ) {}

  async execute(id: string): Promise<Result<ViewDocumentOutput, ViewDocumentError>> {
    // 文書の取得
    const documentResult = await this.documentRepository.findById(id);
    
    if (documentResult.isErr()) {
      return err({
        name: "ViewDocumentError",
        type: "REPOSITORY_ERROR",
        message: "文書の取得に失敗しました",
        cause: documentResult.error
      });
    }
    
    const document = documentResult.value;
    
    if (!document) {
      return err({
        name: "ViewDocumentError",
        type: "DOCUMENT_NOT_FOUND",
        message: `ID: ${id} の文書が見つかりません`
      });
    }
    
    // 関連する投稿の取得
    const postResult = await this.postRepository.findByDocumentId(id);
    let post: Post | undefined = undefined;
    
    if (postResult.isOk() && postResult.value) {
      post = postResult.value;
    }
    
    // 関連するタグの取得
    const tagsResult = await this.tagRepository.findByDocumentId(id);
    let tags: Tag[] = [];
    
    if (tagsResult.isOk()) {
      tags = tagsResult.value;
    }
    
    return ok({
      document,
      tags,
      post
    });
  }
}
```

## 6. タグ管理ユースケース

```typescript
// src/application/document/usecases/tag.ts
import { Result, ok, err } from 'neverthrow';
import { Tag } from '@/domain/document/models/tag';
import { DocumentTag } from '@/domain/document/models/document';
import { TagRepository } from '@/domain/document/repositories/tag';
import { DocumentTagRepository } from '@/domain/document/repositories/documentTag';
import { DocumentRepository } from '@/domain/document/repositories/document';
import { ID, IDGenerator } from '@/domain/shared/models/id';

export type TagError = 
  | { name: "TagError"; type: "TAG_NOT_FOUND"; message: string }
  | { name: "TagError"; type: "DOCUMENT_NOT_FOUND"; message: string }
  | { name: "TagError"; type: "REPOSITORY_ERROR"; message: string; cause?: Error }
  | { name: "TagError"; type: "DUPLICATE_TAG"; message: string };

export class ManageTagsUseCase {
  constructor(
    private tagRepository: TagRepository,
    private documentTagRepository: DocumentTagRepository,
    private documentRepository: DocumentRepository,
    private idGenerator: IDGenerator
  ) {}

  async addTagToDocument(documentId: ID, tagName: string, userId: ID): Promise<Result<Tag, TagError>> {
    // 文書の存在確認
    const documentResult = await this.documentRepository.findById(documentId);
    
    if (documentResult.isErr()) {
      return err({
        name: "TagError",
        type: "REPOSITORY_ERROR",
        message: "文書の取得に失敗しました",
        cause: documentResult.error
      });
    }
    
    if (!documentResult.value) {
      return err({
        name: "TagError",
        type: "DOCUMENT_NOT_FOUND",
        message: `ID: ${documentId} の文書が見つかりません`
      });
    }
    
    // タグの存在確認
    const tagResult = await this.tagRepository.findByName(tagName);
    
    if (tagResult.isErr()) {
      return err({
        name: "TagError",
        type: "REPOSITORY_ERROR",
        message: "タグの取得に失敗しました",
        cause: tagResult.error
      });
    }
    
    let tag = tagResult.value;
    
    // タグが存在しない場合は新規作成
    if (!tag) {
      const newTag: Tag = {
        id: this.idGenerator.generate(),
        name: tagName,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId
      };
      
      const saveTagResult = await this.tagRepository.save(newTag);
      
      if (saveTagResult.isErr()) {
        return err({
          name: "TagError",
          type: "REPOSITORY_ERROR",
          message: "タグの保存に失敗しました",
          cause: saveTagResult.error
        });
      }
      
      tag = saveTagResult.value;
    }
    
    // 既に文書にタグが付与されているか確認
    const existingTagsResult = await this.tagRepository.findByDocumentId(documentId);
    
    if (existingTagsResult.isErr()) {
      return err({
        name: "TagError",
        type: "REPOSITORY_ERROR",
        message: "文書のタグ取得に失敗しました",
        cause: existingTagsResult.error
      });
    }
    
    const existingTags = existingTagsResult.value;
    
    if (existingTags.some(t => t.id === tag!.id)) {
      return err({
        name: "TagError",
        type: "DUPLICATE_TAG",
        message: `文書には既にタグ "${tagName}" が付与されています`
      });
    }
    
    // 文書にタグを付与
    const documentTag: DocumentTag = {
      id: this.idGenerator.generate(),
      documentId,
      tagId: tag.id,
      createdAt: new Date()
    };
    
    const saveDocumentTagResult = await this.documentTagRepository.save(documentTag);
    
    if (saveDocumentTagResult.isErr()) {
      return err({
        name: "TagError",
        type: "REPOSITORY_ERROR",
        message: "文書へのタグ付与に失敗しました",
        cause: saveDocumentTagResult.error
      });
    }
    
    return ok(tag);
  }

  async removeTagFromDocument(documentId: ID, tagId: ID): Promise<Result<void, TagError>> {
    // 文書の存在確認
    const documentResult = await this.documentRepository.findById(documentId);
    
    if (documentResult.isErr()) {
      return err({
        name: "TagError",
        type: "REPOSITORY_ERROR",
        message: "文書の取得に失敗しました",
        cause: documentResult.error
      });
    }
    
    if (!documentResult.value) {
      return err({
        name: "TagError",
        type: "DOCUMENT_NOT_FOUND",
        message: `ID: ${documentId} の文書が見つかりません`
      });
    }
    
    // タグの存在確認
    const tagResult = await this.tagRepository.findById(tagId);
    
    if (tagResult.isErr()) {
      return err({
        name: "TagError",
        type: "REPOSITORY_ERROR",
        message: "タグの取得に失敗しました",
        cause: tagResult.error
      });
    }
    
    if (!tagResult.value) {
      return err({
        name: "TagError",
        type: "TAG_NOT_FOUND",
        message: `ID: ${tagId} のタグが見つかりません`
      });
    }
    
    // 文書からタグを削除
    const deleteResult = await this.documentTagRepository.deleteByDocumentIdAndTagId(documentId, tagId);
    
    if (deleteResult.isErr()) {
      return err({
        name: "TagError",
        type: "REPOSITORY_ERROR",
        message: "文書からのタグ削除に失敗しました",
        cause: deleteResult.error
      });
    }
    
    return ok(undefined);
  }

  async getDocumentTags(documentId: ID): Promise<Result<Tag[], TagError>> {
    // 文書の存在確認
    const documentResult = await this.documentRepository.findById(documentId);
    
    if (documentResult.isErr()) {
      return err({
        name: "TagError",
        type: "REPOSITORY_ERROR",
        message: "文書の取得に失敗しました",
        cause: documentResult.error
      });
    }
    
    if (!documentResult.value) {
      return err({
        name: "TagError",
        type: "DOCUMENT_NOT_FOUND",
        message: `ID: ${documentId} の文書が見つかりません`
      });
    }
    
    // 文書のタグを取得
    const tagsResult = await this.tagRepository.findByDocumentId(documentId);
    
    if (tagsResult.isErr()) {
      return err({
        name: "TagError",
        type: "REPOSITORY_ERROR",
        message: "文書のタグ取得に失敗しました",
        cause: tagsResult.error
      });
    }
    
    return ok(tagsResult.value);
  }
}
```

## 7. Webhook処理ユースケース

```typescript
// src/application/document/usecases/webhook.ts
import { Result, ok, err } from 'neverthrow';
import { GitHubRepo } from '@/domain/document/models/githubRepo';
import { Document } from '@/domain/document/models/document';
import { GitHubRepoRepository } from '@/domain/document/repositories/githubRepo';
import { SyncDocumentUseCase } from './sync';
import { CreatePostUseCase } from '@/application/post/usecases/post';

type WebhookPayload = {
  repository: {
    full_name: string;
  };
  commits: Array<{
    added: string[];
    modified: string[];
    removed: string[];
  }>;
};

type WebhookError = 
  | { name: "WebhookError"; type: 'INVALID_PAYLOAD'; message: string }
  | { name: "WebhookError"; type: 'REPOSITORY_NOT_FOUND'; message: string }
  | { name: "WebhookError"; type: 'SYNC_FAILED'; message: string };

export class ProcessWebhookUseCase {
  constructor(
    private gitHubRepoRepository: GitHubRepoRepository,
    private syncDocumentUseCase: SyncDocumentUseCase,
    private createPostUseCase: CreatePostUseCase
  ) {}

  async execute(payload: WebhookPayload): Promise<Result<void, WebhookError>> {
    // リポジトリの検索
    const repoResult = await this.gitHubRepoRepository.findByFullName(payload.repository.full_name);
    
    if (repoResult.isErr()) {
      return err({ 
        name: "WebhookError",
        type: 'REPOSITORY_NOT_FOUND', 
        message: 'リポジトリ情報の取得に失敗しました' 
      });
    }
    
    if (!repoResult.value) {
      return err({ 
        name: "WebhookError",
        type: 'REPOSITORY_NOT_FOUND', 
        message: 'リポジトリが見つかりません' 
      });
    }
    
    const repository = repoResult.value;
    
    // 変更されたMarkdownファイルを抽出
    const changedFiles = this.extractMarkdownFiles(payload);
    
    // 各ファイルを同期
    for (const file of changedFiles) {
      const syncResult = await this.syncDocumentUseCase.execute(repository.id, file);
      
      if (syncResult.isErr()) {
        console.error(`Failed to sync ${file}: ${syncResult.error.message}`);
        continue;
      }
      
      const document = syncResult.value;
      
      // Blueskyに投稿
      const postResult = await this.createPostUseCase.execute(document.id);
      
      if (postResult.isErr()) {
        console.error(`Failed to post ${file}: ${postResult.error.message}`);
      }
    }
    
    return ok(undefined);
  }

  private extractMarkdownFiles(payload: WebhookPayload): string[] {
    const files = new Set<string>();
    
    for (const commit of payload.commits) {
      // 追加・変更されたMarkdownファイルを抽出
      [...commit.added, ...commit.modified]
        .filter(file => file.endsWith('.md'))
        .forEach(file => files.add(file));
    }
    
    return Array.from(files);
  }
}
``` 
