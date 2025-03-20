import { eq } from "drizzle-orm";
import { type Result, err, ok } from "@/lib/result";
import type { Tag } from "@/domain/note/models";
import { tagSchema } from "@/domain/note/models/tag";
import type {
  TagRepository,
  CreateTag,
  UpdateTag,
} from "@/domain/note/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import {
  type PgDatabase,
  isDatabaseError,
  codeToRepositoryErrorCode,
} from "../../client";
import { tags, notes, noteTags } from "../../schema/note";

/**
 * TagRepositoryの実装
 */
export class DrizzleTagRepository implements TagRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * タグを作成する
   */
  async create(tag: CreateTag): Promise<Result<Tag, RepositoryError>> {
    try {
      const [savedTag] = await this.db.insert(tags).values(tag).returning();

      if (!savedTag) {
        throw new Error("Failed to parse tag data");
      }

      const parsed = tagSchema.safeParse(savedTag);
      if (!parsed.success) {
        throw new Error("Failed to parse tag data");
      }

      return ok(parsed.data);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse tag data",
          error,
        ),
      );
    }
  }

  /**
   * タグを更新する
   */
  async update(tag: UpdateTag): Promise<Result<Tag, RepositoryError>> {
    try {
      const [updatedTag] = await this.db
        .update(tags)
        .set(tag)
        .where(eq(tags.id, tag.id))
        .returning();

      if (!updatedTag) {
        throw new Error("Failed to parse tag data");
      }

      const parsed = tagSchema.safeParse(updatedTag);
      if (!parsed.success) {
        throw new Error("Failed to parse tag data");
      }

      return ok(parsed.data);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse tag data",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのタグを取得する
   */
  async findById(id: string): Promise<Result<Tag | null, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        // タグ情報を取得
        const tagResults = await tx
          .select()
          .from(tags)
          .where(eq(tags.id, id))
          .limit(1);

        if (tagResults.length === 0) return null;

        const parsed = tagSchema.safeParse(tagResults[0]);
        if (!parsed.success) {
          throw new Error("Failed to parse tag data");
        }

        return parsed.data;
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse tag data",
          error,
        ),
      );
    }
  }

  /**
   * 指定したノートIDのタグ一覧を取得する
   */
  async findByNoteId(noteId: string): Promise<Result<Tag[], RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        // タグ情報を取得
        const tagResults = await tx
          .select({
            tag: tags,
          })
          .from(noteTags)
          .innerJoin(tags, eq(noteTags.tagId, tags.id))
          .where(eq(noteTags.noteId, noteId));

        const parsedTags = tagResults.map((result) => {
          const parsed = tagSchema.safeParse(result.tag);
          if (!parsed.success) {
            throw new Error("Failed to parse tag data");
          }
          return parsed.data;
        });

        return parsedTags;
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse tag data",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのタグを削除する
   */
  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(tags).where(eq(tags.id, id));
      return ok(undefined);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse tag data",
          error,
        ),
      );
    }
  }
}
