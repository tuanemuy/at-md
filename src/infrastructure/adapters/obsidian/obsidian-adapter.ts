import { Result } from "npm:neverthrow";
import { InfrastructureError } from "../../../core/errors/base.ts";

/**
 * Obsidianアダプターのエラー型
 */
export class ObsidianError extends InfrastructureError {
  override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "ObsidianError";
    this.cause = cause;
  }
}

/**
 * Obsidianのノート情報
 */
export interface ObsidianNote {
  path: string;
  name: string;
  content: string;
  frontMatter?: Record<string, unknown>;
  tags: string[];
  links: string[];
  backlinks: string[];
  createdAt?: Date;
  modifiedAt?: Date;
}

/**
 * Obsidianのフォルダ情報
 */
export interface ObsidianFolder {
  path: string;
  name: string;
  subfolders: string[];
  notes: string[];
}

/**
 * Obsidianのボールト情報
 */
export interface ObsidianVault {
  path: string;
  name: string;
  rootFolders: string[];
  rootNotes: string[];
}

/**
 * Obsidianアダプターのインターフェース
 * 
 * Obsidianとの連携を抽象化するインターフェース
 */
export interface ObsidianAdapter {
  /**
   * ボールトを開く
   * 
   * @param path ボールトのパス
   * @returns ボールト情報のResult
   */
  openVault(path: string): Promise<Result<ObsidianVault, ObsidianError>>;

  /**
   * ノートを取得する
   * 
   * @param path ノートのパス
   * @returns ノート情報のResult
   */
  getNote(path: string): Promise<Result<ObsidianNote, ObsidianError>>;

  /**
   * ノートを作成または更新する
   * 
   * @param path ノートのパス
   * @param content ノートの内容
   * @param frontMatter フロントマター（省略可）
   * @returns 作成または更新されたノート情報のResult
   */
  saveNote(path: string, content: string, frontMatter?: Record<string, unknown>): Promise<Result<ObsidianNote, ObsidianError>>;

  /**
   * ノートを削除する
   * 
   * @param path ノートのパス
   * @returns 削除結果のResult
   */
  deleteNote(path: string): Promise<Result<void, ObsidianError>>;

  /**
   * フォルダを取得する
   * 
   * @param path フォルダのパス
   * @returns フォルダ情報のResult
   */
  getFolder(path: string): Promise<Result<ObsidianFolder, ObsidianError>>;

  /**
   * フォルダを作成する
   * 
   * @param path フォルダのパス
   * @returns 作成されたフォルダ情報のResult
   */
  createFolder(path: string): Promise<Result<ObsidianFolder, ObsidianError>>;

  /**
   * フォルダを削除する
   * 
   * @param path フォルダのパス
   * @param recursive 再帰的に削除するかどうか（デフォルト: false）
   * @returns 削除結果のResult
   */
  deleteFolder(path: string, recursive?: boolean): Promise<Result<void, ObsidianError>>;

  /**
   * ノートのバックリンクを取得する
   * 
   * @param path ノートのパス
   * @returns バックリンクのパスの配列のResult
   */
  getBacklinks(path: string): Promise<Result<string[], ObsidianError>>;

  /**
   * タグでノートを検索する
   * 
   * @param tag タグ
   * @returns ノートのパスの配列のResult
   */
  searchByTag(tag: string): Promise<Result<string[], ObsidianError>>;

  /**
   * テキストでノートを検索する
   * 
   * @param query 検索クエリ
   * @returns ノートのパスの配列のResult
   */
  searchByText(query: string): Promise<Result<string[], ObsidianError>>;
} 