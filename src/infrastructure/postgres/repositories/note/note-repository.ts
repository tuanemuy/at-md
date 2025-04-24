import type { User } from "@/domain/account/models/user";
import type { Note, Tag } from "@/domain/note/models";
import type {
  CreateOrUpdateNote,
  NoteRepository,
} from "@/domain/note/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { PaginationParams } from "@/domain/types/pagination";
import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { ResultAsync, err, ok } from "neverthrow";
import { type PgDatabase, mapRepositoryError } from "../../client";
import { profiles, users } from "../../schema/account";
import { bookDetails, books, noteTags, notes, tags } from "../../schema/note";

/**
 * NoteRepositoryの実装
 */
export class DrizzleNoteRepository implements NoteRepository {
  constructor(private readonly db: PgDatabase) {}

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

        return {
          ...savedNote,
          tags: savedTags,
        };
      }),
      mapRepositoryError,
    );
  }

  /**
   * 指定したIDのノートを取得する
   */
  findById(id: string) {
    return ResultAsync.fromPromise(
      this.db
        .select({
          note: notes,
          noteTag: noteTags,
          tag: tags,
        })
        .from(notes)
        .where(eq(notes.id, id))
        .leftJoin(noteTags, eq(notes.id, noteTags.noteId))
        .leftJoin(tags, eq(noteTags.tagId, tags.id)),
      mapRepositoryError,
    ).andThen((selectedNotes) =>
      selectedNotes.length === 0
        ? err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Note not found",
            ),
          )
        : ok({
            ...selectedNotes[0].note,
            tags: selectedNotes
              .map((note) => note.tag)
              .filter((tag): tag is Tag => tag !== null),
          }),
    );
  }

  /**
   * 指定したIDのノートを取得する
   */
  findByPath(path: string) {
    return ResultAsync.fromPromise(
      this.db
        .select({
          note: notes,
          noteTag: noteTags,
          tag: tags,
        })
        .from(notes)
        .where(eq(notes.path, path))
        .leftJoin(noteTags, eq(notes.id, noteTags.noteId))
        .leftJoin(tags, eq(noteTags.tagId, tags.id)),
      mapRepositoryError,
    ).andThen((selectedNotes) =>
      selectedNotes.length === 0
        ? err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Note not found",
            ),
          )
        : ok({
            ...selectedNotes[0].note,
            tags: selectedNotes
              .map((note) => note.tag)
              .filter((tag): tag is Tag => tag !== null),
          }),
    );
  }

  findByPathWithUserBook(path: string) {
    return ResultAsync.fromPromise(
      this.db
        .select({
          note: notes,
          noteTag: noteTags,
          tag: tags,
          book: books,
          bookDetails: bookDetails,
          user: users,
          profile: profiles,
        })
        .from(notes)
        .where(eq(notes.path, path))
        .leftJoin(noteTags, eq(notes.id, noteTags.noteId))
        .leftJoin(tags, eq(noteTags.tagId, tags.id))
        .innerJoin(books, eq(notes.bookId, books.id))
        .innerJoin(bookDetails, eq(books.id, bookDetails.bookId))
        .innerJoin(users, eq(books.userId, users.id))
        .innerJoin(profiles, eq(users.id, profiles.userId)),
      mapRepositoryError,
    ).andThen((selectedNotes) =>
      selectedNotes.length === 0
        ? err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Note not found",
            ),
          )
        : ok({
            ...selectedNotes[0].note,
            tags: selectedNotes
              .map((note) => note.tag)
              .filter((tag): tag is Tag => tag !== null),
            book: {
              ...selectedNotes[0].book,
              details: selectedNotes[0].bookDetails,
            },
            user: {
              ...selectedNotes[0].user,
              profile: selectedNotes[0].profile,
            },
          }),
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
            noteTag: noteTags,
            tag: tags,
          })
          .from(sq)
          .innerJoin(notes, eq(sq.id, notes.id))
          .leftJoin(noteTags, eq(notes.id, noteTags.noteId))
          .leftJoin(tags, eq(noteTags.tagId, tags.id))
          .orderBy(this.getOrderBy(pagination)),
        this.db
          .select({ value: count() })
          .from(notes)
          .where(eq(notes.bookId, bookId)),
      ]),
      mapRepositoryError,
    ).map(([selectedNotes, c]) => ({
      items: selectedNotes.reduce((acc, note) => {
        const added = acc.find((n) => n.id === note.note.id);
        if (added && note.tag) {
          added.tags.push(note.tag);
        } else {
          acc.push({
            ...note.note,
            tags: note.tag ? [note.tag] : [],
          });
        }
        return acc;
      }, [] as Note[]),
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
    ).map(([selectedNotes, c]) => ({
      items: selectedNotes.reduce((acc, note) => {
        const added = acc.find((n) => n.id === note.note.id);
        if (added) {
          added.tags.push(note.tag);
        } else {
          acc.push({
            ...note.note,
            tags: [note.tag],
          });
        }
        return acc;
      }, [] as Note[]),
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
        ? or(ilike(notes.title, `%${query}%`), ilike(notes.body, `%${query}%`))
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
            book: books,
            user: users,
            profile: profiles,
            noteTag: noteTags,
            tag: tags,
          })
          .from(sq)
          .innerJoin(notes, eq(sq.id, notes.id))
          .innerJoin(books, eq(notes.bookId, books.id))
          .innerJoin(users, eq(notes.userId, users.id))
          .innerJoin(profiles, eq(users.id, profiles.userId))
          .leftJoin(noteTags, eq(notes.id, noteTags.noteId))
          .leftJoin(tags, eq(noteTags.tagId, tags.id))
          .orderBy(this.getOrderBy(pagination)),
        this.db
          .select({ value: count() })
          .from(notes)
          .where(and(...filters)),
      ]),
      mapRepositoryError,
    ).map(([selectedNotes, c]) => ({
      items: selectedNotes.reduce(
        (acc, note) => {
          const added = acc.find((n) => n.id === note.note.id);
          if (added && note.tag) {
            added.tags.push(note.tag);
          } else {
            acc.push({
              ...note.note,
              fullPath: `${note.user.handle}/${note.book.owner}/${note.book.repo}/${note.note.path}`,
              tags: note.tag ? [note.tag] : [],
              user: {
                ...note.user,
                profile: note.profile,
              },
            });
          }
          return acc;
        },
        [] as (Note & { fullPath: string; user: User })[],
      ),
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
