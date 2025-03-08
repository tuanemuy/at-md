/**
 * DIコンテナのテスト
 */

import { expect } from "@std/expect";
import { describe, it, afterEach } from "@std/testing/bdd";
import { DIContainer } from "../../di/container.ts";
import { IAppState, Page } from "../../state/app-state.ts";
import { IRouter } from "../../router/router.ts";

describe("DIコンテナのテスト", () => {
  afterEach(() => {
    // 各テスト後にDIコンテナをリセット
    DIContainer.reset();
  });

  it("シングルトンインスタンスを提供すること", () => {
    const container1 = DIContainer.getInstance();
    const container2 = DIContainer.getInstance();
    
    expect(container1).toBe(container2);
  });

  it("AppStateインスタンスを提供すること", () => {
    const container = DIContainer.getInstance();
    const appState = container.getAppState();
    
    expect(appState).toBeDefined();
    expect(typeof appState.getCurrentPage).toBe("function");
    expect(typeof appState.getSelectedContentId).toBe("function");
    expect(typeof appState.getSelectedUserId).toBe("function");
    expect(typeof appState.getSelectedFeedId).toBe("function");
    expect(typeof appState.setState).toBe("function");
    expect(typeof appState.navigateToContentDetail).toBe("function");
    expect(typeof appState.navigateToUserDetail).toBe("function");
    expect(typeof appState.navigateToFeedDetail).toBe("function");
    expect(typeof appState.navigateToHome).toBe("function");
    expect(typeof appState.addListener).toBe("function");
    expect(typeof appState.removeListener).toBe("function");
  });

  it("Routerインスタンスを提供すること", () => {
    const container = DIContainer.getInstance();
    const router = container.getRouter();
    
    expect(router).toBeDefined();
    expect(typeof router.start).toBe("function");
    expect(typeof router.stop).toBe("function");
  });

  it("AppStateの初期化パラメータを受け入れること", () => {
    const container = DIContainer.getInstance({
      initialPage: Page.CONTENT_DETAIL,
      initialContentId: "content-1"
    });
    
    const appState = container.getAppState();
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe("content-1");
  });

  it("リセット後に新しいインスタンスを提供すること", () => {
    const container1 = DIContainer.getInstance();
    const appState1 = container1.getAppState();
    
    DIContainer.reset();
    
    const container2 = DIContainer.getInstance();
    const appState2 = container2.getAppState();
    
    expect(container1).not.toBe(container2);
    expect(appState1).not.toBe(appState2);
  });
}); 