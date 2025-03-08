/**
 * ユーザー詳細表示コンポーネントのテスト
 * 
 * ユーザーの詳細表示機能をテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { UserDetail, UserDetailProps } from "../components/user-detail.ts";
import { User } from "../components/user-list.ts";

// モックデータ
const mockUser: User = {
  id: "user-1",
  username: "testuser",
  email: "test@example.com",
  atDid: "did:plc:abcdef123456",
  atHandle: "testuser.bsky.social",
  createdAt: "2024-08-01T00:00:00Z",
  updatedAt: "2024-08-01T12:34:56Z",
};

describe("UserDetailコンポーネントのテスト", () => {
  let props: UserDetailProps;
  let onEditMock: (id: string) => void;
  let onDeleteMock: (id: string) => void;
  let onConnectAtProtocolMock: (id: string) => void;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    onEditMock = () => {};
    onDeleteMock = () => {};
    onConnectAtProtocolMock = () => {};
    props = {
      user: mockUser,
      onEdit: onEditMock,
      onDelete: onDeleteMock,
      onConnectAtProtocol: onConnectAtProtocolMock,
    };
  });
  
  it("ユーザー詳細が正しくレンダリングされること", () => {
    // コンポーネントをレンダリング
    const userDetail = new UserDetail(props);
    const html = userDetail.render();
    
    // 結果を検証
    expect(html.includes("testuser")).toBe(true);
    expect(html.includes("test@example.com")).toBe(true);
    expect(html.includes("testuser.bsky.social")).toBe(true);
    expect(html.includes("AT Protocol連携済")).toBe(true);
    expect(html.includes("編集")).toBe(true);
    expect(html.includes("削除")).toBe(true);
    expect(html.includes("作成日時:")).toBe(true);
    expect(html.includes("更新日時:")).toBe(true);
  });
  
  it("ユーザーが存在しない場合、メッセージが表示されること", () => {
    // ユーザーなしでプロパティを設定
    props.user = undefined;
    
    // 期待する結果
    const expectedHtml = `
      <div class="user-detail empty">
        <p class="empty-message">ユーザーが選択されていません</p>
      </div>
    `.replace(/\s+/g, '');
    
    // コンポーネントをレンダリング
    const userDetail = new UserDetail(props);
    const html = userDetail.render().replace(/\s+/g, '');
    
    // 結果を検証
    expect(html).toBe(expectedHtml);
  });
  
  it("編集ボタンをクリックすると、onEdit関数が呼ばれること", () => {
    // モックの準備
    let editedId: string | null = null;
    props.onEdit = (id: string) => {
      editedId = id;
    };
    
    // コンポーネントをレンダリング
    const userDetail = new UserDetail(props);
    
    // 編集ボタンクリックをシミュレート
    userDetail.handleEditClick();
    
    // 結果を検証
    expect(editedId).toBe("user-1");
  });
  
  it("削除ボタンをクリックすると、onDelete関数が呼ばれること", () => {
    // モックの準備
    let deletedId: string | null = null;
    props.onDelete = (id: string) => {
      deletedId = id;
    };
    
    // コンポーネントをレンダリング
    const userDetail = new UserDetail(props);
    
    // 削除ボタンクリックをシミュレート
    userDetail.handleDeleteClick();
    
    // 結果を検証
    expect(deletedId).toBe("user-1");
  });
  
  it("AT Protocol未連携の場合、連携ボタンが表示されること", () => {
    // AT Protocol未連携のユーザーを設定
    props.user = {
      ...mockUser,
      atDid: null,
      atHandle: null,
    };
    
    // コンポーネントをレンダリング
    const userDetail = new UserDetail(props);
    const html = userDetail.render();
    
    // 結果を検証
    expect(html.includes("AT Protocol未連携")).toBe(true);
    expect(html.includes("AT Protocolと連携する")).toBe(true);
    expect(html.includes("connect-at-protocol-button")).toBe(true);
  });
  
  it("連携ボタンをクリックすると、onConnectAtProtocol関数が呼ばれること", () => {
    // AT Protocol未連携のユーザーを設定
    props.user = {
      ...mockUser,
      atDid: null,
      atHandle: null,
    };
    
    // モックの準備
    let connectedId: string | null = null;
    props.onConnectAtProtocol = (id: string) => {
      connectedId = id;
    };
    
    // コンポーネントをレンダリング
    const userDetail = new UserDetail(props);
    
    // 連携ボタンクリックをシミュレート
    userDetail.handleConnectAtProtocolClick();
    
    // 結果を検証
    expect(connectedId).toBe("user-1");
  });
}); 