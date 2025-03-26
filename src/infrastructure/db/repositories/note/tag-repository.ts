import type { Tag } from "@/domain/note/models";
import type { TagRepository } from "@/domain/note/repositories";
import { RepositoryError } from "@/domain/types/error";
import { type Result, err, ok } from "@/lib/result";
import { eq, inArray } from "drizzle-orm";
import {
  type PgDatabase,
  codeToRepositoryErrorCode,
  isDatabaseError,
} from "../../client";
import { noteTags, tags } from "../../schema/note";

/**
 * TagRepositoryの実装
 */
export class DrizzleTagRepository implements TagRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * 指定したノートIDのタグ一覧を取得する
   */
  async findByNoteId(noteId: string): Promise<Result<Tag[], RepositoryError>> {
    try {
      const result = await this.db
        .select({
          tag: tags,
          noteTag: noteTags,
        })
        .from(tags)
        .innerJoin(noteTags, eq(tags.id, noteTags.tagId))
        .where(eq(noteTags.noteId, noteId));

      return ok(result.map((row) => row.tag));
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to find tags by noteId",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのタグを削除する
   */
  async deleteUnused(): Promise<Result<void, RepositoryError>> {
    try {
      const unusedTagIds = (
        await this.db
          .select({
            tag: tags,
            noteTag: noteTags,
          })
          .from(tags)
          .leftJoin(noteTags, eq(tags.id, noteTags.tagId))
      )
        .filter((row) => row.noteTag === null)
        .map((row) => row.tag.id);

      await this.db.delete(tags).where(inArray(tags.id, unusedTagIds));
      return ok();
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to delete unused tags",
          error,
        ),
      );
    }
  }
}
