import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import { PostStatus } from "@/domain/post/models/post";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { DrizzleNoteRepository } from "@/infrastructure/db/repositories/note/note-repository";
import { DrizzlePostRepository } from "@/infrastructure/db/repositories/post/post-repository";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test } from "vitest";
import { CheckPostStatusService } from "../check-post-status";
import { NoteScope } from "@/domain/note/models/note";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import * as schema from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";

// データベース関連の変数
let client: PGlite;
let userRepository: DrizzleUserRepository;
let noteRepository: DrizzleNoteRepository;
let postRepository: DrizzlePostRepository;
let db: ReturnType<typeof getTestDatabase>;

// テスト用データ
const testDid = "did:plc:testuser123";

beforeEach(async () => {
  // テスト用のデータベースをセットアップ
  client = new PGlite();
  await setupTestDatabase(client);
  db = getTestDatabase(client);
  userRepository = new DrizzleUserRepository(db);
  noteRepository = new DrizzleNoteRepository(db);
  postRepository = new DrizzlePostRepository(db);
});

afterEach(async () => {
  await cleanupTestDatabase(client);
  await closeTestDatabase(client);
});

// テスト用のユーザーを作成する関数
async function createTestUser() {
  const result = await userRepository.create({
    did: testDid,
    profile: {
      displayName: "テストユーザー",
      description: "テスト用のユーザーです",
      avatarUrl: "https://example.com/avatar.png",
      bannerUrl: null,
    },
  });

  if (result.isErr()) {
    throw new Error(`Failed to create user: ${result.error.message}`);
  }

  return result.value;
}

// テスト用のブックとノートを作成する関数
async function createTestBookAndNote(userId: string) {
  // ブックを直接スキーマを使用して作成
  const bookId = generateId("Book");
  await db.insert(schema.books).values({
    id: bookId,
    userId: userId,
    owner: "testOwner",
    repo: "testRepo",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // ブックの詳細情報を追加
  await db.insert(schema.bookDetails).values({
    bookId: bookId,
    name: "テストブック",
    description: "テスト用のブックです",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 同期ステータスを追加
  await db.insert(schema.syncStatuses).values({
    bookId: bookId,
    status: SyncStatusCode.SYNCED,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // ノートを直接スキーマを使用して作成
  const noteId = generateId("Note");
  await db.insert(schema.notes).values({
    id: noteId,
    userId: userId,
    bookId: bookId,
    path: "/path/to/note.md",
    title: "テストノート",
    body: "これはテスト投稿です #test",
    scope: NoteScope.PUBLIC,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // ノート情報を取得
  const [note] = await db
    .select()
    .from(schema.notes)
    .where(eq(schema.notes.id, noteId));

  return note;
}

// テスト用の投稿を作成する関数
async function createPost(userId: string, noteId: string, status: PostStatus) {
  const postId = generateId("Post");
  await db.insert(schema.posts).values({
    id: postId,
    userId,
    noteId,
    status,
    platform: "bluesky",
    postUri:
      status === PostStatus.POSTED
        ? "at://did:plc:testuser123/app.bsky.feed.post/1234"
        : null,
    postCid:
      status === PostStatus.POSTED
        ? "bafyreihc2xwxvhuh6qfge6j5ihrovedoqdocq5a"
        : null,
    errorMessage: status === PostStatus.ERROR ? "投稿に失敗しました" : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [post] = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.id, postId));

  return post;
}

test("投稿が存在する場合にそのステータスが返されること（正常投稿）", async () => {
  // テストデータのセットアップ
  const user = await createTestUser();
  const note = await createTestBookAndNote(user.id);

  // 正常投稿を作成
  const post = await createPost(user.id, note.id, PostStatus.POSTED);

  // テスト対象のサービスを作成
  const service = new CheckPostStatusService({
    deps: {
      postRepository,
    },
  });

  // 実行
  const result = await service.execute({
    noteId: note.id,
  });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toBe(PostStatus.POSTED);
  }
});

test("投稿が存在する場合にそのステータスが返されること（エラー投稿）", async () => {
  // テストデータのセットアップ
  const user = await createTestUser();
  const note = await createTestBookAndNote(user.id);

  // エラー投稿を作成
  const post = await createPost(user.id, note.id, PostStatus.ERROR);

  // テスト対象のサービスを作成
  const service = new CheckPostStatusService({
    deps: {
      postRepository,
    },
  });

  // 実行
  const result = await service.execute({
    noteId: note.id,
  });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toBe(PostStatus.ERROR);
  }
});

test("投稿が存在しない場合にエラーが返されること", async () => {
  // テストデータのセットアップ
  const user = await createTestUser();
  const note = await createTestBookAndNote(user.id);

  // テスト対象のサービスを作成
  const service = new CheckPostStatusService({
    deps: {
      postRepository,
    },
  });

  // 実行（投稿を作成せずにステータス確認を呼び出す）
  const result = await service.execute({
    noteId: note.id,
  });

  // 検証
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.POST_CONTEXT_ERROR,
    );
  }
});

