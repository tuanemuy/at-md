import type { Result } from "@/lib/result";
import { err } from "@/lib/result";
import { logger } from "@/lib/logger";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { Note } from "@/domain/note/models";
import type { NoteRepository } from "@/domain/note/repositories/note-repository";
import type { TagRepository } from "@/domain/note/repositories/tag-repository";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { ListNotesByTagInput, ListNotesByTagUseCase } from "../usecase";

/**
 * タグでノートをフィルタリングするユースケース実装
 */
export class ListNotesByTagService implements ListNotesByTagUseCase {
  private readonly noteRepository: NoteRepository;
  private readonly tagRepository: TagRepository;
  private readonly bookRepository: BookRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      noteRepository: NoteRepository;
      tagRepository: TagRepository;
      bookRepository: BookRepository;
    };
  }) {
    this.noteRepository = params.deps.noteRepository;
    this.tagRepository = params.deps.tagRepository;
    this.bookRepository = params.deps.bookRepository;
  }

  /**
   * ユースケースを実行する
   */
  async execute(input: ListNotesByTagInput): Promise<Result<Note[], NoteError>> {
    logger.info("Listing notes by tag", {
      bookId: input.bookId,
      tagId: input.tagId,
    });

    // 指定されたブックが存在するか確認
    const bookResult = await this.bookRepository.findById(input.bookId);
    if (bookResult.isErr()) {
      logger.error("Failed to find book", {
        bookId: input.bookId,
        error: bookResult.error,
      });
      return err(
        new NoteError(
          NoteErrorCode.BOOK_NOT_FOUND,
          "ブックが見つかりません",
          bookResult.error,
        ),
      );
    }

    // 指定されたタグが存在するか確認（タグの所属するブックを確認）
    const tagsResult = await this.tagRepository.findByBookId(input.bookId);
    if (tagsResult.isErr()) {
      logger.error("Failed to get tags", {
        bookId: input.bookId,
        error: tagsResult.error,
      });
      return err(
        new NoteError(
          NoteErrorCode.TAG_NOT_FOUND,
          "タグの取得に失敗しました",
          tagsResult.error,
        ),
      );
    }

    const tags = tagsResult.value;
    const tagExists = tags.some((tag) => tag.id === input.tagId);
    if (!tagExists) {
      logger.error("Tag not found in book", {
        bookId: input.bookId,
        tagId: input.tagId,
      });
      return err(
        new NoteError(
          NoteErrorCode.TAG_NOT_FOUND,
          "指定されたタグが見つかりません",
        ),
      );
    }

    // タグでノートをフィルタリング
    const notesResult = await this.noteRepository.findByTag(
      input.bookId,
      input.tagId,
    );

    return notesResult
      .map((result) => {
        logger.info("Successfully listed notes by tag", {
          bookId: input.bookId,
          tagId: input.tagId,
          count: result.items.length,
          total: result.count,
        });
        return result.items;
      })
      .mapErr((error) => {
        logger.error("Failed to list notes by tag", {
          bookId: input.bookId,
          tagId: input.tagId,
          error,
        });
        return new NoteError(
          NoteErrorCode.NOTE_NOT_FOUND,
          "ノート一覧の取得に失敗しました",
          error,
        );
      });
  }
} 