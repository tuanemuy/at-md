import type { TagRepository } from "@/domain/note/repositories";
import { ResultAsync } from "@/lib/result";
import { eq, inArray } from "drizzle-orm";
import { type PgDatabase, mapRepositoryError } from "../../client";
import { noteTags, tags } from "../../schema/note";

/**
 * TagRepositoryの実装
 */
export class DrizzleTagRepository implements TagRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * 指定したノートIDのタグ一覧を取得する
   */
  findByNoteId(noteId: string) {
    return ResultAsync.fromPromise(
      this.db
        .select({
          tag: tags,
          noteTag: noteTags,
        })
        .from(tags)
        .innerJoin(noteTags, eq(tags.id, noteTags.tagId))
        .where(eq(noteTags.noteId, noteId)),
      mapRepositoryError,
    ).map((result) => result.map((row) => row.tag));
  }

  /**
   * 指定したブックIDのタグ一覧を取得する
   */
  findByBookId(bookId: string) {
    return ResultAsync.fromPromise(
      this.db.select().from(tags).where(eq(tags.bookId, bookId)),
      mapRepositoryError,
    );
  }

  /**
   * 使用されていないタグを削除する
   */
  deleteUnused(bookId: string) {
    return ResultAsync.fromPromise(
      this.db
        .select({
          tag: tags,
          noteTag: noteTags,
        })
        .from(tags)
        .leftJoin(noteTags, eq(tags.id, noteTags.tagId))
        .where(eq(tags.bookId, bookId)),
      mapRepositoryError,
    )
      .map((rows) =>
        rows.filter((row) => row.noteTag === null).map((row) => row.tag.id),
      )
      .andThen((unusedTagIds) =>
        ResultAsync.fromPromise(
          this.db.delete(tags).where(inArray(tags.id, unusedTagIds)),
          mapRepositoryError,
        ),
      )
      .map(() => {});
  }
}
