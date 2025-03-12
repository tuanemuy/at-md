import type { RepositoryError } from "@/domain/shared/models/common";
import type { Result } from "neverthrow";
import type { User } from "../models/user";
import type { UserRepository } from "../repositories/user";

/**
 * DIDによるユーザー取得のユースケース
 */
export class GetUserByDidUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * DIDによるユーザー取得
   * @param did DID (Decentralized Identifier)
   * @returns ユーザーまたはnull
   */
  async execute(did: string): Promise<Result<User | null, RepositoryError>> {
    return await this.userRepository.findByDid(did);
  }
}
