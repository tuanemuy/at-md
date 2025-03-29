import type { User } from "@/domain/account/models/user";
import type { CreateOrUpdateNote } from "@/domain/note/repositories";
import type { PostStatus } from "@/domain/post/models/post";
import type { CreatePost, UpdatePost } from "@/domain/post/repositories";
import { RepositoryErrorCode } from "@/domain/types/error";
import { users } from "@/infrastructure/db/schema/account";
import { PGlite } from "@electric-sql/pglite";
import { v7 as uuidv7 } from "uuid";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "../../../__test__/setup";
import { DrizzleBookRepository } from "../../note/book-repository";
import { DrizzleNoteRepository } from "../../note/note-repository";
import { DrizzlePostRepository } from "../post-repository";

describe("DrizzlePostRepository", () => {
  let client: PGlite;
  let postRepository: DrizzlePostRepository;
  let noteRepository: DrizzleNoteRepository;
  let bookRepository: DrizzleBookRepository;
  let db: ReturnType<typeof getTestDatabase>;

  // テスト用のユーザーとノートを作成するヘルパー関数
  const createTestUser = (): User => ({
    id: uuidv7(),
    did: `did:plc:${uuidv7()}`,
    profile: {
      displayName: "テストユーザー",
      description: "テスト用のユーザーです",
      avatarUrl: "https://example.com/avatar.png",
      bannerUrl: null,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createTestBook = (userId: string) => ({
    userId,
    owner: "testOwner",
    repo: "testRepo",
    details: {
      name: "テストブック",
      description: "テスト用のブックです",
    },
    syncStatus: {
      lastSyncedAt: null,
      status: "synced" as const,
    },
  });

  const createTestNote = (
    userId: string,
    bookId: string,
  ): CreateOrUpdateNote => ({
    userId,
    bookId,
    path: "test-note.md",
    title: "テストノート",
    body: "# テスト\nこれはテスト用のノートです。",
    scope: "public",
    tags: [],
  });

  const createTestCreatePost = (
    userId: string,
    noteId: string,
    status: PostStatus = "posted",
  ): CreatePost => ({
    userId,
    noteId,
    status,
    platform: "bluesky",
    postUri:
      status === "posted"
        ? `at://did:plc:${uuidv7()}/app.bsky.feed.post/${uuidv7()}`
        : null,
    postCid: status === "posted" ? uuidv7() : null,
    errorMessage: status === "error" ? "投稿に失敗しました" : null,
  });

  const createTestUpdatePost = (
    id: string,
    userId: string,
    noteId: string,
    status: PostStatus = "posted",
  ): UpdatePost => ({
    id,
    userId,
    noteId,
    status,
    postUri:
      status === "posted"
        ? `at://did:plc:${uuidv7()}/app.bsky.feed.post/${uuidv7()}`
        : null,
    postCid: status === "posted" ? uuidv7() : null,
    errorMessage: status === "error" ? "投稿に失敗しました" : null,
  });

  // テストの準備に必要な共通処理
  const setupTestData = async () => {
    const user = createTestUser();
    await db.insert(users).values(user);

    const bookResult = await bookRepository.create(createTestBook(user.id));
    if (bookResult.isErr()) {
      throw new Error(
        `ブックの作成に失敗しました: ${bookResult.error.message}`,
      );
    }
    const book = bookResult.value;

    const noteResult = await noteRepository.createOrUpdate(
      createTestNote(user.id, book.id),
    );
    if (noteResult.isErr()) {
      throw new Error(
        `ノートの作成に失敗しました: ${noteResult.error.message}`,
      );
    }
    const note = noteResult.value;

    return {
      user,
      book,
      note,
    };
  };

  beforeAll(async () => {
    client = new PGlite();
    await setupTestDatabase(client);
    db = getTestDatabase(client);
    postRepository = new DrizzlePostRepository(db);
    noteRepository = new DrizzleNoteRepository(db);
    bookRepository = new DrizzleBookRepository(db);
  });

  beforeEach(async () => {
    await cleanupTestDatabase(client);
  });

  afterAll(async () => {
    await closeTestDatabase(client);
  });

  test("新規投稿を作成すると投稿が正常に作成されること", async () => {
    // 準備
    const { user, note } = await setupTestData();
    const createPost = createTestCreatePost(user.id, note.id);

    // 実行
    const result = await postRepository.create(createPost);

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const post = result.value;
      expect(post.userId).toBe(user.id);
      expect(post.noteId).toBe(note.id);
      expect(post.status).toBe("posted");
      expect(post.postUri).toBeDefined();
      expect(post.postCid).toBeDefined();
    }
  });

  test("エラー状態の投稿を作成するとエラーメッセージが正しく保存されること", async () => {
    // 準備
    const { user, note } = await setupTestData();
    const createPost = createTestCreatePost(user.id, note.id, "error");

    // 実行
    const result = await postRepository.create(createPost);

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const post = result.value;
      expect(post.userId).toBe(user.id);
      expect(post.noteId).toBe(note.id);
      expect(post.status).toBe("error");
      expect(post.errorMessage).toBeDefined();
    }
  });

  test("既存投稿を更新すると投稿情報が正常に更新されること", async () => {
    // 準備
    const { user, note } = await setupTestData();
    const createResult = await postRepository.create(
      createTestCreatePost(user.id, note.id),
    );
    expect(createResult.isOk()).toBe(true);
    if (!createResult.isOk()) return;

    const postId = createResult.value.id;
    const updatePost = createTestUpdatePost(postId, user.id, note.id);

    // 実行
    const result = await postRepository.update(updatePost);

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const post = result.value;
      expect(post.id).toBe(postId);
      expect(post.userId).toBe(user.id);
      expect(post.noteId).toBe(note.id);
      expect(post.status).toBe("posted");
      expect(post.postUri).toBeDefined();
    }
  });

  test("IDで投稿を検索すると正しい投稿が取得できること", async () => {
    // 準備
    const { user, note } = await setupTestData();
    const createResult = await postRepository.create(
      createTestCreatePost(user.id, note.id),
    );
    expect(createResult.isOk()).toBe(true);
    if (!createResult.isOk()) return;
    const createdPost = createResult.value;

    // 実行
    const result = await postRepository.findById(createdPost.id);

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const post = result.value;
      expect(post.id).toBe(createdPost.id);
      expect(post.userId).toBe(user.id);
      expect(post.noteId).toBe(note.id);
      expect(post.status).toBe("posted");
    }
  });

  test("存在しないIDで検索するとNOT_FOUNDエラーが返ること", async () => {
    // 実行
    const result = await postRepository.findById(uuidv7());

    // 検証
    expect(result.isErr()).toBe(true);
    result.mapErr((error) => {
      expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
    });
  });

  test("ノートIDで投稿を検索すると正しい投稿が取得できること", async () => {
    // 準備
    const { user, note } = await setupTestData();
    const createResult = await postRepository.create(
      createTestCreatePost(user.id, note.id),
    );
    expect(createResult.isOk()).toBe(true);
    if (!createResult.isOk()) return;

    // 実行
    const result = await postRepository.findByNoteId(note.id);

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const post = result.value;
      expect(post.noteId).toBe(note.id);
      expect(post.userId).toBe(user.id);
    }
  });

  test("存在しないノートIDで投稿を検索するとNOT_FOUNDエラーが返ること", async () => {
    // 実行
    const result = await postRepository.findByNoteId(uuidv7());

    // 検証
    expect(result.isErr()).toBe(true);
    result.mapErr((error) => {
      expect(error.code).toBe(RepositoryErrorCode.NOT_FOUND);
    });
  });

  test("ユーザーIDで投稿一覧を取得できること", async () => {
    // 準備
    const { user, note } = await setupTestData();
    const createResult1 = await postRepository.create(
      createTestCreatePost(user.id, note.id),
    );
    expect(createResult1.isOk()).toBe(true);
    if (!createResult1.isOk()) return;

    const createResult2 = await postRepository.create(
      createTestCreatePost(user.id, note.id),
    );
    expect(createResult2.isOk()).toBe(true);
    if (!createResult2.isOk()) return;

    // 実行
    const result = await postRepository.findByUserId(user.id);

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const posts = result.value;
      expect(posts.length).toBe(2);
      const ids = posts.map((p) => p.id);
      expect(ids).toContain(createResult1.value.id);
      expect(ids).toContain(createResult2.value.id);
    }
  });

  test("存在しないユーザーIDで投稿一覧を検索すると空配列が返されること", async () => {
    // 実行
    const result = await postRepository.findByUserId(uuidv7());

    // 検証
    expect(result.isOk()).toBe(true);
    result.map((posts) => {
      expect(posts).toEqual([]);
    });
  });

  test("投稿を削除すると該当投稿が削除されること", async () => {
    // 準備
    const { user, note } = await setupTestData();
    const createResult = await postRepository.create(
      createTestCreatePost(user.id, note.id),
    );
    expect(createResult.isOk()).toBe(true);
    if (!createResult.isOk()) return;

    // 実行
    const deleteResult = await postRepository.delete(createResult.value.id);

    // 検証
    expect(deleteResult.isOk()).toBe(true);

    const findResult = await postRepository.findById(createResult.value.id);
    expect(findResult.isErr()).toBe(true);
    if (findResult.isErr()) {
      expect(findResult.error.code).toBe(RepositoryErrorCode.NOT_FOUND);
    }
  });

  test("存在しないIDの投稿を削除しても成功すること", async () => {
    // 実行
    const result = await postRepository.delete(uuidv7());

    // 検証
    expect(result.isOk()).toBe(true);
  });
});
