/**
 * レンダラー
 * 
 * アプリケーションのレンダリングを担当します。
 */

import { AppState, Page, StateChangeListener } from "./app-state.ts";
import { HomePage, HomePageProps } from "../pages/home-page.ts";
import { ContentPage, ContentPageProps } from "../pages/content-page.ts";
import { UserPage, UserPageProps } from "../pages/user-page.ts";
import { FeedPage, FeedPageProps } from "../pages/feed-page.ts";

// レンダラーのプロパティ型定義
export interface RendererProps {
  appState: AppState;
  container: HTMLElement;
  homePageProps: HomePageProps;
  contentPageProps: ContentPageProps;
  userPageProps: UserPageProps;
  feedPageProps: FeedPageProps;
}

/**
 * レンダラークラス
 */
export class Renderer {
  private props: RendererProps;
  private stateChangeListener: StateChangeListener;
  
  /**
   * コンストラクタ
   * @param props レンダラーのプロパティ
   */
  constructor(props: RendererProps) {
    this.props = props;
    this.stateChangeListener = this.render.bind(this);
  }
  
  /**
   * レンダリングを開始する
   */
  public start(): void {
    this.props.appState.addListener(this.stateChangeListener);
    this.render();
  }
  
  /**
   * レンダリングを停止する
   */
  public stop(): void {
    this.props.appState.removeListener(this.stateChangeListener);
  }
  
  /**
   * 現在の状態に基づいてレンダリングする
   */
  public render(): void {
    const { appState, container } = this.props;
    const currentPage = appState.getCurrentPage();
    
    let html = "";
    
    switch (currentPage) {
      case Page.HOME:
        html = this.renderHomePage();
        break;
      case Page.CONTENT_DETAIL:
        html = this.renderContentDetailPage();
        break;
      case Page.USER_DETAIL:
        html = this.renderUserDetailPage();
        break;
      case Page.FEED_DETAIL:
        html = this.renderFeedDetailPage();
        break;
      default:
        html = this.renderHomePage();
    }
    
    container.innerHTML = html;
    this.attachEventHandlers();
  }
  
  /**
   * ホームページをレンダリングする
   * @returns HTML文字列
   */
  private renderHomePage(): string {
    const homePage = new HomePage({
      ...this.props.homePageProps,
      onContentSelect: (id) => this.props.appState.navigateToContentDetail(id),
      onUserSelect: (id) => this.props.appState.navigateToUserDetail(id),
      onFeedSelect: (id) => this.props.appState.navigateToFeedDetail(id),
    });
    
    return homePage.render();
  }
  
  /**
   * コンテンツ詳細ページをレンダリングする
   * @returns HTML文字列
   */
  private renderContentDetailPage(): string {
    const contentPage = new ContentPage({
      ...this.props.contentPageProps,
      onBack: () => this.props.appState.navigateToHome(),
    });
    
    return contentPage.render();
  }
  
  /**
   * ユーザー詳細ページをレンダリングする
   * @returns HTML文字列
   */
  private renderUserDetailPage(): string {
    const userPage = new UserPage({
      ...this.props.userPageProps,
      onBack: () => this.props.appState.navigateToHome(),
    });
    
    return userPage.render();
  }
  
  /**
   * フィード詳細ページをレンダリングする
   * @returns HTML文字列
   */
  private renderFeedDetailPage(): string {
    const feedPage = new FeedPage({
      ...this.props.feedPageProps,
      onBack: () => this.props.appState.navigateToHome(),
    });
    
    return feedPage.render();
  }
  
  /**
   * イベントハンドラを設定する
   */
  private attachEventHandlers(): void {
    const { appState, container } = this.props;
    const currentPage = appState.getCurrentPage();
    
    // 戻るボタンのイベントハンドラを設定
    if (currentPage !== Page.HOME) {
      const backButton = container.querySelector("#back-button");
      if (backButton) {
        backButton.addEventListener("click", () => {
          appState.navigateToHome();
        });
      }
    }
    
    // コンテンツリストのクリックイベントハンドラを設定
    if (currentPage === Page.HOME) {
      const contentItems = container.querySelectorAll(".content-item");
      contentItems.forEach((item) => {
        const id = item.getAttribute("data-id");
        if (id) {
          item.addEventListener("click", () => {
            appState.navigateToContentDetail(id);
          });
        }
      });
      
      // ユーザーリストのクリックイベントハンドラを設定
      const userItems = container.querySelectorAll(".user-item");
      userItems.forEach((item) => {
        const id = item.getAttribute("data-id");
        if (id) {
          item.addEventListener("click", () => {
            appState.navigateToUserDetail(id);
          });
        }
      });
      
      // フィードリストのクリックイベントハンドラを設定
      const feedItems = container.querySelectorAll(".feed-item");
      feedItems.forEach((item) => {
        const id = item.getAttribute("data-id");
        if (id) {
          item.addEventListener("click", () => {
            appState.navigateToFeedDetail(id);
          });
        }
      });
    }
  }
} 