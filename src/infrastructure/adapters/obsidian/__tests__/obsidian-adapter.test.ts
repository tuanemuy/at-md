/**
 * Obsidianアダプターのテスト
 */

import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { describe, it } from "https://deno.land/std/testing/bdd.ts";
import { spy, assertSpyCalls } from "https://deno.land/std/testing/mock.ts";
import { Result } from "npm:neverthrow";
import { ObsidianAdapterError } from "../../../../core/content/mod.ts";

import { ObsidianAdapterImpl } from "../obsidian-adapter.ts";

// テスト用のモック関数を持つObsidianAdapterImplの型
type MockableObsidianAdapterImpl = ObsidianAdapterImpl & {
  readTextFile?: (filePath: string) => Promise<string>;
  writeTextFile?: (filePath: string, content: string) => Promise<void>;
};

describe("ObsidianAdapter", () => {
  describe("openVault", () => {
    it("ボールトを開くことができる", async () => {
      const adapter = new ObsidianAdapterImpl();
      const result = await adapter.openVault("./test-vault");
      
      // 結果を検証
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        assertEquals(typeof result.value.path, "string");
        assertEquals(typeof result.value.name, "string");
      }
    });
  });
  
  describe("getNote", () => {
    it("存在するノートの内容を取得できる", async () => {
      // モックのファイルパス
      const filePath = "test.md";
      
      // モックのファイル読み込み関数
      const mockReadTextFile = spy(() => Promise.resolve("# テスト\nこれはテストファイルです。"));
      
      // アダプターにモックを注入
      const adapter = new ObsidianAdapterImpl();
      (adapter as unknown as MockableObsidianAdapterImpl).readTextFile = mockReadTextFile;
      
      const result = await adapter.getNote(filePath);
      
      // 結果を検証
      assertEquals(result.isOk(), true);
    });
    
    it("存在しないノートの場合はエラーを返す", async () => {
      // モックのファイルパス
      const filePath = "non-existent.md";
      
      // モックのファイル読み込み関数（エラーを投げる）
      const mockReadTextFile = spy(() => {
        throw new Error("ファイルが見つかりません");
      });
      
      // アダプターにモックを注入
      const adapter = new ObsidianAdapterImpl();
      (adapter as unknown as MockableObsidianAdapterImpl).readTextFile = mockReadTextFile;
      
      const result = await adapter.getNote(filePath);
      
      // 結果を検証
      assertEquals(result.isErr(), true);
      if (result.isErr()) {
        assertEquals(result.error instanceof ObsidianAdapterError, true);
      }
    });
  });
  
  describe("saveNote", () => {
    it("ノートを保存できる", async () => {
      // モックのファイルパス
      const filePath = "test.md";
      const content = "# テスト\nこれはテストファイルです。";
      
      // モックのファイル書き込み関数
      const mockWriteTextFile = spy(() => Promise.resolve());
      
      // アダプターにモックを注入
      const adapter = new ObsidianAdapterImpl();
      (adapter as unknown as MockableObsidianAdapterImpl).writeTextFile = mockWriteTextFile;
      
      const result = await adapter.saveNote(filePath, content);
      
      // 結果を検証
      assertEquals(result.isOk(), true);
    });
  });
});