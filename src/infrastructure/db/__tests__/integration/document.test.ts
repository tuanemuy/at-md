import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { generateId } from "@/domain/shared/models/id";
import { createUser } from "@/domain/account/models/user";
import { createDocument } from "@/domain/document/models/document";
import { createGitHubRepo } from "@/domain/document/models/githubRepo";
import { DrizzleDocumentRepository } from "../../repositories/document/document";
import { DrizzleGitHubRepoRepository } from "../../repositories/document/githubRepo";
import { DrizzleUserRepository } from "../../repositories/account/user";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
} from "../setup";
import * as loggerModule from "@/lib/logger";

describe("DrizzleDocumentRepository (Integration)", () => {
  const client = new PGlite();
  const db = getTestDatabase(client);
  const documentRepository = new DrizzleDocumentRepository(db);
  const githubRepoRepository = new DrizzleGitHubRepoRepository(db);
  const userRepository = new DrizzleUserRepository(db);
  let userId: string;
  let repoId: string;

  // テスト前にデータベースをセットアップ
  beforeAll(async () => {
    // ロガーをモック化
    vi.spyOn(loggerModule.logger, "debug").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "info").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "warn").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "error").mockImplementation(() => {});

    await setupTestDatabase(client);
  });

  // 各テスト前にデータベースをクリーンアップし、必要なデータを作成
  beforeEach(async () => {
    await cleanupTestDatabase(client);

    // テスト用ユーザーの作成
    userId = generateId();
    const userData = createUser("Test User", "did:example:123");
    const user = { id: userId, ...userData };
    await userRepository.save(user);

    // テスト用GitHubリポジトリの作成
    repoId = generateId();
    const repoData = createGitHubRepo(
      "testowner",
      "testrepo",
      "testowner/testrepo",
      userId,
    );
    const repo = { id: repoId, ...repoData };
    await githubRepoRepository.save(repo);
  });

  // テスト後にデータベース接続を閉じる
  afterAll(async () => {
    await closeTestDatabase(client);
    vi.restoreAllMocks();
  });

  it("新しい文書を保存して取得できること", async () => {
    // テスト用文書の作成
    const documentId = generateId();
    const documentData = createDocument(
      repoId,
      "test/path.md",
      "Test Document",
      "# Test Content",
      userId,
    );
    const document = { id: documentId, ...documentData };

    // 文書を保存
    const saveResult = await documentRepository.save(document);
    expect(saveResult.isOk()).toBe(true);

    // IDで文書を取得
    const findByIdResult = await documentRepository.findById(documentId);
    expect(findByIdResult.isOk()).toBe(true);
    if (findByIdResult.isOk()) {
      const foundDocument = findByIdResult.value;
      expect(foundDocument).not.toBeNull();
      expect(foundDocument?.id).toBe(documentId);
      expect(foundDocument?.gitHubRepoId).toBe(repoId);
      expect(foundDocument?.path).toBe("test/path.md");
      expect(foundDocument?.title).toBe("Test Document");
      expect(foundDocument?.document).toBe("# Test Content");
      expect(foundDocument?.userId).toBe(userId);
    }
  });

  it("リポジトリIDとパスで文書を検索できること", async () => {
    // テスト用文書の作成と保存
    const documentId = generateId();
    const documentData = createDocument(
      repoId,
      "unique/path.md",
      "Unique Document",
      "# Unique Content",
      userId,
    );
    const document = { id: documentId, ...documentData };
    await documentRepository.save(document);

    // リポジトリIDとパスで文書を取得
    const findResult = await documentRepository.findByGitHubRepoAndPath(
      repoId,
      "unique/path.md",
    );
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const foundDocument = findResult.value;
      expect(foundDocument).not.toBeNull();
      expect(foundDocument?.id).toBe(documentId);
      expect(foundDocument?.title).toBe("Unique Document");
    }
  });

  it("リポジトリIDで文書を検索できること", async () => {
    // 複数のテスト用文書を作成して保存
    const doc1Id = generateId();
    const doc1Data = createDocument(
      repoId,
      "doc1.md",
      "Document 1",
      "# Content 1",
      userId,
    );
    const doc1 = { id: doc1Id, ...doc1Data };

    const doc2Id = generateId();
    const doc2Data = createDocument(
      repoId,
      "doc2.md",
      "Document 2",
      "# Content 2",
      userId,
    );
    const doc2 = { id: doc2Id, ...doc2Data };

    await documentRepository.save(doc1);
    await documentRepository.save(doc2);

    // リポジトリIDで文書を取得
    const findResult = await documentRepository.findByGitHubRepo(repoId);
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const documents = findResult.value;
      expect(documents.length).toBe(2);

      // 各文書が正しく取得できていることを確認
      const paths = documents.map((doc) => doc.path);
      expect(paths).toContain("doc1.md");
      expect(paths).toContain("doc2.md");
    }
  });

  it("存在しないIDで文書を検索するとnullを返すこと", async () => {
    const nonExistentId = generateId();
    const result = await documentRepository.findById(nonExistentId);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeNull();
    }
  });

  it("文書情報を更新できること", async () => {
    // テスト用文書の作成と保存
    const documentId = generateId();
    const documentData = createDocument(
      repoId,
      "update-test.md",
      "Original Title",
      "# Original Content",
      userId,
    );
    const document = { id: documentId, ...documentData };
    await documentRepository.save(document);

    // 文書情報を更新
    const updatedDocument = {
      ...document,
      title: "Updated Title",
      document: "# Updated Content",
    };

    const updateResult = await documentRepository.save(updatedDocument);
    expect(updateResult.isOk()).toBe(true);

    // 更新された文書を取得して確認
    const findResult = await documentRepository.findById(documentId);
    expect(findResult.isOk()).toBe(true);
    if (findResult.isOk()) {
      const foundDocument = findResult.value;
      expect(foundDocument).not.toBeNull();
      expect(foundDocument?.title).toBe("Updated Title");
      expect(foundDocument?.document).toBe("# Updated Content");
      // パスは変更されていないことを確認
      expect(foundDocument?.path).toBe("update-test.md");
    }
  });

  it("ドキュメントを削除できること", async () => {
    // テスト用ドキュメントの作成と保存
    const documentId = generateId();
    const documentData = createDocument(
      repoId,
      "delete-test.md",
      "Delete Test Document",
      "# Delete Test Document\n\nContent",
      userId,
      "This is a document to test deletion",
      "public"
    );
    const document = { id: documentId, ...documentData };
    await documentRepository.save(document);

    // ドキュメントが保存されていることを確認
    const findBeforeDeleteResult = await documentRepository.findById(documentId);
    expect(findBeforeDeleteResult.isOk()).toBe(true);
    if (findBeforeDeleteResult.isOk()) {
      expect(findBeforeDeleteResult.value).not.toBeNull();
    }

    // ドキュメントを削除
    const deleteResult = await documentRepository.delete(documentId);
    expect(deleteResult.isOk()).toBe(true);

    // 削除後にドキュメントが存在しないことを確認
    const findAfterDeleteResult = await documentRepository.findById(documentId);
    expect(findAfterDeleteResult.isOk()).toBe(true);
    if (findAfterDeleteResult.isOk()) {
      expect(findAfterDeleteResult.value).toBeNull();
    }
  });

  it("存在しないドキュメントを削除しても成功すること", async () => {
    const nonExistentId = generateId();
    
    // 存在しないドキュメントを削除
    const deleteResult = await documentRepository.delete(nonExistentId);
    
    // 削除操作自体は成功する
    expect(deleteResult.isOk()).toBe(true);
  });
});
