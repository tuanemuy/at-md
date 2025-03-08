import { Result, ok, err } from "npm:neverthrow";
import { ObsidianAdapter, ObsidianError, ObsidianNote, ObsidianFolder, ObsidianVault } from "./obsidian-adapter.ts";

/**
 * ファイルシステムを使用したObsidianアダプターの実装
 */
export class FsObsidianAdapter implements ObsidianAdapter {
  private vaultPath: string | null = null;
  private vaultName: string | null = null;

  /**
   * ボールトを開く
   * 
   * @param path ボールトのパス
   * @returns ボールト情報のResult
   */
  async openVault(path: string): Promise<Result<ObsidianVault, ObsidianError>> {
    try {
      // ディレクトリが存在するか確認
      const stat = await Deno.stat(path);
      if (!stat.isDirectory) {
        return err(new ObsidianError(`指定されたパスはディレクトリではありません: ${path}`));
      }

      this.vaultPath = path;
      this.vaultName = this.getNameFromPath(path);

      // ルートフォルダとルートノートを取得
      const rootNotes: string[] = [];
      const rootFolders: string[] = [];
      
      for await (const entry of Deno.readDir(path)) {
        if (entry.isDirectory && !entry.name.startsWith(".")) {
          rootFolders.push(entry.name);
        } else if (entry.isFile && entry.name.endsWith(".md")) {
          rootNotes.push(entry.name);
        }
      }

      const vault: ObsidianVault = {
        path,
        name: this.vaultName || path.split("/").pop() || "Obsidian Vault", // 名前が取得できない場合のフォールバック
        rootFolders,
        rootNotes,
      };

      return ok(vault);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new ObsidianError(`ボールトを開けませんでした: ${errorMessage}`, error instanceof Error ? error : undefined));
    }
  }

  /**
   * ノートを取得する
   * 
   * @param path ノートのパス
   * @returns ノート情報のResult
   */
  async getNote(path: string): Promise<Result<ObsidianNote, ObsidianError>> {
    if (!this.vaultPath) {
      return err(new ObsidianError("ボールトが開かれていません"));
    }

    try {
      const fullPath = this.joinPaths(this.vaultPath, path);
      
      // ファイルが存在するか確認
      try {
        const stat = await Deno.stat(fullPath);
        if (!stat.isFile) {
          return err(new ObsidianError(`指定されたパスはファイルではありません: ${path}`));
        }
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return err(new ObsidianError(`ノートが見つかりませんでした: ${path}`));
        }
        throw error;
      }
      
      const content = await Deno.readTextFile(fullPath);
      
      // ノート情報を解析
      const name = this.getNameFromPath(path);
      const { frontMatter, content: cleanContent, tags, links } = this.parseNoteContent(content);
      
      // ファイルの情報を取得
      const fileInfo = await Deno.stat(fullPath);
      
      // バックリンクは別途取得する必要があるが、
      // 実装が複雑になるため、ここでは空配列を返す
      const backlinks: string[] = [];
      
      const note: ObsidianNote = {
        path,
        name: name || path.split("/").pop()?.replace(/\.md$/, "") || "Untitled", // 名前が取得できない場合のフォールバック
        content: cleanContent,
        frontMatter,
        tags,
        links,
        backlinks,
        createdAt: fileInfo.birthtime || undefined,
        modifiedAt: fileInfo.mtime || undefined,
      };
      
      return ok(note);
    } catch (error) {
      console.error("ノート取得エラー:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new ObsidianError(`ノートを取得できませんでした: ${errorMessage}`, error instanceof Error ? error : undefined));
    }
  }

  /**
   * ノートを作成または更新する
   * 
   * @param path ノートのパス
   * @param content ノートの内容
   * @param frontMatter フロントマター（省略可）
   * @returns 作成または更新されたノート情報のResult
   */
  async saveNote(
    path: string, 
    content: string, 
    frontMatter?: Record<string, unknown>
  ): Promise<Result<ObsidianNote, ObsidianError>> {
    if (!this.vaultPath) {
      return err(new ObsidianError("ボールトが開かれていません"));
    }

    try {
      const fullPath = this.joinPaths(this.vaultPath, path);
      
      // ディレクトリが存在することを確認
      const dirPath = this.getDirFromPath(fullPath);
      await this.ensureDir(dirPath);
      
      // フロントマターを含むコンテンツを作成
      let fileContent = content;
      if (frontMatter && Object.keys(frontMatter).length > 0) {
        const yamlFrontMatter = this.createYamlFrontMatter(frontMatter);
        fileContent = `---\n${yamlFrontMatter}\n---\n\n${content}`;
      }
      
      // ファイルに書き込む
      await Deno.writeTextFile(fullPath, fileContent);
      
      // 保存したノートの情報を返す
      const noteResult = await this.getNote(path);
      if (noteResult.isErr()) {
        // getNote が失敗した場合は、基本的な情報だけでも返す
        const name = this.getNameFromPath(path);
        const note: ObsidianNote = {
          path,
          name: name || path.split("/").pop()?.replace(/\.md$/, "") || "Untitled",
          content,
          frontMatter,
          tags: frontMatter?.tags && Array.isArray(frontMatter.tags) 
            ? [...frontMatter.tags as string[]] 
            : [],
          links: [],
          backlinks: [],
          createdAt: new Date(),
          modifiedAt: new Date(),
        };
        return ok(note);
      }
      return noteResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new ObsidianError(`ノートを保存できませんでした: ${errorMessage}`, error instanceof Error ? error : undefined));
    }
  }

  /**
   * ノートを削除する
   * 
   * @param path ノートのパス
   * @returns 削除結果のResult
   */
  async deleteNote(path: string): Promise<Result<void, ObsidianError>> {
    if (!this.vaultPath) {
      return err(new ObsidianError("ボールトが開かれていません"));
    }

    try {
      const fullPath = this.joinPaths(this.vaultPath, path);
      await Deno.remove(fullPath);
      return ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new ObsidianError(`ノートを削除できませんでした: ${errorMessage}`, error instanceof Error ? error : undefined));
    }
  }

  /**
   * フォルダを取得する
   * 
   * @param path フォルダのパス
   * @returns フォルダ情報のResult
   */
  async getFolder(path: string): Promise<Result<ObsidianFolder, ObsidianError>> {
    if (!this.vaultPath) {
      return err(new ObsidianError("ボールトが開かれていません"));
    }

    try {
      const fullPath = this.joinPaths(this.vaultPath, path);
      const stat = await Deno.stat(fullPath);
      
      if (!stat.isDirectory) {
        return err(new ObsidianError(`指定されたパスはディレクトリではありません: ${path}`));
      }
      
      const name = this.getNameFromPath(path);
      const subfolders: string[] = [];
      const notes: string[] = [];
      
      for await (const entry of Deno.readDir(fullPath)) {
        if (entry.isDirectory) {
          subfolders.push(this.joinPaths(path, entry.name));
        } else if (entry.isFile && entry.name.endsWith(".md")) {
          notes.push(this.joinPaths(path, entry.name));
        }
      }
      
      const folder: ObsidianFolder = {
        path,
        name: name || path.split("/").pop() || "Untitled Folder", // 名前が取得できない場合のフォールバック
        subfolders,
        notes,
      };
      
      return ok(folder);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new ObsidianError(`フォルダを取得できませんでした: ${errorMessage}`, error instanceof Error ? error : undefined));
    }
  }

  /**
   * フォルダを作成する
   * 
   * @param path フォルダのパス
   * @returns 作成されたフォルダ情報のResult
   */
  async createFolder(path: string): Promise<Result<ObsidianFolder, ObsidianError>> {
    if (!this.vaultPath) {
      return err(new ObsidianError("ボールトが開かれていません"));
    }

    try {
      const fullPath = this.joinPaths(this.vaultPath, path);
      await this.ensureDir(fullPath);
      
      return this.getFolder(path);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new ObsidianError(`フォルダを作成できませんでした: ${errorMessage}`, error instanceof Error ? error : undefined));
    }
  }

  /**
   * フォルダを削除する
   * 
   * @param path フォルダのパス
   * @param recursive 再帰的に削除するかどうか（デフォルト: false）
   * @returns 削除結果のResult
   */
  async deleteFolder(path: string, recursive = false): Promise<Result<void, ObsidianError>> {
    if (!this.vaultPath) {
      return err(new ObsidianError("ボールトが開かれていません"));
    }

    try {
      const fullPath = this.joinPaths(this.vaultPath, path);
      await Deno.remove(fullPath, { recursive });
      return ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new ObsidianError(`フォルダを削除できませんでした: ${errorMessage}`, error instanceof Error ? error : undefined));
    }
  }

  /**
   * ノートのバックリンクを取得する
   * 
   * @param path ノートのパス
   * @returns バックリンクのパスの配列のResult
   */
  async getBacklinks(path: string): Promise<Result<string[], ObsidianError>> {
    if (!this.vaultPath) {
      return err(new ObsidianError("ボールトが開かれていません"));
    }

    try {
      const targetName = this.getNameFromPath(path);
      const backlinks: string[] = [];
      
      // ボールト内のすべてのマークダウンファイルを走査
      for await (const entry of this.walkDirectory(this.vaultPath, [".md"])) {
        if (entry.isFile) {
          const relativePath = entry.path.substring(this.vaultPath.length + 1);
          
          // 自分自身は除外
          if (relativePath === path) {
            continue;
          }
          
          // ファイルの内容を読み込み、リンクを検索
          const content = await Deno.readTextFile(entry.path);
          const linkRegex = new RegExp(`\\[\\[${targetName}(\\|[^\\]]+)?\\]\\]`, "g");
          
          if (linkRegex.test(content)) {
            backlinks.push(relativePath);
          }
        }
      }
      
      return ok(backlinks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new ObsidianError(`バックリンクを取得できませんでした: ${errorMessage}`, error instanceof Error ? error : undefined));
    }
  }

  /**
   * タグでノートを検索する
   * 
   * @param tag タグ
   * @returns ノートのパスの配列のResult
   */
  async searchByTag(tag: string): Promise<Result<string[], ObsidianError>> {
    if (!this.vaultPath) {
      return err(new ObsidianError("ボールトが開かれていません"));
    }

    try {
      const matchingNotes: string[] = [];
      const tagPattern = tag.startsWith("#") ? tag : `#${tag}`;
      
      // ボールト内のすべてのマークダウンファイルを走査
      for await (const entry of this.walkDirectory(this.vaultPath, [".md"])) {
        if (entry.isFile) {
          const relativePath = entry.path.substring(this.vaultPath.length + 1);
          const content = await Deno.readTextFile(entry.path);
          
          // タグを検索（フロントマターとコンテンツの両方）
          if (content.includes(tagPattern)) {
            matchingNotes.push(relativePath);
          } else {
            // フロントマターのタグ配列も確認
            const { frontMatter } = this.parseNoteContent(content);
            if (frontMatter && Array.isArray(frontMatter.tags) && 
                frontMatter.tags.includes(tag.replace(/^#/, ""))) {
              matchingNotes.push(relativePath);
            }
          }
        }
      }
      
      return ok(matchingNotes);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new ObsidianError(`タグ検索に失敗しました: ${errorMessage}`, error instanceof Error ? error : undefined));
    }
  }

  /**
   * テキストでノートを検索する
   * 
   * @param query 検索クエリ
   * @returns ノートのパスの配列のResult
   */
  async searchByText(query: string): Promise<Result<string[], ObsidianError>> {
    if (!this.vaultPath) {
      return err(new ObsidianError("ボールトが開かれていません"));
    }

    try {
      const matchingNotes: string[] = [];
      
      // ボールト内のすべてのマークダウンファイルを走査
      for await (const entry of this.walkDirectory(this.vaultPath, [".md"])) {
        if (entry.isFile) {
          const relativePath = entry.path.substring(this.vaultPath.length + 1);
          const content = await Deno.readTextFile(entry.path);
          
          if (content.includes(query)) {
            matchingNotes.push(relativePath);
          }
        }
      }
      
      return ok(matchingNotes);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new ObsidianError(`テキスト検索に失敗しました: ${errorMessage}`, error instanceof Error ? error : undefined));
    }
  }

  /**
   * ノートの内容を解析する
   * 
   * @param content ノートの内容
   * @returns 解析結果
   */
  private parseNoteContent(content: string): {
    frontMatter?: Record<string, unknown>;
    content: string;
    tags: string[];
    links: string[];
  } {
    let frontMatter: Record<string, unknown> | undefined;
    let cleanContent = content;
    
    // フロントマターを解析
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (frontMatterMatch) {
      try {
        // YAMLパーサーの代わりに簡易的な解析を行う
        frontMatter = this.parseSimpleYaml(frontMatterMatch[1]);
        cleanContent = content.substring(frontMatterMatch[0].length);
      } catch (error) {
        console.warn("フロントマターの解析に失敗しました:", error);
        // エラーが発生しても処理を続行
        frontMatter = {};
      }
    }
    
    // タグを抽出
    const tags: string[] = [];
    const tagRegex = /#[a-zA-Z0-9_-]+/g;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(cleanContent)) !== null) {
      tags.push(tagMatch[0].substring(1)); // # を除去
    }
    
    // フロントマターのタグも追加
    if (frontMatter && frontMatter.tags && Array.isArray(frontMatter.tags)) {
      tags.push(...(frontMatter.tags as string[]));
    }
    
    // リンクを抽出
    const links: string[] = [];
    const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(cleanContent)) !== null) {
      links.push(linkMatch[1]);
    }
    
    return {
      frontMatter,
      content: cleanContent,
      tags: [...new Set(tags)], // 重複を除去
      links: [...new Set(links)], // 重複を除去
    };
  }

  /**
   * 簡易的なYAML解析
   * 
   * @param yaml YAML文字列
   * @returns 解析結果
   */
  private parseSimpleYaml(yaml: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const lines = yaml.split("\n");
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;
      
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;
      
      const key = line.substring(0, colonIndex).trim();
      let value: unknown = line.substring(colonIndex + 1).trim();
      
      // 配列の処理
      if (value === "") {
        const arrayItems: string[] = [];
        let j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith("-")) {
          const itemValue = lines[j].trim().substring(1).trim();
          arrayItems.push(itemValue);
          j++;
        }
        if (arrayItems.length > 0) {
          value = arrayItems;
          i = j - 1;
        }
      }
      
      result[key] = value;
    }
    
    return result;
  }

  /**
   * YAMLフロントマターを作成する
   * 
   * @param data フロントマターのデータ
   * @returns YAMLフロントマター
   */
  private createYamlFrontMatter(data: Record<string, unknown>): string {
    const lines: string[] = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${item}`);
        }
      } else if (typeof value === "object" && value !== null) {
        // オブジェクトの場合は再帰的に処理する必要があるが、
        // 簡略化のため、ここではJSONに変換
        lines.push(`${key}: ${JSON.stringify(value)}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
    
    return lines.join("\n");
  }

  /**
   * パスからファイル名を取得する
   * 
   * @param path パス
   * @returns ファイル名
   */
  private getNameFromPath(path: string): string {
    const parts = path.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart.replace(/\.md$/, "");
  }

  /**
   * パスからディレクトリを取得する
   * 
   * @param path パス
   * @returns ディレクトリパス
   */
  private getDirFromPath(path: string): string {
    const parts = path.split("/");
    parts.pop();
    return parts.join("/");
  }

  /**
   * パスを結合する
   * 
   * @param base ベースパス
   * @param path 追加パス
   * @returns 結合されたパス
   */
  private joinPaths(base: string, path: string): string {
    if (path.startsWith("/")) {
      path = path.substring(1);
    }
    return `${base}/${path}`;
  }

  /**
   * ディレクトリが存在することを確認し、存在しない場合は作成する
   * 
   * @param path ディレクトリパス
   */
  private async ensureDir(path: string): Promise<void> {
    try {
      const stat = await Deno.stat(path);
      if (!stat.isDirectory) {
        throw new Error(`パスはディレクトリではありません: ${path}`);
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // ディレクトリが存在しない場合は作成
        await Deno.mkdir(path, { recursive: true });
      } else {
        throw error;
      }
    }
  }

  /**
   * ディレクトリを再帰的に走査する
   * 
   * @param root ルートディレクトリ
   * @param extensions 対象の拡張子
   * @returns エントリのイテレーター
   */
  private async *walkDirectory(
    root: string,
    extensions: string[] = []
  ): AsyncGenerator<Deno.DirEntry & { path: string }> {
    for await (const entry of Deno.readDir(root)) {
      const path = `${root}/${entry.name}`;
      
      if (entry.isDirectory) {
        yield* this.walkDirectory(path, extensions);
      } else if (entry.isFile) {
        if (extensions.length === 0 || extensions.some(ext => entry.name.endsWith(ext))) {
          yield { ...entry, path };
        }
      }
    }
  }
}