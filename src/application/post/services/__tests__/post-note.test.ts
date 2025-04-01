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
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { DrizzleNoteRepository } from "@/infrastructure/db/repositories/note/note-repository";
import { DrizzlePostRepository } from "@/infrastructure/db/repositories/post/post-repository";
import { PGlite } from "@electric-sql/pglite";
import { errAsync, okAsync } from "@/lib/result";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { PostNoteService } from "../post-note";
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

// BlueskyPostProviderのモック
const mockBlueskyPostProvider = {
  createPost: vi.fn(),
  getEngagement: vi.fn(),
};

// テスト用データ
const testDid = "did:plc:testuser123";
const testText = "これはテスト投稿です #test";
const testBlueskyPost = {
  uri: "at://did:plc:testuser123/app.bsky.feed.post/1234",
  cid: "bafyreihc2xwxvhuh6qfge6j5ihrovedoqdocq5a",
};

beforeEach(async () => {
  // テスト用のデータベースをセットアップ
  client = new PGlite();
  await setupTestDatabase(client);
  db = getTestDatabase(client);
  userRepository = new DrizzleUserRepository(db);
  noteRepository = new DrizzleNoteRepository(db);
  postRepository = new DrizzlePostRepository(db);

  // BlueskyPostProviderのモックをリセット
  vi.resetAllMocks();
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
    body: testText,
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

test("投稿が成功した場合に成功結果が返されること", async () => {
  // テストデータのセットアップ
  const user = await createTestUser();
  const note = await createTestBookAndNote(user.id);

  // Bluesky投稿モックの設定
  mockBlueskyPostProvider.createPost.mockReturnValue(okAsync(testBlueskyPost));

  // テスト対象のサービスを作成
  const service = new PostNoteService({
    deps: {
      postRepository,
      blueskyPostProvider: mockBlueskyPostProvider,
    },
  });

  // 実行
  const result = await service.execute({
    userId: user.id,
    noteId: note.id,
    did: testDid,
    text: testText,
  });

  // 検証
  expect(mockBlueskyPostProvider.createPost).toHaveBeenCalledWith(
    testDid,
    testText,
  );
  expect(result.isOk()).toBe(true);

  if (result.isOk()) {
    const post = result.value;
    expect(post.userId).toBe(user.id);
    expect(post.noteId).toBe(note.id);
    expect(post.status).toBe(PostStatus.POSTED);
    expect(post.postUri).toBe(testBlueskyPost.uri);
    expect(post.postCid).toBe(testBlueskyPost.cid);
    expect(post.errorMessage).toBeNull();

    // データベースに保存されたことを確認
    const savedPostResult = await postRepository.findById(post.id);
    expect(savedPostResult.isOk()).toBe(true);
    if (savedPostResult.isOk()) {
      const savedPost = savedPostResult.value;
      expect(savedPost.userId).toBe(user.id);
      expect(savedPost.noteId).toBe(note.id);
      expect(savedPost.status).toBe(PostStatus.POSTED);
    }
  }
});

test("Blueskyへの投稿に失敗した場合にエラー情報が記録されること", async () => {
  // テストデータのセットアップ
  const user = await createTestUser();
  const note = await createTestBookAndNote(user.id);

  // 投稿失敗時のエラー
  const postError = new ExternalServiceError(
    "Bluesky",
    ExternalServiceErrorCode.RESPONSE_INVALID,
    "投稿に失敗しました",
  );

  // Bluesky投稿モックの設定
  mockBlueskyPostProvider.createPost.mockReturnValue(errAsync(postError));

  // テスト対象のサービスを作成
  const service = new PostNoteService({
    deps: {
      postRepository,
      blueskyPostProvider: mockBlueskyPostProvider,
    },
  });

  // 実行
  const result = await service.execute({
    userId: user.id,
    noteId: note.id,
    did: testDid,
    text: testText,
  });

  // 検証
  expect(mockBlueskyPostProvider.createPost).toHaveBeenCalledWith(
    testDid,
    testText,
  );
  expect(result.isErr()).toBe(true);

  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.POST_CONTEXT_ERROR,
    );

    // エラー情報がデータベースに保存されたことを確認
    const postsResult = await postRepository.findByNoteId(note.id);
    expect(postsResult.isOk()).toBe(true);

    if (postsResult.isOk()) {
      const post = postsResult.value;
      expect(post.status).toBe(PostStatus.ERROR);
      expect(post.postUri).toBeNull();
      expect(post.postCid).toBeNull();
      expect(post.errorMessage).toBe(postError.message);
    }
  }
});

