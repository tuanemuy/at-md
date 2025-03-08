/**
 * アプリケーションレンダラー
 * 
 * アプリケーションの状態に基づいてUIをレンダリングする機能を提供します。
 * 現在の状態に応じて適切なページコンポーネントをレンダリングします。
 */

import { AppState, Page } from "./app-state.ts";
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

/**
 * AppRendererの初期化パラメータ
 */
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
  private appState: AppState;
  private contentListProps: ContentListProps;
  private userListProps: UserListProps;
  private feedListProps: FeedListProps;
  private contentDetailProps: ContentDetailProps;
  private userDetailProps: UserDetailProps;
  private feedDetailProps: FeedDetailProps;

  /**
   * コンストラクタ
   * @param props 初期化パラメータ
   */
  constructor(props: AppRendererProps) {
    this.appState = props.appState;
    this.contentListProps = props.contentListProps;
    this.userListProps = props.userListProps;
    this.feedListProps = props.feedListProps;
    this.contentDetailProps = props.contentDetailProps;
    this.userDetailProps = props.userDetailProps;
    this.feedDetailProps = props.feedDetailProps;
  }

  /**
   * 現在の状態に基づいてUIをレンダリング
   * @returns レンダリングされたHTML
   */
  render(): string {
    const currentPage = this.appState.getCurrentPage();

    switch (currentPage) {
      case Page.HOME:
        return this.renderHomePage();
      case Page.CONTENT_DETAIL:
        return this.renderContentPage();
      case Page.USER_DETAIL:
        return this.renderUserPage();
      case Page.FEED_DETAIL:
        return this.renderFeedPage();
      default:
        return this.renderHomePage();
    }
  }

  /**
   * ホームページをレンダリング
   */
  private renderHomePage(): string {
    const props: HomePageProps = {
      contentListProps: this.contentListProps,
      userListProps: this.userListProps,
      feedListProps: this.feedListProps,
      onContentSelect: (contentId: string) => {
        this.appState.navigateToContentDetail(contentId);
      },
      onUserSelect: (userId: string) => {
        this.appState.navigateToUserDetail(userId);
      },
      onFeedSelect: (feedId: string) => {
        this.appState.navigateToFeedDetail(feedId);
      },
    };

    const homePage = new HomePage(props);
    return homePage.render();
  }

  /**
   * コンテンツ詳細ページをレンダリング
   */
  private renderContentPage(): string {
    const contentId = this.appState.getSelectedContentId();
    if (!contentId) {
      return this.renderHomePage();
    }

    const props: ContentPageProps = {
      contentDetailProps: this.contentDetailProps,
      onBack: () => {
        this.appState.navigateToHome();
      },
      onEdit: (contentId: string) => {
        // 編集ページへの遷移処理
        console.log(`Edit content: ${contentId}`);
      },
      onDelete: (contentId: string) => {
        // 削除処理
        console.log(`Delete content: ${contentId}`);
        this.appState.navigateToHome();
      },
    };

    const contentPage = new ContentPage(props);
    return contentPage.render();
  }

  /**
   * ユーザー詳細ページをレンダリング
   */
  private renderUserPage(): string {
    const userId = this.appState.getSelectedUserId();
    if (!userId) {
      return this.renderHomePage();
    }

    const props: UserPageProps = {
      userDetailProps: this.userDetailProps,
      onBack: () => {
        this.appState.navigateToHome();
      },
      onEdit: (userId: string) => {
        // 編集ページへの遷移処理
        console.log(`Edit user: ${userId}`);
      },
      onDelete: (userId: string) => {
        // 削除処理
        console.log(`Delete user: ${userId}`);
        this.appState.navigateToHome();
      },
      onConnectAtProtocol: (userId: string) => {
        // AT Protocol連携処理
        console.log(`Connect AT Protocol for user: ${userId}`);
      },
    };

    const userPage = new UserPage(props);
    return userPage.render();
  }

  /**
   * フィード詳細ページをレンダリング
   */
  private renderFeedPage(): string {
    const feedId = this.appState.getSelectedFeedId();
    if (!feedId) {
      return this.renderHomePage();
    }

    const props: FeedPageProps = {
      feedDetailProps: this.feedDetailProps,
      onBack: () => {
        this.appState.navigateToHome();
      },
      onEdit: (feedId: string) => {
        // 編集ページへの遷移処理
        console.log(`Edit feed: ${feedId}`);
      },
      onDelete: (feedId: string) => {
        // 削除処理
        console.log(`Delete feed: ${feedId}`);
        this.appState.navigateToHome();
      },
      onCreatePost: (feedId: string) => {
        // 投稿作成処理
        console.log(`Create post for feed: ${feedId}`);
      },
      onEditPost: (postId: string) => {
        // 投稿編集処理
        console.log(`Edit post: ${postId}`);
      },
      onPublishPost: (postId: string) => {
        // 投稿公開処理
        console.log(`Publish post: ${postId}`);
      },
    };

    const feedPage = new FeedPage(props);
    return feedPage.render();
  }
} 