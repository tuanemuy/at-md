import { describe, test, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { v7 as uuidv7 } from "uuid";
import { ok } from "@/lib/result";
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  closeTestDatabase,
  getTestDatabase
} from "../../../__test__/setup";
import type { User } from "@/domain/account/models/user";
import type { Note } from "@/domain/note/models/note";
import type { Post } from "@/domain/post/models/post";
import { PostStatus } from "@/domain/post/models/post";
import type { CreatePost, UpdatePost } from "@/domain/post/repositories";
import { DrizzlePostRepository } from "../post-repository";
import { DrizzleNoteRepository } from "../../note/note-repository";
import { DrizzleBookRepository } from "../../note/book-repository";
import { users } from "@/infrastructure/db/schema/account";

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
      bannerUrl: null
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const createTestNote = (userId: string): Note => ({
    id: uuidv7(),
    userId,
    bookId: uuidv7(),
    path: "test-note.md",
    title: "テストノート",
    body: "# テスト\nこれはテスト用のノートです。",
    scope: "public",
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const createTestPost = (userId: string, noteId: string, status: PostStatus = "posted"): Post => ({
    id: uuidv7(),
    userId,
    noteId,
    status,
    postUri: status === "posted" ? `at://did:plc:${uuidv7()}/app.bsky.feed.post/${uuidv7()}` : undefined,
    postCid: status === "posted" ? uuidv7() : undefined,
    errorMessage: status === "error" ? "投稿に失敗しました" : undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const createTestCreatePost = (userId: string, noteId: string, status: PostStatus = "posted"): CreatePost => ({
    userId,
    noteId,
    status,
    platform: "bluesky",
    postUri: status === "posted" ? `at://did:plc:${uuidv7()}/app.bsky.feed.post/${uuidv7()}` : null,
    postCid: status === "posted" ? uuidv7() : null,
    errorMessage: status === "error" ? "投稿に失敗しました" : null
  });

  const createTestUpdatePost = (id: string, userId: string, noteId: string, status: PostStatus = "posted"): UpdatePost => ({
    id,
    userId,
    noteId,
    status,
    postUri: status === "posted" ? `at://did:plc:${uuidv7()}/app.bsky.feed.post/${uuidv7()}` : null,
    postCid: status === "posted" ? uuidv7() : null,
    errorMessage: status === "error" ? "投稿に失敗しました" : null
  });

  beforeAll(async () => {
    client = await new PGlite();
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
    // テスト用のユーザーを作成
    const user = createTestUser();
    await db.insert(users).values({
      id: user.id,
      did: user.did,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // ブックを作成
    const book = {
      id: uuidv7(),
      userId: user.id,
      owner: "testOwner",
      repo: "testRepo",
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: {
        lastSyncedAt: null,
        status: "synced"
      }
    };
    const bookResult = await bookRepository.create({
      userId: user.id,
      owner: "testOwner",
      repo: "testRepo",
      details: {
        name: "テストブック",
        description: "テスト用のブックです"
      },
      syncStatus: {
        lastSyncedAt: null,
        status: "synced"
      }
    });
    
    let bookId = "";
    if (bookResult.isOk()) {
      bookId = bookResult.value.id;
    } else {
      throw new Error("ブックの作成に失敗しました");
    }
    
    // ノートを作成
    const note = createTestNote(user.id);
    note.bookId = bookId;
    const noteResult = await noteRepository.create({
      userId: user.id,
      bookId,
      path: note.path,
      title: note.title,
      body: note.body,
      scope: note.scope,
      tags: []
    });
    
    let noteId = "";
    if (noteResult.isOk()) {
      noteId = noteResult.value.id;
    } else {
      throw new Error("ノートの作成に失敗しました");
    }
    
    // 投稿を作成
    const createPost = createTestCreatePost(user.id, noteId);
    
    // 実行
    const result = await postRepository.create(createPost);
    
    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const post = result.value;
      expect(post.userId).toBe(user.id);
      expect(post.noteId).toBe(noteId);
      expect(post.status).toBe("posted");
      expect(post.postUri).toBeDefined();
      expect(post.postCid).toBeDefined();
    } else {
      throw new Error("投稿の作成に失敗しました");
    }
  });

  test("エラー状態の投稿を作成するとエラーメッセージが正しく保存されること", async () => {
    // ユーザーを作成
    const user = createTestUser();
    await db.insert(users).values(user);

    // まずブックを作成
    const bookResult = await bookRepository.create({
      userId: user.id,
      owner: "testowner2",
      repo: "testrepo2",
      details: {
        name: "テストブック2",
        description: "テスト用のブックです2"
      },
      syncStatus: {
        lastSyncedAt: null,
        status: "synced"
      }
    });

    if (bookResult.isErr()) {
      throw new Error(`ブックの作成に失敗しました: ${bookResult.error.message}`);
    }

    let bookId = "";
    bookResult.map((savedBook) => {
      bookId = savedBook.id;
    });
    
    // ノートを作成
    const noteResult = await noteRepository.create({
      userId: user.id,
      bookId: bookId,
      path: "test/path2.md",
      title: "テストノート2",
      body: "# テスト2\nこれはテスト用のノートです。",
      scope: "public",
      tags: []
    });

    if (noteResult.isErr()) {
      throw new Error(`ノートの作成に失敗しました: ${noteResult.error.message}`);
    }

    let noteId = "";
    noteResult.map((savedNote) => {
      noteId = savedNote.id;
    });
    
    // エラー状態の投稿データを作成
    const createPost = createTestCreatePost(user.id, noteId, "error");
    
    // 実行
    const result = await postRepository.create(createPost);
    
    // 結果を検証
    expect(result.isOk()).toBe(true);
    result.map((savedPost) => {
      expect(savedPost.userId).toEqual(user.id);
      expect(savedPost.noteId).toEqual(noteId);
      expect(savedPost.status).toEqual("error");
      expect(savedPost.errorMessage).toBeDefined();
    });
  });

  test("既存投稿を更新すると投稿情報が正常に更新されること", async () => {
    // ユーザーを作成
    const user = createTestUser();
    await db.insert(users).values(user);

    // まずブックを作成
    const bookResult = await bookRepository.create({
      userId: user.id,
      owner: "testowner3",
      repo: "testrepo3",
      details: {
        name: "テストブック3",
        description: "テスト用のブックです3"
      },
      syncStatus: {
        lastSyncedAt: null,
        status: "synced"
      }
    });

    if (bookResult.isErr()) {
      throw new Error(`ブックの作成に失敗しました: ${bookResult.error.message}`);
    }

    let bookId = "";
    bookResult.map((savedBook) => {
      bookId = savedBook.id;
    });
    
    // ノートを作成
    const noteResult = await noteRepository.create({
      userId: user.id,
      bookId: bookId,
      path: "test/path3.md",
      title: "テストノート3",
      body: "# テスト3\nこれはテスト用のノートです。",
      scope: "public",
      tags: []
    });

    if (noteResult.isErr()) {
      throw new Error(`ノートの作成に失敗しました: ${noteResult.error.message}`);
    }

    let noteId = "";
    noteResult.map((savedNote) => {
      noteId = savedNote.id;
    });
    
    // 投稿を作成
    const createPost = createTestCreatePost(user.id, noteId);
    const createResult = await postRepository.create(createPost);
    expect(createResult.isOk()).toBe(true);
    
    let postId = "";
    createResult.map((savedPost) => {
      postId = savedPost.id;
    });
    
    // 更新用の投稿データを作成
    const updatePost = createTestUpdatePost(postId, user.id, noteId);
    
    // 投稿を更新
    const result = await postRepository.update(updatePost);
    
    // 結果を検証
    expect(result.isOk()).toBe(true);
    result.map((updatedPost) => {
      expect(updatedPost.id).toEqual(postId);
      expect(updatedPost.userId).toEqual(user.id);
      expect(updatedPost.noteId).toEqual(noteId);
      expect(updatedPost.status).toEqual("posted");
      expect(updatedPost.postUri).toBeDefined();
    });
  });

  test("IDで投稿を検索すると正しい投稿が取得できること", async () => {
    // ユーザーを作成
    const user = createTestUser();
    await db.insert(users).values(user);

    // まずブックを作成
    const bookResult = await bookRepository.create({
      userId: user.id,
      owner: "testowner4",
      repo: "testrepo4",
      details: {
        name: "テストブック4",
        description: "テスト用のブックです4"
      },
      syncStatus: {
        lastSyncedAt: null,
        status: "synced"
      }
    });

    if (bookResult.isErr()) {
      throw new Error(`ブックの作成に失敗しました: ${bookResult.error.message}`);
    }

    let bookId = "";
    bookResult.map((savedBook) => {
      bookId = savedBook.id;
    });
    
    // ノートを作成
    const noteResult = await noteRepository.create({
      userId: user.id,
      bookId: bookId,
      path: "test/path4.md",
      title: "テストノート4",
      body: "# テスト4\nこれはテスト用のノートです。",
      scope: "public",
      tags: []
    });

    if (noteResult.isErr()) {
      throw new Error(`ノートの作成に失敗しました: ${noteResult.error.message}`);
    }

    let noteId = "";
    noteResult.map((savedNote) => {
      noteId = savedNote.id;
    });
    
    // 投稿を作成
    const createPost = createTestCreatePost(user.id, noteId);
    const createResult = await postRepository.create(createPost);
    expect(createResult.isOk()).toBe(true);
    
    let postId = "";
    createResult.map((savedPost) => {
      postId = savedPost.id;
    });
    
    // IDで投稿を検索
    const result = await postRepository.findById(postId);
    
    // 結果を検証
    expect(result.isOk()).toBe(true);
    result.map((foundPost) => {
      expect(foundPost).not.toBeNull();
      if (foundPost) {
        expect(foundPost.id).toEqual(postId);
        expect(foundPost.userId).toEqual(user.id);
        expect(foundPost.noteId).toEqual(noteId);
        expect(foundPost.status).toEqual("posted");
      }
    });
  });

  test("ノートIDで投稿を検索すると正しい投稿が取得できること", async () => {
    // ユーザーを作成
    const user = createTestUser();
    await db.insert(users).values(user);

    // まずブックを作成
    const bookResult = await bookRepository.create({
      userId: user.id,
      owner: "testowner5",
      repo: "testrepo5",
      details: {
        name: "テストブック5",
        description: "テスト用のブックです5"
      },
      syncStatus: {
        lastSyncedAt: null,
        status: "synced"
      }
    });

    if (bookResult.isErr()) {
      throw new Error(`ブックの作成に失敗しました: ${bookResult.error.message}`);
    }

    let bookId = "";
    bookResult.map((savedBook) => {
      bookId = savedBook.id;
    });
    
    // ノートを作成
    const noteResult = await noteRepository.create({
      userId: user.id,
      bookId: bookId,
      path: "test/path5.md",
      title: "テストノート5",
      body: "# テスト5\nこれはテスト用のノートです。",
      scope: "public",
      tags: []
    });

    if (noteResult.isErr()) {
      throw new Error(`ノートの作成に失敗しました: ${noteResult.error.message}`);
    }

    let noteId = "";
    noteResult.map((savedNote) => {
      noteId = savedNote.id;
    });
    
    // 投稿を作成
    const createPost = createTestCreatePost(user.id, noteId);
    const createResult = await postRepository.create(createPost);
    expect(createResult.isOk()).toBe(true);
    
    // ノートIDで投稿を検索
    const result = await postRepository.findByNoteId(noteId);
    
    // 結果を検証
    expect(result.isOk()).toBe(true);
    result.map((foundPost) => {
      expect(foundPost).not.toBeNull();
      if (foundPost) {
        expect(foundPost.noteId).toEqual(noteId);
      }
    });
  });

  test("存在しないIDで検索するとnullが返ること", async () => {
    const result = await postRepository.findById(uuidv7());
    
    expect(result.isOk()).toBe(true);
    result.map((foundPost) => {
      expect(foundPost).toBeNull();
    });
  });

  test("ユーザーIDで投稿一覧を取得できること", async () => {
    // ユーザーを作成
    const user = createTestUser();
    await db.insert(users).values(user);

    // まずブックを作成
    const bookResult = await bookRepository.create({
      userId: user.id,
      owner: "testowner6",
      repo: "testrepo6",
      details: {
        name: "テストブック6",
        description: "テスト用のブックです6"
      },
      syncStatus: {
        lastSyncedAt: null,
        status: "synced"
      }
    });

    if (bookResult.isErr()) {
      throw new Error(`ブックの作成に失敗しました: ${bookResult.error.message}`);
    }

    let bookId = "";
    bookResult.map((savedBook) => {
      bookId = savedBook.id;
    });
    
    // ノート1を作成
    const noteResult1 = await noteRepository.create({
      userId: user.id,
      bookId: bookId,
      path: "test/path6-1.md",
      title: "テストノート6-1",
      body: "# テスト6-1\nこれはテスト用のノートです。",
      scope: "public",
      tags: []
    });

    if (noteResult1.isErr()) {
      throw new Error(`ノート1の作成に失敗しました: ${noteResult1.error.message}`);
    }

    let noteId1 = "";
    noteResult1.map((savedNote) => {
      noteId1 = savedNote.id;
    });
    
    // ノート2を作成
    const noteResult2 = await noteRepository.create({
      userId: user.id,
      bookId: bookId,
      path: "test/path6-2.md",
      title: "テストノート6-2",
      body: "# テスト6-2\nこれはテスト用のノートです。",
      scope: "public",
      tags: []
    });

    if (noteResult2.isErr()) {
      throw new Error(`ノート2の作成に失敗しました: ${noteResult2.error.message}`);
    }

    let noteId2 = "";
    noteResult2.map((savedNote) => {
      noteId2 = savedNote.id;
    });
    
    // 投稿1を作成
    const post1 = createTestCreatePost(user.id, noteId1);
    const createResult1 = await postRepository.create(post1);
    expect(createResult1.isOk()).toBe(true);
    
    let postId1 = "";
    createResult1.map((post) => {
      postId1 = post.id;
    });
    
    // 投稿2を作成
    const post2 = createTestCreatePost(user.id, noteId2);
    const createResult2 = await postRepository.create(post2);
    expect(createResult2.isOk()).toBe(true);
    
    let postId2 = "";
    createResult2.map((post) => {
      postId2 = post.id;
    });
    
    // ユーザーIDで投稿一覧を取得
    const result = await postRepository.findByUserId(user.id);
    
    // 結果を検証
    expect(result.isOk()).toBe(true);
    result.map((posts) => {
      expect(posts.length).toEqual(2);
      const ids = posts.map(p => p.id);
      expect(ids).toContain(postId1);
      expect(ids).toContain(postId2);
    });
  });

  test("存在しないユーザーIDで投稿一覧を検索すると空配列が返されること", async () => {
    const nonExistentUserId = uuidv7();
    const result = await postRepository.findByUserId(nonExistentUserId);
    
    expect(result.isOk()).toBe(true);
    result.map((posts) => {
      expect(posts).toEqual([]);
    });
  });

  test("投稿を削除すると該当投稿が削除されること", async () => {
    // ユーザーを作成
    const user = createTestUser();
    await db.insert(users).values(user);

    // まずブックを作成
    const bookResult = await bookRepository.create({
      userId: user.id,
      owner: "testowner7",
      repo: "testrepo7",
      details: {
        name: "テストブック7",
        description: "テスト用のブックです7"
      },
      syncStatus: {
        lastSyncedAt: null,
        status: "synced"
      }
    });

    if (bookResult.isErr()) {
      throw new Error(`ブックの作成に失敗しました: ${bookResult.error.message}`);
    }

    let bookId = "";
    bookResult.map((savedBook) => {
      bookId = savedBook.id;
    });
    
    // ノートを作成
    const noteResult = await noteRepository.create({
      userId: user.id,
      bookId: bookId,
      path: "test/path7.md",
      title: "テストノート7",
      body: "# テスト7\nこれはテスト用のノートです。",
      scope: "public",
      tags: []
    });

    if (noteResult.isErr()) {
      throw new Error(`ノートの作成に失敗しました: ${noteResult.error.message}`);
    }

    let noteId = "";
    noteResult.map((savedNote) => {
      noteId = savedNote.id;
    });
    
    // 投稿を作成
    const createPost = createTestCreatePost(user.id, noteId);
    const createResult = await postRepository.create(createPost);
    expect(createResult.isOk()).toBe(true);
    
    let postId = "";
    createResult.map((post) => {
      postId = post.id;
    });
    
    // 削除を実行
    const deleteResult = await postRepository.delete(postId);
    
    // 削除結果を検証
    expect(deleteResult.isOk()).toBe(true);
    
    // 削除されたことを確認
    const findResult = await postRepository.findById(postId);
    expect(findResult.isOk()).toBe(true);
    findResult.map((post) => {
      expect(post).toBeNull();
    });
  });

  test("存在しないIDの投稿を削除しても成功すること", async () => {
    const nonExistentId = uuidv7();
    const result = await postRepository.delete(nonExistentId);
    
    expect(result.isOk()).toBe(true);
  });

  test("正しくないデータ型で投稿を作成するとエラーになること", async () => {
    // テスト用のユーザーとノートを作成
    const user = createTestUser();
    await db.insert(users).values({
      id: user.id,
      did: user.did,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
    
    const note = createTestNote(user.id);
    const noteResult = await noteRepository.create(note);
    
    // 不正なデータで投稿を作成（ステータスが不正）
    const invalidPost = {
      ...createTestCreatePost(user.id, note.id),
      status: "invalid_status" as any
    };
    
    // 実行と検証
    const result = await postRepository.create(invalidPost);
    expect(result.isErr()).toBe(true);
  });
}); 