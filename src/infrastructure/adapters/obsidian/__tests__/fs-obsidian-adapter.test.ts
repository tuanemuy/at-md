import { assertEquals, assertExists } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { FsObsidianAdapter } from "../fs-obsidian-adapter.ts";
import { ObsidianError } from "../obsidian-adapter.ts";

// テスト用の一時ディレクトリを作成する関数
async function createTempDir(): Promise<string> {
  const tempDir = await Deno.makeTempDir({ prefix: "obsidian-test-" });
  return tempDir;
}

// テスト用のディレクトリを削除する関数
async function removeTempDir(path: string): Promise<void> {
  await Deno.remove(path, { recursive: true });
}

// テスト用のノートを作成する関数
async function createTestNote(vaultPath: string, notePath: string, content: string): Promise<void> {
  const fullPath = `${vaultPath}/${notePath}`;
  const dirPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
  
  try {
    await Deno.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
  
  await Deno.writeTextFile(fullPath, content);
}

Deno.test("FsObsidianAdapter", async (t) => {
  // テスト前の準備
  const tempDir = await createTempDir();
  const adapter = new FsObsidianAdapter();
  
  try {
    await t.step("openVault - 正常系: ボールトを開く", async () => {
      // テスト用のディレクトリ構造を作成
      await createTestNote(tempDir, "note1.md", "# テストノート1");
      await createTestNote(tempDir, "note2.md", "# テストノート2");
      await Deno.mkdir(`${tempDir}/folder1`);
      
      // テスト実行
      const result = await adapter.openVault(tempDir);
      
      // 検証
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        const vault = result.value;
        assertEquals(vault.path, tempDir);
        assertEquals(vault.rootNotes.includes("note1.md"), true);
        assertEquals(vault.rootNotes.includes("note2.md"), true);
        assertEquals(vault.rootFolders.includes("folder1"), true);
      }
    });
    
    await t.step("getNote - 正常系: ノートを取得する", async () => {
      // テスト用のノートを作成
      const noteContent = "---\ntitle: テストタイトル\ntags:\n  - test\n  - markdown\n---\n\n# テストノート\n\nこれはテストです。 #タグ [[リンク先]]";
      await createTestNote(tempDir, "note1.md", noteContent);
      
      // ボールトを開く
      const openResult = await adapter.openVault(tempDir);
      assertEquals(openResult.isOk(), true);
      
      // テスト実行
      const result = await adapter.getNote("note1.md");
      
      // 検証
      assertEquals(result.isOk(), true);
      
      // 結果が成功の場合、内容を検証
      if (result.isOk()) {
        const note = result.value;
        assertEquals(note.path, "note1.md");
        assertEquals(note.name, "note1");
        assertExists(note.frontMatter);
        assertEquals(note.frontMatter.title, "テストタイトル");
        
        // タグの検証
        assertExists(note.tags);
        assertEquals(Array.isArray(note.tags), true);
        
        // リンクの検証
        assertExists(note.links);
        assertEquals(Array.isArray(note.links), true);
        assertEquals(note.links.includes("リンク先"), true);
      }
    });
    
    await t.step("saveNote - 正常系: ノートを保存する", async () => {
      // ボールトを開く
      await adapter.openVault(tempDir);
      
      // テスト実行
      const content = "# 新しいノート\n\nこれは新しいノートです。";
      const frontMatter = {
        title: "新しいノート",
        tags: ["new", "test"],
        date: "2023-01-01"
      };
      
      const result = await adapter.saveNote("new-note.md", content, frontMatter);
      
      // 検証
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        const note = result.value;
        assertEquals(note.path, "new-note.md");
        assertEquals(note.name, "new-note");
        assertExists(note.frontMatter);
        assertEquals(note.frontMatter?.title, "新しいノート");
        assertEquals(Array.isArray(note.frontMatter?.tags), true);
        if (note.frontMatter?.tags && Array.isArray(note.frontMatter.tags)) {
          assertEquals(note.frontMatter.tags.includes("new"), true);
          assertEquals(note.frontMatter.tags.includes("test"), true);
        }
        assertEquals(note.frontMatter?.date, "2023-01-01");
        
        // ファイルが実際に作成されたことを確認
        const fileExists = await Deno.stat(`${tempDir}/new-note.md`).then(() => true).catch(() => false);
        assertEquals(fileExists, true);
      }
    });
    
    await t.step("deleteNote - 正常系: ノートを削除する", async () => {
      // テスト用のノートを作成
      await createTestNote(tempDir, "delete/note.md", "# 削除するノート");
      
      // ボールトを開く
      await adapter.openVault(tempDir);
      
      // 削除前にファイルが存在することを確認
      const fileExistsBefore = await Deno.stat(`${tempDir}/delete/note.md`).then(() => true).catch(() => false);
      assertEquals(fileExistsBefore, true);
      
      // テスト実行
      const result = await adapter.deleteNote("delete/note.md");
      
      // 検証
      assertEquals(result.isOk(), true);
      
      // 削除後にファイルが存在しないことを確認
      const fileExistsAfter = await Deno.stat(`${tempDir}/delete/note.md`).then(() => true).catch(() => false);
      assertEquals(fileExistsAfter, false);
    });
    
    await t.step("getFolder - 正常系: フォルダを取得する", async () => {
      // テスト用のディレクトリ構造を作成
      await createTestNote(tempDir, "folder/note1.md", "# ノート1");
      await createTestNote(tempDir, "folder/note2.md", "# ノート2");
      await Deno.mkdir(`${tempDir}/folder/subfolder`);
      
      // ボールトを開く
      await adapter.openVault(tempDir);
      
      // テスト実行
      const result = await adapter.getFolder("folder");
      
      // 検証
      assertEquals(result.isOk(), true);
      if (result.isOk()) {
        const folder = result.value;
        assertEquals(folder.path, "folder");
        assertEquals(folder.name, "folder");
        assertEquals(folder.notes.includes("folder/note1.md"), true);
        assertEquals(folder.notes.includes("folder/note2.md"), true);
        assertEquals(folder.subfolders.includes("folder/subfolder"), true);
      }
    });
  } finally {
    // テスト後のクリーンアップ
    await removeTempDir(tempDir);
  }
}); 