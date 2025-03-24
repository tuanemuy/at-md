export * from "./account";

/**
 * リポジトリの実装をエクスポート
 */
import type { PgDatabase } from "../client";
import {
  DrizzleAuthSessionRepository,
  DrizzleAuthStateRepository,
  DrizzleGitHubConnectionRepository,
  DrizzleUserRepository,
} from "./account";
import {
  DrizzleBookRepository,
  DrizzleNoteRepository,
  DrizzleTagRepository,
} from "./note";
import { DrizzlePostRepository } from "./post";

/**
 * リポジトリの総合インターフェース
 */
export interface Repositories {
  accountRepositories: {
    userRepository: DrizzleUserRepository;
    gitHubConnectionRepository: DrizzleGitHubConnectionRepository;
    authSessionRepository: DrizzleAuthSessionRepository;
    authStateRepository: DrizzleAuthStateRepository;
  };
  noteRepositories: {
    bookRepository: DrizzleBookRepository;
    noteRepository: DrizzleNoteRepository;
    tagRepository: DrizzleTagRepository;
  };
  postRepositories: {
    postRepository: DrizzlePostRepository;
  };
}

/**
 * リポジトリ作成関数
 * @param db データベース接続
 */
export function createRepositories(db: PgDatabase): Repositories {
  return {
    accountRepositories: {
      userRepository: new DrizzleUserRepository(db),
      gitHubConnectionRepository: new DrizzleGitHubConnectionRepository(db),
      authSessionRepository: new DrizzleAuthSessionRepository(db),
      authStateRepository: new DrizzleAuthStateRepository(db),
    },
    noteRepositories: {
      bookRepository: new DrizzleBookRepository(db),
      noteRepository: new DrizzleNoteRepository(db),
      tagRepository: new DrizzleTagRepository(db),
    },
    postRepositories: {
      postRepository: new DrizzlePostRepository(db),
    },
  };
}
