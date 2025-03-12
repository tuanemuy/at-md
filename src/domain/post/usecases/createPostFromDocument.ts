import { err, ok } from "neverthrow";
import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Post, PostPlatform } from "../models/post";
import { createPost } from "../models/post";
import type { PostRepository } from "../repositories/post";
import type { PostService } from "../services/post";
import type { PostError, RepositoryError } from "../models/errors";
import { createPostError } from "../models/errors";
import type { Document } from "@/domain/document/models/document";
import type { DocumentRepository } from "@/domain/document/repositories/document";

/**
 * 文書から投稿を作成するユースケース
 */
export class CreatePostFromDocumentUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly postService: PostService
  ) {}

  /**
   * 文書から投稿を作成
   * @param documentId 文書ID
   * @param platform 投稿プラットフォーム
   * @param userId ユーザーID
   * @returns 作成された投稿
   */
  async execute(
    documentId: ID,
    platform: PostPlatform,
    userId: ID
  ): Promise<Result<Post, PostError | RepositoryError>> {
    // 文書を取得
    const documentResult = await this.documentRepository.findById(documentId);
    if (documentResult.isErr()) {
      return err(
        createPostError(
          "API_ERROR",
          `文書の取得に失敗しました: ${documentId}`,
          new Error(documentResult.error.message)
        )
      );
    }

    const document = documentResult.value;
    if (!document) {
      return err(
        createPostError("CONTENT_NOT_FOUND", `文書が見つかりません: ${documentId}`)
      );
    }

    // Blueskyサービスを使用して投稿を作成
    const createResult = await this.postService.createPost(documentId);
    if (createResult.isErr()) {
      return err(createResult.error);
    }

    // 投稿データを作成
    const postData = createPost(documentId, platform, userId);
    
    // 投稿を保存
    const saveResult = await this.postRepository.save(postData as Post);
    if (saveResult.isErr()) {
      return err(saveResult.error);
    }

    return ok(saveResult.value);
  }
} 