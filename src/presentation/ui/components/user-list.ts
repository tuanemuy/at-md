/**
 * ユーザーリスト表示コンポーネント
 * 
 * ユーザーのリスト表示機能を提供します。
 */

// ユーザーの型定義
export interface User {
  id: string;
  username: string;
  email: string;
  atDid: string | null;
  atHandle: string | null;
  createdAt: string;
  updatedAt: string;
}

// コンポーネントのプロパティ型定義
export interface UserListProps {
  users: User[];
  onSelect: (id: string) => void;
  filter?: string;
  sortBy?: 'username' | 'email' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * ユーザーリスト表示コンポーネント
 */
export class UserList {
  private props: UserListProps;
  
  /**
   * コンストラクタ
   * @param props コンポーネントのプロパティ
   */
  constructor(props: UserListProps) {
    this.props = props;
  }
  
  /**
   * ユーザーアイテムのクリックハンドラ
   * @param id クリックされたユーザーのID
   */
  public handleItemClick(id: string): void {
    this.props.onSelect(id);
  }
  
  /**
   * ユーザーをフィルタリングする
   * @returns フィルタリングされたユーザー配列
   */
  private filterUsers(): User[] {
    if (!this.props.filter) {
      return this.props.users;
    }
    
    return this.props.users.filter(user => 
      user.username.includes(this.props.filter || '') || 
      user.email.includes(this.props.filter || '') ||
      (user.atHandle && user.atHandle.includes(this.props.filter || ''))
    );
  }
  
  /**
   * ユーザーをソートする
   * @param users ソート対象のユーザー配列
   * @returns ソートされたユーザー配列
   */
  private sortUsers(users: User[]): User[] {
    if (!this.props.sortBy) {
      return users;
    }
    
    const { sortBy, sortOrder = 'asc' } = this.props;
    
    return [...users].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
  
  /**
   * コンポーネントをレンダリングする
   * @returns HTML文字列
   */
  public render(): string {
    const filteredUsers = this.filterUsers();
    const sortedUsers = this.sortUsers(filteredUsers);
    
    if (sortedUsers.length === 0) {
      return `
        <div class="user-list empty">
          <p class="empty-message">ユーザーがいません</p>
        </div>
      `;
    }
    
    const userItems = sortedUsers.map(user => {
      const atProtocolStatus = user.atDid && user.atHandle 
        ? `<span class="at-protocol connected">AT Protocol連携済</span>` 
        : `<span class="at-protocol not-connected">AT Protocol未連携</span>`;
      
      return `
        <li data-id="${user.id}" class="user-item">
          <div class="user-info">
            <h3>${user.username}</h3>
            <p class="email">${user.email}</p>
            ${user.atHandle ? `<p class="at-handle">@${user.atHandle}</p>` : ''}
          </div>
          <div class="user-status">
            ${atProtocolStatus}
          </div>
        </li>
      `;
    }).join('');
    
    return `
      <div class="user-list">
        <ul>
          ${userItems}
        </ul>
      </div>
    `;
  }
} 