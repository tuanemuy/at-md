/**
 * アプリケーション状態管理のテスト
 * 
 * アプリケーションの状態管理機能をテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { AppState, AppStateProps, Page } from "../../state/app-state.ts";

describe("AppStateのテスト", () => {
  let appState: AppState;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    const props: AppStateProps = {
      initialPage: Page.HOME,
    };
    appState = new AppState(props);
  });
  
  it("初期状態が正しく設定されること", () => {
    // 初期状態を検証
    expect(appState.getCurrentPage()).toBe(Page.HOME);
    expect(appState.getSelectedContentId()).toBe(null);
    expect(appState.getSelectedUserId()).toBe(null);
    expect(appState.getSelectedFeedId()).toBe(null);
  });
  
  it("ページを変更できること", () => {
    // ページを変更
    appState.setCurrentPage(Page.CONTENT_DETAIL);
    
    // 変更後の状態を検証
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
  });
  
  it("選択中のコンテンツIDを設定できること", () => {
    // コンテンツIDを設定
    appState.setSelectedContentId("content-1");
    
    // 設定後の状態を検証
    expect(appState.getSelectedContentId()).toBe("content-1");
  });
  
  it("選択中のユーザーIDを設定できること", () => {
    // ユーザーIDを設定
    appState.setSelectedUserId("user-1");
    
    // 設定後の状態を検証
    expect(appState.getSelectedUserId()).toBe("user-1");
  });
  
  it("選択中のフィードIDを設定できること", () => {
    // フィードIDを設定
    appState.setSelectedFeedId("feed-1");
    
    // 設定後の状態を検証
    expect(appState.getSelectedFeedId()).toBe("feed-1");
  });
  
  it("コンテンツ詳細ページに遷移すると、ページとコンテンツIDが設定されること", () => {
    // コンテンツ詳細ページに遷移
    appState.navigateToContentDetail("content-2");
    
    // 遷移後の状態を検証
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe("content-2");
  });
  
  it("ユーザー詳細ページに遷移すると、ページとユーザーIDが設定されること", () => {
    // ユーザー詳細ページに遷移
    appState.navigateToUserDetail("user-2");
    
    // 遷移後の状態を検証
    expect(appState.getCurrentPage()).toBe(Page.USER_DETAIL);
    expect(appState.getSelectedUserId()).toBe("user-2");
  });
  
  it("フィード詳細ページに遷移すると、ページとフィードIDが設定されること", () => {
    // フィード詳細ページに遷移
    appState.navigateToFeedDetail("feed-2");
    
    // 遷移後の状態を検証
    expect(appState.getCurrentPage()).toBe(Page.FEED_DETAIL);
    expect(appState.getSelectedFeedId()).toBe("feed-2");
  });
  
  it("ホームページに戻ると、ページが設定されること", () => {
    // 一度別のページに遷移
    appState.navigateToContentDetail("content-1");
    
    // ホームページに戻る
    appState.navigateToHome();
    
    // 遷移後の状態を検証
    expect(appState.getCurrentPage()).toBe(Page.HOME);
  });
  
  it("状態変更時にリスナーが呼び出されること", () => {
    // リスナーのモック
    let callCount = 0;
    const listener = () => {
      callCount++;
    };
    
    // リスナーを登録
    appState.addChangeListener(listener);
    
    // 状態を変更
    appState.setCurrentPage(Page.CONTENT_DETAIL);
    
    // リスナーが呼び出されたことを検証
    expect(callCount).toBe(1);
    
    // さらに状態を変更
    appState.setSelectedContentId("content-1");
    
    // リスナーが再度呼び出されたことを検証
    expect(callCount).toBe(2);
  });
  
  it("リスナーを削除できること", () => {
    // リスナーのモック
    let callCount = 0;
    const listener = () => {
      callCount++;
    };
    
    // リスナーを登録
    appState.addChangeListener(listener);
    
    // 状態を変更
    appState.setCurrentPage(Page.CONTENT_DETAIL);
    
    // リスナーが呼び出されたことを検証
    expect(callCount).toBe(1);
    
    // リスナーを削除
    appState.removeChangeListener(listener);
    
    // さらに状態を変更
    appState.setSelectedContentId("content-1");
    
    // リスナーが呼び出されないことを検証
    expect(callCount).toBe(1);
  });
}); 