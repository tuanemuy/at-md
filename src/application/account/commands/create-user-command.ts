/**
 * ユーザー作成コマンド
 * 新しいユーザーを作成するためのコマンド
 */

import { Command } from "../../common/command.ts";
import { Result, ok, err } from "npm:neverthrow";
import { UserAggregate, createUserAggregate } from "../../../core/account/aggregates/user-aggregate.ts";
import { UserRepository } from "../repositories/user-repository.ts";

/**
 * ユーザー作成コマンド
 */
export interface CreateUserCommand extends Command {
  readonly name: "CreateUser";
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly atIdentifier: {
    did: string;
    handle?: string;
  };
}

/**
 * ユーザー作成コマンドハンドラー
 */
export class CreateUserCommandHandler {
  private userRepository: UserRepository;
  
  /**
   * コンストラクタ
   * @param userRepository ユーザーリポジトリ
   */
  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }
  
  /**
   * コマンドを実行する
   * @param command ユーザー作成コマンド
   * @returns 作成されたユーザー集約
   */
  async execute(command: CreateUserCommand): Promise<Result<UserAggregate, Error>> {
    try {
      // 同じユーザー名が存在するか確認
      const existingUserByUsername = await this.userRepository.findByUsername(command.username);
      if (existingUserByUsername) {
        return err(new Error(`ユーザー名 ${command.username} は既に使用されています`));
      }
      
      // 同じメールアドレスが存在するか確認
      const existingUserByEmail = await this.userRepository.findByEmail(command.email);
      if (existingUserByEmail) {
        return err(new Error(`メールアドレス ${command.email} は既に使用されています`));
      }
      
      // 同じDIDが存在するか確認
      const existingUserByDid = await this.userRepository.findByDid(command.atIdentifier.did);
      if (existingUserByDid) {
        return err(new Error(`DID ${command.atIdentifier.did} は既に使用されています`));
      }
      
      // ハンドルが指定されている場合、同じハンドルが存在するか確認
      if (command.atIdentifier.handle) {
        const existingUserByHandle = await this.userRepository.findByHandle(command.atIdentifier.handle);
        if (existingUserByHandle) {
          return err(new Error(`ハンドル ${command.atIdentifier.handle} は既に使用されています`));
        }
      }
      
      try {
        // ユーザー集約の作成
        const userAggregate = createUserAggregate({
          id: command.id,
          username: command.username,
          email: command.email,
          atIdentifier: {
            did: command.atIdentifier.did,
            handle: command.atIdentifier.handle
          }
        });
        
        // ユーザーの保存
        const savedUser = await this.userRepository.save(userAggregate);
        
        return ok(savedUser);
      } catch (validationError) {
        // 値オブジェクトの作成時にバリデーションエラーが発生した場合
        return err(validationError instanceof Error ? validationError : new Error(String(validationError)));
      }
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 