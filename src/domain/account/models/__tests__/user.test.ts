import { expect, test } from "vitest";
import { createUser, createGitHubConnection } from "../user";
import type { ID } from "@/domain/shared/models/id";

test("createUser関数が正しいユーザーオブジェクトを作成すること", () => {
  // 準備
  const name = "テストユーザー";
  const did = "did:example:123";

  // 実行
  const user = createUser(name, did);

  // 検証
  expect(user.name).toBe(name);
  expect(user.did).toBe(did);
  expect(user.gitHubConnections).toEqual([]);
  expect(user.createdAt).toBeInstanceOf(Date);
  expect(user.updatedAt).toBeInstanceOf(Date);
  expect(user.createdAt).toEqual(user.updatedAt);
});

test("createGitHubConnection関数が正しいGitHub連携情報オブジェクトを作成すること", () => {
  // 準備
  const userId = "123e4567-e89b-12d3-a456-426614174000" as ID;
  const installationId = "12345";
  const accessToken = "github_token_123";

  // 実行
  const connection = createGitHubConnection(userId, installationId, accessToken);

  // 検証
  expect(connection.userId).toBe(userId);
  expect(connection.installationId).toBe(installationId);
  expect(connection.accessToken).toBe(accessToken);
  expect(connection.createdAt).toBeInstanceOf(Date);
  expect(connection.updatedAt).toBeInstanceOf(Date);
  expect(connection.createdAt).toEqual(connection.updatedAt);
});

test("createGitHubConnection関数がaccessTokenがnullの場合も正しく動作すること", () => {
  // 準備
  const userId = "123e4567-e89b-12d3-a456-426614174000" as ID;
  const installationId = "12345";

  // 実行
  const connection = createGitHubConnection(userId, installationId);

  // 検証
  expect(connection.userId).toBe(userId);
  expect(connection.installationId).toBe(installationId);
  expect(connection.accessToken).toBeNull();
  expect(connection.createdAt).toBeInstanceOf(Date);
  expect(connection.updatedAt).toBeInstanceOf(Date);
}); 