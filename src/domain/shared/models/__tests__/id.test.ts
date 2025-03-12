import { expect, test, vi } from "vitest";
import { generateId, toId } from "../id";

test("generateId関数が有効な一意のIDを生成すること", () => {
  const id = generateId();

  // UUID形式に一致するか確認（現在の実装ではUUID）
  expect(id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  );
});

test("toId関数が有効なID文字列を正しく変換すること", () => {
  const validId = "123e4567-e89b-12d3-a456-426614174000";

  const result = toId(validId);

  expect(result).toBe(validId);
});

test("toId関数が無効な文字列に対してnullを返すこと", () => {
  const invalidId = "not-a-valid-id";

  const result = toId(invalidId);

  expect(result).toBeNull();
});
