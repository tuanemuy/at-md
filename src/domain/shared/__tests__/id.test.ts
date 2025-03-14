import { expect, test } from "vitest";
import { createId } from "../models/id";

test("有効なUUIDを生成できること", () => {
  const id = createId();
  
  // UUIDのフォーマットに一致するか確認
  expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
}); 