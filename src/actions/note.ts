"use server";

import { auth } from "@/actions/account";
import type {
  AddBookInput,
  SearchNotesInput,
} from "@/application/note/usecase";
import type { PaginationParams } from "@/domain/types/pagination";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";
import { container } from "./container";

export async function searchRepositories(
  userId: string,
  query: string,
  owner: {
    type: "user" | "org";
    name: string;
  },
  pagination: PaginationParams,
) {
  return container.noteService.searchRepositories
    .bind(container.noteService)({ userId, query, owner, pagination })
    .unwrapOr({ repositories: [], count: 0 });
}

export async function addBook(input: AddBookInput) {
  return await container.noteService.addBook
    .bind(container.noteService)(input)
    .match(
      () => {
        revalidatePath("/[handle]/[owner]/[repo]", "page");
        return true;
      },
      () => {
        return false;
      },
    );
}

export const listBooks = cache(_listBooks);
async function _listBooks(userId: string) {
  return container.noteService.listBooks
    .bind(container.noteService)({ userId })
    .unwrapOr([]);
}

export const getBook = cache(_getBook);
async function _getBook(owner: string, repo: string) {
  return container.noteService.getBookByRepo
    .bind(container.noteService)({ owner, repo })
    .unwrapOr(null);
}

export async function syncNotes(owner: string, repo: string) {
  const session = await auth();

  if (!session) {
    return false;
  }

  after(async () => {
    await container.noteService.syncNotes.bind(container.noteService)({
      userId: session.user.id,
      owner,
      repo,
    });
  });

  return true;
}

export async function deleteBook(bookId: string, redirectPath?: string) {
  const session = await auth();

  if (!session) {
    return false;
  }

  const result = await container.noteService.deleteBook
    .bind(container.noteService)({
      userId: session.user.id,
      bookId,
    })
    .match(
      () => {
        revalidatePath("/[handle]", "page");
        return true;
      },
      () => false,
    );

  if (redirectPath) {
    redirect(redirectPath);
  }

  return result;
}

export async function listNotes(bookId: string, pagination: PaginationParams) {
  return container.noteService.listNotes
    .bind(container.noteService)({
      bookId,
      pagination,
    })
    .unwrapOr({
      items: [],
      count: 0,
    });
}

export async function listAllNotes(bookId: string) {
  return container.noteService.listAllNotes
    .bind(container.noteService)({
      bookId,
    })
    .unwrapOr([]);
}

export async function searchNotes(input: SearchNotesInput) {
  return container.noteService.searchNotes
    .bind(container.noteService)(input)
    .unwrapOr({
      items: [],
      count: 0,
    });
}

export const getNote = cache(_getNote);
async function _getNote(notePath: string) {
  return container.noteService.getNote
    .bind(container.noteService)({ notePath })
    .unwrapOr(null);
}

export async function deleteNote(noteId: string, redirectPath?: string) {
  const session = await auth();

  if (!session) {
    return false;
  }

  const result = await container.noteService.deleteNote
    .bind(container.noteService)({
      noteId,
    })
    .match(
      () => {
        revalidatePath("/[handle]/[owner]/[repo]", "page");
        return true;
      },
      () => false,
    );

  if (result && redirectPath) {
    redirect(redirectPath);
  }

  return result;
}

export async function countNotes() {
  return container.noteService.countNotes
    .bind(container.noteService)()
    .unwrapOr(0);
}

export async function listNotesForSitemap(page: number, limit: number) {
  return container.noteService.listNotesForSitemap
    .bind(container.noteService)({ page, limit })
    .unwrapOr([]);
}

export async function countBooks() {
  return container.noteService.countBooks
    .bind(container.noteService)()
    .unwrapOr(0);
}

export async function listBooksForSitemap(page: number, limit: number) {
  return container.noteService.listBooksForSitemap
    .bind(container.noteService)({ page, limit })
    .unwrapOr([]);
}
