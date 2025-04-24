import { AccountService } from "@/application/account/service";
import type { AccountUsecase } from "@/application/account/usecase";
import { NoteService } from "@/application/note/service";
import type { NoteUsecase } from "@/application/note/usecase";
import { PostService } from "@/application/post/service";
import type { PostUsecase } from "@/application/post/usecase";
import { DefaultBlueskyAuthProvider } from "@/infrastructure/bluesky/auth-provider";
import { DefaultBlueskyPostProvider } from "@/infrastructure/bluesky/post-provider";
import { DefaultGitHubAppProvider } from "@/infrastructure/github/app-provider";
import { DefaultGitHubContentProvider } from "@/infrastructure/github/content-provider";
import { NextjsSessionManager } from "@/infrastructure/nextjs/session-manager";
import { NextjsStateManager } from "@/infrastructure/nextjs/state-manager";
import { getDatabase } from "@/infrastructure/sqlite/client";
import { DrizzleAuthSessionRepository } from "@/infrastructure/sqlite/repositories/account/auth-session-repository";
import { DrizzleAuthStateRepository } from "@/infrastructure/sqlite/repositories/account/auth-state-repository";
import { DrizzleGitHubConnectionRepository } from "@/infrastructure/sqlite/repositories/account/github-connection-repository";
import { DrizzleUserRepository } from "@/infrastructure/sqlite/repositories/account/user-repository";
import { DrizzleBookRepository } from "@/infrastructure/sqlite/repositories/note/book-repository";
import { DrizzleNoteRepository } from "@/infrastructure/sqlite/repositories/note/note-repository";
import { DrizzleTagRepository } from "@/infrastructure/sqlite/repositories/note/tag-repository";
import { DrizzlePostRepository } from "@/infrastructure/sqlite/repositories/post/post-repository";
import type { cookies } from "next/headers";
import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string(),
  DATABASE_AUTH_TOKEN: z.string(),
  PUBLIC_URL: z.string(),
  AUTH_SECRET: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_APP_ID: z.string(),
  GITHUB_APP_NAME: z.string(),
  GITHUB_PRIVATE_KEY: z.string(),
  GITHUB_WEBHOOK_URL: z.string(),
  GITHUB_WEBHOOK_SECRET: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export class Container {
  public readonly accountService: AccountUsecase<
    Awaited<ReturnType<typeof cookies>>
  >;
  public readonly noteService: NoteUsecase;
  public readonly postService: PostUsecase;

  constructor(private readonly env: Env) {
    const db = getDatabase(this.env.DATABASE_URL, this.env.DATABASE_AUTH_TOKEN);

    const authSessionRepository = new DrizzleAuthSessionRepository(db);
    const authStateRepository = new DrizzleAuthStateRepository(db);
    const userRepository = new DrizzleUserRepository(db);
    const githubConnectionRepository = new DrizzleGitHubConnectionRepository(
      db,
    );
    const bookRepository = new DrizzleBookRepository(db);
    const noteRepository = new DrizzleNoteRepository(db);
    const tagRepository = new DrizzleTagRepository(db);
    const postRepository = new DrizzlePostRepository(db);

    const blueskyAuthProvider = new DefaultBlueskyAuthProvider({
      config: {
        publicUrl: this.env.PUBLIC_URL,
      },
      deps: {
        authSessionRepository,
        authStateRepository,
      },
    });

    const blueskyPostProvider = new DefaultBlueskyPostProvider({
      config: {
        publicUrl: this.env.PUBLIC_URL,
      },
      deps: {
        authSessionRepository,
        authStateRepository,
      },
    });

    const githubAppProvider = new DefaultGitHubAppProvider({
      config: {
        clientId: this.env.GITHUB_CLIENT_ID,
        clientSecret: this.env.GITHUB_CLIENT_SECRET,
      },
    });

    const githubContentProvider = new DefaultGitHubContentProvider({
      config: {
        appId: this.env.GITHUB_APP_ID,
        privateKey: this.env.GITHUB_PRIVATE_KEY,
        webhookUrl: this.env.GITHUB_WEBHOOK_URL,
        webhookSecret: this.env.GITHUB_WEBHOOK_SECRET,
      },
    });

    const sessionManager = new NextjsSessionManager({
      config: {
        secret: this.env.AUTH_SECRET,
      },
    });

    const stateManager = new NextjsStateManager({
      config: {
        secret: this.env.AUTH_SECRET,
      },
    });

    this.accountService = new AccountService({
      deps: {
        publicUrl: this.env.PUBLIC_URL,
        clientId: this.env.GITHUB_CLIENT_ID,
        appName: this.env.GITHUB_APP_NAME,
        authProvider: blueskyAuthProvider,
        githubAppProvider,
        githubConnectionRepository,
        userRepository,
        sessionManager,
        stateManager,
      },
    });

    this.noteService = new NoteService({
      deps: {
        githubContentProvider,
        githubConnectionRepository,
        bookRepository,
        noteRepository,
        tagRepository,
      },
    });

    this.postService = new PostService({
      deps: {
        postRepository,
        blueskyPostProvider,
      },
    });
  }
}

const env = envSchema.safeParse(process.env);
if (!env.success) {
  throw new Error(env.error.errors[0].message);
}
export const container = new Container(env.data);
