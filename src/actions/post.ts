"use server";

import { auth } from "@/actions/account";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { container } from "./container";

export const getPost = cache(_getPost);
async function _getPost(bookId: string, notePath: string) {
  return container.postService.getPost
    .bind(container.postService)({ bookId, notePath })
    .unwrapOr(null);
}

export const getEngagementByNotePath = cache(_getEngagementByNotePath);
async function _getEngagementByNotePath(bookId: string, notePath: string) {
  return container.postService.getEngagementByNotePath
    .bind(container.postService)({ bookId, notePath })
    .unwrapOr(null);
}

export const getEngagement = cache(_getEngagement);
async function _getEngagement(uri: string) {
  return container.postService.getEngagement
    .bind(container.postService)({ uri })
    .unwrapOr(null);
}

export async function postNote(bookId: string, notePath: string, text: string) {
  const session = await auth();

  if (!session) {
    return null;
  }

  return container.postService.postNote
    .bind(container.postService)({
      userId: session.user.id,
      bookId,
      notePath,
      did: session.user.did,
      text,
    })
    .andTee(() => revalidatePath(`/[handle]/[owner]/[repo]/${notePath}`))
    .unwrapOr(null);
}
