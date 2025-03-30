import { expect, test, vi, beforeEach } from "vitest";
import { SyncNotesService } from "../sync-notes";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { GitHubCommit } from "@/domain/note/dtos";
import type { Book, Note, Tag, SyncStatus } from "@/domain/note/models";
import { SyncStatusCode } from "@/domain/note/models/sync-status";
import { generateId } from "@/domain/types/id";
import type { 
  NoteRepository, 
  BookRepository, 
  TagRepository 
} from "@/domain/note/repositories";

const mockGitHubConnectionRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  deleteByUserId: vi.fn(),
  delete: vi.fn(),
};

const mockNoteRepository = {
  createOrUpdate: vi.fn(),
  findById: vi.fn(),
  findByBookId: vi.fn(),
  findByTag: vi.fn(),
  search: vi.fn(),
  delete: vi.fn(),
  deleteByPath: vi.fn(),
} as unknown as NoteRepository;

const mockBookRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findByOwnerAndRepo: vi.fn(),
  delete: vi.fn(),
} as unknown as BookRepository;

const mockTagRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findById: vi.fn(),
  findByBookId: vi.fn(),
  findByNoteId: vi.fn(),
  findOrCreate: vi.fn(),
  delete: vi.fn(),
  deleteUnused: vi.fn(),
} as unknown as TagRepository;

const mockGithubContentProvider = {
  listRepositories: vi.fn(),
  getContent: vi.fn(),
  getContentByInstallation: vi.fn(),
  listPaths: vi.fn(),
  setupWebhook: vi.fn(),
};

beforeEach(() => {
  vi.resetAllMocks();
});

const testBook: Book = {
  id: generateId("Book"),
  userId: generateId("User"),
  owner: "test-owner",
  repo: "test-repo",
  details: {
    name: "Test Book",
    description: "Test Description",
  },
  syncStatus: {
    lastSyncedAt: new Date(),
    status: SyncStatusCode.SYNCED,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const testTag: Tag = {
  id: generateId("Tag"),
  bookId: generateId("Book"),
  name: "test-tag",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const testNote: Note = {
  id: generateId("Note"),
  userId: generateId("User"),
  bookId: generateId("Book"),
  path: "path/to/note.md",
  title: "Test Note",
  body: "# Test Note\n\nThis is a test note.",
  scope: "private",
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const testCommit: GitHubCommit = {
  id: generateId("Commit"),
  message: "Test commit",
  timestamp: new Date().toISOString(),
  url: "https://github.com/test-owner/test-repo/commit/hash",
  added: ["path/to/new-note.md"],
  removed: ["path/to/deleted-note.md"],
  modified: ["path/to/modified-note.md"],
};

const markdownContent = `---
scope: public
---

# Test Markdown

This is a test markdown file with tags: #test-tag #another-tag`;

test("コミットのマークダウンファイルを同期できること", async () => {
  const userId = generateId("User");
  const connectionId = generateId("Connection");
  
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync({
      id: connectionId,
      userId,
      accessToken: "test-token",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
  (mockBookRepository.findByOwnerAndRepo as any).mockReturnValue(okAsync(testBook));
  (mockBookRepository.findById as any).mockReturnValue(okAsync(testBook));
  (mockBookRepository.update as any).mockReturnValue(okAsync(testBook));

  (mockGithubContentProvider.getContent as any).mockReturnValue(
    okAsync(markdownContent),
  );
  (mockGithubContentProvider.listPaths as any).mockReturnValue(
    okAsync(["path/to/new-note.md", "path/to/modified-note.md"]),
  );

  const createdNote: Note = {
    ...testNote,
    id: generateId("Note"),
    path: "path/to/new-note.md",
    title: "Test Markdown",
    body: markdownContent,
    scope: "public",
    tags: [
      {
        id: generateId("Tag"),
        bookId: testBook.id,
        name: "test-tag",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: generateId("Tag"),
        bookId: testBook.id,
        name: "another-tag",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  (mockNoteRepository.createOrUpdate as any).mockReturnValue(okAsync(createdNote));
  (mockTagRepository.deleteUnused as any).mockReturnValue(okAsync(undefined));

  const service = new SyncNotesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
      tagRepository: mockTagRepository,
      githubContentProvider: mockGithubContentProvider,
    },
  });

  const result = await service.execute({
    userId,
    owner: "test-owner",
    repo: "test-repo",
  });

  expect(mockBookRepository.findByOwnerAndRepo).toHaveBeenCalledWith(
    "test-owner",
    "test-repo",
  );
  expect(mockGithubContentProvider.listPaths).toHaveBeenCalledWith(
    "test-token",
    "test-owner",
    "test-repo",
  );
  expect(mockGithubContentProvider.getContent).toHaveBeenCalledWith(
    "test-token",
    "test-owner",
    "test-repo",
    "path/to/new-note.md",
  );

  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toBe(2);
  }
});

test("GitHub連携情報が見つからない場合はエラーを返すこと", async () => {
  const userId = generateId("User");
  const errorId = generateId("Error");
  const connectionError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    `GitHub connection not found (${errorId})`,
  );
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    errAsync(connectionError),
  );

  const service = new SyncNotesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
      tagRepository: mockTagRepository,
      githubContentProvider: mockGithubContentProvider,
    },
  });

  const result = await service.execute({
    userId,
    owner: "test-owner",
    repo: "test-repo",
  });

  expect(mockGitHubConnectionRepository.findByUserId).toHaveBeenCalledWith(
    userId,
  );
  expect(mockBookRepository.findByOwnerAndRepo).not.toHaveBeenCalled();
  expect(mockGithubContentProvider.listPaths).not.toHaveBeenCalled();

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
  }
});

