/**
 * ユーザー詳細表示コンポーネント
 * 
 * ユーザーの詳細表示機能を提供します。
 */

import { User } from "./user-list.ts";

// コンポーネントのプロパティ型定義
export interface UserDetailProps {
  user?: User;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onConnectAtProtocol: (id: string) => void;
}

/**
 * ユーザー詳細表示コンポーネント
 */
export class UserDetail {
  private props: UserDetailProps;
  
  /**
   * コンストラクタ
   * @param props コンポーネントのプロパティ
   */
  constructor(props: UserDetailProps) {
    this.props = props;
  }
  
  /**
   * 編集ボタンのクリックハンドラ
   */
  public handleEditClick(): void {
    if (this.props.user) {
      this.props.onEdit(this.props.user.id);
    }
  }
  
  /**
   * 削除ボタンのクリックハンドラ
   */
  public handleDeleteClick(): void {
    if (this.props.user) {
      this.props.onDelete(this.props.user.id);
    }
  }
  
  /**
   * AT Protocol連携ボタンのクリックハンドラ
   */
  public handleConnectAtProtocolClick(): void {
    if (this.props.user) {
      this.props.onConnectAtProtocol(this.props.user.id);
    }
  }
  
  /**
   * 日時を整形する
   * @param dateString ISO形式の日時文字列
   * @returns 整形された日時文字列
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  /**
   * コンポーネントをレンダリングする
   * @returns HTML文字列
   */
  public render(): string {
    if (!this.props.user) {
      return `
        <div class="user-detail empty">
          <p class="empty-message">ユーザーが選択されていません</p>
        </div>
      `;
    }
    
    const { user } = this.props;
    const isAtProtocolConnected = user.atDid && user.atHandle;
    
    const atProtocolSection = isAtProtocolConnected
      ? `
        <div class="at-protocol-info connected">
          <h4>AT Protocol連携済</h4>
          <p class="at-did">DID: ${user.atDid}</p>
          <p class="at-handle">ハンドル: @${user.atHandle}</p>
        </div>
      `
      : `
        <div class="at-protocol-info not-connected">
          <h4>AT Protocol未連携</h4>
          <button class="connect-at-protocol-button">AT Protocolと連携する</button>
        </div>
      `;
    
    return `
      <div class="user-detail">
        <header>
          <h2>${user.username}</h2>
          <div class="actions">
            <button class="edit-button">編集</button>
            <button class="delete-button">削除</button>
          </div>
        </header>
        
        <div class="user-info">
          <div class="basic-info">
            <p class="email">メールアドレス: ${user.email}</p>
          </div>
          
          ${atProtocolSection}
        </div>
        
        <footer>
          <div class="timestamps">
            <span class="created-at">作成日時: ${this.formatDate(user.createdAt)}</span>
            <span class="updated-at">更新日時: ${this.formatDate(user.updatedAt)}</span>
          </div>
        </footer>
      </div>
    `;
  }
} 