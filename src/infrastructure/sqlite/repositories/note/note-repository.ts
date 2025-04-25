import type { Tag } from "@/domain/note/models";
import type {
  CreateOrUpdateNote,
  NoteRepository,
} from "@/domain/note/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { PaginationParams } from "@/domain/types/pagination";
import { and, asc, count, desc, eq, inArray, like, or } from "drizzle-orm";
import { ResultAsync, err, ok } from "neverthrow";
import { type Database, mapRepositoryError } from "../../client";
import { users } from "../../schema/account";
import { books, noteTags, notes, tags } from "../../schema/note";

/**
 * NoteRepositoryの実装
 */
export class DrizzleNoteRepository implements NoteRepository {
  constructor(private readonly db: Database) {}

  /**
   * ソート条件を安全に生成する
   */
  private getOrderBy(pagination?: PaginationParams) {
    if (!pagination?.orderBy || !pagination?.order) {
      return desc(notes.createdAt);
    }

    const order = pagination.order === "asc" ? asc : desc;
    switch (pagination.orderBy) {
      case "title":
        return order(notes.title);
      case "updatedAt":
        return order(notes.updatedAt);
      default:
        return order(notes.createdAt);
    }
  }

  /**
   * ノートを作成または更新する
   */
  createOrUpdate(note: CreateOrUpdateNote) {
    return ResultAsync.fromPromise(
      this.db.transaction(async (tx) => {
        const [savedNote] = await tx
          .insert(notes)
          .values(note)
          .onConflictDoUpdate({
            target: [notes.bookId, notes.path],
            set: {
              title: note.title,
              body: note.body,
              scope: note.scope,
            },
          })
          .returning();

        if (!savedNote) {
          throw new Error("Failed to create or update note");
        }

        let savedTags: Tag[] = [];
        if (note.tags.length > 0) {
          savedTags = await tx
            .insert(tags)
            .values(
              note.tags.map((name) => ({ bookId: savedNote.bookId, name })),
            )
            .onConflictDoUpdate({
              target: [tags.bookId, tags.name],
              set: { updatedAt: new Date() },
            })
            .returning();

          await tx
            .insert(noteTags)
            .values(
              savedTags.map((tag) => ({
                noteId: savedNote.id,
                tagId: tag.id,
              })),
            )
            .onConflictDoNothing();
        }

        return savedNote;
      }),
      mapRepositoryError,
    );
  }

