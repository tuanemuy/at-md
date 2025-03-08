/**
 * ユーザーリスト表示コンポーネントのテスト
 * 
 * ユーザーのリスト表示機能をテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { UserList, UserListProps } from "../components/user-list.ts";

// モックデータ
const mockUsers = [
  {
    id: "user-1",
    username: "user1",
    email: "user1@example.com",
    atDid: "did:plc:abcdef123456",
    atHandle: "user1.bsky.social",
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  {
    id: "user-2",
    username: "user2",
    email: "user2@example.com",
    atDid: null,
    atHandle: null,
    createdAt: "2024-08-02T00:00:00Z",
    updatedAt: "2024-08-02T00:00:00Z",
  },
  {
    id: "user-3",
    username: "user3",
    email: "user3@example.com",
    atDid: "did:plc:ghijkl789012",
    atHandle: "user3.bsky.social",
    createdAt: "2024-08-03T00:00:00Z",
    updatedAt: "2024-08-03T00:00:00Z",
  },
];

describe("UserListコンポーネントのテスト", () => {
  let props: UserListProps;
  let onSelectMock: (id: string) => void;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    onSelectMock = () => {};
    props = {
      users: mockUsers,
      onSelect: onSelectMock,
    };
  });
  
  it("ユーザーリストが正しくレンダリングされること", () => {
    // コンポーネントをレンダリング
    const userList = new UserList(props);
    const html = userList.render();
    
    // 結果を検証
    expect(html.includes("user1")).toBe(true);
    expect(html.includes("user2")).toBe(true);
    expect(html.includes("user3")).toBe(true);
    expect(html.includes("user1@example.com")).toBe(true);
    expect(html.includes("user1.bsky.social")).toBe(true);
    expect(html.includes("AT Protocol連携済")).toBe(true);
    expect(html.includes("AT Protocol未連携")).toBe(true);
  });
  
  it("空のユーザーリストの場合、メッセージが表示されること", () => {
    // 空のユーザーリストでプロパティを設定
    props.users = [];
    
    // 期待する結果
    const expectedHtml = `
      <div class="user-list empty">
        <p class="empty-message">ユーザーがいません</p>
      </div>
    `.replace(/\s+/g, '');
    
    // コンポーネントをレンダリング
    const userList = new UserList(props);
    const html = userList.render().replace(/\s+/g, '');
    
    // 結果を検証
    expect(html).toBe(expectedHtml);
  });
  
  it("ユーザーアイテムをクリックすると、onSelect関数が呼ばれること", () => {
    // モックの準備
    let selectedId: string | null = null;
    props.onSelect = (id: string) => {
      selectedId = id;
    };
    
    // コンポーネントをレンダリング
    const userList = new UserList(props);
    
    // クリックイベントをシミュレート
    userList.handleItemClick("user-2");
    
    // 結果を検証
    expect(selectedId).toBe("user-2");
  });
  
  it("フィルタリングが機能すること", () => {
    // フィルタリングプロパティを設定
    props.filter = "user2";
    
    // コンポーネントをレンダリング
    const userList = new UserList(props);
    const html = userList.render();
    
    // 結果を検証
    expect(html.includes("user2")).toBe(true);
    expect(html.includes("user1")).toBe(false);
    expect(html.includes("user3")).toBe(false);
  });
  
  it("ソート機能が正しく動作すること", () => {
    // ソートプロパティを設定（ユーザー名の降順）
    props.sortBy = "username";
    props.sortOrder = "desc";
    
    // コンポーネントをレンダリング
    const userList = new UserList(props);
    const html = userList.render();
    
    // user3, user2, user1の順に表示されることを確認
    const user1Index = html.indexOf("user1");
    const user2Index = html.indexOf("user2");
    const user3Index = html.indexOf("user3");
    
    expect(user3Index).toBeLessThan(user2Index);
    expect(user2Index).toBeLessThan(user1Index);
  });
}); 