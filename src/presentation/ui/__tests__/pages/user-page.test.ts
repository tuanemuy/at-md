/**
 * ユーザー詳細ページコンポーネントのテスト
 * 
 * ユーザーの詳細を表示するページコンポーネントをテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { UserPage, UserPageProps } from "../../pages/user-page.ts";
import { UserDetailProps } from "../../components/user-detail.ts";

// モックデータ
const mockUser = {
  id: "user-1",
  username: "testuser",
  email: "test@example.com",
  atDid: "did:plc:abcdef123456",
  atHandle: "test.bsky.social",
  createdAt: "2024-08-01T00:00:00Z",
  updatedAt: "2024-08-01T12:34:56Z",
};

describe("UserPageコンポーネントのテスト", () => {
  let props: UserPageProps;
  let onBackMock: () => void;
  let onEditMock: (id: string) => void;
  let onDeleteMock: (id: string) => void;
  let onConnectAtProtocolMock: (id: string) => void;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    onBackMock = () => {};
    onEditMock = () => {};
    onDeleteMock = () => {};
    onConnectAtProtocolMock = () => {};
    
    const userDetailProps: UserDetailProps = {
      user: mockUser,
      onEdit: () => {},
      onDelete: () => {},
      onConnectAtProtocol: () => {},
    };
    
    props = {
      userDetailProps,
      onBack: onBackMock,
      onEdit: onEditMock,
      onDelete: onDeleteMock,
      onConnectAtProtocol: onConnectAtProtocolMock,
    };
  });
  
  it("ユーザー詳細ページが正しくレンダリングされること", () => {
    // コンポーネントをレンダリング
    const userPage = new UserPage(props);
    const html = userPage.render();
    
    // 結果を検証
    expect(html.includes("ユーザー詳細")).toBe(true);
    expect(html.includes("戻る")).toBe(true);
    
    // ユーザー詳細コンテナが含まれていることを確認
    expect(html.includes("user-container")).toBe(true);
  });
  
  it("戻るボタンをクリックすると、onBack関数が呼ばれること", () => {
    // モックの準備
    let backCalled = false;
    props.onBack = () => {
      backCalled = true;
    };
    
    // コンポーネントをレンダリング
    const userPage = new UserPage(props);
    
    // 戻るボタンクリックをシミュレート
    userPage.handleBackClick();
    
    // 結果を検証
    expect(backCalled).toBe(true);
  });
  
  it("編集ボタンをクリックすると、onEdit関数が呼ばれること", () => {
    // モックの準備
    let editedId: string | null = null;
    props.onEdit = (id: string) => {
      editedId = id;
    };
    
    // コンポーネントをレンダリング
    const userPage = new UserPage(props);
    
    // 編集ボタンクリックをシミュレート
    userPage.handleEditClick("user-1");
    
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
    const userPage = new UserPage(props);
    
    // 削除ボタンクリックをシミュレート
    userPage.handleDeleteClick("user-1");
    
    // 結果を検証
    expect(deletedId).toBe("user-1");
  });
  
  it("AT Protocol連携ボタンをクリックすると、onConnectAtProtocol関数が呼ばれること", () => {
    // モックの準備
    let connectedId: string | null = null;
    props.onConnectAtProtocol = (id: string) => {
      connectedId = id;
    };
    
    // コンポーネントをレンダリング
    const userPage = new UserPage(props);
    
    // AT Protocol連携ボタンクリックをシミュレート
    userPage.handleConnectAtProtocolClick("user-1");
    
    // 結果を検証
    expect(connectedId).toBe("user-1");
  });
}); 