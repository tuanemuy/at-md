/**
 * ユーザー詳細ページコンポーネント
 * 
 * ユーザーの詳細を表示するページコンポーネントです。
 */

import { UserDetail, UserDetailProps } from "../components/user-detail.ts";

// ユーザー詳細ページのプロパティ型定義
export interface UserPageProps {
  userDetailProps: UserDetailProps;
  onBack: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onConnectAtProtocol: (id: string) => void;
}

/**
 * ユーザー詳細ページコンポーネント
 */
export class UserPage {
  private props: UserPageProps;
  
  /**
   * コンストラクタ
   * @param props コンポーネントのプロパティ
   */
  constructor(props: UserPageProps) {
    this.props = props;
  }
  
  /**
   * 戻るボタンのクリックハンドラ
   */
  public handleBackClick(): void {
    this.props.onBack();
  }
  
  /**
   * 編集ボタンのクリックハンドラ
   * @param id 編集するユーザーのID
   */
  public handleEditClick(id: string): void {
    this.props.onEdit(id);
  }
  
  /**
   * 削除ボタンのクリックハンドラ
   * @param id 削除するユーザーのID
   */
  public handleDeleteClick(id: string): void {
    this.props.onDelete(id);
  }
  
  /**
   * AT Protocol連携ボタンのクリックハンドラ
   * @param id 連携するユーザーのID
   */
  public handleConnectAtProtocolClick(id: string): void {
    this.props.onConnectAtProtocol(id);
  }
  
  /**
   * コンポーネントをレンダリングする
   * @returns HTML文字列
   */
  public render(): string {
    // ユーザー詳細コンポーネントのインスタンスを作成
    const userDetail = new UserDetail({
      ...this.props.userDetailProps,
      onEdit: (id) => this.handleEditClick(id),
      onDelete: (id) => this.handleDeleteClick(id),
      onConnectAtProtocol: (id) => this.handleConnectAtProtocolClick(id)
    });
    
    // ユーザー詳細をレンダリング
    const userDetailHtml = userDetail.render();
    
    // ユーザー詳細ページのHTMLを構築
    return `
      <div class="user-page">
        <header class="page-header">
          <button class="back-button" id="back-button">← 戻る</button>
          <h1>ユーザー詳細</h1>
        </header>
        
        <div class="user-container">
          ${userDetailHtml}
        </div>
      </div>
    `;
  }
} 