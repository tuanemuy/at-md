import type { UserRepository } from "@/domain/account/repositories/user";
import type { AuthService } from "@/domain/account/services/auth";
import type { DocumentRepository } from "@/domain/document/repositories/document";
import type { GitHubRepoRepository } from "@/domain/document/repositories/githubRepo";
import type { TagRepository } from "@/domain/document/repositories/tag";
import type { SyncService } from "@/domain/document/services/sync";
import type { PostRepository } from "@/domain/post/repositories/post";
import type { PostService } from "@/domain/post/services/post";

/**
 * DIコンテナのインターフェース
 * アプリケーション全体の依存関係を管理する
 */
export interface Container {
  // アカウント管理コンテキスト
  userRepository: UserRepository;
  authService: AuthService;

  // 文書管理コンテキスト
  documentRepository: DocumentRepository;
  githubRepoRepository: GitHubRepoRepository;
  tagRepository: TagRepository;
  syncService: SyncService;

  // 投稿管理コンテキスト
  postRepository: PostRepository;
  postService: PostService;
}

/**
 * DIコンテナの実装
 */
export class ContainerImpl implements Container {
  // アカウント管理コンテキスト
  readonly userRepository: UserRepository;
  readonly authService: AuthService;

  // 文書管理コンテキスト
  readonly documentRepository: DocumentRepository;
  readonly githubRepoRepository: GitHubRepoRepository;
  readonly tagRepository: TagRepository;
  readonly syncService: SyncService;

  // 投稿管理コンテキスト
  readonly postRepository: PostRepository;
  readonly postService: PostService;

  constructor(params: {
    // アカウント管理コンテキスト
    userRepository: UserRepository;
    authService: AuthService;

    // 文書管理コンテキスト
    documentRepository: DocumentRepository;
    githubRepoRepository: GitHubRepoRepository;
    tagRepository: TagRepository;
    syncService: SyncService;

    // 投稿管理コンテキスト
    postRepository: PostRepository;
    postService: PostService;
  }) {
    // アカウント管理コンテキスト
    this.userRepository = params.userRepository;
    this.authService = params.authService;

    // 文書管理コンテキスト
    this.documentRepository = params.documentRepository;
    this.githubRepoRepository = params.githubRepoRepository;
    this.tagRepository = params.tagRepository;
    this.syncService = params.syncService;

    // 投稿管理コンテキスト
    this.postRepository = params.postRepository;
    this.postService = params.postService;
  }
}

// グローバルなコンテナインスタンス
let container: Container | null = null;

/**
 * コンテナを初期化する
 * @param newContainer 新しいコンテナインスタンス
 */
export function initializeContainer(newContainer: Container): void {
  container = newContainer;
}

/**
 * コンテナを取得する
 * @returns コンテナインスタンス
 * @throws コンテナが初期化されていない場合はエラーをスローする
 */
export function getContainer(): Container {
  if (!container) {
    throw new Error("Container is not initialized");
  }
  return container;
}

/**
 * テスト用にコンテナをリセットする
 */
export function resetContainer(): void {
  container = null;
}
