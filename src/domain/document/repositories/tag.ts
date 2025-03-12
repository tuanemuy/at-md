import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Tag, DocumentTag } from "../models/tag";
import type { RepositoryError } from "@/domain/shared/models/common";

/**
 * タグリポジトリのインターフェース
 */
export interface TagRepository {
  /**
   * IDによるタグ検索
   * @param id タグID
   * @returns タグまたはnull
   */
  findById(id: ID): Promise<Result<Tag | null, RepositoryError>>;

  /**
   * スラッグによるタグ検索
   * @param slug タグスラッグ
   * @returns タグまたはnull
   */
  findBySlug(slug: string): Promise<Result<Tag | null, RepositoryError>>;

  /**
   * ユーザーIDによるタグ検索
   * @param userId ユーザーID
   * @returns タグの配列
   */
  findByUserId(userId: ID): Promise<Result<Tag[], RepositoryError>>;

  /**
   * 文書IDによるタグ検索
   * @param documentId 文書ID
   * @returns タグの配列
   */
  findByDocumentId(documentId: ID): Promise<Result<Tag[], RepositoryError>>;

  /**
   * タグの保存
   * @param tag タグオブジェクト
   * @returns 保存されたタグ
   */
  save(tag: Tag): Promise<Result<Tag, RepositoryError>>;

  /**
   * タグの削除
   * @param id タグID
   * @returns void
   */
  delete(id: ID): Promise<Result<void, RepositoryError>>;
}

/**
 * 文書タグリポジトリのインターフェース
 */
export interface DocumentTagRepository {
  /**
   * 文書IDによる文書タグ検索
   * @param documentId 文書ID
   * @returns 文書タグの配列
   */
  findByDocumentId(documentId: ID): Promise<Result<DocumentTag[], RepositoryError>>;

  /**
   * タグIDによる文書タグ検索
   * @param tagId タグID
   * @returns 文書タグの配列
   */
  findByTagId(tagId: ID): Promise<Result<DocumentTag[], RepositoryError>>;

  /**
   * 文書タグの保存
   * @param documentTag 文書タグオブジェクト
   * @returns 保存された文書タグ
   */
  save(documentTag: DocumentTag): Promise<Result<DocumentTag, RepositoryError>>;

  /**
   * 文書タグの削除
   * @param id 文書タグID
   * @returns void
   */
  delete(id: ID): Promise<Result<void, RepositoryError>>;

  /**
   * 文書IDとタグIDによる文書タグの削除
   * @param documentId 文書ID
   * @param tagId タグID
   * @returns void
   */
  deleteByDocumentIdAndTagId(documentId: ID, tagId: ID): Promise<Result<void, RepositoryError>>;
} 