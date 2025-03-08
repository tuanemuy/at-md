/**
 * アプリケーションレンダラー
 * 
 * アプリケーションの状態に基づいてUIをレンダリングします。
 */

import { AppState, Page, StateChangeListener } from "./app-state.ts";
import { HomePage, HomePageProps } from "../pages/home-page.ts";
import { ContentPage, ContentPageProps } from "../pages/content-page.ts";
import { UserPage, UserPageProps } from "../pages/user-page.ts";
import { FeedPage, FeedPageProps } from "../pages/feed-page.ts";
import { ContentListProps } from "../components/content-list.ts";
import { UserListProps } from "../components/user-list.ts";
import { FeedListProps } from "../components/feed-list.ts";
import { ContentDetailProps } from "../components/content-detail.ts";
import { UserDetailProps } from "../components/user-detail.ts";
import { FeedDetailProps } from "../components/feed-detail.ts";

// アプリケーションレンダラーのプロパティ型定義
export interface AppRendererProps {
  appState: AppState;
  contentListProps: ContentListProps;
  userListProps: UserListProps;
  feedListProps: FeedListProps;
  contentDetailProps: ContentDetailProps;
  userDetailProps: UserDetailProps;
  feedDetailProps: FeedDetailProps;
}

/**
 * アプリケーションレンダラークラス
 */
export class AppRenderer {
  private props: AppRendererProps;
  private stateChangeListener: StateChangeListener;
  private container: HTMLElement | null = null;
  public onRender: (() => void) | null = null;
  
  /**
   * コンストラクタ
   * @param props アプリケーションレンダラーのプロパティ
   */
  constructor(props: AppRendererProps) {
    this.props = props;
    
    // 状態変更リスナーを定義
    this.stateChangeListener = () => {
      this.renderToContainer();
    };
  }
  
  /**
   * 現在の状態に基づいてUIをレンダリングする
   * @returns HTML文字列
   */
  public render(): string {
    const { appState } = this.props;
    const currentPage = appState.getCurrentPage();
    
    switch (currentPage) {
      case Page.HOME:
        return this.renderHomePage();
      case Page.CONTENT_DETAIL:
        return this.renderContentDetailPage();
      case Page.USER_DETAIL:
        return this.renderUserDetailPage();
      case Page.FEED_DETAIL:
        return this.renderFeedDetailPage();
      default:
        return this.renderHomePage();
    }
  }
  
  /**
   * ホームページをレンダリングする
   * @returns HTML文字列
   */
  private renderHomePage(): string {
    const { appState, contentListProps, userListProps, feedListProps } = this.props;
    
    // ホームページのプロパティを作成
    const homePageProps: HomePageProps = {
      contentListProps,
      userListProps,
      feedListProps,
      onContentSelect: (id) => appState.navigateToContentDetail(id),
      onUserSelect: (id) => appState.navigateToUserDetail(id),
      onFeedSelect: (id) => appState.navigateToFeedDetail(id),
    };
    
    // ホームページをレンダリング
    const homePage = new HomePage(homePageProps);
    return homePage.render();
  }
  
  /**
   * コンテンツ詳細ページをレンダリングする
   * @returns HTML文字列
   */
  private renderContentDetailPage(): string {
    const { appState, contentDetailProps } = this.props;
    
    // コンテンツ詳細ページのプロパティを作成
    const contentPageProps: ContentPageProps = {
      contentDetailProps,
      onBack: () => appState.navigateToHome(),
      onEdit: (id) => {
        // 編集処理（実際の実装では編集ページに遷移するなど）
        console.log(`Edit content: ${id}`);
      },
      onDelete: (id) => {
        // 削除処理（実際の実装では削除確認後に削除するなど）
        console.log(`Delete content: ${id}`);
        appState.navigateToHome();
      },
    };
    
    // コンテンツ詳細ページをレンダリング
    const contentPage = new ContentPage(contentPageProps);
    return contentPage.render();
  }
  
  /**
   * ユーザー詳細ページをレンダリングする
   * @returns HTML文字列
   */
  private renderUserDetailPage(): string {
    const { appState, userDetailProps } = this.props;
    
    // ユーザー詳細ページのプロパティを作成
    const userPageProps: UserPageProps = {
      userDetailProps,
      onBack: () => appState.navigateToHome(),
      onEdit: (id) => {
        // 編集処理（実際の実装では編集ページに遷移するなど）
        console.log(`Edit user: ${id}`);
      },
      onDelete: (id) => {
        // 削除処理（実際の実装では削除確認後に削除するなど）
        console.log(`Delete user: ${id}`);
        appState.navigateToHome();
      },
      onConnectAtProtocol: (id) => {
        // AT Protocol連携処理
        console.log(`Connect AT Protocol for user: ${id}`);
      },
    };
    
    // ユーザー詳細ページをレンダリング
    const userPage = new UserPage(userPageProps);
    return userPage.render();
  }
  
  /**
   * フィード詳細ページをレンダリングする
   * @returns HTML文字列
   */
  private renderFeedDetailPage(): string {
    const { appState, feedDetailProps } = this.props;
    
    // フィード詳細ページのプロパティを作成
    const feedPageProps: FeedPageProps = {
      feedDetailProps,
      onBack: () => appState.navigateToHome(),
      onEdit: (id) => {
        // 編集処理（実際の実装では編集ページに遷移するなど）
        console.log(`Edit feed: ${id}`);
      },
      onDelete: (id) => {
        // 削除処理（実際の実装では削除確認後に削除するなど）
        console.log(`Delete feed: ${id}`);
        appState.navigateToHome();
      },
      onCreatePost: (feedId) => {
        // 投稿作成処理
        console.log(`Create post for feed: ${feedId}`);
      },
      onEditPost: (postId) => {
        // 投稿編集処理
        console.log(`Edit post: ${postId}`);
      },
      onPublishPost: (postId) => {
        // 投稿公開処理
        console.log(`Publish post: ${postId}`);
      },
    };
    
    // フィード詳細ページをレンダリング
    const feedPage = new FeedPage(feedPageProps);
    return feedPage.render();
  }
  
  /**
   * コンテナにレンダリングする
   */
  private renderToContainer(): void {
    if (this.container) {
      this.container.innerHTML = this.render();
      
      // レンダリング後のコールバックを実行
      if (this.onRender) {
        this.onRender();
      }
    }
  }
  
  /**
   * 指定したセレクタのコンテナにマウントする
   * @param selector DOMセレクタ
   */
  public mount(selector: string): void {
    // コンテナを取得
    this.container = document.querySelector(selector);
    
    if (!this.container) {
      console.error(`Container not found: ${selector}`);
      return;
    }
    
    // 状態変更リスナーを登録
    this.props.appState.addChangeListener(this.stateChangeListener);
    
    // 初期レンダリング
    this.renderToContainer();
  }
  
  /**
   * アンマウントする
   */
  public unmount(): void {
    // 状態変更リスナーを削除
    this.props.appState.removeChangeListener(this.stateChangeListener);
    
    // コンテナをクリア
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.container = null;
  }
} 