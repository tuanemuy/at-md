import { and, eq, like, sql } from "drizzle-orm";
import { type Result, err, ok } from "@/lib/result";
import type { Note } from "@/domain/note/models";
import { noteSchema } from "@/domain/note/models/note";
import type { NoteRepository, CreateNote, UpdateNote, PaginationParams } from "@/domain/note/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import {
  type PgDatabase,
  isDatabaseError,
  codeToRepositoryErrorCode,
} from "../../client";
import { notes, tags, noteTags } from "../../schema/note";

/**
 * NoteRepositoryの実装
 */
export class DrizzleNoteRepository implements NoteRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * ノートを作成する
   */
  async create(note: CreateNote): Promise<Result<Note, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        // ノートの保存
        const [savedNote] = await tx
          .insert(notes)
          .values(note)
          .returning();

        if (!savedNote) {
          throw new Error("Failed to parse note data");
        }

        // ノートとタグの関連付けを保存
        if (note.tags.length > 0) {
          // タグの保存と関連付け
          for (const tag of note.tags) {
            const [savedTag] = await tx
              .insert(tags)
              .values(tag)
              .onConflictDoUpdate({
                target: tags.id,
                set: tag,
              })
              .returning();

            if (!savedTag) {
              throw new Error("Failed to parse note data");
            }

            // ノートとタグの関連付け
            await tx
              .insert(noteTags)
              .values({
                noteId: savedNote.id,
                tagId: savedTag.id,
              })
              .onConflictDoNothing();
          }
        }

        // タグ情報を取得
        const noteTagsResults = await tx
          .select({
            tag: tags,
          })
          .from(noteTags)
          .innerJoin(tags, eq(noteTags.tagId, tags.id))
          .where(eq(noteTags.noteId, savedNote.id));

        const parsed = noteSchema.safeParse({
          ...savedNote,
          tags: noteTagsResults.map((result) => result.tag),
        });

        if (!parsed.success) {
          throw new Error("Failed to parse note data");
        }

        return parsed.data;
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse note data",
          error,
        ),
      );
    }
  }

  /**
   * ノートを更新する
   */
  async update(note: UpdateNote): Promise<Result<Note, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        // ノートの更新
        const [updatedNote] = await tx
          .update(notes)
          .set(note)
          .where(eq(notes.id, note.id))
          .returning();

        if (!updatedNote) {
          throw new Error("Failed to parse note data");
        }

        // 既存のタグ関連付けをクリア
        await tx
          .delete(noteTags)
          .where(eq(noteTags.noteId, updatedNote.id));

        // ノートとタグの関連付けを保存
        if (note.tags.length > 0) {
          // タグの保存と関連付け
          for (const tag of note.tags) {
            const [savedTag] = await tx
              .insert(tags)
              .values(tag)
              .onConflictDoUpdate({
                target: tags.id,
                set: tag,
              })
              .returning();

            if (!savedTag) {
              throw new Error("Failed to parse note data");
            }

            // ノートとタグの関連付け
            await tx
              .insert(noteTags)
              .values({
                noteId: updatedNote.id,
                tagId: savedTag.id,
              })
              .onConflictDoNothing();
          }
        }

        // タグ情報を取得
        const noteTagsResults = await tx
          .select({
            tag: tags,
          })
          .from(noteTags)
          .innerJoin(tags, eq(noteTags.tagId, tags.id))
          .where(eq(noteTags.noteId, updatedNote.id));

        const parsed = noteSchema.safeParse({
          ...updatedNote,
          tags: noteTagsResults.map((result) => result.tag),
        });

        if (!parsed.success) {
          throw new Error("Failed to parse note data");
        }

        return parsed.data;
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse note data",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのノートを取得する
   */
  async findById(id: string): Promise<Result<Note | null, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        // ノート情報を取得
        const noteResults = await tx
          .select()
          .from(notes)
          .where(eq(notes.id, id))
          .limit(1);

        if (noteResults.length === 0) return null;

        const note = noteResults[0];

        // タグ情報を取得
        const noteTagsResults = await tx
          .select({
            tag: tags,
          })
          .from(noteTags)
          .innerJoin(tags, eq(noteTags.tagId, tags.id))
          .where(eq(noteTags.noteId, note.id));

        const parsed = noteSchema.safeParse({
          ...note,
          tags: noteTagsResults.map((result) => result.tag),
        });

        if (!parsed.success) {
          throw new Error("Failed to parse note data");
        }

        return parsed.data;
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse note data",
          error,
        ),
      );
    }
  }

  /**
   * 指定したブックIDのノート一覧を取得する
   */
  async findByBookId(
    bookId: string,
    pagination?: PaginationParams
  ): Promise<Result<Note[], RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        // ページネーションパラメータの設定
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const offset = (page - 1) * limit;

        // ノート情報を取得
        const noteResults = await tx
          .select()
          .from(notes)
          .where(eq(notes.bookId, bookId))
          .limit(limit)
          .offset(offset);

        if (noteResults.length === 0) return [];

        // 各ノートのタグ情報を取得
        const notesWithTags = await Promise.all(
          noteResults.map(async (note) => {
            const noteTagsResults = await tx
              .select({
                tag: tags,
              })
              .from(noteTags)
              .innerJoin(tags, eq(noteTags.tagId, tags.id))
              .where(eq(noteTags.noteId, note.id));

            const parsed = noteSchema.safeParse({
              ...note,
              tags: noteTagsResults.map((result) => result.tag),
            });

            if (!parsed.success) {
              throw new Error("Failed to parse note data");
            }

            return parsed.data;
          })
        );

        return notesWithTags;
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse note data",
          error,
        ),
      );
    }
  }

  /**
   * 指定したタグIDのノート一覧を取得する
   */
  async findByTag(
    tagId: string,
    pagination?: PaginationParams
  ): Promise<Result<Note[], RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        // ページネーションパラメータの設定
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const offset = (page - 1) * limit;

        // タグに関連付けられたノートIDを取得
        const noteIdsResults = await tx
          .select({
            noteId: noteTags.noteId,
          })
          .from(noteTags)
          .where(eq(noteTags.tagId, tagId))
          .limit(limit)
          .offset(offset);

        if (noteIdsResults.length === 0) return [];

        const noteIds = noteIdsResults.map((result) => result.noteId);

        // ノート情報を取得
        const noteResults = await Promise.all(
          noteIds.map(async (noteId) => {
            const [note] = await tx
              .select()
              .from(notes)
              .where(eq(notes.id, noteId))
              .limit(1);

            if (!note) {
              throw new Error("Failed to parse note data");
            }

            // タグ情報を取得
            const noteTagsResults = await tx
              .select({
                tag: tags,
              })
              .from(noteTags)
              .innerJoin(tags, eq(noteTags.tagId, tags.id))
              .where(eq(noteTags.noteId, note.id));

            const parsed = noteSchema.safeParse({
              ...note,
              tags: noteTagsResults.map((result) => result.tag),
            });

            if (!parsed.success) {
              throw new Error("Failed to parse note data");
            }

            return parsed.data;
          })
        );

        return noteResults;
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse note data",
          error,
        ),
      );
    }
  }

  /**
   * 指定した条件でノートを検索する
   */
  async search(
    bookId: string,
    query: string,
    pagination?: PaginationParams
  ): Promise<Result<Note[], RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        // ページネーションパラメータの設定
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const offset = (page - 1) * limit;

        // ノート情報を取得（タイトルまたは本文に検索クエリを含むものを検索）
        const searchQuery = `%${query}%`;
        const noteResults = await tx
          .select()
          .from(notes)
          .where(
            and(
              eq(notes.bookId, bookId),
              sql`(${notes.title} ILIKE ${searchQuery} OR ${notes.body} ILIKE ${searchQuery})`
            )
          )
          .limit(limit)
          .offset(offset);

        if (noteResults.length === 0) return [];

        // 各ノートのタグ情報を取得
        const notesWithTags = await Promise.all(
          noteResults.map(async (note) => {
            const noteTagsResults = await tx
              .select({
                tag: tags,
              })
              .from(noteTags)
              .innerJoin(tags, eq(noteTags.tagId, tags.id))
              .where(eq(noteTags.noteId, note.id));

            const parsed = noteSchema.safeParse({
              ...note,
              tags: noteTagsResults.map((result) => result.tag),
            });

            if (!parsed.success) {
              throw new Error("Failed to parse note data");
            }

            return parsed.data;
          })
        );

        return notesWithTags;
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to parse note data",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのノートを削除する
   */
  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(notes).where(eq(notes.id, id));
      return ok(undefined);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to delete note",
          error,
        ),
      );
    }
  }
} 