test("ブックが見つからない場合はエラーを返すこと", async () => {
  const userId = generateId("User");
  const connectionId = generateId("Connection");
  
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync({
      id: connectionId,
      userId,
      accessToken: "test-token",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );

  const bookError = new RepositoryError(
    RepositoryErrorCode.NOT_FOUND,
    "Book not found",
  );
  (mockBookRepository.findByOwnerAndRepo as any).mockReturnValue(errAsync(bookError));

  const service = new SyncNotesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
      tagRepository: mockTagRepository,
      githubContentProvider: mockGithubContentProvider,
    },
  });

  const result = await service.execute({
    userId,
    owner: "test-owner",
    repo: "test-repo",
  });

  expect(mockBookRepository.findByOwnerAndRepo).toHaveBeenCalledWith(
    "test-owner",
    "test-repo",
  );
  expect(mockGithubContentProvider.listPaths).not.toHaveBeenCalled();

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
  }
});

test("ファイル一覧の取得に失敗した場合はエラーを返すこと", async () => {
  const userId = generateId("User");
  const connectionId = generateId("Connection");
  
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync({
      id: connectionId,
      userId,
      accessToken: "test-token",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
  (mockBookRepository.findByOwnerAndRepo as any).mockReturnValue(okAsync(testBook));

  const contentError = new ExternalServiceError(
    "GitHubContent",
    ExternalServiceErrorCode.REQUEST_FAILED,
    "Failed to list paths",
  );
  (mockGithubContentProvider.listPaths as any).mockReturnValue(errAsync(contentError));

  const service = new SyncNotesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
      tagRepository: mockTagRepository,
      githubContentProvider: mockGithubContentProvider,
    },
  });

  const result = await service.execute({
    userId,
    owner: "test-owner",
    repo: "test-repo",
  });

  expect(mockGithubContentProvider.listPaths).toHaveBeenCalledWith(
    "test-token",
    "test-owner",
    "test-repo",
  );
  expect(mockGithubContentProvider.getContent).not.toHaveBeenCalled();

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.NOTE_CONTEXT_ERROR,
    );
  }
});

test("ファイル内容の取得に失敗した場合はそのファイルをスキップすること", async () => {
  const userId = generateId("User");
  const connectionId = generateId("Connection");
  
  (mockGitHubConnectionRepository.findByUserId as any).mockReturnValue(
    okAsync({
      id: connectionId,
      userId,
      accessToken: "test-token",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
  (mockBookRepository.findByOwnerAndRepo as any).mockReturnValue(okAsync(testBook));
  (mockBookRepository.update as any).mockReturnValue(okAsync(testBook));

  (mockGithubContentProvider.listPaths as any).mockReturnValue(
    okAsync(["path/to/new-note.md"]),
  );

  const contentError = new ExternalServiceError(
    "GitHubContent",
    ExternalServiceErrorCode.REQUEST_FAILED,
    "Failed to get content",
  );
  (mockGithubContentProvider.getContent as any).mockReturnValue(errAsync(contentError));

  const service = new SyncNotesService({
    deps: {
      githubConnectionRepository: mockGitHubConnectionRepository,
      noteRepository: mockNoteRepository,
      bookRepository: mockBookRepository,
      tagRepository: mockTagRepository,
      githubContentProvider: mockGithubContentProvider,
    },
  });

  const result = await service.execute({
    userId,
    owner: "test-owner",
    repo: "test-repo",
  });

  expect(mockGithubContentProvider.getContent).toHaveBeenCalledWith(
    "test-token",
    "test-owner",
    "test-repo",
    "path/to/new-note.md",
  );
  expect(mockNoteRepository.createOrUpdate).not.toHaveBeenCalled();

  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value).toBe(0);
  }
});