  /**
   * 指定したIDのノートを取得する
   */
  findById(id: string) {
    return ResultAsync.fromPromise(
      this.db.select().from(notes).where(eq(notes.id, id)),
      mapRepositoryError,
    ).andThen((selectedNotes) =>
      selectedNotes.length === 0
        ? err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Note not found",
            ),
          )
        : ok(selectedNotes[0]),
    );
  }

  /**
   * 指定したIDのノートを取得する
   */
  findByPath(path: string) {
    return ResultAsync.fromPromise(
      this.db.select().from(notes).where(eq(notes.path, path)),
      mapRepositoryError,
    ).andThen((selectedNotes) =>
      selectedNotes.length === 0
        ? err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Note not found",
            ),
          )
        : ok(selectedNotes[0]),
    );
  }

  /**
   * 指定したブックIDのノート一覧を取得する
   */
  findByBookId(bookId: string, pagination?: PaginationParams) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const offset = (page - 1) * limit;

    const sq = this.db.$with("sq").as(
      this.db
        .select({
          id: notes.id,
        })
        .from(notes)
        .where(eq(notes.bookId, bookId))
        .orderBy(this.getOrderBy(pagination))
        .limit(limit)
        .offset(offset),
    );

    return ResultAsync.fromPromise(
      Promise.all([
        this.db
          .with(sq)
          .select({
            note: notes,
          })
          .from(sq)
          .innerJoin(notes, eq(sq.id, notes.id))
          .orderBy(this.getOrderBy(pagination)),
        this.db
          .select({ value: count() })
          .from(notes)
          .where(eq(notes.bookId, bookId)),
      ]),
      mapRepositoryError,
    ).map(([items, c]) => ({
      items: items.map((i) => i.note),
      count: c.at(0)?.value || 0,
    }));
  }

  listAllByBookId(bookId: string) {
    return ResultAsync.fromPromise(
      this.db.select().from(notes).where(eq(notes.bookId, bookId)),
      mapRepositoryError,
    );
  }

  /**
   * 指定したブックID、タグIDのノート一覧を取得する
   */
  findByTag(bookId: string, tagId: string, pagination?: PaginationParams) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const offset = (page - 1) * limit;

    return ResultAsync.fromPromise(
      Promise.all([
        this.db
          .select({
            note: notes,
            noteTag: noteTags,
            tag: tags,
          })
          .from(notes)
          .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
          .innerJoin(tags, eq(noteTags.tagId, tags.id))
          .where(and(eq(notes.bookId, bookId), eq(noteTags.tagId, tagId)))
          .limit(limit)
          .offset(offset)
          .orderBy(this.getOrderBy(pagination)),
        this.db
          .select({ value: count() })
          .from(notes)
          .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
          .where(and(eq(notes.bookId, bookId), eq(noteTags.tagId, tagId))),
      ]),
      mapRepositoryError,
    ).map(([items, c]) => ({
      items: items.map((i) => i.note),
      count: c.at(0)?.value || 0,
    }));
  }

  /**
   * 指定した条件でノートを検索する
   */
  search(
    bookId?: string | null,
    query?: string | null,
    pagination?: PaginationParams,
  ) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const offset = (page - 1) * limit;

    const filters = [
      bookId ? eq(notes.bookId, bookId) : undefined,
      query
        ? or(like(notes.title, `%${query}%`), like(notes.body, `%${query}%`))
        : undefined,
    ].filter((filter) => filter !== undefined);

    const sq = this.db.$with("sq").as(
      this.db
        .select({
          id: notes.id,
        })
        .from(notes)
        .where(and(...filters))
        .orderBy(this.getOrderBy(pagination))
        .limit(limit)
        .offset(offset),
    );

    return ResultAsync.fromPromise(
      Promise.all([
        this.db
          .with(sq)
          .select({
            note: notes,
            user: users,
            book: books,
          })
          .from(sq)
          .innerJoin(notes, eq(sq.id, notes.id))
          .innerJoin(users, eq(notes.userId, users.id))
          .innerJoin(books, eq(notes.bookId, books.id))
          .orderBy(this.getOrderBy(pagination)),
        this.db
          .select({ value: count() })
          .from(notes)
          .where(and(...filters)),
      ]),
      mapRepositoryError,
    ).map(([items, c]) => ({
      items: items.map((i) => ({
        ...i.note,
        fullPath: `${i.user.handle}/${i.book.owner}/${i.book.repo}/${i.note.path}`,
      })),
      count: c.at(0)?.value || 0,
    }));
  }

  /**
   * 指定したIDのノートを削除する
   */
  delete(id: string) {
    return ResultAsync.fromPromise(
      this.db.delete(notes).where(eq(notes.id, id)),
      mapRepositoryError,
    ).map(() => {});
  }

  /**
   * 指定したブックID、pathのノートを削除する
   */
  deleteByPath(bookId: string, paths: string[]) {
    return ResultAsync.fromThrowable(
      () =>
        this.db
          .delete(notes)
          .where(and(eq(notes.bookId, bookId), inArray(notes.path, paths))),
      mapRepositoryError,
    )().map(() => {});
  }

  count() {
    return ResultAsync.fromPromise(
      this.db
        .select({
          count: count(),
        })
        .from(notes),
      mapRepositoryError,
    ).map((results) => results.at(0)?.count || 0);
  }

  list(page: number, limit: number) {
    return ResultAsync.fromPromise(
      this.db
        .select()
        .from(notes)
        .innerJoin(books, eq(notes.bookId, books.id))
        .innerJoin(users, eq(notes.userId, users.id))
        .orderBy(asc(notes.id))
        .limit(limit)
        .offset((page - 1) * limit),
      mapRepositoryError,
    ).map((results) =>
      results.map((row) => ({
        ...row.notes,
        book: row.books,
        user: row.users,
      })),
    );
  }
}
