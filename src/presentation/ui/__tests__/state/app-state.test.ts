/**
 * AppStateのテスト
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { IAppState, AppState, Page } from "../../state/app-state.ts";

describe("AppStateのテスト", () => {
  it("初期状態が正しく設定されること", () => {
    const appState: IAppState = new AppState({ initialPage: Page.HOME });
    expect(appState.getCurrentPage()).toBe(Page.HOME);
    expect(appState.getSelectedContentId()).toBe(undefined);
    expect(appState.getSelectedUserId()).toBe(undefined);
    expect(appState.getSelectedFeedId()).toBe(undefined);
  });

  it("ページを変更できること", () => {
    const appState: IAppState = new AppState({ initialPage: Page.HOME });
    appState.setState(Page.CONTENT_DETAIL);
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
  });

  it("選択中のコンテンツIDを設定できること", () => {
    const appState: IAppState = new AppState({ initialPage: Page.HOME });
    appState.setState(Page.CONTENT_DETAIL, "content-1");
    expect(appState.getSelectedContentId()).toBe("content-1");
  });

  it("選択中のユーザーIDを設定できること", () => {
    const appState: IAppState = new AppState({ initialPage: Page.HOME });
    appState.setState(Page.USER_DETAIL, undefined, "user-1");
    expect(appState.getSelectedUserId()).toBe("user-1");
  });

  it("選択中のフィードIDを設定できること", () => {
    const appState: IAppState = new AppState({ initialPage: Page.HOME });
    appState.setState(Page.FEED_DETAIL, undefined, undefined, "feed-1");
    expect(appState.getSelectedFeedId()).toBe("feed-1");
  });

  it("コンテンツ詳細ページに遷移すると、ページとコンテンツIDが設定されること", () => {
    const appState: IAppState = new AppState({ initialPage: Page.HOME });
    appState.navigateToContentDetail("content-1");
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe("content-1");
  });

  it("ユーザー詳細ページに遷移すると、ページとユーザーIDが設定されること", () => {
    const appState: IAppState = new AppState({ initialPage: Page.HOME });
    appState.navigateToUserDetail("user-1");
    expect(appState.getCurrentPage()).toBe(Page.USER_DETAIL);
    expect(appState.getSelectedUserId()).toBe("user-1");
  });

  it("フィード詳細ページに遷移すると、ページとフィードIDが設定されること", () => {
    const appState: IAppState = new AppState({ initialPage: Page.HOME });
    appState.navigateToFeedDetail("feed-1");
    expect(appState.getCurrentPage()).toBe(Page.FEED_DETAIL);
    expect(appState.getSelectedFeedId()).toBe("feed-1");
  });

  it("ホームページに戻ると、ページが設定されること", () => {
    const appState: IAppState = new AppState({ initialPage: Page.CONTENT_DETAIL });
    appState.navigateToHome();
    expect(appState.getCurrentPage()).toBe(Page.HOME);
  });

  it("状態変更時にリスナーが呼び出されること", () => {
    const appState: IAppState = new AppState({ initialPage: Page.HOME });
    let called = false;
    const listener = () => {
      called = true;
    };
    
    appState.addListener(listener);
    appState.navigateToContentDetail("content-1");
    
    expect(called).toBe(true);
  });

  it("リスナーを削除できること", () => {
    const appState: IAppState = new AppState({ initialPage: Page.HOME });
    let count = 0;
    const listener = () => {
      count++;
    };
    
    appState.addListener(listener);
    appState.navigateToContentDetail("content-1");
    expect(count).toBe(1);
    
    appState.removeListener(listener);
    appState.navigateToHome();
    expect(count).toBe(1); // リスナーが削除されたので呼ばれない
  });
}); 