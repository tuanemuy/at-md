import type { Result } from "@/lib/result";
import { err } from "@/lib/result";
import { logger } from "@/lib/logger";
import { NoteError, NoteErrorCode } from "@/domain/note/models/errors";
import type { Tag } from "@/domain/note/models";
import type { TagRepository } from "@/domain/note/repositories/tag-repository";
import type { BookRepository } from "@/domain/note/repositories/book-repository";
import type { ListTagsInput, ListTagsUseCase } from "../usecase";

/**
 * タグ一覧を取得するユースケース実装
 */
export class ListTagsService implements ListTagsUseCase {
  private readonly tagRepository: TagRepository;
  private readonly bookRepository: BookRepository;

  /**
   * コンストラクタ
   */
  constructor(params: {
    deps: {
      tagRepository: TagRepository;
      bookRepository: BookRepository;
    };
  }) {
    this.tagRepository = params.deps.tagRepository;
    this.bookRepository = params.deps.bookRepository;
  }

  /**
   * ユースケースを実行する
   */
  async execute(input: ListTagsInput): Promise<Result<Tag[], NoteError>> {
    logger.info("Listing tags", { bookId: input.bookId });

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

    // タグ一覧を取得
    return (await this.tagRepository.findByBookId(input.bookId))
      .map((tags) => {
        logger.info("Successfully listed tags", {
          bookId: input.bookId,
          count: tags.length,
        });
        return tags;
      })
      .mapErr((error) => {
        logger.error("Failed to list tags", {
          bookId: input.bookId,
          error,
        });
        return new NoteError(
          NoteErrorCode.TAG_NOT_FOUND,
          "タグ一覧の取得に失敗しました",
          error,
        );
      });
  }
} 