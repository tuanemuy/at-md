"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { container } from "./container";

export const auth = cache(async () => _auth());
async function _auth() {
  const cookieStore = await cookies();
  return container.accountService.validateSession
    .bind(container.accountService)({
      context: cookieStore,
    })
    .unwrapOr(null);
}

export async function signIn(handle: string) {
  const cookieStore = await cookies();
  return container.accountService.startBlueskyAuth
    .bind(container.accountService)({
      handle,
      context: cookieStore,
    })
    .match(
      (url) => redirect(url),
      () => "error",
    );
}

export async function signOut() {
  const cookieStore = await cookies();
  const result = await container.accountService.logout
    .bind(container.accountService)({ context: cookieStore })
    .match(
      () => true,
      () => false,
    );

  if (result) {
    redirect("/");
  }
}

export async function syncProfile() {
  const session = await auth();

  if (!session) {
    return false;
  }

  return await container.accountService.syncProfile
    .bind(container.accountService)({
      userId: session.user.id,
      did: session.user.did,
    })
    .match(
      (user) => {
        revalidatePath(`/${user.handle}`);
        return true;
      },
      () => false,
    );
}

export const getUser = cache(_getUser);
async function _getUser(id: string) {
  return container.accountService.getUserById
    .bind(container.accountService)({ userId: id })
    .unwrapOr(null);
}

export const getUserByHandle = cache(_getUserByHandle);
async function _getUserByHandle(handle: string) {
  return container.accountService.getUserByHandle
    .bind(container.accountService)({ handle })
    .unwrapOr(null);
}

export async function startGitHubAccessTokenFlow() {
  const session = await auth();

  if (!session) {
    return false;
  }

  const cookieStore = await cookies();
  return container.accountService.startGitHubAccessTokenFlow
    .bind(container.accountService)({
      context: cookieStore,
    })
    .match(
      (url) => redirect(url),
      () => "error",
    );
}

export async function startGitHubAppsInstallation() {
  const session = await auth();

  if (!session) {
    return false;
  }

  const cookieStore = await cookies();
  return container.accountService.startGitHubAppsInstallation
    .bind(container.accountService)({
      context: cookieStore,
    })
    .match(
      (url) => redirect(url),
      () => "error",
    );
}

export const getGitHubConnection = cache(_getGitHubConnection);
async function _getGitHubConnection(userId: string) {
  return container.accountService.getGitHubConnection
    .bind(container.accountService)({ userId })
    .map((connection) => ({ success: true, connection }))
    .unwrapOr({ success: false, connection: null });
}

export const listGitHubInstallations = cache(_listGitHubInstallations);
async function _listGitHubInstallations(userId: string) {
  return container.accountService.listGitHubInstallations
    .bind(container.accountService)({ userId })
    .map((installations) => ({ success: true, installations }))
    .unwrapOr({ success: false, installations: [] });
}

export async function deleteAccount() {
  const session = await auth();

  if (!session) {
    return null;
  }

  await container.accountService.getGitHubConnection
    .bind(container.accountService)({
      userId: session.user.id,
    })
    .andThen((connection) =>
      container.noteService.deleteAllWebhooks.bind(container.noteService)({
        accessToken: connection.accessToken,
        userId: session.user.id,
      }),
    )
    .unwrapOr(null);

  return container.accountService.deleteUser
    .bind(container.accountService)({
      userId: session.user.id,
    })
    .match(
      () => {
        revalidatePath("/auth/delete");
        return true;
      },
      () => false,
    );
}

export async function countUsers() {
  return container.accountService.countUsers
    .bind(container.accountService)()
    .unwrapOr(0);
}

export async function listUsers(page: number, limit: number) {
  return container.accountService.listUsers
    .bind(container.accountService)({ page, limit })
    .unwrapOr([]);
}
